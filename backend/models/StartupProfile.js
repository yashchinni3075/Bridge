import mongoose from 'mongoose';

const founderSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    role: { type: String, trim: true, default: 'Founder' },
    bio: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    role: { type: String, trim: true },
    experience: { type: String, trim: true },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },
  },
  { _id: true }
);

const socialLinkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    state: {
      type: String,
      enum: ['planned', 'in_progress', 'completed'],
      default: 'planned',
    },
    isVerified: { type: Boolean, default: false }, // Explicit distinction: true only if externally verified by platform admin/audit
    targetDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const pitchEvaluationSchema = new mongoose.Schema(
  {
    overallScore: { type: Number },
    dimensions: { type: mongoose.Schema.Types.Mixed }, // Changed from strict object to Mixed
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
    evaluatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const domainVerificationSchema = new mongoose.Schema(
  {
    domain: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['not_requested', 'pending', 'verified', 'failed'],
      default: 'not_requested',
    },
    verificationToken: { type: String, default: null },
    recordType: { type: String, default: 'TXT' },
    recordHost: { type: String, default: '@' },
    verifiedAt: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
  },
  { _id: false }
);

const startupProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    startupName: {
      type: String,
      required: [true, 'Startup name is required'],
      trim: true,
    },
    founderName: {
      type: String,
      trim: true,
    },
    founders: [founderSchema],
    pitch: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    domain: {
      type: String,
      trim: true,
      default: 'Technology',
    },
    stage: {
      type: String,
      enum: ['Idea', 'MVP', 'Early Stage', 'Growth', 'Scaling'],
      default: 'Early Stage',
    },
    fundingRequirement: {
      type: Number,
      default: 0,
    },
    minimumFunding: {
      type: Number,
      default: 0,
    },
    maximumFunding: {
      type: Number,
      default: 0,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    github: {
      type: String,
      trim: true,
      default: '',
    },
    socialLinks: [socialLinkSchema],
    traction: {
      type: String,
      trim: true,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    team: [teamMemberSchema],
    teamSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    openRoles: [
      {
        type: String,
        trim: true,
      },
    ],
    progress: {
      milestones: [milestoneSchema],
      metrics: { type: String, default: '' },
      currentStatus: { type: String, default: 'Building MVP' },
    },
    pitchDeck: {
      type: String,
      default: null,
    },
    pitchDeckPublicId: {
      type: String,
      default: null,
    },
    pitchDeckOriginalName: {
      type: String,
      default: null,
    },
    pitchDeckUploadedAt: {
      type: Date,
      default: null,
    },
    pitchDeckText: {
      type: String,
      default: '',
    },
    aiEvaluation: {
      type: pitchEvaluationSchema,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'not_submitted'],
      default: 'not_submitted',
    },
    domainVerification: {
      type: domainVerificationSchema,
      default: () => ({
        domain: '',
        status: 'not_requested',
        verificationToken: null,
        recordType: 'TXT',
        recordHost: '@',
        verifiedAt: null,
        lastCheckedAt: null,
        failureReason: null,
      }),
    },
  },
  { timestamps: true }
);

const StartupProfile = mongoose.model('StartupProfile', startupProfileSchema);
export default StartupProfile;