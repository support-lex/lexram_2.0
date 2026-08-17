import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RECHARGE_MAIL_TO = process.env.RECHARGE_MAIL_TO || 'mail@grhari.com';

function esc(s: unknown) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { order_id?: string; amount_inr?: number; credits?: number } = {};
  try { body = await req.json(); } catch { /* empty body is fine, fields are optional fallbacks */ }
  const orderId = (body.order_id ?? '').trim();
  if (!orderId) return NextResponse.json({ error: 'order_id is required' }, { status: 400 });

  // Look up the authoritative row if the webhook has already landed it; fall
  // back to the client-supplied amount/credits otherwise (same pattern the
  // payment/success page already uses while polling).
  const { data: payment } = await supabase
    .from('payments')
    .select('amount_inr, credits_granted, status')
    .eq('order_id', orderId)
    .eq('user_id', user.id)
    .maybeSingle();

  const amountInr = payment?.amount_inr ?? body.amount_inr ?? 0;
  const credits = payment?.credits_granted ?? body.credits ?? 0;
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#f6f1e7;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f1a14">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #ece3d2;border-radius:16px;overflow:hidden">
  <div style="background:#6b1d1d;color:#fdf6e8;padding:18px 22px">
    <div style="font-size:17px;font-weight:700">Lexram &mdash; Credits Recharge</div>
  </div>
  <div style="padding:22px;font-size:14px;line-height:1.7">
    <p style="margin:0 0 12px">A user just topped up credits.</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="color:#8a7f6f;padding:4px 0;width:120px">User</td><td>${esc(user.email)}</td></tr>
      <tr><td style="color:#8a7f6f;padding:4px 0">Amount</td><td style="font-weight:700">${fmtINR(amountInr)}</td></tr>
      <tr><td style="color:#8a7f6f;padding:4px 0">Credits</td><td>${esc(credits)}</td></tr>
      <tr><td style="color:#8a7f6f;padding:4px 0">Order ID</td><td style="font-family:monospace;font-size:12px">${esc(orderId)}</td></tr>
      <tr><td style="color:#8a7f6f;padding:4px 0">Time</td><td>${esc(now)}</td></tr>
    </table>
  </div>
</div></body></html>`;

  const text = `Lexram credits recharge\nUser: ${user.email}\nAmount: ${fmtINR(amountInr)}\nCredits: ${credits}\nOrder ID: ${orderId}\nTime: ${now}`;

  try {
    await sendMail({
      to: RECHARGE_MAIL_TO,
      subject: `Recharge — ${user.email} — ${fmtINR(amountInr)}`,
      html,
      text,
    });
  } catch (err) {
    // Don't fail the checkout flow over a notification email.
    console.error('[notify-recharge] send failed:', err);
    return NextResponse.json({ ok: false, error: 'mail send failed' }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
