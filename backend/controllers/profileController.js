import StartupProfile from '../models/StartupProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import FreelancerProfile from '../models/FreelancerProfile.js';

const getModelByRole = (role) => {
  switch (role) {
    case 'startup':
      return StartupProfile;
    case 'investor':
      return InvestorProfile;
    case 'freelancer':
      return FreelancerProfile;
    default:
      return null;
  }
};

// @desc    Get profile for logged-in user or by role & userId for admin
// @route   GET /api/profiles/:role or GET /api/profiles/:role/:userId
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const role = req.params.role;
    const Model = getModelByRole(role);

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid profile type' });
    }

    // Admins can read any profile by userId param; regular users only read their own
    const targetUserId =
      req.user.role === 'admin' && req.params.userId ? req.params.userId : req.user._id;

    if (req.user.role !== 'admin' && req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Cannot view ${role} profile as a ${req.user.role}`,
      });
    }

    const profile = await Model.findOne({ userId: targetUserId }).populate('userId', 'name email role');

    if (!profile) {
      return res.status(200).json({ success: true, profile: null, message: 'Profile not yet created' });
    }

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update profile
// @route   POST /api/profiles/:role
// @access  Private
export const upsertProfile = async (req, res, next) => {
  try {
    const role = req.params.role;
    const Model = getModelByRole(role);

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid profile type' });
    }

    // Role safety check: users can only modify their own assigned role profile
    if (req.user.role !== 'admin' && req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Only ${role} users can edit this profile`,
      });
    }

    const payload = { ...req.body, userId: req.user._id };

    // Regular users cannot arbitrarily self-verify
    if (req.user.role !== 'admin' && payload.verificationStatus) {
      delete payload.verificationStatus;
    }

    const profile = await Model.findOneAndUpdate(
      { userId: req.user._id },
      payload,
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};