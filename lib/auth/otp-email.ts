// OTP delivery over our own SMTP. SERVER USE ONLY.
//
// The email counterpart of lib/sms/arihant.ts. Supabase's mailer is not
// involved: it only delivers to project team members unless custom SMTP is
// configured, which is what produced "Error sending magic link email" for real
// users. Same shape as sendOtpSms so issueAndSendOtp can treat both alike.

// NB: the TTL arrives as an argument rather than an import — phone-otp.ts
// imports this module, and importing it back would close a cycle.
import 'server-only';
import { sendMail } from '@/lib/mail';

export interface MailResult {
  ok: boolean;
  /** User-facing message. Never contains SMTP credentials. */
  error?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: string,
  ttlMinutes: number
): Promise<MailResult> {
  if (!isEmailConfigured()) {
    console.error('[otp-email] SMTP_USER/SMTP_PASS missing in env');
    return { ok: false, error: 'Email service is not configured. Please contact support.' };
  }

  const heading = purpose === 'signup' ? 'Verify your email' : 'Reset your password';
  const lead =
    purpose === 'signup'
      ? 'Use this code to finish setting up your Lexram account.'
      : 'Use this code to reset your Lexram password.';

  const text =
    `${heading}\n\n${lead}\n\n` +
    `Your code is ${code}\n\n` +
    `It expires in ${ttlMinutes} minutes. If you didn't request this, ignore this email — ` +
    `your password stays unchanged.`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111">
      <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
      <p style="font-size:15px;line-height:1.5;margin:0 0 24px;color:#444">${lead}</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:20px;background:#f4f4f5;border-radius:10px">${code}</div>
      <p style="font-size:13px;line-height:1.6;color:#666;margin:24px 0 0">
        This code expires in ${ttlMinutes} minutes. If you didn't request it, ignore this
        email — your password stays unchanged.
      </p>
    </div>`;

  try {
    await sendMail({ to, subject: `${code} is your Lexram verification code`, text, html });
    return { ok: true };
  } catch (err) {
    // Log the cause (SMTP auth, DNS, throttling) so failures are diagnosable.
    console.error('[otp-email] send failed:', err);
    return { ok: false, error: 'Could not send the email. Please try again in a moment.' };
  }
}
