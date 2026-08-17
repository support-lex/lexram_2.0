// OTP issue/verify core. SERVER USE ONLY.
//
// Replaces Supabase's built-in OTP on BOTH channels: we mint the code, store
// only its hash in public.phone_otp_codes, deliver it ourselves (Arihant Global
// for SMS, our own SMTP for email) and confirm the contact on auth.users via
// the admin API.
//
// Email joined this path because Supabase's mailer only delivers to project
// team members without custom SMTP, which surfaced to users as "Error sending
// magic link email".
//
// Guarantees:
//   • raw codes/tickets are never persisted or logged
//   • 10-minute expiry, 5 verify attempts, single use
//   • 30s resend cooldown and 5 sends/hour per contact

import 'server-only';
import { createHash, randomInt, randomBytes, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOtpSms } from '@/lib/sms/arihant';
import { sendOtpEmail } from './otp-email';

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 30;
const MAX_SENDS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const TICKET_TTL_MINUTES = 15;

export type OtpPurpose = 'signup' | 'reset';
export type OtpChannel = 'sms' | 'email';

export interface AuthUserRow {
  id: string;
  /** Digits only, as stored on auth.users. */
  phone: string | null;
  email: string | null;
  phone_confirmed_at: string | null;
}

// ─── Contacts ────────────────────────────────────────────────────────────────
// A code belongs to exactly one contact: a phone (digits) or an email
// (lowercased). Everything below — the row, the rate limit, the hash — is keyed
// on that, so an SMS code can never be redeemed as an email code.

export interface Contact {
  channel: OtpChannel;
  /** Digits only. Set iff channel === 'sms'. */
  phone?: string;
  /** Lowercased and trimmed. Set iff channel === 'email'. */
  email?: string;
}

export function phoneContact(raw: string): Contact {
  return { channel: 'sms', phone: phoneDigits(raw) };
}

export function emailContact(raw: string): Contact {
  return { channel: 'email', email: (raw || '').trim().toLowerCase() };
}

/** Classify whatever the user typed. Returns null if it is neither. */
export function contactFromIdentifier(raw: string): Contact | null {
  const id = (raw || '').trim();
  if (!id) return null;
  if (isValidEmail(id)) return emailContact(id);
  const digits = phoneDigits(id);
  return isValidPhone(digits) ? phoneContact(digits) : null;
}

/** The value the hash and the rate limit are keyed on. */
function contactKey(c: Contact): string {
  return c.channel === 'email' ? c.email ?? '' : c.phone ?? '';
}

function isUsableContact(c: Contact): boolean {
  return c.channel === 'email' ? isValidEmail(c.email ?? '') : isValidPhone(c.phone ?? '');
}

/**
 * The contact column a query should filter on. Returned as a plain string
 * rather than wrapping the builder — a generic wrapper around PostgREST's
 * chained types trips TS2589 (excessively deep instantiation).
 */
function contactColumn(c: Contact): 'email' | 'phone' {
  return c.channel === 'email' ? 'email' : 'phone';
}

