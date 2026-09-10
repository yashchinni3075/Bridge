import express from 'express';
import mongoose from 'mongoose';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { requireVerifiedUser } from '../middleware/verificationMiddleware.js';
import Connection from '../models/Connection.js';
import StartupProfile from '../models/StartupProfile.js';
import {
  getMyInvestorProfile,
  updateInvestorProfile,
  discoverStartupsForInvestors,
  getInvestorDashboard,
} from '../controllers/investorController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('investor'));

router.get('/profile', getMyInvestorProfile);
router.put('/profile', updateInvestorProfile);
router.post('/profile', updateInvestorProfile);
router.get('/dashboard', getInvestorDashboard);
router.get('/startups', discoverStartupsForInvestors);

// Get all active connection requests sent by this investor with status mapping
router.get('/connections', async (req, res, next) => {
  try {
    const connections = await Connection.find({ requester: req.user._id }).lean();
    return res.status(200).json({ 
      success: true, 
      connections: connections.map(c => ({
        _id: c._id,
        recipient: c.recipient,
        status: c.status || 'pending'
      })) 
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


router.get('/connections', async (req, res, next) => {
  try {
    const connections = await Connection.find({ requester: req.user._id }).lean();
    
    // Enrich connections to include both user and profile IDs for robust frontend matching
    const enrichedConnections = await Promise.all(connections.map(async (c) => {
      let startupProfileId = c.recipient;
      const profileDoc = await StartupProfile.findOne({ userId: c.recipient });
      if (profileDoc) {
        startupProfileId = profileDoc._id;
      }
      return {
        _id: c._id,
        recipient: c.recipient,
        startupProfileId: startupProfileId,
        status: c.status || 'pending'
      };
    }));

    return res.status(200).json({ 
      success: true, 
      connections: enrichedConnections 
    });
  } catch (err) {
    next(err);
  }
});

export default router;