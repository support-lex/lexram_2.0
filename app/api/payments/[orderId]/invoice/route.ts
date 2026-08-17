import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// lexram-payments (:8126), which nginx serves at /payments on api.lexram.ai.
const CREDITS_API = process.env.CREDITS_API_URL || 'https://api.lexram.ai';

/**
 * Returns a short-lived signed URL for a paid order's invoice PDF.
 *
 * The bucket is private, so this is the only route to an object. Ownership is
 * enforced by the payments service against the bearer token — this proxy just
 * forwards it, and must never try to authorise on its own.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const auth = req.headers.get('Authorization');

  try {
    const res = await fetch(
      `${CREDITS_API}/payments/${encodeURIComponent(orderId)}/invoice`,
      {
        headers: auth ? { Authorization: auth } : {},
        // Generous: a first download may render the PDF on demand when the
        // webhook could not, and WeasyPrint takes a moment.
        signal: AbortSignal.timeout(30_000),
      },
    );
    const data = await res.json().catch(() => ({ detail: 'Invalid response from payments API' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      {
        detail: timedOut
          ? 'Generating the invoice took too long. Please try again.'
          : err instanceof Error ? err.message : 'Payments API unreachable',
      },
      { status: 502 },
    );
  }
}
