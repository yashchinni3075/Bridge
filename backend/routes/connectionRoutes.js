import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import {
  sendConnectionRequest,
  getSentRequests,
  getReceivedRequests,
  getAcceptedConnections,
  respondToConnectionRequest,
} from '../controllers/connectionController.js';

const router = express.Router();

router.use(protect);

// Read feeds
router.get('/sent', getSentRequests);
router.get('/received', getReceivedRequests);
router.get('/accepted', getAcceptedConnections);

// Action endpoints (strictly require verified user status)
router.post('/request/:recipientId', requireVerifiedUser, sendConnectionRequest);
router.patch('/:connectionId/respond', requireVerifiedUser, respondToConnectionRequest);

export default router;