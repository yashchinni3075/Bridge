import mongoose from 'mongoose';
import Report from '../models/Report.js';
import User from '../models/User.js';

const BLOCK_THRESHOLD = 10;

const FREELANCER_REPORT_REASONS = [
  'Fake job',
  'Misleading job description',
  'Scam/Fraud',
  'Asking for money',
  'Harassment',
  'Spam/Duplicate',
  'Inappropriate communication',
  'Other',
];

const STARTUP_REPORT_REASONS = [
  'Fake profile',
  'Misrepresentation of skills',
  'Scam/Fraud',
  'Spam',
  'Harassment',
  'Inappropriate communication',
  'Other',
];

// @desc    Create a report against a user
// @route   POST /api/reports
// @access  Private (Freelancer or Startup)
export const createReport = async (req, res, next) => {
  try {
    const { reportedUserId, reason, description, jobId } = req.body;
    const reporterId = req.user._id;
    const reporterRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(reportedUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID to report.' });
    }

    if (reporterId.toString() === reportedUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself.' });
    }

    const reportedUser = await User.findById(reportedUserId).select('name email role isBlocked');
    if (!reportedUser) {
      return res.status(404).json({ success: false, message: 'Reported user not found.' });
    }

    const validReporterRole = reporterRole === 'freelancer' ? 'freelancer' : 'startup';
    const validReportedRole = reportedUser.role === 'freelancer' ? 'freelancer' : 'startup';

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Report reason is required.' });
    }

    const validReasons = validReporterRole === 'freelancer' ? FREELANCER_REPORT_REASONS : STARTUP_REPORT_REASONS;
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Invalid report reason.' });
    }

    if (jobId && !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }

    const report = await Report.create({
      reporterId,
      reporterRole: validReporterRole,
      reportedUserId,
      reportedRole: validReportedRole,
      jobId: jobId || null,
      reason: reason.trim(),
      description: description || '',
      status: 'pending',
    });

    // Auto-block check: count non-self reports against this user
    const reportCount = await Report.countDocuments({ reportedUserId });

    if (reportCount >= BLOCK_THRESHOLD && !reportedUser.isBlocked) {
      await User.findByIdAndUpdate(reportedUserId, { isBlocked: true });
    }

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully.',
      report,
      reportCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report count for a user (admin/moderation)
// @route   GET /api/reports/count/:userId
// @access  Private (authenticated)
export const getReportCount = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const user = await User.findById(userId).select('isBlocked');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const totalReports = await Report.countDocuments({ reportedUserId: userId });

    return res.status(200).json({
      success: true,
      userId,
      totalReports,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get valid report reasons for a role
// @route   GET /api/reports/reasons/:role
// @access  Private (authenticated)
export const getReportReasons = async (req, res, next) => {
  try {
    const { role } = req.params;
    if (role === 'freelancer') {
      return res.status(200).json({ success: true, reasons: FREELANCER_REPORT_REASONS });
    }
    if (role === 'startup') {
      return res.status(200).json({ success: true, reasons: STARTUP_REPORT_REASONS });
    }
    return res.status(400).json({ success: false, message: 'Invalid role.' });
  } catch (error) {
    next(error);
  }
};
