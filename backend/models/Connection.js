import mongoose from 'mongoose';

// Canonical connection statuses. Anything else is normalized/validated at the
// controller boundary before it is written to the `status` field below.
export const CONNECTION_STATUSES = ['pending', 'accepted', 'rejected'];

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
      enum: CONNECTION_STATUSES,
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

// Map client-supplied status aliases to canonical connection statuses.
// Values outside CONNECTION_STATUSES are returned untouched so callers can
// still reject them with a validation error.
export const normalizeConnectionStatus = (status) => {
  if (typeof status !== 'string') return status;

  const key = status.trim().toLowerCase();
  const ALIAS_MAP = {
    selected: 'accepted',
    accept: 'accepted',
    approved: 'accepted',
    reject: 'rejected',
    declined: 'rejected',
    cancel: 'rejected',
    cancelled: 'rejected',
  };

  return ALIAS_MAP[key] || key;
};

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection;