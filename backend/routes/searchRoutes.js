import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  searchStartupsForFreelancers,
  searchStartupsForInvestors,
  searchFreelancersForStartups,
  searchInvestorsForStartups,
} from '../controllers/searchController.js';

const router = express.Router();

router.use(protect);

// 1. Freelancer Searching Startups
router.get('/startups/freelancer', authorize('freelancer'), searchStartupsForFreelancers);

// 2. Investor Searching Startups
router.get('/startups/investor', authorize('investor'), searchStartupsForInvestors);

// 3. Startup Searching Freelancers
router.get('/freelancers', authorize('startup'), searchFreelancersForStartups);

// 4. Startup Searching Investors
router.get('/investors', authorize('startup'), searchInvestorsForStartups);

export default router;