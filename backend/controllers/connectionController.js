import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const dispatchNotification = async ({ recipient, sender, type, title, message, relatedId }) => {
  try {
    if (recipient) {
      await Notification.create({
        recipient,
        sender: sender || null,
        type,
        title,
        message,
        relatedId: relatedId || null,
      });
    }
  } catch (err) {
    console.warn('Notification dispatch failure (non-fatal):', err.message);
  }
};

// Validates whether the two roles constitute a supported connection pair
const determineConnectionType = (roleA, roleB) => {
  if (
    (roleA === 'startup' && roleB === 'investor') ||
    (roleA === 'investor' && roleB === 'startup')
  ) {
    return 'startup_investor';
  }
  if (
    (roleA === 'startup' && roleB === 'freelancer') ||
    (roleA === 'freelancer' && roleB === 'startup')
  ) {
    return 'startup_freelancer';
  }
  return null;
};

// @desc    Send a connection request
// @route   POST /api/connections/request/:recipientId
// @access  Private (Verified Users only)
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const { note } = req.body;
    const requesterId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipient user ID.' });
    }

    if (requesterId.toString() === recipientId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot connect with yourself.' });
    }

    const recipient = await User.findById(recipientId).select('name email role isVerified verification isDeactivated isBlocked');
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient user not found.' });
    }

    if (recipient.isDeactivated || recipient.isBlocked) {
      return res.status(400).json({ success: false, message: 'This user account is currently unavailable.' });
    }

    const connectionType = determineConnectionType(req.user.role, recipient.role);
    if (!connectionType) {
      return res.status(400).json({
        success: false,
        message: `Connections between ${req.user.role} and ${recipient.role} are not supported. Only Startup ↔ Investor and Startup ↔ Freelancer connections are allowed.`,
      });
    }

    // Check for existing connection in either direction
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'You are already connected with this user.' });
      }
      if (existingConnection.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: existingConnection.requester.toString() === requesterId.toString()
            ? 'A connection request has already been sent and is awaiting review.'
            : 'This user has already sent you a connection request. Check your received requests to accept.',
        });
      }
      if (existingConnection.status === 'rejected') {
        // Allow re-request if previously rejected by updating record
        existingConnection.requester = requesterId;
        existingConnection.recipient = recipientId;
        existingConnection.requesterRole = req.user.role;
        existingConnection.recipientRole = recipient.role;
        existingConnection.status = 'pending';
        existingConnection.note = note || '';
        await existingConnection.save();

        await dispatchNotification({
          recipient: recipient._id,
          sender: requesterId,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${req.user.name} sent you a connection request.`,
          relatedId: existingConnection._id,
        });

        return res.status(200).json({
          success: true,
          message: 'Connection request sent successfully.',
          connection: existingConnection,
        });
      }
    }

    const newConnection = await Connection.create({
      requester: requesterId,
      recipient: recipientId,
      requesterRole: req.user.role,
      recipientRole: recipient.role,
      connectionType,
      status: 'pending',
      note: note || '',
    });

    await dispatchNotification({
      recipient: recipient._id,
      sender: requesterId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${req.user.name} sent you a connection request.`,
      relatedId: newConnection._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Connection request sent successfully.',
      connection: newConnection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests sent by current user
// @route   GET /api/connections/sent
// @access  Private
export const getSentRequests = async (req, res, next) => {
  try {
    const sent = await Connection.find({ requester: req.user._id, status: { $in: ['pending', 'rejected'] } })
      .populate('recipient', 'name email role profileImage isVerified')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: sent.length,
      requests: sent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests received by current user (pending review)
// @route   GET /api/connections/received
// @access  Private
export const getReceivedRequests = async (req, res, next) => {
  try {
    const received = await Connection.find({ recipient: req.user._id, status: 'pending' })
      .populate('requester', 'name email role profileImage isVerified')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: received.length,
      requests: received,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active accepted connections
// @route   GET /api/connections/accepted
// @access  Private
export const getAcceptedConnections = async (req, res, next) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    })
      .populate('requester', 'name email role profileImage isVerified')
      .populate('recipient', 'name email role profileImage isVerified')
      .sort({ updatedAt: -1 })
      .lean();

    // Map each connection so connectedUser points to the partner
    const formatted = connections.map((conn) => {
      const isRequester = conn.requester._id.toString() === req.user._id.toString();
      const partner = isRequester ? conn.recipient : conn.requester;
      return {
        _id: conn._id,
        connectionType: conn.connectionType,
        connectedUser: partner,
        connectedAt: conn.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      connections: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to an incoming connection request (accept or reject)
// @route   PATCH /api/connections/:connectionId/respond
// @access  Private (Verified Recipient only)
export const respondToConnectionRequest = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!mongoose.Types.ObjectId.isValid(connectionId)) {
      return res.status(400).json({ success: false, message: 'Invalid connection ID.' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be either 'accept' or 'reject'." });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection request not found.' });
    }

    // Ownership check: Only recipient can accept or reject
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only respond to requests sent directly to you.',
      });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${connection.status}.`,
      });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    connection.status = newStatus;
    await connection.save();

    // Notifications to requester
    if (action === 'accept') {
      await dispatchNotification({
        recipient: connection.requester,
        sender: req.user._id,
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: `${req.user.name} accepted your connection request!`,
        relatedId: connection._id,
      });
    } else {
      await dispatchNotification({
        recipient: connection.requester,
        sender: req.user._id,
        type: 'connection_rejected',
        title: 'Connection Update',
        message: `${req.user.name} declined the connection request.`,
        relatedId: connection._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Connection request successfully ${newStatus}.`,
      connection,
    });
  } catch (error) {
    next(error);
  }
};