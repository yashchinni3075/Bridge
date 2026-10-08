import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../controllers/chatController.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', getUnreadCount);
router.get('/:connectionId', getMessages);
router.post('/:connectionId', sendMessage);
router.patch('/:connectionId/read', markAsRead);

export default router;