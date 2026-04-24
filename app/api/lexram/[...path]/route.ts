import { NextRequest, NextResponse } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE = process.env.LEXRAM_API_BASE || 'https://139.59.74.49';

function proxyGet(targetUrl: string): Promise<{ status: number; body: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
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
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 502,
            body: Buffer.concat(chunks).toString('utf-8'),
            contentType: (res.headers['content-type'] as string) ?? 'application/json',
          });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy(new Error('upstream_timeout'));
    });
    req.end();
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const query = req.nextUrl.search;
  const target = `${API_BASE}/api/${path.join('/')}${query}`;

  try {
    const { status, body, contentType } = await proxyGet(target);
    return new NextResponse(body, {
      status,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'proxy_failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 502 }
    );
  }
}
