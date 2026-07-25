// Send (or resend) a phone OTP over Arihant Global.
//
//   purpose "signup" → finish verifying an account whose phone isn't confirmed
//   purpose "reset"  → forgot-password for a confirmed account
//
// The caller passes whatever the user typed (email OR phone); the phone that
// actually receives the code is resolved server-side from auth.users and only
// ever returned masked, so this route can't be used to harvest numbers.

import { NextResponse } from 'next/server';
import {
  clientIp,
  findUserByContact,
  issueAndSendOtp,
  maskPhone,
  type OtpPurpose,
} from '@/lib/auth/phone-otp';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { identifier?: string; purpose?: OtpPurpose };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const identifier = (body.identifier ?? '').trim();
  const purpose = body.purpose;
  if (!identifier) return NextResponse.json({ error: 'Email or phone is required.' }, { status: 400 });
  if (purpose !== 'signup' && purpose !== 'reset') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const user = await findUserByContact(identifier);
  if (!user) {
    return NextResponse.json(
      { error: 'No account found with this email or phone.' },
      { status: 404 }
    );
  }
  if (!user.phone) {
    return NextResponse.json(
      { error: 'Your account has no phone on file. Please contact support.' },
      { status: 400 }
    );
  }
  if (purpose === 'signup' && user.phone_confirmed_at) {
    return NextResponse.json(
      { error: 'This phone is already verified. Please sign in.' },
      { status: 400 }
    );
  }

  const sent = await issueAndSendOtp(user.phone, purpose, clientIp(req));
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error ?? 'Could not send the verification code.' },
      { status: sent.retryAfter ? 429 : 502 }
    );
  }

  return NextResponse.json({ success: true, maskedPhone: maskPhone(user.phone) });
}
