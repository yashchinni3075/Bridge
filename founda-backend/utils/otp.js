import nodemailer from "nodemailer";

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendOTPEmail(email, otp) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Founda" <noreply@founda.app>',
    to: email,
    subject: "Your Founda Verification Code",
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:420px;margin:auto;padding:32px;">
        <h2 style="color:#6C3FE0;">Founda</h2>
        <p style="font-size:14px;color:#0f1226;">Your one-time verification code is:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#0f1226;background:#f8fafc;padding:16px 24px;border-radius:12px;text-align:center;margin:16px 0;">${otp}</div>
        <p style="font-size:13px;color:#94a3b8;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  console.log(`[OTP] Sent to ${email} — Preview URL: ${nodemailer.getTestMessageUrl(info) || "console mode"}`);
  return info;
}
