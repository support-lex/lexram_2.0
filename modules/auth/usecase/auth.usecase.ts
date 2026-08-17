// Auth use-cases. Sessions are Supabase; OTP is ours, on both channels.
//
// No OTP goes through Supabase Auth — neither its SMS provider nor its mailer.
// We mint, send and verify codes ourselves through app/api/auth/* (Arihant
// Global for SMS, our own SMTP for email). Supabase only stores the user and
// issues the session. Email joined this path because Supabase's built-in mailer
// only delivers to project team members, which real users saw as "Error sending
// magic link email".
//
// Flows:
//   • Signup → POST /api/auth/signup (creates unconfirmed user + sends SMS OTP)
//              → verify OTP → phone confirmed → sign in with phone + password
//   • Login  → email or phone + password. An unconfirmed phone bounces the user
//              into the same SMS OTP screen.
//   • Forgot → OTP to whichever contact the user typed, then a new password via
//              a single-use reset ticket. Neither channel creates a session.

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
export type OtpIntent = 'signup' | 'reset';

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

export interface SendOtpResult extends UsecaseResult {
  /** Partially hidden destination, safe to render (e.g. "+91••••••6508"). */
  maskedPhone?: string;
}

export interface SignupResult extends SendOtpResult {
  /** What to pass back to verify/resend — the phone in E.164. */
  otpIdentifier?: string;
  /**
   * True when the phone is already attached to a verified account. The caller
   * is expected to flip the form into Sign in mode (with the phone prefilled)
   * instead of showing the raw error string.
   */
  alreadyRegistered?: boolean;
}

export interface LoginResult extends UsecaseResult {
  /**
   * Credentials were correct but the phone was never confirmed — the caller
   * should send an OTP and show the verification screen.
   */
  needsPhoneVerification?: boolean;
}

export interface SendResetOtpResult extends SendOtpResult {
  contact?: string;
  channel?: OtpChannel;
}

// ─── API helper ──────────────────────────────────────────────────────────────

interface ApiResponse {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

async function postJson(path: string, body: unknown): Promise<ApiResponse> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as ApiResponse;
    if (!res.ok) return { ...data, success: false, error: data.error ?? 'Something went wrong.' };
    return { ...data, success: true };
  } catch (err) {
    console.error(`[auth] ${path} failed:`, err);
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
}

// ─── Signup: create the account, then send our SMS OTP ────────────────────────

export interface SignupInput {
  phone: string;        // the actual auth identifier
  password: string;
  confirm_password: string;
}

export async function signupUsecase(input: SignupInput): Promise<SignupResult> {
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

  const data = await postJson('/api/auth/signup', { phone, password: input.password });
  if (!data.success) {
    return {
      success: false,
      error: data.error,
      alreadyRegistered: data.alreadyRegistered === true,
    };
  }

  return {
    success: true,
    otpIdentifier: phone,
    maskedPhone: typeof data.maskedPhone === 'string' ? data.maskedPhone : undefined,
  };
}

// ─── Verify the signup OTP, then sign in ──────────────────────────────────────
// Confirming the phone happens server-side; the session comes from a normal
// password sign-in right after, which is why the password is needed here.

export async function verifySignupOtpUsecase(
  identifier: string,
  token: string,
  password: string
): Promise<UsecaseResult> {
  if (!/^\d{6}$/.test(token)) return { success: false, error: 'OTP must be 6 digits.' };

  const data = await postJson('/api/auth/otp/verify', {
    identifier,
    purpose: 'signup',
    code: token,
  });
  if (!data.success) return { success: false, error: data.error ?? 'Verification failed.' };

  if (!password) {
    // Phone is verified but we have no password in hand (e.g. the tab was
    // reloaded mid-flow) — send them back to sign in rather than hanging.
    return { success: false, error: 'Phone verified. Please sign in with your password.' };
  }

  const login = await loginUsecase(
    typeof data.phone === 'string' ? data.phone : identifier,
    password
  );
  if (!login.success) return login;

  // Belt-and-suspenders profile sync. The DB trigger `on_auth_user_change`
  // already mirrors auth.users → public.profiles, but we also upsert from the
  // client so the table is up-to-date even if the trigger isn't installed yet.
  if (login.user) await profileRepository.upsertCurrent(login.user);

  return login;
}

