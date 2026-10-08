import nodemailer from 'nodemailer';
import { gmailConfigured, sendViaGmailApi } from './gmailSender.js';

/**
 * Single send path used by every template below.
 *
 * - If GMAIL_* credentials are configured -> Gmail API over HTTPS.
 *   This is what works on hosts that block outbound SMTP (e.g. Render free).
 * - Otherwise -> nodemailer SMTP (local/dev fallback), hardened with short
 *   timeouts so a dead connection fails fast instead of hanging forever.
 */
const sendMail = async ({ to, subject, html }) => {
  if (gmailConfigured()) {
    await sendViaGmailApi({ to, subject, html });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // false for port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Force IPv4: some networks have no IPv6 route, and Node otherwise tries
    // the AAAA record first and dies with ENETUNREACH.
    socketOptions: { family: 4 },
    // Fail fast instead of hanging forever when SMTP is unreachable.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Bridge Platform" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendOTPEmail = async (email, otp) => {
  const subject = 'Email Verification OTP';
  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #818cf8;">Welcome to Bridge!</h2>
        <p>Your One-Time Password (OTP) for email verification is:</p>
        <div style="background: #1e293b; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #818cf8; letter-spacing: 6px; margin: 0; font-size: 32px;">${otp}</h1>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

  await sendMail({ to: email, subject, html });
};

export const sendMeetingInvitationEmail = async ({ to, freelancerName, startupName, event }) => {
  const meetingLink = event.meetingLink
    ? `<p>Meeting link: <a href="${event.meetingLink}" style="color: #818cf8;">${event.meetingLink}</a></p>`
    : '';
  const location = event.location ? `<p>Location: ${event.location}</p>` : '';
  const notes = event.notes ? `<p><strong>Notes:</strong> ${event.notes}</p>` : '';

  const subject = `Interview Scheduled: ${event.title}`;
  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
        <h2 style="color: #818cf8;">Hello ${freelancerName},</h2>
        <p><strong>${startupName}</strong> has scheduled an interview with you.</p>
        <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>${event.title}</strong></p>
          <p style="margin: 4px 0;">Date: ${event.date}</p>
          <p style="margin: 4px 0;">Time: ${event.startTime} - ${event.endTime}</p>
        </div>
        ${meetingLink}
        ${location}
        ${notes}
        <p>Please log in to the Bridge platform to confirm and manage your interview.</p>
        <p style="font-size: 12px; color: #94a3b8;">This email was sent by the Bridge platform.</p>
      </div>
    `;

  await sendMail({ to, subject, html });
};
