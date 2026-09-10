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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent active duplicate applications by the same freelancer to the same startup
applicationSchema.index({ freelancerId: 1, startupId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
export default Application;