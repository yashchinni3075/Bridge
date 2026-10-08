import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import {
  applyToStartup,
  getMyApplications,
  withdrawApplication,
  getApplicationStatusForStartups,
  getApplicationStatusForHirings,
} from '../controllers/applicationController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('freelancer'));

// Discovery / Self Applications
router.get('/my', getMyApplications);
router.post('/status/startups', getApplicationStatusForStartups);
router.post('/status/hirings', getApplicationStatusForHirings);
router.post('/:startupId', requireVerifiedUser, applyToStartup);
router.patch('/:id/withdraw', withdrawApplication);

export default router;