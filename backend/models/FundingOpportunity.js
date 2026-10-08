import mongoose from 'mongoose';

const fundingDocumentsSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    uploadedAt: { type: Date, default: null },
  },
  { _id: false }
);

const valuationSchema = new mongoose.Schema(
  {
    preMoney: { type: Number, default: 0 },
    postMoney: { type: Number, default: 0 },
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

const fundingOpportunitySchema = new mongoose.Schema(
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

    // Basic funding details
    title: {
      type: String,
      required: [true, 'Funding title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    fundingType: {
      type: String,
      enum: ['equity', 'debt', 'convertible_note', 'safe', 'grant', 'other'],
      default: 'equity',
    },

    // Amount and valuation
    amountRaising: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR', trim: true },
    },
    equityOffered: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    valuation: {
      type: valuationSchema,
      default: () => ({ preMoney: 0, postMoney: 0, currency: 'INR' }),
    },

    // Terms and conditions
    useOfFunds: {
      type: String,
      default: '',
      trim: true,
    },
    milestones: [{
      title: { type: String, required: true, trim: true },
      description: { type: String, default: '', trim: true },
      targetDate: { type: Date },
      amount: { type: Number, default: 0 },
    }],

    // Documents
    pitchDeck: {
      type: fundingDocumentsSchema,
      default: () => ({ fileName: '', fileUrl: '', publicId: '', uploadedAt: null }),
    },
    financialProjections: {
      type: fundingDocumentsSchema,
      default: () => ({ fileName: '', fileUrl: '', publicId: '', uploadedAt: null }),
    },

    // Startup info snapshot
    startupInfo: {
      type: startupInfoSchema,
      default: () => ({}),
    },

    // Status and timeline
    status: {
      type: String,
      enum: ['open', 'closed', 'draft', 'funded'],
      default: 'open',
    },

    closingDate: {
      type: Date,
      default: null,
    },

    // Interest tracking
    interestsCount: {
      type: Number,
      default: 0,
    },

    committedAmount: {
      type: Number,
      default: 0,
    },

    // Investor preferences
    preferredInvestorType: {
      type: String,
      enum: ['angel', 'vc', 'strategic', 'family_office', 'any'],
      default: 'any',
    },
    preferredInvestorStage: {
      type: String,
      enum: ['pre_seed', 'seed', 'series_a', 'series_b', 'growth', 'any'],
      default: 'any',
    },
    minimumCheckSize: {
      type: Number,
      default: 0,
    },
    maximumCheckSize: {
      type: Number,
      default: 0,
    },

    // Metadata
    employeeCount: {
      type: String,
      default: '',
    },
    startupStage: {
      type: String,
      default: '',
    },
    industryDomain: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

fundingOpportunitySchema.index({ startupId: 1, createdAt: -1 });
fundingOpportunitySchema.index({ status: 1 });
fundingOpportunitySchema.index({ fundingType: 1 });

const FundingOpportunity = mongoose.model('FundingOpportunity', fundingOpportunitySchema, 'funding_opportunities');
export default FundingOpportunity;