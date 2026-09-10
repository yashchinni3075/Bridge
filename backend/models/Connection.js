import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requesterRole: {
      type: String,
      enum: ['startup', 'investor', 'freelancer'],
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['startup', 'investor', 'freelancer'],
      required: true,
    },
    connectionType: {
      type: String,
      enum: ['startup_investor', 'startup_freelancer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate pairs in the same direction
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection;