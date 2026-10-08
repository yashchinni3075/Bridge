import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAdminVerificationStats,
  getVerificationRequests,
  reviewVerification,
  adminDeleteVerificationDocument,
  getUsers,
  blockUser,
  unblockUser,
  deleteUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getAdminDashboardMetrics
} from '../controllers/adminController.js';

const router = express.Router();

// Strict Gate: Admin only
router.use(protect);
router.use(authorize('admin'));

// Dashboard & Stats
router.get('/dashboard', getDashboardStats);
router.get('/verification/stats', getAdminVerificationStats);

// Modern Unified Verification
router.get('/verification/requests', getVerificationRequests);
router.patch('/verification/:userId/review', reviewVerification);
router.delete('/verification/:userId/document', adminDeleteVerificationDocument);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.delete('/users/:id', deleteUser);

// Legacy Startup Verification Endpoints (Backwards Compatibility)
router.get('/verifications', getPendingVerifications);
router.patch('/verifications/:id/approve', approveVerification);
router.patch('/verifications/:id/reject', rejectVerification);
router.patch('/startups/:id/approve', approveVerification);
router.patch('/startups/:id/reject', rejectVerification);

export default router;