import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';
import { normalizeFetchError, normalizeUpstreamError } from '@/lib/upstream-error';

/**
 * Generic RAG proxy.
 * Forwards POST /api/rag { query, k?, act_id?, ... } to the live MoEFCC
 * backend /api/rag/moefcc (BGE-M3 + Weaviate + MiniMax on the LexMatrix box).
 * The older arbitration RAG endpoint (/api/rag/query) has been retired.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RAG_BASE = process.env.LEXMATRIX_RAG_BASE || 'https://139.59.74.49';

interface RagRequest {
  query?: string;
  q?: string;
  act_id?: string;           // accepted for compatibility; ignored server-side
  k?: number;
  rerank?: boolean;          // accepted for compatibility; ignored server-side
  generate?: boolean;        // accepted; maps to /search when false
  no_cache?: boolean;
}

function postUpstream(
  urlStr: string,
  body: string,
  timeoutMs = 55_000,
): Promise<{ status: number; body: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
          accept: 'application/json',
        },
        rejectUnauthorized: false,         // backend uses self-signed cert
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.from(c)));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 502,
            body: Buffer.concat(chunks).toString('utf-8'),
            contentType: (res.headers['content-type'] as string) ?? 'application/json',
          });
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('upstream_timeout')));
    req.write(body);
    req.end();
  });
}

function bad(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

async function handle(params: RagRequest) {
  const query = (params.query ?? params.q ?? '').toString().trim();
  if (query.length < 3) return bad(400, 'query (min 3 chars) required');

  const k = Math.min(Math.max(Number(params.k ?? 3), 1), 10);
  const no_cache = Boolean(params.no_cache);

  // If caller explicitly asked for retrieve-only (generate:false), hit /search.
  // Otherwise use the full RAG endpoint.
  const path =
    params.generate === false
      ? `${RAG_BASE}/api/rag/moefcc/search`
      : `${RAG_BASE}/api/rag/moefcc`;

  const payload = JSON.stringify(
    params.generate === false ? { query, k } : { query, k, no_cache },
  );

  try {
    const { status, body, contentType } = await postUpstream(path, payload);
    if (status >= 200 && status < 300) {
      return new NextResponse(body, {
        status,
        headers: {
          'content-type': contentType,
          'cache-control': 'no-store',
        },
      });
    }
    const normalized = normalizeUpstreamError(body, status);
    return NextResponse.json(normalized.body, { status: normalized.status });
  } catch (err) {
    const normalized = normalizeFetchError(err);
    return NextResponse.json(normalized.body, { status: normalized.status });
  }
}

export async function POST(req: NextRequest) {
  let body: RagRequest;
  try {
    body = (await req.json()) as RagRequest;
  } catch {
    return bad(400, 'invalid JSON body');
  }
  return handle(body);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return handle({
    query: sp.get('query') ?? sp.get('q') ?? '',
    act_id: sp.get('act_id') ?? undefined,
    k: sp.get('k') ? Number(sp.get('k')) : undefined,
    rerank: sp.get('rerank') ? sp.get('rerank') !== 'false' : undefined,
    generate: sp.get('generate') ? sp.get('generate') !== 'false' : undefined,
    no_cache: sp.get('no_cache') === 'true',
  });
}
