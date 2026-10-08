import mongoose from 'mongoose';

const freelancerProfileSchema = new mongoose.Schema(
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
    domain: {
      type: String,
      trim: true,
      default: 'General Software',
    },
    experience: {
      type: String, // e.g., '3-5 years', 'Senior', or numerical string
      default: '1-3 years',
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    portfolio: {
      type: String,
      trim: true,
      default: '',
    },

    // Education
    highestEducation: {
      type: String,
      trim: true,
      default: '',
    },
    educationStatus: {
      type: String,
      trim: true,
      default: '',
    },
    degree: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    collegeUniversity: {
      type: String,
      trim: true,
      default: '',
    },
    graduationYear: {
      type: Number,
      default: null,
    },

    // Certifications
    certifications: {
      type: [String],
      default: [],
    },

    // Hourly charge (INR)
    hourlyCharge: {
      type: Number,
      default: null,
    },

    // Resume visibility toggle
    resumeVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const FreelancerProfile = mongoose.model('FreelancerProfile', freelancerProfileSchema);
export default FreelancerProfile;