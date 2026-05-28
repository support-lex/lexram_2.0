import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CREDITS_API = process.env.CREDITS_API_URL || 'http://157.245.106.223:8124';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('Authorization');
  try {
    const res = await fetch(`${CREDITS_API}/credits/balance`, {
      headers: auth ? { Authorization: auth } : {},
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
