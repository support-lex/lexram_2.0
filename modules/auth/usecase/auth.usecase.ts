// Auth use-cases backed by Supabase.
// Flows:
//   • Signup → email/password + profile metadata, then EMAIL OTP gating before login
//   • Login  → email or phone + password (no OTP)
//   • Forgot → email-or-phone OTP, then update password while signed in via OTP

import { supabase } from '@/lib/supabase/client';
import { userFromSupabase, type StoredUser } from '../storage/userStorage';
import { profileRepository } from '../repository/profile.repository';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164: +<country><number>, 8–15 digits total. Strip spaces/dashes first.
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s().-]/g, '');
}
export function isValidEmail(raw: string): boolean {
  return EMAIL_REGEX.test(raw.trim());
}
export function isValidPhone(raw: string): boolean {
  return PHONE_REGEX.test(normalizePhone(raw));
}

export type OtpChannel = 'email' | 'sms';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface UsecaseResult {
  success: boolean;
  error?: string;
  user?: StoredUser;
  /** True only when the user's phone has been confirmed via OTP. */
  phoneVerified?: boolean;
  /** Phone number on the auth.users row, populated when login succeeds. */
  phone?: string;
}

export interface SignupResult extends UsecaseResult {
  otpPhone?: string;
}

export interface SendResetOtpResult extends UsecaseResult {
  contact?: string;
  channel?: OtpChannel;
}

// ─── Signup: create account, then trigger email OTP gating ────────────────────

export interface SignupInput {
  first_name: string;
  last_name: string;
  country: string;
  email: string;        // stored as profile metadata only — NOT used for auth
  phone: string;        // the actual auth identifier
  password: string;
  confirm_password: string;
}

export async function signupUsecase(input: SignupInput): Promise<SignupResult> {
  if (!input.first_name.trim() || !input.last_name.trim()) {
    return { success: false, error: 'First and last name are required.' };
  }
  if (!input.country.trim()) {
    return { success: false, error: 'Please select your country.' };
  }
  if (!isValidEmail(input.email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  const phone = normalizePhone(input.phone);
  if (!isValidPhone(phone)) {
    return {
      success: false,
      error: 'Enter a valid phone number in international format (e.g. +919876543210).',
    };
  }
  if (input.password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }
  if (input.password !== input.confirm_password) {
    return { success: false, error: 'Passwords do not match.' };
  }

  // Phone-only auth. We deliberately do NOT pass `email` to signUp() because
  // the Supabase project has email signups disabled. The email is persisted
  // as profile metadata so it shows up in the dashboard / settings page.
  const { data, error: signUpErr } = await supabase().auth.signUp({
    phone,
    password: input.password,
    options: {
      data: {
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        country: input.country.trim(),
        email: input.email.trim(),
      },
    },
  });
  if (signUpErr) {
    console.error('[signup] supabase.auth.signUp error:', signUpErr);
    return { success: false, error: friendlyError(signUpErr.message) };
  }

  // Detailed logging so we can diagnose silent SMS-delivery failures.
  // Paste the full output of this group when reporting issues.
  console.groupCollapsed('[signup] signUp response');
  console.log('user_id:           ', data.user?.id);
  console.log('phone_confirmed_at:', data.user?.phone_confirmed_at);
  console.log('confirmed_at:      ', data.user?.confirmed_at);
  console.log('identities:        ', data.user?.identities);
  console.log('session:           ', !!data.session);
  console.log('full data.user:    ', data.user);
  console.groupEnd();

  // If phone confirmations are disabled in the Supabase project, signUp()
  // returns an active session — sign it out so the OTP screen still gates entry.
  if (data.session) {
    await supabase().auth.signOut();
  }

  return { success: true, otpPhone: phone };
}

// ─── Verify the signup OTP (logs the user in) ─────────────────────────────────

export async function verifySignupOtpUsecase(
  phone: string,
  token: string
): Promise<UsecaseResult> {
  const normalized = normalizePhone(phone);
  if (!isValidPhone(normalized)) return { success: false, error: 'Invalid phone number.' };
  if (!/^\d{6}$/.test(token)) return { success: false, error: 'OTP must be 6 digits.' };

  const { data, error } = await supabase().auth.verifyOtp({
    phone: normalized,
    token,
    type: 'sms',
  });
  if (error) return { success: false, error: friendlyError(error.message) };

  // Belt-and-suspenders profile sync. The DB trigger `on_auth_user_change`
  // already mirrors auth.users → public.profiles, but we also upsert from the
  // client so the table is up-to-date even if the trigger isn't installed yet.
  const stored = userFromSupabase(data.user);
  if (stored) {
    await profileRepository.upsertCurrent(stored);
  }

  return { success: true, user: stored ?? undefined };
}

// ─── Login (email OR phone + password) ────────────────────────────────────────

export async function loginUsecase(
  identifier: string,
  password: string
): Promise<UsecaseResult> {
  const id = identifier.trim();
  if (!id) return { success: false, error: 'Email or phone is required.' };
  if (!password) return { success: false, error: 'Password is required.' };

  const isEmail = isValidEmail(id);
  const phone = normalizePhone(id);
  const isPhone = !isEmail && isValidPhone(phone);

  if (!isEmail && !isPhone) {
    return {
      success: false,
      error: 'Enter a valid email address or phone number (e.g. +919876543210).',
    };
  }

  const { data, error } = isEmail
    ? await supabase().auth.signInWithPassword({ email: id, password })
    : await supabase().auth.signInWithPassword({ phone, password });

  if (error) return { success: false, error: friendlyError(error.message) };

  const phoneVerified = !!data.user?.phone_confirmed_at;
  const userPhone = data.user?.phone ? `+${data.user.phone}` : '';

  return {
    success: true,
    user: userFromSupabase(data.user) ?? undefined,
    phoneVerified,
    phone: userPhone,
  };
}

// ─── Send a fresh signup-confirmation OTP to an existing unverified user ──────
// Used when a user logs in but their phone isn't confirmed yet — we trigger a
// new SMS so they can finish the verification on the OTP screen.

export async function sendVerificationOtpUsecase(
  rawPhone: string
): Promise<UsecaseResult> {
  const phone = normalizePhone(rawPhone);
  if (!isValidPhone(phone)) {
    return { success: false, error: 'Invalid phone number on this account.' };
  }
  const { error } = await supabase().auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: false },
  });
  if (error) return { success: false, error: friendlyError(error.message) };
  return { success: true };
}

