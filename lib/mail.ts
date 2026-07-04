import nodemailer from 'nodemailer';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
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
  const fromName = process.env.MAIL_FROM_NAME || 'Lexram';
  const fromAddr = process.env.MAIL_FROM || process.env.SMTP_USER;
  await t.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
