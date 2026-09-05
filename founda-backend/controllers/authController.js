import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Freelancer from "../models/Freelancer.js";
import { generateOTP, sendOTPEmail } from "../utils/otp.js";
import { JWT_SECRET } from "../middleware/auth.js";

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      otp,
      otpExpiry,
    });

    try {
      await sendOTPEmail(email, otp);
    } catch (mailErr) {
      console.error("[OTP] Email send failed:", mailErr.message);
      console.log(`[OTP] Dev fallback — OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      message: "Registration successful. Please check your email for the OTP.",
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "No OTP pending. Please register again." });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please register again." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.verified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    await Freelancer.create({
      userId: user._id,
      name: user.name,
      headline: "",
      location: "",
      experience: 0,
      rate: 0,
      availability: "Open to Work",
      engagement: "One-off",
      github: "",
      bio: "",
      domains: [],
      skills: [],
    });

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.verified) {
      return res.status(403).json({ message: "Account not verified. Please check your email for OTP." });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
