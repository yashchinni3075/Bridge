import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getCalendarEvents,
  getUpcomingEvents,
  getCalendarEvent,
  createCalendarEvent,
  createEventFromParticipant,
  updateCalendarEvent,
  updateEventStatus,
  deleteCalendarEvent,
  rsvpToEvent,
} from '../controllers/calendarController.js';

const router = express.Router();

// All calendar endpoints are private; read access is scoped by role in the
// controllers (startup = organizer, freelancer/investor = participant).
router.use(protect);

// Read endpoints for every authenticated role (role-aware scoping).
router.get('/', getCalendarEvents);
router.get('/upcoming', getUpcomingEvents);

// Participant RSVP to a shared meeting invitation.
router.post('/:id/rsvp', rsvpToEvent);

// Event detail: organizer or invited participant.
router.get('/:id', getCalendarEvent);

// Organizer-only management endpoints (startup).
router.post('/', authorize('startup'), createCalendarEvent);
router.post('/from-participant', authorize('startup'), createEventFromParticipant);
router.put('/:id', authorize('startup'), updateCalendarEvent);
router.patch('/:id/status', authorize('startup'), updateEventStatus);
router.delete('/:id', authorize('startup'), deleteCalendarEvent);

export default router;