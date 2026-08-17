// Set a new password using the ticket minted by a verified "reset" phone OTP.
// Email-based resets don't come here — those still ride Supabase's email OTP,
// which leaves the user signed in so the client can call updateUser() directly.

import { NextResponse } from 'next/server';
import { jsonRoute } from '@/lib/api/json-route';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { consumeResetTicket, findUserByContact, phoneDigits } from '@/lib/auth/phone-otp';

export const runtime = 'nodejs';

export const POST = jsonRoute('reset-password', async (req: Request) => {
  let body: { phone?: string; ticket?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const digits = phoneDigits(body.phone ?? '');
  const ticket = (body.ticket ?? '').trim();
  const password = body.password ?? '';

  if (!digits || !ticket) {
    return NextResponse.json({ error: 'Verification expired. Please start again.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const consumed = await consumeResetTicket(digits, ticket);
  if (!consumed.ok) {
    return NextResponse.json({ error: consumed.error ?? 'Verification expired.' }, { status: 400 });
  }

  const user = await findUserByContact(digits);
  if (!user) {
    return NextResponse.json({ error: 'No account found with this phone number.' }, { status: 404 });
  }

  // Confirm the phone alongside the password change: the user just proved
  // control of the number, and an unconfirmed phone would block their login.
  const { error } = await supabaseAdmin().auth.admin.updateUserById(user.id, {
    password,
    phone_confirm: true,
  });
  if (error) {
    console.error('[reset-password] could not update password:', error.message);
    return NextResponse.json({ error: 'Could not update the password. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
