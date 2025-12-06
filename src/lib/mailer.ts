import nodemailer from "nodemailer";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter !== null) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export function isEmailEnabled() {
  return !!getTransporter();
}

export async function sendMail({ to, subject, text, html }: MailInput) {
  const tx = getTransporter();
  if (!tx) {
    console.warn("Email disabled: missing SMTP configuration. Would have sent:", { to, subject, text });
    return { sent: false };
  }

  await tx.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "no-reply@ecotek.local",
    to,
    subject,
    text,
    html: html ?? text,
  });
  return { sent: true };
}
