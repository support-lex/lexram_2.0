// Arihant Global SMS gateway — the only SMS transport in the app.
// SERVER USE ONLY: the gateway password must never reach the browser.
//
// DLT rules: the message body has to match the approved template character for
// character, and the sender header must be the DLT-approved 6-char ID. Any
// drift and the gateway rejects the submission (or the telco drops it silently).
//
// Env (see .env):
//   ARIHANT_SMS_URL          optional, defaults to the production endpoint
//   ARIHANT_SMS_USERNAME     e.g. lexramai.trans  (".trans" = transactional)
//   ARIHANT_SMS_PASSWORD     panel → My Profile → 🔒 (NOT the web login password)
//   ARIHANT_SMS_SENDER       6 alpha chars, DLT-approved header (LEXRAM)
//   ARIHANT_DLT_ENTITY_ID    DLT Principal Entity Id
//   ARIHANT_DLT_CONTENT_ID   DLT Content Id for the OTP template

import 'server-only';

const DEFAULT_ENDPOINT = 'https://control.arihantglobal.in/fe/api/v1/send';
const REQUEST_TIMEOUT_MS = 15_000;

export interface SmsResult {
  ok: boolean;
  transactionId?: string;
  /** User-facing message. Never contains gateway credentials. */
  error?: string;
}

/**
 * The DLT-approved OTP template. `{var}` is the only variable part — do not
 * reword, re-space or re-punctuate this string.
 */
export function otpMessage(code: string): string {
  return `LEXRAM: Your Login OTP is ${code} . This OTP is valid for 10 minutes. Please don't share this with anyone.`;
}

/** Gateway wants the country code with no "+" and no separators. */
function toGatewayMsisdn(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.ARIHANT_SMS_USERNAME &&
    process.env.ARIHANT_SMS_PASSWORD &&
    process.env.ARIHANT_DLT_ENTITY_ID &&
    process.env.ARIHANT_DLT_CONTENT_ID
  );
}

export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  const endpoint = process.env.ARIHANT_SMS_URL || DEFAULT_ENDPOINT;
  const username = process.env.ARIHANT_SMS_USERNAME;
  const password = process.env.ARIHANT_SMS_PASSWORD;
  const sender   = process.env.ARIHANT_SMS_SENDER || 'LEXRAM';
  const entityId = process.env.ARIHANT_DLT_ENTITY_ID;
  const contentId = process.env.ARIHANT_DLT_CONTENT_ID;

  if (!username || !password || !entityId || !contentId) {
    console.error('[arihant] missing SMS credentials in env');
    return { ok: false, error: 'SMS service is not configured. Please contact support.' };
  }

  const msisdn = toGatewayMsisdn(phone);
  if (msisdn.length < 10) return { ok: false, error: 'Invalid phone number.' };

  const params = new URLSearchParams({
    username,
    password,
    unicode: 'false',              // English only — the template is ASCII
    from: sender,
    to: msisdn,
    text: otpMessage(code),
    dltPrincipalEntityId: entityId,
    dltContentId: contentId,
  });

  let raw: string;
  let httpStatus: number;
  try {
    const res = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    httpStatus = res.status;
    raw = await res.text();
  } catch (err) {
    console.error('[arihant] network error:', err);
    return { ok: false, error: 'Could not reach the SMS service. Please try again.' };
  }

  // HTTP 200 alone is NOT success — the gateway reports failures in the body.
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    parsed = null;
  }

  const state = typeof parsed?.state === 'string' ? parsed.state : '';
  if (state === 'SUBMIT_ACCEPTED') {
    return { ok: true, transactionId: String(parsed?.transactionId ?? '') };
  }

  // Log the raw gateway response (minus credentials, which only ride in the
  // query string) so delivery failures are diagnosable from server logs.
  console.error('[arihant] send failed', { httpStatus, body: raw.slice(0, 500) });
  return { ok: false, error: gatewayError(raw) };
}

/** Map the gateway's error vocabulary onto something a user can act on. */
function gatewayError(raw: string): string {
  const body = raw.toLowerCase();
  if (body.includes('authentication failure') || body.includes('2070'))
    return 'SMS service authentication failed. Please contact support.';
  if (body.includes('invalid_source_address'))
    return 'SMS sender is misconfigured. Please contact support.';
  if (body.includes('insufficient balance') || body.includes('6001'))
    return 'SMS service is temporarily unavailable. Please contact support.';
  if (body.includes('template') || body.includes('5001'))
    return 'SMS template is misconfigured. Please contact support.';
  if (body.includes('invalid_msisdn'))
    return 'That phone number could not be reached. Please check and try again.';
  return 'Could not send the SMS. Please try again in a moment.';
}
