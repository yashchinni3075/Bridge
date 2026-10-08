import mongoose from 'mongoose';
import ChatMessage from '../models/Chat.js';
import Connection from '../models/Connection.js';
import { createNotification } from '../services/notificationService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const DEFAULT_MESSAGE_PAGE_SIZE = 50;

export const getMessages = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({ success: false, message: 'Invalid connection ID' });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }

    const isParticipant = connection.requester.toString() === req.user._id.toString() ||
                          connection.recipient.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat' });
    }

    if (connection.status !== 'accepted') {
      return res.status(403).json({ success: false, message: 'Chat only available for accepted connections' });
    }

    const { page, limit } = parsePagination(req.query, { defaultLimit: 50 });

    // Sorted newest-first so the newest page is page 1, then reversed so the
    // client receives the page in chronological order.
    const [messages, total] = await Promise.all([
      ChatMessage.find({ connectionId })
        .populate('senderId', 'name email role profileImage')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChatMessage.countDocuments({ connectionId }),
    ]);

    await ChatMessage.updateMany(
      { connectionId, readBy: { $ne: req.user._id }, senderId: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { content, messageType = 'text', fileUrl, fileName, fileSize } = req.body;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({ success: false, message: 'Invalid connection ID' });
    }

    if (!content?.trim() && messageType === 'text') {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }

    const isParticipant = connection.requester.toString() === req.user._id.toString() ||
                          connection.recipient.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages in this chat' });
    }

    if (connection.status !== 'accepted') {
      return res.status(403).json({ success: false, message: 'Chat only available for accepted connections' });
    }

    const message = await ChatMessage.create({
      connectionId,
      senderId: req.user._id,
      content: content?.trim() || '',
      messageType,
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      readBy: [req.user._id],
    });

    await message.populate('senderId', 'name email role profileImage');

    const recipientId = connection.requester.toString() === req.user._id.toString()
      ? connection.recipient
      : connection.requester;

    await createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: 'message_received',
      title: 'New Message',
      message: `${req.user.name}: ${content?.substring(0, 100) || 'Sent a file'}`,
      relatedId: connectionId,
      relatedModel: 'Connection',
      link: `/chat/${connectionId}`,
    });

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({ success: false, message: 'Invalid connection ID' });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' });
    }

    const isParticipant = connection.requester.toString() === req.user._id.toString() ||
                          connection.recipient.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (connection.status !== 'accepted') {
      return res.status(403).json({ success: false, message: 'Chat only available for accepted connections' });
    }

    await ChatMessage.updateMany(
      { connectionId, readBy: { $ne: req.user._id }, senderId: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    }).select('_id').lean();

    const connectionIds = connections.map(c => c._id);

    const unreadCounts = await ChatMessage.aggregate([
      { $match: { connectionId: { $in: connectionIds }, senderId: { $ne: req.user._id }, readBy: { $ne: req.user._id } } },
      { $group: { _id: '$connectionId', count: { $sum: 1 } } },
    ]);

    const totalUnread = unreadCounts.reduce((sum, item) => sum + item.count, 0);
    const byConnection = {};
    unreadCounts.forEach(item => { byConnection[item._id.toString()] = item.count; });

    return res.status(200).json({
      success: true,
      totalUnread,
      byConnection,
    });
  } catch (error) {
    next(error);
  }
};