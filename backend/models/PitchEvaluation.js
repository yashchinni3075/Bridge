import mongoose from 'mongoose';

const pitchEvaluationSchema = new mongoose.Schema(
  {
    startupProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StartupProfile',
      required: true,
      index: true,
    },
    pitchDeckUrl: {
      type: String,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    marketClarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    tractionScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    teamStrengthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    financialModelScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    askClarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('PitchEvaluation', pitchEvaluationSchema);