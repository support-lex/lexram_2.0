import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Payments and credits are served by lexram-payments (:8126), which nginx
// exposes at /credits and /payments on api.lexram.ai. The old fallback pointed
// at :8124 (langgraph-v4), which still carries a stale copy of these routes.
const CREDITS_API = process.env.CREDITS_API_URL || 'https://api.lexram.ai';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  try {
    const res = await fetch(`${CREDITS_API}/credits/balance`, {
      headers: auth ? { Authorization: auth } : {},
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({ detail: 'Invalid response from credits API' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Credits API unreachable' },
      { status: 502 }
    );
  }
}
