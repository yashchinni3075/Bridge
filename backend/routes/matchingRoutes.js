import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import {
  getFreelancerStartupMatches,
  getStartupFreelancerMatches,
  getInvestorStartupMatches,
  evaluatePairCompatibility,
} from '../controllers/matchingController.js';
import {
  getFreelancerHiringMatches,
  getStartupMatchFreelancers,
  getFreelancerPublicProfile,
} from '../controllers/freelancerMatchController.js';

const router = express.Router();

router.use(protect);

// Strictly guard all matching routes for verified users.
router.use(requireVerifiedUser);

// Freelancer Match Engine (Freelancer -> Startup Hiring).
router.get(
  '/freelancer/hiring',
  authorize('freelancer'),
  getFreelancerHiringMatches
);

// Startup Match Freelancers (Startup -> Freelancer for a specific hiring record).
router.get(
  '/startup/hiring/:hiringId/freelancers',
  authorize('startup'),
  getStartupMatchFreelancers
);

// Get freelancer public profile (for startup to view)
router.get(
  '/freelancer/:freelancerId/profile',
  authorize('startup'),
  getFreelancerPublicProfile
);

// Role-specific matching feeds
router.get('/freelancer/startups', authorize('freelancer'), getFreelancerStartupMatches);
router.get('/startup/freelancers', authorize('startup'), getStartupFreelancerMatches);
router.get('/investor/startups', authorize('investor'), getInvestorStartupMatches);

// Generic pair evaluation
router.get('/evaluate/startup/:startupId/freelancer/:freelancerId', evaluatePairCompatibility);

export default router;
