import { google } from 'googleapis';

/**
 * Email sending over the Gmail API (HTTPS / port 443).
 *
 * Why: hosting providers such as Render (free instances) block outbound SMTP
 * ports 25/465/587, which makes nodemailer hang or fail with ENETUNREACH.
 * The Gmail API uses plain HTTPS, so it works both locally and on any host.
 *
 * Required env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 * Optional: EMAIL_USER (the From address; must match the Google account that
 * authorized the refresh token).
 */

export const gmailConfigured = () =>
  Boolean(
    process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN
  );

const SEND_TIMEOUT_MS = 15_000;

export const sendViaGmailApi = async ({ to, subject, html }) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const fromAddress = process.env.EMAIL_USER || process.env.SMTP_USER;

  // Build a raw RFC 822 message (same pattern as the PlaceIntel reference)
  const emailLines = [
    `To: ${to}`,
    `From: "Bridge Platform" <${fromAddress}>`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ];

  const raw = Buffer.from(emailLines.join('\r\n')).toString('base64url');

  const sendPromise = gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  // Fail fast instead of hanging forever if the request stalls.
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Gmail API request timed out after ${SEND_TIMEOUT_MS}ms`)),
      SEND_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([sendPromise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
    // If the timeout won the race, swallow the late settlement so it never
    // becomes an unhandled rejection that could crash the process.
    sendPromise.catch(() => {});
  }
};
