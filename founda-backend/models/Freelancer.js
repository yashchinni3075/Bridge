import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    github: {
      username: String,
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
    },
    linkedin: {
      profileUrl: String,
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
    },
    aadhaar: {
      documentUrl: String,
      status: {
        type: String,
        enum: ["not_submitted", "pending", "approved", "rejected"],
        default: "not_submitted",
      },
      verifiedAt: Date,
    },
    email: { type: mongoose.Schema.Types.Mixed, default: false },
    phone: { type: mongoose.Schema.Types.Mixed, default: false },
    mobile: { type: mongoose.Schema.Types.Mixed, default: false },
  },
  { _id: false }
);

const freelancerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // links to your teammate's auth User model
    name: String,
    headline: String,
    tagline: String,
    location: String,
    experience: Number,
    rate: Number,
    availability: {
      type: String,
      enum: ["Open to Work", "Currently Engaged", "Not Available"],
      default: "Open to Work",
    },
    engagement: {
      type: String,
      enum: ["One-off", "Ongoing", "Co-founder"],
      default: "One-off",
    },
    github: String,
    bio: String,
    domains: [String],
    skills: [String],
    verified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 0 },
    starRating: { type: Number, default: 0 },
    verification: { type: verificationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("Freelancer", freelancerSchema);