import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
// your profile controller imports...

const router = express.Router();

// Require login on all profile operations
router.use(protect);

// router.get('/startup', ...);
// router.post('/startup', ...);

export default router;