/** Masked destination, safe to hand to an unauthenticated UI. */
export function maskContact(c: Contact): string {
  return c.channel === 'email' ? maskEmail(c.email ?? '') : maskPhone(c.phone ?? '');
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

/** "someone@lexram.ai" → "so••••@lexram.ai". */
export function maskEmail(raw: string): string {
  const email = (raw || '').trim();
  const at = email.lastIndexOf('@');
  if (at < 1) return '••••';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local[0]}•••${domain}`;
  return `${local.slice(0, 2)}${'•'.repeat(Math.min(6, local.length - 2))}${domain}`;
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
 * Generate a code for `contact`, persist its hash and deliver it on the
 * matching channel. The row is rolled back if delivery fails, so a failed send
 * never invalidates a previously working code.
 */
export async function issueAndSendOtp(
  contact: Contact,
  purpose: OtpPurpose,
  ip?: string | null
): Promise<IssueResult> {
  if (!isUsableContact(contact)) {
    return { ok: false, error: 'Invalid email address or phone number.' };
  }

  const sb = supabaseAdmin();
  const now = Date.now();
  const key = contactKey(contact);

  // Housekeeping: drop rows that expired more than a day ago.
  await sb
    .from('phone_otp_codes')
    .delete()
    .lt('expires_at', new Date(now - 24 * 60 * 60 * 1000).toISOString());

  // Rate limits — cooldown + hourly cap, per contact.
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const { data: recent } = await sb
    .from('phone_otp_codes')
    .select('created_at')
    .eq(contactColumn(contact), key)
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
      // Only the column in play is sent: an SMS insert then still works against
      // a database where 20260817_email_otp.sql hasn't been applied yet, so the
      // deploy order of code vs migration can't break the phone flow.
      ...(contact.channel === 'email'
        ? { email: contact.email }
        : { phone: contact.phone }),
      purpose,
      code_hash: hash(key, purpose, code),
      expires_at: new Date(now + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
      ip: ip ?? null,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    console.error('[phone-otp] could not persist code:', insertErr?.message);
    return { ok: false, error: 'Could not start verification. Please try again.' };
  }

  const sent =
    contact.channel === 'email'
      ? await sendOtpEmail(contact.email ?? '', code, purpose, OTP_TTL_MINUTES)
      : await sendOtpSms(contact.phone ?? '', code);

  if (!sent.ok) {
    await sb.from('phone_otp_codes').delete().eq('id', inserted.id);
    return { ok: false, error: sent.error ?? 'Could not send the verification code.' };
  }

  return { ok: true };
}

// ─── Verify ──────────────────────────────────────────────────────────────────

export interface ConsumeResult {
  ok: boolean;
  error?: string;
}

/** Check a submitted code against the newest live code for contact+purpose. */
export async function consumeOtp(
  contact: Contact,
  purpose: OtpPurpose,
  code: string
): Promise<ConsumeResult> {
  if (!/^\d{6}$/.test(code)) return { ok: false, error: 'OTP must be 6 digits.' };

  const sb = supabaseAdmin();
  const { data: row, error } = await sb
    .from('phone_otp_codes')
    .select('id, code_hash, attempts, expires_at, consumed_at')
    .eq(contactColumn(contact), contactKey(contact))
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

  if (!hashesEqual(row.code_hash as string, hash(contactKey(contact), purpose, code))) {
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
// single-use ticket that only authorises setting a new password for that
// contact.

export async function issueResetTicket(contact: Contact): Promise<string | null> {
  const ticket = randomBytes(32).toString('hex');

  const sb = supabaseAdmin();
  const { data: row } = await sb
    .from('phone_otp_codes')
    .select('id')
    .eq(contactColumn(contact), contactKey(contact))
    .eq('purpose', 'reset')
    .not('consumed_at', 'is', null)
    .order('consumed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return null;

  const { error } = await sb
    .from('phone_otp_codes')
    .update({
      ticket_hash: hash(contactKey(contact), 'ticket', ticket),
      ticket_expires_at: new Date(Date.now() + TICKET_TTL_MINUTES * 60 * 1000).toISOString(),
    })
    .eq('id', row.id);
  if (error) {
    console.error('[phone-otp] could not store reset ticket:', error.message);
    return null;
  }
  return ticket;
}

export async function consumeResetTicket(
  contact: Contact,
  ticket: string
): Promise<ConsumeResult> {
  if (!ticket) return { ok: false, error: 'Verification expired. Please start again.' };

  const sb = supabaseAdmin();
  const { data: row } = await sb
    .from('phone_otp_codes')
    .select('id, ticket_expires_at')
    .eq(contactColumn(contact), contactKey(contact))
    .eq('purpose', 'reset')
    .eq('ticket_hash', hash(contactKey(contact), 'ticket', ticket))
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
