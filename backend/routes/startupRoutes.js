import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import {
  getPublicStartups,
  getStartupDetails,
  getMyStartupProfile,
  createOrUpdateStartupProfile,
  uploadPitchDeck,
  evaluateStartupPitch,
  getStartupDashboardMetrics,
  getStartupApplications,
  updateApplicationStatus,
  getStartupTeam,
  removeTeamMember,
  createMilestone,
  updateMilestone,
  removeMilestone,
} from '../controllers/startupController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit for decks
});

const router = express.Router();

// ==========================================
// 1. PUBLIC DISCOVERY (COLLECTION LEVEL)
// ==========================================
router.get('/', getPublicStartups);

// ==========================================
// 2. STARTUP FOUNDER PRIVATE ROUTES (SPECIFIC)
// ==========================================
router.use(protect);
router.use(authorize('startup'));

// Dashboard & Profile
router.get('/dashboard/metrics', getStartupDashboardMetrics);
router.get('/profile/me', getMyStartupProfile);
router.post('/profile', createOrUpdateStartupProfile);

// Milestone Management (Must precede /:id)
router.post('/milestones', createMilestone);
router.patch('/milestones/:milestoneId', updateMilestone);
router.delete('/milestones/:milestoneId', requireVerifiedUser, removeMilestone);

// Pitch Deck & AI Pitch Evaluation
router.post('/pitch-deck', upload.single('pitchDeck'), uploadPitchDeck);
router.post('/evaluate-pitch', evaluateStartupPitch);

// Team Roster Management (Must precede /:id)
router.get('/team', getStartupTeam);
router.delete('/team/:memberIndex', requireVerifiedUser, removeTeamMember);

// Applications & Collaboration (Must precede /:id)
router.get('/applications/received', requireVerifiedUser, getStartupApplications);
router.patch('/applications/:applicationId', requireVerifiedUser, updateApplicationStatus);

// ==========================================
// 3. PARAMETERIZED DYNAMIC ROUTES (LAST)
// ==========================================
router.get('/:id', getStartupDetails);

export default router;