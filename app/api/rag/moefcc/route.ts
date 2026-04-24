import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RAG_BASE = process.env.LEXMATRIX_RAG_BASE || 'https://139.59.74.49';

function getUpstream(target: string, timeoutMs = 55000): Promise<{ status: number; body: string; contentType: string }> {
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
  const k = Math.min(Math.max(Number(sp.get('k') ?? 3), 1), 10);
  const noCache = sp.get('no_cache') === 'true';

  const qs = new URLSearchParams({ q, k: String(k) });
  if (noCache) qs.set('no_cache', 'true');
  const target = `${RAG_BASE}/api/rag/moefcc?${qs.toString()}`;

  try {
    const { status, body, contentType } = await getUpstream(target);
    return new NextResponse(body, {
      status,
      headers: { 'content-type': contentType, 'cache-control': 'no-store' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    const isTimeout = /timeout/i.test(msg);
    return NextResponse.json(
      {
        error: isTimeout
          ? 'The RAG service is warming up. Try again in 30 seconds.'
          : 'Proxy failed',
        detail: msg,
      },
      { status: isTimeout ? 504 : 502 },
    );
  }
}
