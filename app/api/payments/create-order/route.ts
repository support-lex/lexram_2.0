import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CREDITS_API = process.env.CREDITS_API_URL || 'http://157.245.106.223:8124';

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
    });
    const data = await res.json().catch(() => ({ detail: 'Invalid response from payments API' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Payments API unreachable' },
      { status: 502 }
    );
  }
}
