import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    problemClarity: { type: Number, default: 0, min: 0, max: 15 },
    solutionValueProposition: { type: Number, default: 0, min: 0, max: 15 },
    marketOpportunity: { type: Number, default: 0, min: 0, max: 15 },
    businessModel: { type: Number, default: 0, min: 0, max: 15 },
    traction: { type: Number, default: 0, min: 0, max: 15 },
    team: { type: Number, default: 0, min: 0, max: 10 },
    competitiveAdvantage: { type: Number, default: 0, min: 0, max: 5 },
    fundingAsk: { type: Number, default: 0, min: 0, max: 10 },
  },
  { _id: false }
);

const pitchEvaluationSchema = new mongoose.Schema(
  {
    startupProfileId: {
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
    inputSource: {
      type: String,
      enum: ['MANUAL_TEXT', 'PITCH_DECK'],
      default: 'MANUAL_TEXT',
      required: true,
      // Indexed via pitchEvaluationSchema.index({ inputSource: 1 }) below.
      // Declaring `index: true` here as well triggers a duplicate-index warning.
    },
    pitchText: {
      type: String,
      default: '',
      maxlength: [12000, 'Stored pitch text cannot exceed 12000 characters'],
    },
    pitchDeckUrl: {
      type: String,
      default: null,
    },
    pitchDeckFileName: {
      type: String,
      default: null,
    },
    scores: {
      type: scoreSchema,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingSections: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    summary: { type: String, default: '' },
    geminiModel: { type: String, default: '' },
  },
  { timestamps: true }
);

pitchEvaluationSchema.index({ startupProfileId: 1, createdAt: -1 });
pitchEvaluationSchema.index({ inputSource: 1 });

const PitchEvaluation = mongoose.model('PitchEvaluation', pitchEvaluationSchema);
export default PitchEvaluation;