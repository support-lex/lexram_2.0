import nodemailer from 'nodemailer';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

/**
 * Env values pasted through a dashboard or piped from a file can arrive with a
 * UTF-8 BOM and/or a trailing newline baked in. Observed in production: an
 * SMTP_HOST that resolved to U+FEFF + "smtp.gmail.com" + CRLF, which fails DNS
 * with EDNS/EBUSY before a single message is sent — silently breaking every
 * app email, not just OTP. Strip both so a stray byte can't take the mailer
 * down.
 */
function envClean(name: string): string {
  // U+FEFF as an escape, not a literal, so the guard survives however this
  // file is encoded. (trim() also drops U+FEFF, but be explicit about it.)
  return (process.env[name] ?? '').replace(/^\uFEFF/, '').trim();
}

function getTransporter() {
  if (transporter) return transporter;
  const host = envClean('SMTP_HOST') || 'smtp.gmail.com';
  const port = Number(envClean('SMTP_PORT') || 587);
  const user = envClean('SMTP_USER');
  const pass = envClean('SMTP_PASS');
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }) {
  const t = getTransporter();
  if (!t) {
    console.warn('[mail] SMTP_USER/SMTP_PASS not configured — skipping send:', opts.subject);
    return;
  }
  const fromName = envClean('MAIL_FROM_NAME') || 'Lexram';
  const fromAddr = envClean('MAIL_FROM') || envClean('SMTP_USER');
  await t.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
