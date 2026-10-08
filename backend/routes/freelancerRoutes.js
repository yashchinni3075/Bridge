import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import {
  getMyFreelancerProfile,
  updateFreelancerProfile,
  applyToStartup,
  getFreelancerApplications,
  cancelApplication,
} from '../controllers/freelancerController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('freelancer'));

// Profile Routes
router.get('/profile', getMyFreelancerProfile);
router.get('/', getMyFreelancerProfile);
router.put('/profile', updateFreelancerProfile);
router.post('/profile', updateFreelancerProfile);
router.put('/', updateFreelancerProfile);

// Applications & Discovery Routes
router.get('/applications', getFreelancerApplications);
router.post('/apply/:startupId', requireVerifiedUser, applyToStartup);
router.delete('/applications/:applicationId', requireVerifiedUser, cancelApplication);

export default router;