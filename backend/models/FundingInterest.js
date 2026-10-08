import mongoose from 'mongoose';

const fundingInterestSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fundingOpportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FundingOpportunity',
      required: true,
      index: true,
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StartupProfile',
      required: true,
      index: true,
    },

    // Investor details
    investorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    investorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestorProfile',
      index: true,
    },

    // Startup details
    startupUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startupProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StartupProfile',
      index: true,
    },

    // Interest details
    checkSize: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR', trim: true },
    },
    equityRequested: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },

    // Additional terms
    proposedTerms: {
      type: String,
      default: '',
      trim: true,
    },
    timeline: {
      type: String,
      default: '',
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'negotiating'],
      default: 'pending',
      index: true,
    },

    // Response
    startupResponse: {
      type: String,
      default: '',
      trim: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },

    // Investment commitment
    committedAmount: {
      type: Number,
      default: 0,
    },
    committedAt: {
      type: Date,
      default: null,
    },
    equityAgreed: {
      type: Number,
      default: 0,
    },

    // Notes
    investorNote: {
      type: String,
      default: '',
      trim: true,
    },
    startupNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound indexes to prevent duplicate interest from same investor to same opportunity
fundingInterestSchema.index({ investorId: 1, fundingOpportunityId: 1 }, { unique: true });
fundingInterestSchema.index({ fundingOpportunityId: 1, status: 1 });
fundingInterestSchema.index({ investorId: 1, status: 1 });
fundingInterestSchema.index({ startupId: 1, status: 1 });

const FundingInterest = mongoose.model('FundingInterest', fundingInterestSchema, 'funding_interests');
export default FundingInterest;