import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createReport,
  getReportCount,
  getReportReasons,
} from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('freelancer', 'startup'), createReport);
router.get('/count/:userId', getReportCount);
router.get('/reasons/:role', getReportReasons);

export default router;
