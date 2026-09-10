import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import User from '../models/User.js';
import StartupProfile from '../models/StartupProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import FreelancerProfile from '../models/FreelancerProfile.js';

// Helper to determine role-based profile model
const getProfileModelByRole = (role) => {
  if (role === 'startup') return StartupProfile;
  if (role === 'investor') return InvestorProfile;
  if (role === 'freelancer') return FreelancerProfile;
  return null;
};

// @desc    Upload user profile avatar
// @route   POST /api/upload/profile-image
// @access  Private
export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Upload new image to Cloudinary
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'bridge/avatars', 'image');

    // 2. Delete old image from Cloudinary if it exists
    if (user.profileImagePublicId) {
      await deleteFromCloudinary(user.profileImagePublicId, 'image');
    }

    // 3. Update User document
    user.profileImage = url;
    user.profileImagePublicId = publicId;
    await user.save();

    // 4. Mirror URL to the respective profile if one exists
    const ProfileModel = getProfileModelByRole(user.role);
    if (ProfileModel) {
      await ProfileModel.findOneAndUpdate(
        { userId: user._id },
        { profileImage: url, profileImagePublicId: publicId }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      url,
      publicId,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload startup logo
// @route   POST /api/upload/startup-logo
// @access  Private (Startup only)
export const uploadStartupLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Please create your basic startup profile first before uploading files.',
      });
    }

    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'bridge/logos', 'image');

    if (profile.logoPublicId) {
      await deleteFromCloudinary(profile.logoPublicId, 'image');
    }

    profile.logo = url;
    profile.logoPublicId = publicId;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Startup logo uploaded successfully',
      url,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload startup pitch deck (PDF / PPT / RAW)
// @route   POST /api/upload/pitch-deck
// @access  Private (Startup only)
export const uploadPitchDeck = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Please create your basic startup profile first before uploading files.',
      });
    }

    const resourceType = req.file.mimetype.includes('pdf') ? 'image' : 'raw';
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'bridge/pitch_decks', resourceType);

    if (profile.pitchDeckPublicId) {
      await deleteFromCloudinary(profile.pitchDeckPublicId, resourceType);
    }

    profile.pitchDeck = url;
    profile.pitchDeckPublicId = publicId;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Pitch deck uploaded successfully',
      url,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload freelancer resume (PDF / DOC / DOCX)
// @route   POST /api/upload/resume
// @access  Private (Freelancer only)
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file uploaded' });
    }

    const resourceType = req.file.mimetype.includes('pdf') ? 'image' : 'raw';
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'bridge/resumes', resourceType);

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      url,
      publicId,
      fileName: req.file.originalname || 'resume.pdf',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload startup verification document (registration / other)
// @route   POST /api/upload/verification-doc
// @access  Private (Startup only)
export const uploadVerificationDoc = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { docType } = req.body; // 'registration' or 'other'
    const profile = await StartupProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Please create your basic startup profile first before uploading files.',
      });
    }

    const resourceType = req.file.mimetype.includes('pdf') ? 'image' : 'raw';
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'bridge/verification_docs', resourceType);

    if (docType === 'registration') {
      if (profile.businessRegistrationDocPublicId) {
        await deleteFromCloudinary(profile.businessRegistrationDocPublicId, resourceType);
      }
      profile.businessRegistrationDoc = url;
      profile.businessRegistrationDocPublicId = publicId;
    } else {
      if (profile.otherVerificationDocPublicId) {
        await deleteFromCloudinary(profile.otherVerificationDocPublicId, resourceType);
      }
      profile.otherVerificationDoc = url;
      profile.otherVerificationDocPublicId = publicId;
    }

    // Mark as pending admin verification whenever docs are updated
    profile.verificationStatus = 'pending';
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Verification document uploaded successfully',
      url,
    });
  } catch (error) {
    next(error);
  }
};