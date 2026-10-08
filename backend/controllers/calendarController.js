import mongoose from 'mongoose';
import CalendarEvent, {
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_STATUSES,
  CALENDAR_PARTICIPANT_TYPES,
} from '../models/CalendarEvent.js';
import StartupProfile from '../models/StartupProfile.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Application from '../models/Application.js';
import { createNotification } from '../services/notificationService.js';
import { sendMeetingInvitationEmail } from '../utils/emailService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const URL_LENGTH_LIMIT = 500;
const pad2 = (n) => String(n).padStart(2, '0');
const DEFAULT_TIMEZONE = 'UTC';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

// Validates an IANA timezone id (e.g. "Asia/Kolkata", "America/New_York").
const isValidTimezone = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value.trim() });
    return true;
  } catch (err) {
    return false;
  }
};

// Converts a wall-clock (date + HH:mm + IANA timezone) to the absolute UTC
// instant. Converges via Intl.DateTimeFormat; DST-safe. Pure and dependency-free.
const zonedTimeToUtcMs = (dateStr, timeStr, timeZone) => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  const target = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const wallAsUtc = (ms) => {
    const map = {};
    for (const part of dtf.formatToParts(new Date(ms))) {
      if (part.type !== 'literal') map[part.type] = Number(part.value);
    }
    return Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  };
  let ts = target;
  for (let i = 0; i < 8; i += 1) {
    const delta = target - wallAsUtc(ts);
    if (delta === 0) break;
    ts += delta;
  }
  return ts;
};

// Startup ownership is always derived from the authenticated user via the
// existing StartupProfile relation (never trusted from the request body).
const getOwnStartupId = async (userId) => {
  const startup = await StartupProfile.findOne({ userId }).select('_id').lean();
  return startup ? startup._id : null;
};

// Dashboard link used when notifying an event participant.
const participantMeetingLink = (eventType) =>
  eventType === 'INVESTOR_PITCH' ? '/investor-dashboard/calendar' : '/freelancer-dashboard/calendar';

// Notifies the event participant (DB-first, non-fatal on failure).
const notifyMeetingParticipant = async ({ event, senderId, type, title, message }) => {
  if (!event.participantId) return;
  await createNotification({
    recipient: event.participantId,
    sender: senderId,
    type,
    title,
    message,
    relatedId: event._id,
    relatedModel: 'CalendarEvent',
    link: participantMeetingLink(event.eventType),
  });
};

// ---------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
};

const isValidTimeString = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const normalizeUrl = (value) => {
  if (value === undefined || value === null) return { ok: true, value: '' };
  if (typeof value !== 'string') return { ok: false, message: 'Meeting link must be a string.' };
  const cleaned = value.trim();
  if (!cleaned) return { ok: true, value: '' };
  if (cleaned.length > URL_LENGTH_LIMIT) {
    return { ok: false, message: `Meeting link cannot exceed ${URL_LENGTH_LIMIT} characters.` };
  }
  let candidate = cleaned;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const url = new URL(candidate);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')) {
      return { ok: true, value: candidate };
    }
  } catch (err) {
    /* invalid */
  }
  return { ok: false, message: 'Meeting link must be a valid URL (e.g. https://meet.google.com/abc).' };
};

const cleanText = (value, fieldName, { max } = {}) => {
  if (value === undefined || value === null) return { ok: true, value: '' };
  if (typeof value !== 'string') return { ok: false, message: `${fieldName} must be a string.` };
  const cleaned = value.trim();
  if (max && cleaned.length > max) {
    return { ok: false, message: `${fieldName} cannot exceed ${max} characters.` };
  }
  return { ok: true, value: cleaned };
};

const validateEventType = (value) => {
  if (typeof value !== 'string' || !CALENDAR_EVENT_TYPES.includes(value)) {
    return { ok: false, message: `Invalid event type. Allowed: ${CALENDAR_EVENT_TYPES.join(', ')}.` };
  }
  return { ok: true };
};

