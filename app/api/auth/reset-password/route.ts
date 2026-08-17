// Set a new password using the ticket minted by a verified "reset" OTP.
// Works for both channels: the ticket is bound to the contact the code was sent
// to, so an email ticket can only change that email account's password.

import { NextResponse } from 'next/server';
import { jsonRoute } from '@/lib/api/json-route';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  consumeResetTicket,
  emailContact,
  findUserByContact,
  isValidEmail,
  isValidPhone,
  phoneContact,
  phoneDigits,
} from '@/lib/auth/phone-otp';

export const runtime = 'nodejs';

export const POST = jsonRoute('reset-password', async (req: Request) => {
  let body: { phone?: string; email?: string; ticket?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ticket = (body.ticket ?? '').trim();
  const password = body.password ?? '';
  const email = (body.email ?? '').trim();
  const digits = phoneDigits(body.phone ?? '');

  const contact = isValidEmail(email)
    ? emailContact(email)
    : isValidPhone(digits)
      ? phoneContact(digits)
      : null;

  if (!contact || !ticket) {
    return NextResponse.json({ error: 'Verification expired. Please start again.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const consumed = await consumeResetTicket(contact, ticket);
  if (!consumed.ok) {
    return NextResponse.json({ error: consumed.error ?? 'Verification expired.' }, { status: 400 });
  }

  const identifier = contact.channel === 'email' ? contact.email ?? '' : contact.phone ?? '';
  const user = await findUserByContact(identifier);
  if (!user) {
    return NextResponse.json({ error: 'No account found with this email or phone.' }, { status: 404 });
  }

  // On the SMS path, confirm the phone alongside the password change: the user
  // just proved control of the number, and an unconfirmed phone would block
  // their login. An email reset says nothing about the phone, so leave it.
  const { error } = await supabaseAdmin().auth.admin.updateUserById(user.id, {
    password,
    ...(contact.channel === 'sms' ? { phone_confirm: true } : {}),
  });
  if (error) {
    console.error('[reset-password] could not update password:', error.message);
    return NextResponse.json({ error: 'Could not update the password. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
