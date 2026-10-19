import nodemailer from 'nodemailer';
import { getRequiredEnv } from '../config/env';

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465,
    auth: { user: getRequiredEnv('EMAIL_ADDRESS'), pass: getRequiredEnv('EMAIL_PASSWORD') },
    tls: { rejectUnauthorized: true },
  });
  await transporter.sendMail({ from: process.env.EMAIL_ADDRESS, to, subject, html });
  return { success: true };
};
export default sendEmail;
