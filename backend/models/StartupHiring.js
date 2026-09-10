import mongoose from 'mongoose';

const jobDescriptionPdfSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    uploadedAt: { type: Date, default: null },
  },
  { _id: false }
);

const salarySchema = new mongoose.Schema(
  {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: 'INR', trim: true },
  },
  { _id: false }
);

const startupInfoSchema = new mongoose.Schema(
  {
    startupName: { type: String, default: '' },
    description: { type: String, default: '' },
    industry: { type: String, default: '' },
    stage: { type: String, default: '' },
    employeeCount: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    foundedYear: { type: String, default: '' },
  },
  { _id: false }
);

const candidateCriteriaSchema = new mongoose.Schema(
  {
    minimumQualification: { type: String, default: '', trim: true },
    eligibleDegrees: [{ type: String, trim: true }],
    eligibleBranches: [{ type: String, trim: true }],
    minimumExperience: { type: String, default: '', trim: true },
    requiredSkills: [{ type: String, trim: true }],
    preferredSkills: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    additionalCriteria: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const startupHiringSchema = new mongoose.Schema(
  {
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StartupProfile',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    jobDescription: {
      type: String,
      default: '',
      trim: true,
    },

    vacancies: {
      type: Number,
      required: [true, 'Number of vacancies is required'],
      min: [1, 'At least 1 vacancy is required'],
      default: 1,
    },

    salary: {
      type: salarySchema,
      default: () => ({ min: 0, max: 0, currency: 'INR' }),
    },

    employmentType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Internship', 'Contract', 'Freelance'],
      default: 'Full Time',
    },
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'On-site',
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    experienceRequired: {
      type: String,
      default: '',
      trim: true,
    },
    domain: {
      type: String,
      default: '',
      trim: true,
    },

    requiredSkills: [{ type: String, trim: true }],
    preferredSkills: [{ type: String, trim: true }],

    jobDescriptionPdf: {
      type: jobDescriptionPdfSchema,
      default: () => ({ fileName: '', fileUrl: '', publicId: '', uploadedAt: null }),
    },

    startupInfo: {
      type: startupInfoSchema,
      default: () => ({}),
    },

    criteria: {
      type: candidateCriteriaSchema,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ['open', 'closed', 'draft'],
      default: 'open',
    },

    closingDate: {
      type: Date,
      default: null,
    },

    applicationsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

startupHiringSchema.index({ startupId: 1, createdAt: -1 });
startupHiringSchema.index({ status: 1 });

const StartupHiring = mongoose.model('StartupHiring', startupHiringSchema, 'startup_hiring');
export default StartupHiring;
