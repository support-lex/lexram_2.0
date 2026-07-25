// Phone OTP issue/verify core. SERVER USE ONLY.
//
// Replaces Supabase's built-in (Twilio-backed) phone OTP: we mint the code,
// store only its hash in public.phone_otp_codes, deliver it through Arihant
// Global, and confirm the phone on auth.users ourselves via the admin API.
//
// Guarantees:
//   • raw codes/tickets are never persisted or logged
//   • 10-minute expiry, 5 verify attempts, single use
//   • 30s resend cooldown and 5 sends/hour per phone

import 'server-only';
import { createHash, randomInt, randomBytes, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOtpSms } from '@/lib/sms/arihant';

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 30;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const TICKET_TTL_MINUTES = 15;

export type OtpPurpose = 'signup' | 'reset';

export interface AuthUserRow {
  id: string;
  /** Digits only, as stored on auth.users. */
  phone: string | null;
  email: string | null;
  phone_confirmed_at: string | null;
}

// ─── Phone helpers ───────────────────────────────────────────────────────────

/** Digits only — the form auth.users.phone and the SMS gateway both use. */
export function phoneDigits(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

/** "+" + digits — the form the Supabase JS client expects. */
export function toE164(raw: string): string {
  return `+${phoneDigits(raw)}`;
}

export function isValidPhone(raw: string): boolean {
  return /^[1-9]\d{7,14}$/.test(phoneDigits(raw));
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((raw || '').trim());
}

/** "+919344186508" → "+91••••••6508". Safe to hand to an unauthenticated UI. */
export function maskPhone(raw: string): string {
  const d = phoneDigits(raw);
  if (d.length < 6) return '••••';
  return `+${d.slice(0, 2)}${'•'.repeat(Math.max(0, d.length - 6))}${d.slice(-4)}`;
}

// ─── Hashing ─────────────────────────────────────────────────────────────────

function pepper(): string {
  // Dedicated secret when present; otherwise fall back to the service-role key,
  // which is already required for every server route in this flow.
  return process.env.OTP_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function hash(...parts: string[]): string {
  return createHash('sha256').update([...parts, pepper()].join('|')).digest('hex');
}

function hashesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// ─── User lookup ─────────────────────────────────────────────────────────────

/** Resolve an email-or-phone identifier to an auth.users row (or null). */
export async function findUserByContact(identifier: string): Promise<AuthUserRow | null> {
  const id = (identifier || '').trim();
  if (!id) return null;

  const isEmail = isValidEmail(id);
  const { data, error } = await supabaseAdmin().rpc('auth_user_by_contact', {
    p_phone: isEmail ? null : phoneDigits(id),
    p_email: isEmail ? id : null,
  });
  if (error) {
    console.error('[phone-otp] auth_user_by_contact failed:', error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as AuthUserRow | undefined) ?? null;
}

// ─── Issue ───────────────────────────────────────────────────────────────────

export interface IssueResult {
  ok: boolean;
  error?: string;
  /** Seconds the caller must wait, when rate-limited. */
  retryAfter?: number;
}

/**
 * Generate a code for `phone`, persist its hash and send the SMS. The row is
 * rolled back if the gateway rejects the submission, so a failed send never
 * invalidates a previously working code.
 */
export async function issueAndSendOtp(
  phone: string,
  purpose: OtpPurpose,
  ip?: string | null
): Promise<IssueResult> {
  const digits = phoneDigits(phone);
  if (!isValidPhone(digits)) return { ok: false, error: 'Invalid phone number.' };

  const sb = supabaseAdmin();
  const now = Date.now();

  // Housekeeping: drop rows that expired more than a day ago.
  await sb
    .from('phone_otp_codes')
    .delete()
    .lt('expires_at', new Date(now - 24 * 60 * 60 * 1000).toISOString());

  // Rate limits — cooldown + hourly cap, per phone.
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const { data: recent } = await sb
    .from('phone_otp_codes')
    .select('created_at')
    .eq('phone', digits)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: false });

  const sends = recent ?? [];
  if (sends.length >= MAX_SENDS_PER_HOUR) {
    return {
      ok: false,
      error: 'Too many verification codes requested. Please try again in an hour.',
    };
  }
  if (sends.length > 0) {
    const elapsed = (now - new Date(sends[0].created_at as string).getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const retryAfter = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      return {
        ok: false,
        retryAfter,
        error: `Please wait ${retryAfter}s before requesting another code.`,
      };
    }
  }

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
  const { data: inserted, error: insertErr } = await sb
    .from('phone_otp_codes')
    .insert({
      phone: digits,
      purpose,
      code_hash: hash(digits, purpose, code),
      expires_at: new Date(now + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
      ip: ip ?? null,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    console.error('[phone-otp] could not persist code:', insertErr?.message);
    return { ok: false, error: 'Could not start verification. Please try again.' };
  }

  const sms = await sendOtpSms(digits, code);
  if (!sms.ok) {
    await sb.from('phone_otp_codes').delete().eq('id', inserted.id);
    return { ok: false, error: sms.error ?? 'Could not send the verification code.' };
  }

  return { ok: true };
}

// ─── Verify ──────────────────────────────────────────────────────────────────

export interface ConsumeResult {
  ok: boolean;
  error?: string;
}

/** Check a submitted code against the newest live code for phone+purpose. */
export async function consumeOtp(
  phone: string,
  purpose: OtpPurpose,
  code: string
): Promise<ConsumeResult> {
  const digits = phoneDigits(phone);
  if (!/^\d{6}$/.test(code)) return { ok: false, error: 'OTP must be 6 digits.' };

  const sb = supabaseAdmin();
  const { data: row, error } = await sb
    .from('phone_otp_codes')
    .select('id, code_hash, attempts, expires_at, consumed_at')
    .eq('phone', digits)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[phone-otp] lookup failed:', error.message);
    return { ok: false, error: 'Could not verify the code. Please try again.' };
  }
  if (!row) return { ok: false, error: 'No active code. Please request a new one.' };
  if (new Date(row.expires_at as string).getTime() < Date.now())
    return { ok: false, error: 'OTP expired. Please request a new code.' };
  if ((row.attempts as number) >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  if (!hashesEqual(row.code_hash as string, hash(digits, purpose, code))) {
    await sb
      .from('phone_otp_codes')
      .update({ attempts: (row.attempts as number) + 1 })
      .eq('id', row.id);
    return { ok: false, error: 'Invalid OTP. Please check and try again.' };
  }

  // Single use: burn it before the caller acts on the result.
  const { error: burnErr } = await sb
    .from('phone_otp_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('consumed_at', null);
  if (burnErr) {
    console.error('[phone-otp] could not consume code:', burnErr.message);
    return { ok: false, error: 'Could not verify the code. Please try again.' };
  }

  return { ok: true };
}

// ─── Password-reset ticket ───────────────────────────────────────────────────
// A verified 'reset' OTP does NOT create a session. Instead it mints a
// single-use ticket that only authorises setting a new password for that phone.

export async function issueResetTicket(phone: string): Promise<string | null> {
  const digits = phoneDigits(phone);
  const ticket = randomBytes(32).toString('hex');

  const sb = supabaseAdmin();
  const { data: row } = await sb
    .from('phone_otp_codes')
    .select('id')
    .eq('phone', digits)
    .eq('purpose', 'reset')
    .not('consumed_at', 'is', null)
    .order('consumed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return null;

  const { error } = await sb
    .from('phone_otp_codes')
    .update({
      ticket_hash: hash(digits, 'ticket', ticket),
      ticket_expires_at: new Date(Date.now() + TICKET_TTL_MINUTES * 60 * 1000).toISOString(),
    })
    .eq('id', row.id);
  if (error) {
    console.error('[phone-otp] could not store reset ticket:', error.message);
    return null;
  }
  return ticket;
}

export async function consumeResetTicket(phone: string, ticket: string): Promise<ConsumeResult> {
  const digits = phoneDigits(phone);
  if (!ticket) return { ok: false, error: 'Verification expired. Please start again.' };

  const sb = supabaseAdmin();
  const { data: row } = await sb
    .from('phone_otp_codes')
    .select('id, ticket_expires_at')
    .eq('phone', digits)
    .eq('purpose', 'reset')
    .eq('ticket_hash', hash(digits, 'ticket', ticket))
    .maybeSingle();

  if (!row) return { ok: false, error: 'Verification expired. Please start again.' };
  if (
    !row.ticket_expires_at ||
    new Date(row.ticket_expires_at as string).getTime() < Date.now()
  ) {
    return { ok: false, error: 'Verification expired. Please start again.' };
  }

  // Burn the ticket so a password can be set exactly once per verification.
  await sb
    .from('phone_otp_codes')
    .update({ ticket_hash: null, ticket_expires_at: null })
    .eq('id', row.id);

  return { ok: true };
}

// ─── Misc ────────────────────────────────────────────────────────────────────

export function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}