// ─── Login (email OR phone + password) ────────────────────────────────────────

export async function loginUsecase(
  identifier: string,
  password: string
): Promise<LoginResult> {
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

  if (error) {
    // Supabase validates the password BEFORE reporting "phone not confirmed",
    // so this branch means the credentials were right — the user just never
    // finished OTP verification. Route them to the OTP screen.
    if (isPhoneUnconfirmedError(error.message)) {
      return {
        success: false,
        needsPhoneVerification: true,
        phone: isPhone ? phone : '',
        error: 'Please verify your phone number to continue.',
      };
    }
    return { success: false, error: friendlyError(error.message) };
  }

  const phoneVerified = !!data.user?.phone_confirmed_at;
  const userPhone = data.user?.phone ? `+${data.user.phone}` : '';

  return {
    success: true,
    user: userFromSupabase(data.user) ?? undefined,
    phoneVerified,
    phone: userPhone,
  };
}

// ─── Send a signup OTP to an existing unverified user ─────────────────────────
// Used when a user logs in but their phone isn't confirmed yet. `identifier`
// may be the email or the phone — the server resolves the number on file.

export async function sendVerificationOtpUsecase(
  identifier: string
): Promise<SendOtpResult> {
  const id = identifier.trim();
  if (!id) return { success: false, error: 'Email or phone is required.' };

  const data = await postJson('/api/auth/otp/send', { identifier: id, purpose: 'signup' });
  if (!data.success) return { success: false, error: data.error ?? 'Could not send the code.' };
  return {
    success: true,
    maskedPhone: typeof data.maskedPhone === 'string' ? data.maskedPhone : undefined,
  };
}

// ─── Forgot password: send OTP via the matching channel ───────────────────────

export async function sendResetOtpUsecase(
  identifier: string
): Promise<SendResetOtpResult> {
  const id = identifier.trim();
  if (!id) return { success: false, error: 'Email or phone is required.' };

  const phone = normalizePhone(id);
  const isEmail = isValidEmail(id);
  if (!isEmail && !isValidPhone(phone)) {
    return { success: false, error: 'Enter a valid email address or phone number.' };
  }

  // Both channels now go through our own OTP routes. Supabase's mailer is not
  // involved: without custom SMTP it only delivers to project team members,
  // which is what surfaced as "Error sending magic link email".
  const contact = isEmail ? id : phone;
  const data = await postJson('/api/auth/otp/send', { identifier: contact, purpose: 'reset' });
  if (!data.success) return { success: false, error: data.error ?? 'Could not send the code.' };

  return {
    success: true,
    contact,
    channel: data.channel === 'sms' || data.channel === 'email' ? data.channel : isEmail ? 'email' : 'sms',
    maskedPhone: typeof data.maskedPhone === 'string' ? data.maskedPhone : undefined,
  };
}

// ─── Verify reset OTP ─────────────────────────────────────────────────────────
// Neither channel creates a session. Both stash a single-use ticket that
// /reset-password exchanges for the password change.

export async function verifyResetOtpUsecase(
  contact: string,
  channel: OtpChannel,
  token: string
): Promise<UsecaseResult> {
  if (!/^\d{6}$/.test(token)) return { success: false, error: 'OTP must be 6 digits.' };

  const data = await postJson('/api/auth/otp/verify', {
    identifier: contact,
    purpose: 'reset',
    code: token,
  });
  if (!data.success) return { success: false, error: data.error ?? 'Verification failed.' };

  // Prefer the contact the server actually issued the ticket against.
  const verified =
    channel === 'email'
      ? typeof data.email === 'string'
        ? data.email
        : contact
      : typeof data.phone === 'string'
        ? data.phone
        : contact;

  storeResetTicket(verified, channel, String(data.resetTicket ?? ''));
  return { success: true };
}

// ─── Update password ─────────────────────────────────────────────────────────

