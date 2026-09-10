import mongoose from 'mongoose';
import User from '../models/User.js';
import StartupProfile from '../models/StartupProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import { deleteCloudinaryResource } from '../utils/cloudinaryService.js';

// ==========================================
// DASHBOARD METRICS & STATS
// ==========================================

// @desc    Get Ecosystem Dashboard Metrics & Real-time Verification Counters
// @route   GET /api/admin/dashboard & GET /api/admin/verification/stats
// @access  Private (Admin only)
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalStartups,
      totalInvestors,
      totalFreelancers,
      statusCounts,
      blockedUsers,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'startup' }),
      User.countDocuments({ role: 'investor' }),
      User.countDocuments({ role: 'freelancer' }),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        {
          $group: {
            _id: {
              $ifNull: ['$verification.status', { $cond: ['$isVerified', 'approved', 'not_submitted'] }],
            },
            count: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments({ isBlocked: true }),
      User.find({ role: { $ne: 'admin' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt isVerified isBlocked verification'),
    ]);

    const verificationStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      not_submitted: 0,
    };

    statusCounts.forEach((item) => {
      if (verificationStats.hasOwnProperty(item._id)) {
        verificationStats[item._id] = item.count;
      }
    });

    const stats = {
      totalUsers,
      totalStartups: totalStartups,
      totalInvestors: totalInvestors,
      totalFreelancers: totalFreelancers,
      startups: totalStartups,
      investors: totalInvestors,
      freelancers: totalFreelancers,
      blockedUsers,
      pendingVerifications: verificationStats.pending,
      pending: verificationStats.pending,
      approved: verificationStats.approved,
      rejected: verificationStats.rejected,
      not_submitted: verificationStats.not_submitted,
    };

    return res.status(200).json({
      success: true,
      stats,
      recentUsers,
      data: stats, // For backwards compatibility with older dashboard views
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Alias for dedicated verification stats route
// @route   GET /api/admin/verification/stats
export const getAdminVerificationStats = getDashboardStats;

// @desc    Alias for admin dashboard metrics route
// @route   GET /api/admin/dashboard
export const getAdminDashboardMetrics = getDashboardStats;

// ==========================================
// UNIFIED VERIFICATION WORKFLOWS
// ==========================================

// @desc    Get Verification Requests with Lifecycle Filtering
// @route   GET /api/admin/verification/requests
// @access  Private (Admin only)
export const getVerificationRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { role: { $ne: 'admin' } };

    if (status && ['pending', 'approved', 'rejected', 'not_submitted'].includes(status)) {
      query['verification.status'] = status;
    } else {
      query['verification.status'] = { $in: ['pending', 'approved', 'rejected'] };
    }

    const requests = await User.find(query)
      .select('name email role profileImage isBlocked isVerified verification createdAt')
      .populate({
        path: 'verification.reviewedBy',
        select: 'name email',
        model: 'User',
        options: { strictPopulate: false },
      })
      .sort({ 'verification.uploadedAt': -1, updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review Verification (Approve or Reject with mandatory reason)
// @route   PATCH /api/admin/verification/:userId/review
// @access  Private (Admin only)
export const reviewVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { action, rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be either 'approve' or 'reject'" });
    }

    if (action === 'reject') {
      if (!rejectionReason || typeof rejectionReason !== 'string' || !rejectionReason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'A non-empty rejection reason is mandatory when rejecting verification.',
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Applicant user not found' });
    }

    const isApproval = action === 'approve';
    const now = new Date();
    const adminObjectId = new mongoose.Types.ObjectId(req.user._id);

    // 1. Update User verification status
    await User.collection.updateOne(
      { _id: user._id },
      {
        $set: {
          'verification.status': isApproval ? 'approved' : 'rejected',
          'verification.rejectionReason': isApproval ? '' : rejectionReason.trim(),
          'verification.reviewedAt': now,
          'verification.reviewedBy': adminObjectId,
          isVerified: isApproval,
        },
      }
    );

    // 2. Synchronize role-specific profile verification status if applicable
    if (user.role === 'startup') {
      await StartupProfile.findOneAndUpdate(
        { userId: user._id },
        { verificationStatus: isApproval ? 'verified' : 'rejected' }
      );
    }

    const updatedUser = await User.findById(userId)
      .select('name email role verification isVerified')
      .populate({
        path: 'verification.reviewedBy',
        select: 'name email',
        model: 'User',
        options: { strictPopulate: false },
      });

    return res.status(200).json({
      success: true,
      message: `User verification ${isApproval ? 'approved' : 'rejected'} successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Document Removal (Safe Cloudinary Deletion + State Reset)
// @route   DELETE /api/admin/verification/:userId/document
// @access  Private (Admin only)
export const adminDeleteVerificationDocument = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const rawUser = await User.collection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (!rawUser) {
      return res.status(404).json({ success: false, message: 'Applicant user not found' });
    }

    const publicId = rawUser.verification?.cloudinaryPublicId;
    if (publicId) {
      await deleteCloudinaryResource(publicId);
    }

    await User.collection.updateOne(
      { _id: rawUser._id },
      {
        $set: {
          'verification.status': 'not_submitted',
          'verification.documentUrl': null,
          'verification.cloudinaryPublicId': null,
          'verification.documentType': 'Government ID',
          'verification.uploadedAt': null,
          'verification.rejectionReason': '',
          'verification.reviewedAt': null,
          'verification.reviewedBy': null,
          isVerified: false,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Verification document purged from Cloudinary and status reset to not_submitted.',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// USER DIRECTORY MANAGEMENT
// ==========================================

// @desc    Get Users with search & role filter
// @route   GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).select('-password');
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Block User
// @route   PATCH /api/admin/users/:id/block
export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Admin cannot be blocked' });

    user.isBlocked = true;
    await user.save();

    return res.status(200).json({ success: true, message: `User ${user.email} has been blocked.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock User
// @route   PATCH /api/admin/users/:id/unblock
export const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isBlocked = false;
    await user.save();

    return res.status(200).json({ success: true, message: `User ${user.email} has been unblocked.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete User & Associated Profile
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Admin cannot be deleted' });

    // Purge verification document from Cloudinary if one exists
    if (user.verification?.cloudinaryPublicId) {
      await deleteCloudinaryResource(user.verification.cloudinaryPublicId);
    }

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      StartupProfile.findOneAndDelete({ userId: req.params.id }),
      InvestorProfile.findOneAndDelete({ userId: req.params.id }),
      FreelancerProfile.findOneAndDelete({ userId: req.params.id }),
    ]);

    return res.status(200).json({ success: true, message: 'User and associated data permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ROLE DIRECTORY LISTINGS
// ==========================================

// @desc    Get All Startups
// @route   GET /api/admin/startups
export const getStartups = async (req, res, next) => {
  try {
    const startups = await StartupProfile.find().populate('userId', 'name email isBlocked isVerified createdAt verification');
    return res.status(200).json({ success: true, count: startups.length, startups });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Investors
// @route   GET /api/admin/investors
export const getInvestors = async (req, res, next) => {
  try {
    const investors = await InvestorProfile.find().populate('userId', 'name email isBlocked isVerified createdAt verification');
    return res.status(200).json({ success: true, count: investors.length, investors });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Freelancers
// @route   GET /api/admin/freelancers
export const getFreelancers = async (req, res, next) => {
  try {
    const freelancers = await FreelancerProfile.find().populate('userId', 'name email isBlocked isVerified createdAt verification');
    return res.status(200).json({ success: true, count: freelancers.length, freelancers });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BACKWARDS-COMPATIBILITY HOOKS (LEGACY STARTUP ROUTES)
// ==========================================

// @desc    Legacy Get Pending Verifications (Startup Profile Model)
// @route   GET /api/admin/verifications
export const getPendingVerifications = async (req, res, next) => {
  try {
    const pending = await StartupProfile.find({ verificationStatus: 'pending' }).populate('userId', 'name email createdAt');
    return res.status(200).json({ success: true, count: pending.length, verifications: pending });
  } catch (error) {
    next(error);
  }
};

// @desc    Legacy Approve Startup Verification
// @route   PATCH /api/admin/verifications/:id/approve
export const approveVerification = async (req, res, next) => {
  try {
    const startup = await StartupProfile.findById(req.params.id);
    if (!startup) return res.status(404).json({ success: false, message: 'Startup profile not found' });

    startup.verificationStatus = 'verified';
    await startup.save();

    if (startup.userId) {
      await User.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(startup.userId) },
        {
          $set: {
            'verification.status': 'approved',
            'verification.reviewedAt': new Date(),
            'verification.reviewedBy': new mongoose.Types.ObjectId(req.user._id),
            isVerified: true,
          },
        }
      );
    }

    return res.status(200).json({ success: true, message: 'Startup successfully verified', startup });
  } catch (error) {
    next(error);
  }
};

// @desc    Legacy Reject Startup Verification
// @route   PATCH /api/admin/verifications/:id/reject
export const rejectVerification = async (req, res, next) => {
  try {
    const startup = await StartupProfile.findById(req.params.id);
    if (!startup) return res.status(404).json({ success: false, message: 'Startup profile not found' });

    startup.verificationStatus = 'rejected';
    await startup.save();

    if (startup.userId) {
      await User.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(startup.userId) },
        {
          $set: {
            'verification.status': 'rejected',
            'verification.reviewedAt': new Date(),
            'verification.reviewedBy': new mongoose.Types.ObjectId(req.user._id),
            isVerified: false,
          },
        }
      );
    }

    return res.status(200).json({ success: true, message: 'Startup verification rejected', startup });
  } catch (error) {
    next(error);
  }
};