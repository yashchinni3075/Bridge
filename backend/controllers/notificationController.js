import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const DEFAULT_NOTIFICATION_PAGE_SIZE = 20;

export const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query, {
      defaultLimit: DEFAULT_NOTIFICATION_PAGE_SIZE,
    });
    const filter = { recipient: req.user._id };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name email role profileImage')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      pagination: buildPaginationMeta({ page, limit, total }),
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};