/** Email/OTP-session path: the user is signed in, Supabase does the update. */
export async function updatePasswordUsecase(
  newPassword: string,
  confirmPassword: string
): Promise<UsecaseResult> {
  const invalid = validateNewPassword(newPassword, confirmPassword);
  if (invalid) return invalid;

  const { error } = await supabase().auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: friendlyError(error.message) };
  return { success: true };
}

/**
 * SMS path: no session yet. Spend the reset ticket from the verified OTP, then
 * sign the user in with the password they just chose.
 */
export async function resetPasswordWithTicketUsecase(
  newPassword: string,
  confirmPassword: string
): Promise<UsecaseResult> {
  const invalid = validateNewPassword(newPassword, confirmPassword);
  if (invalid) return invalid;

  const ticket = readResetTicket();
  if (!ticket) {
    return { success: false, error: 'Verification expired. Please start again.' };
  }

  const data = await postJson('/api/auth/reset-password', {
    ...(ticket.channel === 'email' ? { email: ticket.contact } : { phone: ticket.contact }),
    ticket: ticket.token,
    password: newPassword,
  });
  if (!data.success) return { success: false, error: data.error ?? 'Could not update the password.' };

  clearResetTicket();
  return loginUsecase(ticket.contact, newPassword);
}

// ─── Resend OTP (used by both signup and reset OTP screens) ───────────────────

export async function resendOtpUsecase(
  contact: string,
  channel: OtpChannel,
  intent: OtpIntent = 'reset'
): Promise<SendOtpResult> {
  void channel; // the server re-derives the channel from the identifier
  const data = await postJson('/api/auth/otp/send', { identifier: contact, purpose: intent });
  if (!data.success) return { success: false, error: data.error ?? 'Could not resend the code.' };
  return {
    success: true,
    maskedPhone: typeof data.maskedPhone === 'string' ? data.maskedPhone : undefined,
  };
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logoutUsecase(): Promise<void> {
  await supabase().auth.signOut();
}

// ─── Reset-ticket handoff (sign-in form → /reset-password) ────────────────────
// sessionStorage, not the URL: the ticket authorises a password change, so it
// must not end up in history, referrers or shared links. Cleared on use.

const TICKET_KEY = 'lexram.reset.ticket';

interface ResetTicket { contact: string; channel: OtpChannel; token: string }

function storeResetTicket(contact: string, channel: OtpChannel, token: string): void {
  if (typeof window === 'undefined' || !token) return;
  sessionStorage.setItem(TICKET_KEY, JSON.stringify({ contact, channel, token }));
}

export function readResetTicket(): ResetTicket | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(TICKET_KEY);
    if (!raw) return null;
    // `phone` is the pre-email shape; keep reading it so a ticket minted just
    // before a deploy still works.
    const parsed = JSON.parse(raw) as Partial<ResetTicket> & { phone?: string };
    const contact = parsed.contact || parsed.phone || '';
    const channel: OtpChannel = parsed.channel === 'email' ? 'email' : 'sms';
    return contact && parsed.token ? { contact, channel, token: parsed.token } : null;
  } catch {
    return null;
  }
}

export function clearResetTicket(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TICKET_KEY);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateNewPassword(pw: string, confirm: string): UsecaseResult | null {
  if (pw.length < 8) return { success: false, error: 'Password must be at least 8 characters.' };
  if (pw !== confirm) return { success: false, error: 'Passwords do not match.' };
  return null;
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('over_email_send_rate_limit'))
    return 'Too many requests. Please wait a few seconds before trying again.';
  if (m.includes('invalid login credentials')) return 'Incorrect email/phone or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (m.includes('expired')) return 'OTP expired. Please request a new code.';
  if (m.includes('invalid') && (m.includes('otp') || m.includes('token')))
    return 'Invalid OTP. Please check and try again.';
  if (m.includes('user not found')) return 'No account found with this email or phone.';
  return msg;
}

/** Supabase's "the password was right but the phone isn't confirmed" error. */
function isPhoneUnconfirmedError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('phone not confirmed') || m.includes('phone_not_confirmed');
}