const validateStatus = (value) => {
  if (value === undefined || value === null) return { ok: true, value: 'SCHEDULED' };
  if (typeof value !== 'string' || !CALENDAR_EVENT_STATUSES.includes(value)) {
    return { ok: false, message: `Invalid status. Allowed: ${CALENDAR_EVENT_STATUSES.join(', ')}.` };
  }
  return { ok: true, value: value };
};

const eventRequiresParticipant = (eventType) => eventType !== 'GENERAL_MEETING';

// Normalizes and validates the editable event payload (no DB lookups).
const validateEventPayload = (body = {}) => {
  const typeResult = validateEventType(body.eventType);
  if (!typeResult.ok) return typeResult;

  const title = cleanText(body.title, 'Event title', { max: 150 });
  if (title.value === '') return { ok: false, message: 'Event title is required.' };
  if (!title.ok) return title;

  if (!body.date || typeof body.date !== 'string' || !isValidDateString(body.date)) {
    return { ok: false, message: 'Event date must be a valid date in YYYY-MM-DD format.' };
  }

  if (body.startTime === undefined || body.startTime === null || body.startTime === '') {
    return { ok: false, message: 'Start time is required.' };
  }
  if (!isValidTimeString(body.startTime)) {
    return { ok: false, message: 'Start time must be in HH:mm (24-hour) format.' };
  }
  if (body.endTime === undefined || body.endTime === null || body.endTime === '') {
    return { ok: false, message: 'End time is required.' };
  }
  if (!isValidTimeString(body.endTime)) {
    return { ok: false, message: 'End time must be in HH:mm (24-hour) format.' };
  }
  if (body.endTime <= body.startTime) {
    return { ok: false, message: 'End time must be later than start time.' };
  }

  const meetingLink = normalizeUrl(body.meetingLink);
  if (!meetingLink.ok) return meetingLink;
  const location = cleanText(body.location, 'Location', { max: 200 });
  if (!location.ok) return location;
  const notes = cleanText(body.notes, 'Notes', { max: 2000 });
  if (!notes.ok) return notes;
  const participantName = cleanText(body.participantName, 'Participant name', { max: 150 });
  if (!participantName.ok) return participantName;
  const status = validateStatus(body.status);
  if (!status.ok) return status;
  const relatedEntityType = cleanText(body.relatedEntityType, 'Related entity type', { max: 50 });
  if (!relatedEntityType.ok) return relatedEntityType;

  let participantType = body.participantType || 'general';
  if (!CALENDAR_PARTICIPANT_TYPES.includes(participantType)) {
    return { ok: false, message: `Invalid participant type. Allowed: ${CALENDAR_PARTICIPANT_TYPES.join(', ')}.` };
  }

  let participantId = null;
  if (body.participantId !== undefined && body.participantId !== null && body.participantId !== '') {
    if (!isValidObjectId(body.participantId)) {
      return { ok: false, message: 'Participant ID is invalid.' };
    }
    participantId = body.participantId;
  }

  // Timezone-aware storage: wall-clock strings + IANA timezone -> UTC instants.
  const timezone = isValidTimezone(body.timezone) ? body.timezone.trim() : DEFAULT_TIMEZONE;
  const startAt = new Date(zonedTimeToUtcMs(body.date, body.startTime, timezone));
  const endAt = new Date(zonedTimeToUtcMs(body.date, body.endTime, timezone));

  return {
    ok: true,
    value: {
      eventType: body.eventType,
      title: title.value,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      timezone,
      startAt,
      endAt,
      meetingLink: meetingLink.value,
      location: location.value,
      notes: notes.value,
      participantId,
      participantType,
      participantName: participantName.value,
      status: status.value,
      relatedEntityType: relatedEntityType.value,
    },
  };
};

