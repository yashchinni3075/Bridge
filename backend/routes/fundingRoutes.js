import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import {
  createFundingOpportunity,
  getMyFundingOpportunities,
  getFundingOpportunityById,
  updateFundingOpportunity,
  deleteFundingOpportunity,
  discoverFundingOpportunities,
  expressInterest,
  getFundingInterests,
  getMyFundingInterests,
  respondToInterest,
  updateInterest,
  getFundingStats,
} from '../controllers/fundingController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
});

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==========================================
// NAMED ROUTES FIRST
// Express matches in registration order, so literal paths must be declared
// before "/:id" or they get swallowed by getFundingOpportunityById.
// ==========================================

// Discover funding opportunities (investor)
router.get('/discover', authorize('investor'), discoverFundingOpportunities);

// Get investor's own funding interests
router.get('/my-interests', authorize('investor'), getMyFundingInterests);

// Get funding stats for dashboard
router.get('/stats', authorize('startup'), getFundingStats);

// Get all funding opportunities for current startup
router.get('/', authorize('startup'), getMyFundingOpportunities);

// Create new funding opportunity (multer handles multipart/form-data parsing)
router.post('/', authorize('startup'), requireVerifiedUser, upload.single('pitchDeck'), createFundingOpportunity);

// Get single funding opportunity (startup owner or investor)
router.get('/:id', getFundingOpportunityById);

// Update funding opportunity
router.put('/:id', authorize('startup'), requireVerifiedUser, updateFundingOpportunity);

// Delete funding opportunity
router.delete('/:id', authorize('startup'), requireVerifiedUser, deleteFundingOpportunity);

// ==========================================
// FUNDING INTERESTS (Investor Outreach)
// ==========================================

// Express interest in a funding opportunity (investor)
router.post('/:id/interest', authorize('investor'), requireVerifiedUser, expressInterest);

// Get interests for a funding opportunity (startup owner)
router.get('/:id/interests', authorize('startup'), getFundingInterests);

// Respond to interest (startup accepts/rejects/negotiates)
router.patch('/interests/:interestId/respond', authorize('startup'), requireVerifiedUser, respondToInterest);

// Update interest (investor can withdraw/negotiate)
router.patch('/interests/:interestId', authorize('investor'), updateInterest);

export default router;