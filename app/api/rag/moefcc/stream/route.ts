import { NextRequest } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';
import { normalizeUpstreamError } from '@/lib/upstream-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RAG_BASE = process.env.LEXMATRIX_RAG_BASE || 'https://139.59.74.49';

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  if (q.length < 3) return jsonError(400, 'q (min 3 chars) required');
  const k = Math.min(Math.max(Number(sp.get('k') ?? 3), 1), 10);

  const target = `${RAG_BASE}/api/rag/moefcc/stream?q=${encodeURIComponent(q)}&k=${k}`;

  const url = new URL(target);
  const client = url.protocol === 'https:' ? https : http;

  const readable = new ReadableStream({
    start(controller) {
      let closed = false;
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };
      const safeError = (err: unknown) => {
        if (closed) return;
        closed = true;
        const detail = err instanceof Error ? err.message : 'unknown';
        try {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ event: 'error', detail })}\n\n`,
            ),
          );
          controller.close();
        } catch {
          /* noop */
        }
      };

      const upstreamReq = client.request(
        {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          headers: { accept: 'text/event-stream' },
          rejectUnauthorized: false,
        },
        (res) => {
          if (!res.statusCode || res.statusCode >= 400) {
            // Read the upstream body so the friendly message can detect
            // Hasura-down / connection-refused traces and surface a useful
            // error event instead of "Upstream 500".
            const status = res.statusCode ?? 502;
            const chunks: Buffer[] = [];
            res.on('data', (c) => chunks.push(Buffer.from(c)));
            res.on('end', () => {
              if (closed) return;
              const body = Buffer.concat(chunks).toString('utf-8');
              const normalized = normalizeUpstreamError(body, status);
              try {
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({
                      event: 'error',
                      detail: normalized.body.message,
                      error_type: normalized.body.error,
                    })}\n\n`,
                  ),
                );
              } catch {
                /* noop */
              }
              safeClose();
            });
            res.on('error', safeError);
            return;
          }
          res.on('data', (chunk: Buffer) => {
            if (closed) return;
            try {
              controller.enqueue(chunk);
            } catch {
              closed = true;
            }
          });
          res.on('end', safeClose);
          res.on('error', safeError);
        },
      );

      upstreamReq.on('error', safeError);
      // The backend can take up to ~15s to finish generating; give headroom.
      upstreamReq.setTimeout(55000, () => upstreamReq.destroy(new Error('upstream_timeout')));
      upstreamReq.end();

      // Propagate client disconnect to the upstream.
      req.signal.addEventListener('abort', () => {
        try {
          upstreamReq.destroy();
        } catch {
          /* noop */
        }
        safeClose();
      });
    },
  });

  return new Response(readable, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
