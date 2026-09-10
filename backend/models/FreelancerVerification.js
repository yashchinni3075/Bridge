import mongoose from 'mongoose';

const githubSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true, default: '' },
    profileUrl: { type: String, trim: true, default: '' },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const linkedinSchema = new mongoose.Schema(
  {
    profileUrl: { type: String, trim: true, default: '' },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    method: { type: String, enum: ['oauth', 'url'], default: 'url' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const verificationStatusSchema = new mongoose.Schema(
  {
    documentType: { type: String, default: 'Government ID' },
    documentUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    verifiedAt: { type: Date, default: null },
  },
  { _id: false }
);

const freelancerVerificationSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'freelancerId is required'],
      unique: true,
    },
    github: { type: githubSchema, default: () => ({}) },
    linkedin: { type: linkedinSchema, default: () => ({}) },
    identity: { type: verificationStatusSchema, default: () => ({}) },
    education: { type: verificationStatusSchema, default: () => ({}) },
    trustScore: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'freelancer_verifications' }
);

const FreelancerVerification = mongoose.model('FreelancerVerification', freelancerVerificationSchema);

export default FreelancerVerification;