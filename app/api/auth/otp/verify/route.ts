// Verify a phone OTP issued by /api/auth/otp/send (or /api/auth/signup).
//
//   purpose "signup" → marks the phone confirmed on auth.users. The browser
//                      then signs in with phone/email + password as usual.
//   purpose "reset"  → returns a single-use, 15-minute ticket that authorises
//                      POST /api/auth/reset-password for this phone. No
//                      session is created here.

import { NextResponse } from 'next/server';
import { jsonRoute } from '@/lib/api/json-route';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  consumeOtp,
  findUserByContact,
  issueResetTicket,
  toE164,
  type OtpPurpose,
} from '@/lib/auth/phone-otp';

export const runtime = 'nodejs';

export const POST = jsonRoute('otp/verify', async (req: Request) => {
  let body: { identifier?: string; purpose?: OtpPurpose; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const identifier = (body.identifier ?? '').trim();
  const purpose = body.purpose;
  const code = (body.code ?? '').trim();

  if (purpose !== 'signup' && purpose !== 'reset') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'OTP must be 6 digits.' }, { status: 400 });
  }

  const user = await findUserByContact(identifier);
  if (!user?.phone) {
    return NextResponse.json({ error: 'No account found with this email or phone.' }, { status: 404 });
  }

  const result = await consumeOtp(user.phone, purpose, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Verification failed.' }, { status: 400 });
  }

  if (purpose === 'signup') {
    const { error } = await supabaseAdmin().auth.admin.updateUserById(user.id, {
      phone_confirm: true,
    });
    if (error) {
      console.error('[otp/verify] could not confirm phone:', error.message);
      return NextResponse.json({ error: 'Could not complete verification. Please try again.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, phone: toE164(user.phone) });
  }

  const ticket = await issueResetTicket(user.phone);
  if (!ticket) {
    return NextResponse.json({ error: 'Could not complete verification. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ success: true, resetTicket: ticket, phone: toE164(user.phone) });
});