// Resolves a participant from explicit fields or from a related record
// (Connection / Application) when the participant was not supplied. This keeps
// card integrations simple: startup just sends the related record id.
const resolveParticipant = async ({ userId, startupId, eventType, participantId, participantType, relatedEntityId, relatedEntityType }) => {
  const expectedRole = eventType === 'INVESTOR_PITCH' ? 'investor' : 'freelancer';

  if (participantId) {
    const participant = await User.findById(participantId).select('name role isBlocked');
    if (!participant) return { ok: false, message: 'Participant not found.' };
    if (participant.isBlocked) return { ok: false, message: 'Participant account is currently unavailable.' };
    if (participant._id.toString() === userId.toString()) {
      return { ok: false, message: 'You cannot schedule an event with yourself.' };
    }
    if (eventRequiresParticipant(eventType) && participant.role !== expectedRole) {
      return { ok: false, message: `This event type requires a ${expectedRole} participant.` };
    }
    return {
      ok: true,
      value: {
        participantId: participant._id,
        participantType: participantType || expectedRole,
        participantName: '',
      },
    };
  }

  if (eventRequiresParticipant(eventType) && !participantId) {
    if (!relatedEntityId || !isValidObjectId(relatedEntityId)) {
      return { ok: false, message: 'A participant is required for this event type.' };
    }
  }

  if (eventRequiresParticipant(eventType) && relatedEntityId && isValidObjectId(relatedEntityId)) {
    if (relatedEntityType === 'Connection') {
      const connection = await Connection.findById(relatedEntityId).lean();
      if (!connection) return { ok: false, message: 'Connection record not found.' };
      const requesterIsMe = connection.requester && connection.requester.toString() === userId.toString();
      const recipientIsMe =
        connection.recipient &&
        (connection.recipient.toString() === userId.toString() || connection.recipient.toString() === startupId.toString());
      if (!requesterIsMe && !recipientIsMe) {
        return { ok: false, message: 'This connection does not belong to your startup.' };
      }
      const partnerId = requesterIsMe ? connection.recipient : connection.requester;
      if (!partnerId) return { ok: false, message: 'Connection has no participant.' };
      const partner = await User.findById(partnerId).select('name role');
      if (!partner || partner._id.toString() === userId.toString()) {
        return { ok: false, message: 'Cannot resolve a valid partner for this connection.' };
      }
      if (eventRequiresParticipant(eventType) && partner.role !== expectedRole) {
        return { ok: false, message: `This event type requires a ${expectedRole} participant.` };
      }
      return {
        ok: true,
        value: { participantId: partner._id, participantType: expectedRole, participantName: '' },
      };
    }

    if (relatedEntityType === 'Application') {
      const application = await Application.findById(relatedEntityId)
        .select('freelancerId startupId')
        .lean();
      if (!application || !application.startupId || application.startupId.toString() !== startupId.toString()) {
        return { ok: false, message: 'Application not found for this startup.' };
      }
      if (!application.freelancerId) return { ok: false, message: 'Application has no freelancer participant.' };
      if (eventRequiresParticipant(eventType) && expectedRole !== 'freelancer') {
        return { ok: false, message: 'This event type requires a freelancer participant.' };
      }
      const freelancer = await User.findById(application.freelancerId).select('name role');
      if (!freelancer) return { ok: false, message: 'Freelancer participant not found.' };
      return {
        ok: true,
        value: { participantId: freelancer._id, participantType: 'freelancer', participantName: '' },
      };
    }
  }

  // GENERAL_MEETING (participant optional) or a related-entity type we don't
  // resolve. If an explicit participantId was not provided, it stays null.
  return { ok: true, value: { participantId: null, participantType: 'general', participantName: '' } };
};

