import Notification from '../models/Notification.js';

let io = null;

export const setSocketIO = (socketServer) => {
  io = socketServer;
};

export const createNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  relatedId = null,
  relatedModel = null,
  link = null,
}) => {
  try {
    if (!recipient) return { ok: false, error: 'recipient is required' };
    if (!type || !title || !message) {
      return { ok: false, error: 'type, title and message are required' };
    }

    const notification = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      title,
      message,
      relatedId: relatedId || null,
      relatedModel: relatedModel || null,
      link: link || null,
    });

    if (io) {
      io.to(recipient.toString()).emit('notification', {
        _id: notification._id,
        recipient: notification.recipient,
        sender: notification.sender,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedId: notification.relatedId,
        relatedModel: notification.relatedModel,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    }

    return { ok: true, notification };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};