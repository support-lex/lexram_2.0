// Phone signup, step 1 of 2: create the (unconfirmed) auth user and send our
// own OTP over Arihant Global. Supabase never sends an SMS — the browser must
// NOT call supabase.auth.signUp({ phone }) anymore.
//
// Step 2 is POST /api/auth/otp/verify with purpose "signup", which confirms the
// phone; the browser then signs in normally with phone + password.

import { NextResponse } from 'next/server';
import { jsonRoute } from '@/lib/api/json-route';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  clientIp,
  findUserByContact,
  isValidPhone,
  issueAndSendOtp,
  maskPhone,
  phoneContact,
  phoneDigits,
  toE164,
} from '@/lib/auth/phone-otp';

export const runtime = 'nodejs';

export const POST = jsonRoute('signup', async (req: Request) => {
  let body: { phone?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const digits = phoneDigits(body.phone ?? '');
  const password = body.password ?? '';

  if (!isValidPhone(digits)) {
    return NextResponse.json(
      { error: 'Enter a valid phone number in international format (e.g. +919876543210).' },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const existing = await findUserByContact(digits);

  // Confirmed account → tell the caller to switch into Sign in mode rather
  // than marching them to an OTP screen for a code they don't need.
  if (existing?.phone_confirmed_at) {
    return NextResponse.json(
      {
        error: 'An account with this phone number already exists.',
        alreadyRegistered: true,
      },
      { status: 409 }
    );
  }

  const sb = supabaseAdmin();

  if (existing) {
    // An abandoned, never-verified signup. Nobody can hold this account (login
    // is blocked until the phone is confirmed), so let the new attempt take it
    // over with the password just entered instead of dead-ending the user.
    const { error } = await sb.auth.admin.updateUserById(existing.id, { password });
    if (error) {
      console.error('[signup] could not reset unverified account password:', error.message);
      return NextResponse.json({ error: 'Could not start signup. Please try again.' }, { status: 500 });
    }
  } else {
    const { error } = await sb.auth.admin.createUser({
      phone: toE164(digits),
      password,
      phone_confirm: false, // our OTP flow flips this, never Supabase's
    });
    if (error) {
      console.error('[signup] admin.createUser failed:', error.message);
      const msg = error.message.toLowerCase();
      if (msg.includes('already') || msg.includes('exists')) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists.', alreadyRegistered: true },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: 'Could not create the account. Please try again.' }, { status: 500 });
    }
  }

  const sent = await issueAndSendOtp(phoneContact(digits), 'signup', clientIp(req));
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error ?? 'Could not send the verification code.' },
      { status: 429 }
    );
  }

  return NextResponse.json({ success: true, maskedPhone: maskPhone(digits) });
});
