import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'connection_request',
        'connection_accepted',
        'connection_rejected',
        'application_received',
        'application_accepted',
        'application_rejected',
        'application_under_review',
        'application_shortlisted',
        'application_interview',
        'application_skill_test',
        'application_selected',
        'verification_submitted',
        'verification_approved',
        'verification_rejected',
        'investor_interest',
        'investor_interest_accepted',
        'investor_interest_rejected',
        'meeting_invitation',
        'meeting_rescheduled',
        'meeting_cancelled',
        'meeting_status_changed',
        'message_received',
        'general',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      default: null,
      trim: true,
    },
    link: {
      type: String,
      default: null,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;