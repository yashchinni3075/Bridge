import mongoose from 'mongoose';

const investorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    interests: [{
      type: String,
      trim: true,
    }],
    preferredDomains: [{
      type: String,
      trim: true,
    }],
    investmentPreferences: {
      stages: [{
        type: String,
        enum: ['Idea', 'MVP', 'Early Stage', 'Growth', 'Scaling'],
      }],
      minCheckSize: {
        type: Number,
        default: 0,
      },
      maxCheckSize: {
        type: Number,
        default: 0,
      },
      geography: {
        type: String,
        default: 'Global',
      },
    },
    experience: {
      type: String,
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const InvestorProfile = mongoose.model('InvestorProfile', investorProfileSchema);
export default InvestorProfile;