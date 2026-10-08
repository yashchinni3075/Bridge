import mongoose from 'mongoose';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import StartupProfile from '../models/StartupProfile.js';
import { createNotification } from '../services/notificationService.js';
import { parsePagination, paginateQuery } from '../utils/pagination.js';

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

        await createNotification({
          recipient: recipient._id,
          sender: requesterId,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${req.user.name} sent you a connection request.`,
          relatedId: existingConnection._id,
          relatedModel: 'Connection',
          link: '/connections',
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

    await createNotification({
      recipient: recipient._id,
      sender: requesterId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${req.user.name} sent you a connection request.`,
      relatedId: newConnection._id,
      relatedModel: 'Connection',
      link: '/connections',
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
// @route   GET /api/connections/sent?page=&limit=
// @access  Private
export const getSentRequests = async (req, res, next) => {
  try {
    const filter = { requester: req.user._id, status: { $in: ['pending', 'rejected'] } };
    const buildQuery = () =>
      Connection.find(filter)
        .populate('recipient', 'name email role profileImage isVerified')
        .sort({ createdAt: -1, _id: 1 })
        .lean();

    const { rows: sent, total, meta } = await paginateQuery(
      buildQuery(),
      buildQuery(),
      parsePagination(req.query)
    );

    return res.status(200).json({
      success: true,
      count: total,
      requests: sent,
      pagination: meta,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests received by current user (pending review)
// @route   GET /api/connections/received?page=&limit=
// @access  Private
export const getReceivedRequests = async (req, res, next) => {
  try {
    const filter = { recipient: req.user._id, status: 'pending' };
    const buildQuery = () =>
      Connection.find(filter)
        .populate('requester', 'name email role profileImage isVerified')
        .sort({ createdAt: -1, _id: 1 })
        .lean();

    const { rows: received, total, meta } = await paginateQuery(
      buildQuery(),
      buildQuery(),
      parsePagination(req.query)
    );

    return res.status(200).json({
      success: true,
      count: total,
      requests: received,
      pagination: meta,
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
    const filter = {
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    };
    const buildQuery = () =>
      Connection.find(filter)
        .populate('requester', 'name email role profileImage isVerified')
        .populate('recipient', 'name email role profileImage isVerified')
        .sort({ updatedAt: -1, _id: 1 })
        .lean();

    // Paged before the partner/profile enrichment below, so that work stays
    // proportional to the page size rather than to the user's whole history.
    const { rows: connections, total, meta } = await paginateQuery(
      buildQuery(),
      buildQuery(),
      parsePagination(req.query)
    );

    // Map each connection so connectedUser points to the partner
    const selfId = req.user._id.toString();
    const partnerOf = (conn) =>
      conn.requester?._id?.toString() === selfId ? conn.recipient : conn.requester;

    const partnerIds = [
      ...new Set(connections.map(partnerOf).map((p) => p?._id?.toString()).filter(Boolean)),
    ];

    // Resolve each partner's StartupProfile so callers can key connection status
    // by the startup profile id as well as the user id. Screens that list
    // startups identify them by profile _id, so without this they cannot tell
    // that the freelancer is already connected.
    const profiles = partnerIds.length
      ? await StartupProfile.find({ userId: { $in: partnerIds } }).select('_id userId').lean()
      : [];
    const profileIdByUserId = new Map(
      profiles.map((p) => [p.userId.toString(), p._id.toString()])
    );

    const formatted = connections.map((conn) => {
      const partner = partnerOf(conn);
      const partnerId = partner?._id?.toString() || null;
      return {
        _id: conn._id,
        connectionType: conn.connectionType,
        connectedUser: partner,
        partnerId,
        startupProfileId: partnerId ? profileIdByUserId.get(partnerId) || null : null,
        connectedAt: conn.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: total,
      connections: formatted,
      pagination: meta,
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
      await createNotification({
        recipient: connection.requester,
        sender: req.user._id,
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: `${req.user.name} accepted your connection request!`,
        relatedId: connection._id,
        relatedModel: 'Connection',
        link: '/connections',
      });
    } else {
      await createNotification({
        recipient: connection.requester,
        sender: req.user._id,
        type: 'connection_rejected',
        title: 'Connection Update',
        message: `${req.user.name} declined the connection request.`,
        relatedId: connection._id,
        relatedModel: 'Connection',
        link: '/connections',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Connection request successfully ${newStatus}.`,
      connection,
    });
  } catch (error) {
    console.error('[Connection] Error in respondToConnectionRequest:', error);
    next(error);
  }
};