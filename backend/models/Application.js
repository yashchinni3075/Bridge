import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    fileName: { type: String, default: '' },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StartupProfile',
      required: true,
      index: true,
    },
    hiringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StartupHiring',
      default: null,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    resume: {
      type: resumeSchema,
      default: () => ({ url: '', publicId: '', fileName: '' }),
    },
    // Internal note visible only to the startup reviewing the applicant
    note: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      // Canonical statuses: submitted, under_review, shortlisted, interview,
      // skill_test, selected, rejected, withdrawn.
      // Legacy values (pending, accepted) are preserved for existing documents
      // and normalized to canonical values at read time.
      enum: ['pending', 'submitted', 'under_review', 'shortlisted', 'interview', 'skill_test', 'selected', 'accepted', 'rejected', 'withdrawn'],
      default: 'submitted',
      index: true,
    },
    // Engagement stage for accepted freelancer collaborations
    // Separate from application status and connection status
    engagementStage: {
      type: String,
      enum: ['accepted', 'onboarding', 'active', 'completed'],
      default: null,
      index: true,
    },
    engagementStartedAt: {
      type: Date,
      default: null,
    },
    engagementCompletedAt: {
      type: Date,
      default: null,
    },
    // Rejection reason (when startup rejects)
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// A freelancer may apply to more than one different job at the same startup,
// so duplicate prevention is per-hiring and enforced in the controllers.
applicationSchema.index({ freelancerId: 1, hiringId: 1 });
applicationSchema.index({ startupId: 1, status: 1 });

// Map legacy statuses to canonical job-application statuses.
export const normalizeApplicationStatus = (status) => {
  const LEGACY_MAP = { pending: 'submitted', accepted: 'selected' };
  return LEGACY_MAP[status] || status || 'submitted';
};

const Application = mongoose.model('Application', applicationSchema);
export default Application;