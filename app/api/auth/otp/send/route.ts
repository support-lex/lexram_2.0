// Send (or resend) an OTP on the channel matching what the user typed.
//
//   purpose "signup" → finish verifying an account whose phone isn't confirmed
//   purpose "reset"  → forgot-password for an existing account
//
// The caller passes whatever the user typed (email OR phone). An email goes out
// over our own SMTP and a phone over Arihant Global — Supabase's mailer and SMS
// provider are both bypassed. A phone destination is only ever returned masked,
// so this route can't be used to harvest numbers.
//
// "signup" stays SMS-only: it exists to confirm the phone on auth.users, which
// an email code cannot do.

import { NextResponse } from 'next/server';
import { jsonRoute } from '@/lib/api/json-route';
import {
  clientIp,
  contactFromIdentifier,
  emailContact,
  findUserByContact,
  issueAndSendOtp,
  maskContact,
  phoneContact,
  type OtpPurpose,
} from '@/lib/auth/phone-otp';

export const runtime = 'nodejs';

export const POST = jsonRoute('otp/send', async (req: Request) => {
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

  const typed = contactFromIdentifier(identifier);
  if (!typed) {
    return NextResponse.json(
      { error: 'Enter a valid email address or phone number.' },
      { status: 400 }
    );
  }

  const user = await findUserByContact(identifier);
  if (!user) {
    return NextResponse.json(
      { error: 'No account found with this email or phone.' },
      { status: 404 }
    );
  }

  // Signup verification confirms the phone, so it always goes to the number on
  // file regardless of which identifier the user typed to get here.
  if (purpose === 'signup') {
    if (!user.phone) {
      return NextResponse.json(
        { error: 'Your account has no phone on file. Please contact support.' },
        { status: 400 }
      );
    }
    if (user.phone_confirmed_at) {
      return NextResponse.json(
        { error: 'This phone is already verified. Please sign in.' },
        { status: 400 }
      );
    }
    const contact = phoneContact(user.phone);
    const sent = await issueAndSendOtp(contact, 'signup', clientIp(req));
    if (!sent.ok) {
      return NextResponse.json(
        { error: sent.error ?? 'Could not send the verification code.' },
        { status: sent.retryAfter ? 429 : 502 }
      );
    }
    return NextResponse.json({
      success: true,
      channel: 'sms',
      maskedPhone: maskContact(contact),
    });
  }

  // Reset: deliver on whichever channel the user asked for, provided the
  // account actually carries that contact.
  const contact =
    typed.channel === 'email'
      ? user.email
        ? emailContact(user.email)
        : null
      : user.phone
        ? phoneContact(user.phone)
        : null;

  if (!contact) {
    return NextResponse.json(
      {
        error:
          typed.channel === 'email'
            ? 'Your account has no email on file. Please reset using your phone number.'
            : 'Your account has no phone on file. Please reset using your email address.',
      },
      { status: 400 }
    );
  }

  const sent = await issueAndSendOtp(contact, 'reset', clientIp(req));
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error ?? 'Could not send the verification code.' },
      { status: sent.retryAfter ? 429 : 502 }
    );
  }

  return NextResponse.json({
    success: true,
    channel: contact.channel,
    // Named maskedPhone for both channels so existing callers keep working.
    maskedPhone: maskContact(contact),
  });
});