// Shared creation service used by POST / and POST /from-participant.
const createEventForStartup = async ({ userId, body }) => {
  const startup = await StartupProfile.findOne({ userId });
  if (!startup) {
    return { error: { status: 404, message: 'Startup profile not found. Complete your startup profile first.' } };
  }

  const validation = validateEventPayload(body);
  if (!validation.ok) return { error: { status: 400, message: validation.message } };

  const resolved = await resolveParticipant({
    userId,
    startupId: startup._id,
    eventType: validation.value.eventType,
    participantId: validation.value.participantId,
    participantType: validation.value.participantType,
    relatedEntityId: body.relatedEntityId,
    relatedEntityType: validation.value.relatedEntityType,
  });
  if (!resolved.ok) return { error: { status: 400, message: resolved.message } };

  let participantName = validation.value.participantName;
  if (participantName === '' && resolved.value.participantId) {
    const user = await User.findById(resolved.value.participantId).select('name');
    participantName = user?.name || '';
  }

  const event = await CalendarEvent.create({
    startupId: startup._id,
    createdBy: userId,
    eventType: validation.value.eventType,
    title: validation.value.title,
    date: validation.value.date,
    startTime: validation.value.startTime,
    endTime: validation.value.endTime,
    timezone: validation.value.timezone,
    startAt: validation.value.startAt,
    endAt: validation.value.endAt,
    meetingLink: validation.value.meetingLink,
    location: validation.value.location,
    notes: validation.value.notes,
    participantId: resolved.value.participantId,
    participantType: resolved.value.participantType,
    participantName,
    relatedEntityId: body.relatedEntityId && isValidObjectId(body.relatedEntityId) ? body.relatedEntityId : null,
    relatedEntityType: validation.value.relatedEntityType,
    status: validation.value.status,
  });

  // Notify the participant about the new meeting invitation
  await notifyMeetingParticipant({
    event,
    senderId: userId,
    type: 'meeting_invitation',
    title: 'Meeting Invitation',
    message: `You have been invited to "${event.title}" on ${event.date} at ${event.startTime}.`,
  });

  // Email the freelancer's registered address about the scheduled interview
  // (DB-first event + in-app notification are unaffected if this fails).
  if (event.participantId && event.participantType === 'freelancer') {
    try {
      const freelancer = await User.findById(event.participantId).select('name email');
      if (freelancer?.email) {
        await sendMeetingInvitationEmail({
          to: freelancer.email,
          freelancerName: freelancer.name || event.participantName || 'there',
          startupName: startup.startupName,
          event,
        });
      }
    } catch (err) {
      console.error('Failed to send interview email notification:', err.message);
    }
  }

  return { event };
};

// ---------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------

