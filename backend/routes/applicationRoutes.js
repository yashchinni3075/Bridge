import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import {
  applyToStartup,
  getMyApplications,
  withdrawApplication,
} from '../controllers/applicationController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('freelancer'));

// Discovery / Self Applications
router.get('/my', getMyApplications);
router.post('/:startupId', requireVerifiedUser, applyToStartup);
router.patch('/:id/withdraw', withdrawApplication);

export default router;