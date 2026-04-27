import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';
import { normalizeFetchError, normalizeUpstreamError } from '@/lib/upstream-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const RAG_BASE = process.env.LEXMATRIX_RAG_BASE || 'https://139.59.74.49';

function getUpstream(target: string, timeoutMs = 10000): Promise<{ status: number; body: string; contentType: string }> {
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
        rejectUnauthorized: false,
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

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  if (q.length < 3) {
    return NextResponse.json({ error: 'q (min 3 chars) required' }, { status: 400 });
  }
  const k = Math.min(Math.max(Number(sp.get('k') ?? 3), 1), 20);

  const target = `${RAG_BASE}/api/rag/moefcc/search?q=${encodeURIComponent(q)}&k=${k}`;

  try {
    const { status, body, contentType } = await getUpstream(target, 12000);
    // Upstream success — pass through verbatim.
    if (status >= 200 && status < 300) {
      return new NextResponse(body, {
        status,
        headers: { 'content-type': contentType, 'cache-control': 'no-store' },
      });
    }
    // Upstream returned an error — normalize so the client never sees raw
    // stack traces or backend internals like 127.0.0.1:8080 / GraphQL URLs.
    const normalized = normalizeUpstreamError(body, status);
    return NextResponse.json(normalized.body, { status: normalized.status });
  } catch (err) {
    const normalized = normalizeFetchError(err);
    return NextResponse.json(normalized.body, { status: normalized.status });
  }
}