// @desc    List the startup's events with optional filters
// @route   GET /api/calendar
// @access  Private (Startup)
export const getCalendarEvents = async (req, res, next) => {
  try {
    const { date, startDate, endDate, eventType, status } = req.query;
    const query = {};
    if (req.user.role === 'startup') {
      const startupId = await getOwnStartupId(req.user._id);
      if (!startupId) return res.status(404).json({ success: false, message: 'Startup profile not found.' });
      query.startupId = startupId;
    } else {
      // Participants (freelancer/investor) see only meetings shared with them.
      query.participantId = req.user._id;
    }

    if (date !== undefined) {
      if (!isValidDateString(date)) {
        return res.status(400).json({ success: false, message: 'date filter must be YYYY-MM-DD.' });
      }
      query.date = date;
    }
    if (startDate !== undefined || endDate !== undefined) {
      if (startDate !== undefined && !isValidDateString(startDate)) {
        return res.status(400).json({ success: false, message: 'startDate filter must be YYYY-MM-DD.' });
      }
      if (endDate !== undefined && !isValidDateString(endDate)) {
        return res.status(400).json({ success: false, message: 'endDate filter must be YYYY-MM-DD.' });
      }
      query.date = {
        ...(startDate ? { $gte: startDate } : {}),
        ...(endDate ? { $lte: endDate } : {}),
      };
    }
    if (eventType !== undefined) {
      if (!CALENDAR_EVENT_TYPES.includes(eventType)) {
        return res.status(400).json({ success: false, message: `Invalid eventType filter. Allowed: ${CALENDAR_EVENT_TYPES.join(', ')}.` });
      }
      query.eventType = eventType;
    }
    if (status !== undefined) {
      if (!CALENDAR_EVENT_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status filter. Allowed: ${CALENDAR_EVENT_STATUSES.join(', ')}.` });
      }
      query.status = status;
    }

    const { page, limit } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });

    const [events, total] = await Promise.all([
      CalendarEvent.find(query)
        .sort({ date: 1, startTime: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CalendarEvent.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: events.length,
      total,
      events,
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List upcoming events (excludes cancelled), nearest first
// @route   GET /api/calendar/upcoming
// @access  Private (Startup)
export const getUpcomingEvents = async (req, res, next) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const nowTime = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

    const query = { status: { $ne: 'CANCELLED' } };
    if (req.user.role === 'startup') {
      const startupId = await getOwnStartupId(req.user._id);
      if (!startupId) return res.status(404).json({ success: false, message: 'Startup profile not found.' });
      query.startupId = startupId;
    } else {
      query.participantId = req.user._id;
    }
    query.$or = [{ date: { $gt: today } }, { date: today, startTime: { $gte: nowTime } }];

    const { limit } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });

    const events = await CalendarEvent.find(query)
      .sort({ date: 1, startTime: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    next(error);
  }
};

// @desc    Get one event (startup's own only)
// @route   GET /api/calendar/:id
// @access  Private (Startup)
export const getCalendarEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid calendar event ID.' });

    const query = { _id: id };
    if (req.user.role === 'startup') {
      const startupId = await getOwnStartupId(req.user._id);
      if (!startupId) return res.status(404).json({ success: false, message: 'Startup profile not found.' });
      query.startupId = startupId;
    } else {
      query.participantId = req.user._id;
    }

    const event = await CalendarEvent.findOne(query).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Calendar event not found.' });

    return res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a calendar event
// @route   POST /api/calendar
// @access  Private (Startup)
export const createCalendarEvent = async (req, res, next) => {
  try {
    const result = await createEventForStartup({ userId: req.user._id, body: req.body });
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }
    return res.status(201).json({ success: true, message: 'Calendar event created successfully.', event: result.event });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a calendar event from an investor/freelancer card (pre-filled)
// @route   POST /api/calendar/from-participant
// @access  Private (Startup)
export const createEventFromParticipant = async (req, res, next) => {
  try {
    const result = await createEventForStartup({ userId: req.user._id, body: req.body });
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }
    return res.status(201).json({ success: true, message: 'Calendar event scheduled.', event: result.event });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a calendar event (ownership enforced; startupId immutable)
// @route   PUT /api/calendar/:id
// @access  Private (Startup)
export const updateCalendarEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid calendar event ID.' });

    const startupId = await getOwnStartupId(req.user._id);
    if (!startupId) return res.status(404).json({ success: false, message: 'Startup profile not found.' });

    const existing = await CalendarEvent.findOne({ _id: id, startupId });
    if (!existing) return res.status(404).json({ success: false, message: 'Calendar event not found.' });

    const validation = validateEventPayload(req.body);
    if (!validation.ok) return res.status(400).json({ success: false, message: validation.message });

    const resolved = await resolveParticipant({
      userId: req.user._id,
      startupId,
      eventType: validation.value.eventType,
      participantId: validation.value.participantId,
      participantType: validation.value.participantType,
      relatedEntityId: req.body.relatedEntityId,
      relatedEntityType: validation.value.relatedEntityType,
    });
    if (!resolved.ok) return res.status(400).json({ success: false, message: resolved.message });

    let participantName = validation.value.participantName;
    if (participantName === '' && resolved.value.participantId) {
      const user = await User.findById(resolved.value.participantId).select('name');
      participantName = user?.name || existing.participantName || '';
    }

    const previousDate = existing.date;
    const previousStartTime = existing.startTime;
    const previousEndTime = existing.endTime;
    const previousStatus = existing.status;

    Object.assign(existing, {
      eventType: validation.value.eventType,
      title: validation.value.title,
      date: validation.value.date,
      startTime: validation.value.startTime,
      endTime: validation.value.endTime,
      timezone: validation.value.timezone,
      startAt: validation.value.startAt,
      endAt: validation.value.endAt,
      meetingLink: validation.value.meetingLink,
      location: validation.value.location,
      notes: validation.value.notes,
      participantId: resolved.value.participantId,
      participantType: resolved.value.participantType,
      participantName,
      relatedEntityId: req.body.relatedEntityId && isValidObjectId(req.body.relatedEntityId) ? req.body.relatedEntityId : null,
      relatedEntityType: validation.value.relatedEntityType,
      status: validation.value.status,
    });
    await existing.save();

    // Notify the participant when details that matter to them change
    const scheduleChanged =
      previousDate !== existing.date ||
      previousStartTime !== existing.startTime ||
      previousEndTime !== existing.endTime;
    if (existing.participantId) {
      if (existing.status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
        await notifyMeetingParticipant({
          event: existing,
          senderId: req.user._id,
          type: 'meeting_cancelled',
          title: 'Meeting Cancelled',
          message: `The meeting "${existing.title}" has been cancelled.`,
        });
      } else if (scheduleChanged || previousStatus === 'CANCELLED') {
        await notifyMeetingParticipant({
          event: existing,
          senderId: req.user._id,
          type: 'meeting_rescheduled',
          title: 'Meeting Rescheduled',
          message: `The meeting "${existing.title}" has been rescheduled to ${existing.date} at ${existing.startTime} (${existing.timezone}).`,
        });
      } else if (previousStatus !== existing.status) {
        await notifyMeetingParticipant({
          event: existing,
          senderId: req.user._id,
          type: 'meeting_status_changed',
          title: 'Meeting Status Updated',
          message: `The meeting "${existing.title}" status changed to ${existing.status}.`,
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Calendar event updated successfully.', event: existing });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join('; '),
      });
    }
    next(error);
  }
};

// @desc    Update event status only
// @route   PATCH /api/calendar/:id/status
// @access  Private (Startup)
export const updateEventStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid calendar event ID.' });

    const statusResult = validateStatus(req.body.status);
    if (!statusResult.ok) return res.status(400).json({ success: false, message: statusResult.message });

    const startupId = await getOwnStartupId(req.user._id);
    if (!startupId) return res.status(404).json({ success: false, message: 'Startup profile not found.' });

    const existing = await CalendarEvent.findOne({ _id: id, startupId });
    if (!existing) return res.status(404).json({ success: false, message: 'Calendar event not found.' });

    if (existing.status === statusResult.value) {
      return res.status(200).json({ success: true, message: `Event is already marked as ${statusResult.value}.`, event: existing });
    }

    const event = await CalendarEvent.findOneAndUpdate(
      { _id: id, startupId },
      { $set: { status: statusResult.value } },
      { new: true, runValidators: true }
    );

    // Notify the participant about the status change
    if (event.participantId) {
      if (statusResult.value === 'CANCELLED') {
        await notifyMeetingParticipant({
          event,
          senderId: req.user._id,
          type: 'meeting_cancelled',
          title: 'Meeting Cancelled',
          message: `The meeting "${event.title}" has been cancelled.`,
        });
      } else {
        await notifyMeetingParticipant({
          event,
          senderId: req.user._id,
          type: 'meeting_status_changed',
          title: 'Meeting Status Updated',
          message: `The meeting "${event.title}" status changed to ${event.status}.`,
        });
      }
    }

    return res.status(200).json({ success: true, message: `Event marked as ${statusResult.value}.`, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a calendar event (hard delete, ownership enforced)
// @route   DELETE /api/calendar/:id
// @access  Private (Startup)
export const deleteCalendarEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid calendar event ID.' });

    const startupId = await getOwnStartupId(req.user._id);
    if (!startupId) return res.status(404).json({ success: false, message: 'Startup profile not found.' });

    const event = await CalendarEvent.findOneAndDelete({ _id: id, startupId });
    if (!event) return res.status(404).json({ success: false, message: 'Calendar event not found.' });

    return res.status(200).json({ success: true, message: 'Calendar event deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Participant responds (RSVP) to a shared meeting invitation
// @route   POST /api/calendar/:id/rsvp
// @access  Private (invited participant only)
export const rsvpToEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid calendar event ID.' });

    const response = ['accepted', 'declined'].includes(req.body?.response) ? req.body.response : null;
    if (!response) {
      return res.status(400).json({ success: false, message: 'Response must be "accepted" or "declined".' });
    }

    const event = await CalendarEvent.findOne({ _id: id, participantId: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Calendar event not found or you are not the invited participant.' });
    }
    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: `Cannot respond to a meeting that is already ${event.status.toLowerCase()}.` });
    }

    event.participantResponse = response;
    event.respondedAt = new Date();
    await event.save();

    return res.status(200).json({ success: true, message: `Meeting ${response}.`, event });
  } catch (error) {
    next(error);
  }
};