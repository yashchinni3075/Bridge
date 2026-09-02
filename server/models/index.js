import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    password_hash: { type: String, required: true },
    role: { type: String, default: "founder" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  token_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

const linkSchema = new mongoose.Schema(
  {
    platform: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false }
);

const domainVerificationSchema = new mongoose.Schema(
  {
    domain: { type: String, default: "" },
    status: { type: String, default: "" },
    checkDate: { type: Date, default: null },
    registeredAt: { type: Date, default: null },
    message: { type: String, default: "" },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    status: { type: String, enum: ["not_started", "draft", "pending_review", "verified", "rejected"], default: "not_started" },
    startupName: { type: String, default: "" },
    sector: { type: String, default: "" },
    stage: { type: String, default: "" },
    description: { type: String, default: "" },
    ask: { type: String, default: "" },
    skillsHave: { type: [String], default: [] },
    skillsNeeded: { type: [String], default: [] },
    city: { type: String, default: "" },
    links: { type: [linkSchema], default: [] },
    registrationProofFile: { type: String, default: null },
    domainVerification: { type: domainVerificationSchema, default: null },
    pitchDeckFile: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
export const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);
