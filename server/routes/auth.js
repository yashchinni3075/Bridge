import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Router } from "express";
import { User, Otp } from "../models/index.js";

const router = Router();

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^\+?[1-9]\d{6,14}$/;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function normalizePhone(p) {
  return p.replace(/[\s\-()]/g, "");
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.full_name,
    email: user.email,
    phone: user.phone || "",
    role: user.role || "founder",
    registeredAt: user.created_at,
  };
}

/* POST /api/auth/send-otp — generate and email a one-time code */
router.post("/send-otp", async (req, res) => {
  const { email } = req.body || {};
  if (!email || !emailRe.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  const smtpConfigured =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured) {
    return res.status(500).json({
      error: "Email service is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL to server/.env",
    });
  }

  const token = generateOtp();
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      token_hash: hashedToken,
      expires_at: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: "Your Bridge verification code",
        text: `Your Bridge verification code is ${token}. It is valid for 10 minutes.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#111827;margin:0 0 8px">Bridge verification code</h2>
          <p style="color:#374151;font-size:14px;line-height:1.6">Use the code below to verify your email address. It expires in <b>10 minutes</b>.</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4f46e5;padding:16px 0">${token}</div>
          <p style="color:#9ca3af;font-size:12px;line-height:1.5">If you didn't request this code, you can safely ignore this email.</p>
        </div>`,
      });
    } catch (mailErr) {
      console.error("send-otp mail error:", mailErr.message);
      await Otp.deleteMany({ email });
      throw new Error(`Failed to send email: ${mailErr.message}`);
    }

    return res.json({ ok: true, message: `OTP sent to ${email}` });
  } catch (err) {
    console.error("send-otp error:", err.message);
    return res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
});

/* POST /api/auth/verify-otp — validate the code for an email */
router.post("/verify-otp", async (req, res) => {
  const { email, token } = req.body || {};
  if (!email || !emailRe.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  if (!token || String(token).trim().length !== 6) {
    return res.status(400).json({ error: "A 6-digit code is required" });
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(String(token).trim()).digest("hex");
    const otp = await Otp.findOne({ email, used: false });
    if (!otp || otp.expires_at < new Date() || otp.token_hash !== hashedToken) {
      return res.status(401).json({ error: "Invalid or expired code" });
    }
    return res.json({ ok: true, message: "Email verified" });
  } catch (err) {
    console.error("verify-otp error:", err.message);
    return res.status(500).json({ error: err.message || "Verification failed" });
  }
});

/* POST /api/auth/register — verify code, then create the account */
router.post("/register", async (req, res) => {
  const { name, email, phone, password, token } = req.body || {};

  if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
  if (!email || !emailRe.test(email)) return res.status(400).json({ error: "Valid email is required" });
  if (!phone || !phoneRe.test(normalizePhone(phone))) {
    return res.status(400).json({ error: "Valid phone number is required" });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (!token || String(token).trim().length !== 6) {
    return res.status(400).json({ error: "Please verify your email OTP first" });
  }

  try {
    const emailLower = email.trim().toLowerCase();

    const hashedToken = crypto.createHash("sha256").update(String(token).trim()).digest("hex");
    const otp = await Otp.findOne({ email: emailLower, used: false });
    if (!otp || otp.expires_at < new Date() || otp.token_hash !== hashedToken) {
      return res.status(400).json({ error: "Invalid or expired email verification code" });
    }

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      full_name: name.trim(),
      email: emailLower,
      phone: normalizePhone(phone),
      password_hash: passwordHash,
      role: "founder",
    });

    await Otp.deleteMany({ email: emailLower });

    const tokenSigned = signToken(user);
    return res.status(201).json({
      ok: true,
      user: toPublicUser(user),
      access_token: tokenSigned,
    });
  } catch (err) {
    console.error("register error:", err.message);
    return res.status(400).json({ error: err.message || "Registration failed" });
  }
});

/* POST /api/auth/login — verify password and return a session token */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !emailRe.test(email)) return res.status(400).json({ error: "Valid email is required" });
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const emailLower = email.trim().toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const tokenSigned = signToken(user);
    return res.json({
      ok: true,
      user: toPublicUser(user),
      access_token: tokenSigned,
    });
  } catch (err) {
    console.error("login error:", err.message);
    return res.status(401).json({ error: err.message || "Invalid email or password" });
  }
});

/* GET /api/auth/me — restore a session from the JWT */
router.get("/me", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    return res.json({ ok: true, user: toPublicUser(user) });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
});

export default router;
