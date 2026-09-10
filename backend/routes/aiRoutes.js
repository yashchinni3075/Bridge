import express from 'express';
import { evaluatePitchDeck, getPitchEvaluation } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/evaluate-pitch', authorize('startup', 'admin'), evaluatePitchDeck);
router.get('/pitch-evaluation', authorize('startup', 'admin'), getPitchEvaluation);

export default router;