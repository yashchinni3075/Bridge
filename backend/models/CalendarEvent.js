import mongoose from 'mongoose';

const EVENT_TYPES = Object.freeze({
  INVESTOR_PITCH: 'INVESTOR_PITCH',
  FREELANCER_INTERVIEW: 'FREELANCER_INTERVIEW',
  FREELANCER_SKILL_TEST: 'FREELANCER_SKILL_TEST',
  GENERAL_MEETING: 'GENERAL_MEETING',
});

export const CALENDAR_EVENT_TYPES = Object.values(EVENT_TYPES);

export const CALENDAR_EVENT_STATUSES = Object.freeze([
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED',
]);

export const CALENDAR_PARTICIPANT_TYPES = Object.freeze([
  'investor',
  'freelancer',
  'user',
  'general',
]);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const isValidDateString = (value) => {
  if (!DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
};

const calendarEventSchema = new mongoose.Schema(
  {
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StartupProfile',
      required: [true, 'startupId is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
      index: true,
    },
    eventType: {
      type: String,
      enum: CALENDAR_EVENT_TYPES,
      required: [true, 'eventType is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Event title cannot exceed 150 characters'],
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    participantType: {
      type: String,
      enum: CALENDAR_PARTICIPANT_TYPES,
      default: 'general',
    },
    participantName: {
      type: String,
      trim: true,
      default: '',
    },
    // RSVP state for the invited participant.
    participantResponse: {
      type: String,
      enum: ['none', 'accepted', 'declined'],
      default: 'none',
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedEntityType: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: String,
      required: [true, 'Event date is required'],
      validate: {
        validator: isValidDateString,
        message: 'Event date must be a valid date in YYYY-MM-DD format.',
      },
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [TIME_REGEX, 'Start time must be in HH:mm (24-hour) format.'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [TIME_REGEX, 'End time must be in HH:mm (24-hour) format.'],
      validate: {
        validator: function (value) {
          return !this.startTime || value > this.startTime;
        },
        message: 'End time must be later than start time.',
      },
    },
    // IANA timezone in which date/startTime/endTime wall-clock values are interpreted.
    timezone: {
      type: String,
      default: 'UTC',
    },
    // Absolute UTC instants derived from (date + time + timezone); timezone-safe storage.
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: CALENDAR_EVENT_STATUSES,
      default: 'SCHEDULED',
      index: true,
    },
  },
  { timestamps: true }
);

calendarEventSchema.index({ startupId: 1, date: 1, startTime: 1 });
calendarEventSchema.index({ startupId: 1, status: 1 });
calendarEventSchema.index({ date: 1 });

const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema);
export default CalendarEvent;