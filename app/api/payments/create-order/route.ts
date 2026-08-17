import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Must resolve to the payments microservice (lexram-payments, :8126), which
// nginx serves at /payments and /credits on api.lexram.ai.
//
// The previous fallback was http://157.245.106.223:8124 — that is langgraph-v4,
// which still carries an older copy of this route from before payments was split
// out. With CREDITS_API_URL set in Vercel the fallback never fired, but if it
// were ever unset, orders would silently be created by the stale code: no GST,
// no tax snapshot, and the Rs 50 minimum instead of Rs 500. Point the default at
// the public host so the fallback lands on the same service as the live config.
const CREDITS_API = process.env.CREDITS_API_URL || 'https://api.lexram.ai';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 });
  }

  try {
    const res = await fetch(`${CREDITS_API}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({ detail: 'Invalid response from payments API' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      { detail: timedOut ? 'Payments API timed out. Please try again.' : err instanceof Error ? err.message : 'Payments API unreachable' },
      { status: 502 }
    );
  }
}
