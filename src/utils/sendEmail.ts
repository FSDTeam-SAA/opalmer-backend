import nodemailer from 'nodemailer';
import { getRequiredEnv } from '../config/env';

type SendEmailInput = { to: string; subject: string; html: string; text?: string };

const sendEmail = async ({ to, subject, html, text }: SendEmailInput) => {
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465,
    auth: { user: getRequiredEnv('EMAIL_ADDRESS'), pass: getRequiredEnv('EMAIL_PASSWORD') },
    tls: { rejectUnauthorized: true },
  });
  // A display name and a plain-text alternative both help deliverability.
  const from = { name: process.env.EMAIL_FROM_NAME || 'AchieverPlus', address: getRequiredEnv('EMAIL_ADDRESS') };
  await transporter.sendMail({ from, to, subject, html, ...(text ? { text } : {}) });
  return { success: true };
};
export default sendEmail;