// ─── Forgot password: send OTP via the matching channel ───────────────────────

export async function sendResetOtpUsecase(
  identifier: string
): Promise<SendResetOtpResult> {
  const id = identifier.trim();
  if (!id) return { success: false, error: 'Email or phone is required.' };

  if (isValidEmail(id)) {
    const { error } = await supabase().auth.signInWithOtp({
      email: id,
      options: { shouldCreateUser: false },
    });
    if (error) return { success: false, error: friendlyError(error.message) };
    return { success: true, contact: id, channel: 'email' };
  }

  const phone = normalizePhone(id);
  if (isValidPhone(phone)) {
    const { error } = await supabase().auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    });
    if (error) return { success: false, error: friendlyError(error.message) };
    return { success: true, contact: phone, channel: 'sms' };
  }

  return { success: false, error: 'Enter a valid email address or phone number.' };
}

// ─── Verify reset OTP — leaves the user signed in via OTP ─────────────────────

export async function verifyResetOtpUsecase(
  contact: string,
  channel: OtpChannel,
  token: string
): Promise<UsecaseResult> {
  if (!/^\d{6}$/.test(token)) return { success: false, error: 'OTP must be 6 digits.' };

  const { data, error } =
    channel === 'email'
      ? await supabase().auth.verifyOtp({ email: contact, token, type: 'email' })
      : await supabase().auth.verifyOtp({ phone: contact, token, type: 'sms' });

  if (error) return { success: false, error: friendlyError(error.message) };
  return { success: true, user: userFromSupabase(data.user) ?? undefined };
}

// ─── Update password (called from /reset-password while signed in via OTP) ────

export async function updatePasswordUsecase(
  newPassword: string,
  confirmPassword: string
): Promise<UsecaseResult> {
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  const { error } = await supabase().auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: friendlyError(error.message) };
  return { success: true };
}

// ─── Resend OTP (used by both signup and reset OTP screens) ───────────────────

export async function resendOtpUsecase(
  contact: string,
  channel: OtpChannel
): Promise<UsecaseResult> {
  const { error } =
    channel === 'email'
      ? await supabase().auth.signInWithOtp({ email: contact, options: { shouldCreateUser: false } })
      : await supabase().auth.signInWithOtp({ phone: contact, options: { shouldCreateUser: false } });

  if (error) return { success: false, error: friendlyError(error.message) };
  return { success: true };
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logoutUsecase(): Promise<void> {
  await supabase().auth.signOut();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('over_email_send_rate_limit'))
    return 'Too many requests. Please wait a few seconds before trying again.';
  if (m.includes('invalid login credentials')) return 'Incorrect email/phone or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'An account with this email already exists.';
  if (m.includes('expired')) return 'OTP expired. Please request a new code.';
  if (m.includes('invalid') && (m.includes('otp') || m.includes('token')))
    return 'Invalid OTP. Please check and try again.';
  if (m.includes('user not found')) return 'No account found with this email or phone.';
  return msg;
}
