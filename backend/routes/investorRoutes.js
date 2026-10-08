import express from 'express';
import mongoose from 'mongoose';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import Connection from '../models/Connection.js';
import StartupProfile from '../models/StartupProfile.js';
import { createNotification } from '../services/notificationService.js';
import {
  getMyInvestorProfile,
  updateInvestorProfile,
  discoverStartupsForInvestors,
  getInvestorDashboard,
  getInvestmentHistory,
} from '../controllers/investorController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('investor'));

router.get('/profile', getMyInvestorProfile);
router.put('/profile', updateInvestorProfile);
router.post('/profile', updateInvestorProfile);
router.get('/dashboard', getInvestorDashboard);
router.get('/startups', discoverStartupsForInvestors);
router.get('/investment-history', getInvestmentHistory);

// All startup<->investor connections involving this investor, in either direction.
router.get('/connections', async (req, res, next) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      connectionType: 'startup_investor',
    })
      .populate('requester', 'name email role profileImage')
      .populate('recipient', 'name email role profileImage')
      .sort({ updatedAt: -1 })
      .lean();

    const toId = (populated) => populated?._id?.toString() || null;
    const selfId = req.user._id.toString();

    // Identify the startup side of each connection. A connection can be started
    // by either party, so use recipientRole rather than assuming a direction.
    const startupUserIdFor = (c) => toId(c.recipient);

    const startupUserIds = [
      ...new Set(connections.map(startupUserIdFor).filter((id) => id && id !== selfId)),
    ];

    // Resolve the StartupProfile for each counterparty so the client can look up
    // connection status by EITHER the startup user id or the startup profile id.
    // Without this the UI cannot tell that a startup is already connected.
    const startupProfiles = startupUserIds.length
      ? await StartupProfile.find({ userId: { $in: startupUserIds } })
          .select('_id userId')
          .lean()
      : [];
    const profileIdByUserId = new Map(
      startupProfiles.map((p) => [p.userId.toString(), p._id.toString()])
    );

    return res.status(200).json({
      success: true,
      connections: connections.map((c) => {
        const startupUserId = startupUserIdFor(c);
        return {
          _id: c._id,
          requester: c.requester,
          recipient: c.recipient,
          requesterId: toId(c.requester),
          recipientId: toId(c.recipient),
          requesterRole: c.requesterRole,
          recipientRole: c.recipientRole,
          startupUserId: startupUserId && startupUserId !== selfId ? startupUserId : null,
          // Falls back to the user id when the startup has no profile yet.
          startupProfileId: startupUserId ? profileIdByUserId.get(startupUserId) || startupUserId : null,
          status: c.status || 'pending',
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

// Connect to a startup
router.post('/connect/:startupId', requireVerifiedUser, async (req, res, next) => {
  try {
    const { startupId } = req.params;

    let recipientUserId = startupId;
    const startupDoc = await StartupProfile.findById(startupId);
    if (startupDoc && startupDoc.userId) {
      recipientUserId = startupDoc.userId;
    }

    const existing = await Connection.findOne({
      requester: req.user._id,
      $or: [{ recipient: recipientUserId }, { recipient: startupId }],
    });

    if (!existing) {
      await Connection.create({
        requester: req.user._id,
        recipient: recipientUserId,
        requesterRole: 'investor',
        recipientRole: 'startup',
        connectionType: 'startup_investor',
        status: 'pending',
      });
    } else if (existing.status === 'rejected') {
      // Allow re-requesting if previously rejected
      existing.status = 'pending';
      await existing.save();

      // Ping the startup, otherwise a reconnect lands in their applications
      // list with no notification and is easy to miss.
      await createNotification({
        recipient: recipientUserId,
        sender: req.user._id,
        type: 'connection_request',
        title: 'Connection Request Resent',
        message: `${req.user.name} has re-sent a connection request.`,
        relatedId: existing._id,
        relatedModel: 'Connection',
        link: '/startup-dashboard/applications',
      });
    }

    return res.status(200).json({ success: true, message: 'Connection request sent.' });
  } catch (err) {
    next(err);
  }
});

// Cancel a sent connection request
router.delete('/connect/:startupId', requireVerifiedUser, async (req, res, next) => {
  try {
    const { startupId } = req.params;

    let recipientUserId = startupId;
    const startupDoc = await StartupProfile.findById(startupId);
    if (startupDoc && startupDoc.userId) {
      recipientUserId = startupDoc.userId;
    }

    await Connection.findOneAndDelete({
      requester: req.user._id,
      $or: [{ recipient: recipientUserId }, { recipient: startupId }],
    });

    return res.status(200).json({ success: true, message: 'Connection request cancelled.' });
  } catch (err) {
    next(err);
  }
});


export default router;