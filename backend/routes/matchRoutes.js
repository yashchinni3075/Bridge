import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import { getRecommendations } from '../controllers/matchController.js';

const router = express.Router();

router.use(protect);
router.use(requireVerifiedUser); // Restricts recommendations to verified users

router.get('/recommendations', getRecommendations);

export default router;