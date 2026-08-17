import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';
import { normalizeFetchError, normalizeUpstreamError } from '@/lib/upstream-error';

/**
 * Proxy for /api/rag/moefcc/clusters.
 * Forwards query params through to the self-hosted FastAPI on 139.59.74.49.
 * Supports both GET (query params) and POST (JSON body).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RAG_BASE = process.env.LEXMATRIX_RAG_BASE || 'https://139.59.74.49';

interface ClusterRequest {
  query?: string;
  q?: string;
  pool?: number;
  max_clusters?: number;
  max_chunks_per_cluster?: number;
  max_distance?: number;
  label?: boolean;
}

function getUpstream(
  target: string,
  timeoutMs = 55_000,
): Promise<{ status: number; body: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(target);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        headers: { accept: 'application/json' },
        rejectUnauthorized: false,          // self-signed backend cert
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.from(c)));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 502,
            body: Buffer.concat(chunks).toString('utf-8'),
            contentType: (res.headers['content-type'] as string) ?? 'application/json',
          }),
        );
      },
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('upstream_timeout')));
    req.end();
  });
}

async function handle(params: ClusterRequest) {
  const q = (params.query ?? params.q ?? '').trim();
  if (q.length < 3) {
    return NextResponse.json({ error: 'query (min 3 chars) required' }, { status: 400 });
  }

  const qs = new URLSearchParams({ q });
  if (params.pool !== undefined) qs.set('pool', String(params.pool));
  if (params.max_clusters !== undefined) qs.set('max_clusters', String(params.max_clusters));
  if (params.max_chunks_per_cluster !== undefined)
    qs.set('max_chunks_per_cluster', String(params.max_chunks_per_cluster));
  if (params.max_distance !== undefined) qs.set('max_distance', String(params.max_distance));
  if (params.label !== undefined) qs.set('label', String(params.label));

  const target = `${RAG_BASE}/api/rag/moefcc/clusters?${qs.toString()}`;

  try {
    const { status, body, contentType } = await getUpstream(target);
    if (status >= 200 && status < 300) {
      return new NextResponse(body, {
        status,
        headers: { 'content-type': contentType, 'cache-control': 'no-store' },
      });
    }
    const normalized = normalizeUpstreamError(body, status);
    return NextResponse.json(normalized.body, { status: normalized.status });
  } catch (err) {
    const normalized = normalizeFetchError(err);
    return NextResponse.json(normalized.body, { status: normalized.status });
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return handle({
    query: sp.get('q') ?? sp.get('query') ?? '',
    pool: sp.get('pool') ? Number(sp.get('pool')) : undefined,
    max_clusters: sp.get('max_clusters') ? Number(sp.get('max_clusters')) : undefined,
    max_chunks_per_cluster: sp.get('max_chunks_per_cluster')
      ? Number(sp.get('max_chunks_per_cluster'))
      : undefined,
    max_distance: sp.get('max_distance') ? Number(sp.get('max_distance')) : undefined,
    label: sp.get('label') ? sp.get('label') !== 'false' : undefined,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ClusterRequest;
    return handle(body);
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
}
