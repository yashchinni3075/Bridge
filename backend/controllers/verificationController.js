import mongoose from 'mongoose';
import User from '../models/User.js';
import FreelancerVerification from '../models/FreelancerVerification.js';
import { getOrCreateByFreelancer } from '../services/freelancerVerificationService.js';
import { uploadVerificationBuffer, deleteCloudinaryResource } from '../utils/cloudinaryService.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Get current user verification status & doc details
// @route   GET /api/verification/status
// @access  Private
export const getVerificationStatus = async (req, res, next) => {
  try {
    const rawUser = await User.collection.findOne(
      { _id: new mongoose.Types.ObjectId(req.user._id) },
      { projection: { verification: 1, isVerified: 1, role: 1 } }
    );

    if (!rawUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const verification = rawUser.verification || {};

    let identity = {};
    let education = {};
    let trustScore = 0;

    if (rawUser.role === 'freelancer') {
      const fv = await getOrCreateByFreelancer(req.user._id);
      identity = fv.identity || {};
      education = fv.education || {};
      trustScore = fv.trustScore ?? 0;
    }

    return res.status(200).json({
      success: true,
      status: verification.status || (rawUser.isVerified ? 'approved' : 'not_submitted'),
      documentType: verification.documentType || identity.documentType || null,
      uploadedAt: verification.uploadedAt || null,
      documentUrl: verification.documentUrl || identity.documentUrl || null,
      rejectionReason: verification.rejectionReason || null,
      reviewedAt: verification.reviewedAt || identity.verifiedAt || null,
      identity,
      education,
      trustScore,
      freelancerId: rawUser._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload or replace verification document
// @route   POST /api/verification/upload
// @access  Private
export const uploadVerificationDocument = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please provide a verification document' });
  }

  const { documentType } = req.body;
  const validTypes = ['Government ID', 'Company Registration', 'Accreditation Proof', 'Passport', 'Other'];
  const docTypeToSave = validTypes.includes(documentType) ? documentType : 'Government ID';

  const userObjectId = new mongoose.Types.ObjectId(req.user._id);

  const existingUser = await User.collection.findOne({ _id: userObjectId });
  if (!existingUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  let uploadedFile = null;
  const oldPublicId = existingUser.verification?.cloudinaryPublicId;

  try {
    // 1. Upload to Cloudinary
    uploadedFile = await uploadVerificationBuffer(req.file.buffer, {
      role: existingUser.role,
      userId: existingUser._id.toString(),
      originalname: req.file.originalname,
    });

    const now = new Date();

    // 2. Direct atomic update using native driver
    const updateResult = await User.collection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          'verification.status': 'pending',
          'verification.documentUrl': uploadedFile.url,
          'verification.cloudinaryPublicId': uploadedFile.publicId,
          'verification.documentType': docTypeToSave,
          'verification.uploadedAt': now,
          'verification.rejectionReason': '',
          'verification.reviewedAt': null,
          'verification.reviewedBy': null,
          isVerified: false,
        },
      }
    );

    // 3. Delete old file from Cloudinary if replacement
    if (oldPublicId && oldPublicId !== uploadedFile.publicId) {
      await deleteCloudinaryResource(oldPublicId);
    }

    // 4. Mirror identity verification into the freelancer_verifications document
    if (existingUser.role === 'freelancer') {
      await getOrCreateByFreelancer(req.user._id);
      await FreelancerVerification.updateOne(
        { freelancerId: req.user._id },
        {
          $set: {
            'identity.status': 'pending',
            'identity.documentType': docTypeToSave,
            'identity.documentUrl': uploadedFile.url,
            'identity.verifiedAt': null,
          },
        }
      );
    }

    // 5. Notify the user their verification document is submitted for review
    const verificationLinks = {
      startup: '/startup-dashboard/verification',
      investor: '/investor-dashboard/verification',
      freelancer: '/freelancer-dashboard/verification',
    };
    await createNotification({
      recipient: req.user._id,
      sender: req.user._id,
      type: 'verification_submitted',
      title: 'Verification Document Submitted',
      message: 'Your verification document has been submitted and is awaiting admin review.',
      relatedId: req.user._id,
      relatedModel: 'User',
      link: verificationLinks[existingUser.role] || '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Verification document submitted successfully.',
      verification: {
        status: 'pending',
        documentType: docTypeToSave,
        documentUrl: uploadedFile.url,
        uploadedAt: now,
      },
    });
  } catch (error) {
    // 4. Safe Rollback
    if (uploadedFile?.publicId) {
      await deleteCloudinaryResource(uploadedFile.publicId);
    }
    return next(error);
  }
};

// @desc    Delete current verification document (reverts to not_submitted)
// @route   DELETE /api/verification/document
// @access  Private
export const deleteVerificationDocument = async (req, res, next) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    const existingUser = await User.collection.findOne({ _id: userObjectId });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (existingUser.verification?.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved verification documents cannot be removed directly. Contact administrator.',
      });
    }

    const publicId = existingUser.verification?.cloudinaryPublicId;
    if (publicId) {
      await deleteCloudinaryResource(publicId);
    }

    await User.collection.updateOne(
      { _id: userObjectId },
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

    if (existingUser.role === 'freelancer') {
      await getOrCreateByFreelancer(req.user._id);
      await FreelancerVerification.updateOne(
        { freelancerId: req.user._id },
        {
          $set: {
            'identity.status': 'not_submitted',
            'identity.documentType': 'Government ID',
            'identity.documentUrl': null,
            'identity.verifiedAt': null,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Verification document removed. Status reset to not_submitted.',
    });
  } catch (error) {
    next(error);
  }
};

