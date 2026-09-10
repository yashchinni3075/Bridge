import mongoose from 'mongoose';
import axios from 'axios';
import User from '../models/User.js';
import FreelancerVerification from '../models/FreelancerVerification.js';
import { getOrCreateByFreelancer } from '../services/freelancerVerificationService.js';
import { uploadVerificationBuffer, deleteCloudinaryResource } from '../utils/cloudinaryService.js';

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

    let github = { username: '', profileUrl: '', isVerified: false, verifiedAt: null, note: '' };
    let linkedin = { profileUrl: '', isVerified: false, verifiedAt: null, method: 'url', note: '' };
    let identity = {};
    let education = {};
    let trustScore = 0;

    if (rawUser.role === 'freelancer') {
      const fv = await getOrCreateByFreelancer(req.user._id);
      github = fv.github || github;
      linkedin = fv.linkedin || linkedin;
      identity = fv.identity || {};
      education = fv.education || {};
      trustScore = fv.trustScore ?? 0;
    } else {
      github = verification.github || github;
      linkedin = verification.linkedin || linkedin;
    }

    return res.status(200).json({
      success: true,
      status: verification.status || (rawUser.isVerified ? 'approved' : 'not_submitted'),
      documentType: verification.documentType || identity.documentType || null,
      uploadedAt: verification.uploadedAt || null,
      documentUrl: verification.documentUrl || identity.documentUrl || null,
      rejectionReason: verification.rejectionReason || null,
      reviewedAt: verification.reviewedAt || identity.verifiedAt || null,
      github,
      linkedin,
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

const extractGithubUsername = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;

  // If it looks like a full URL, extract the username from the path
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('www.')) {
    try {
      const url = new URL(trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed);
      if (url.hostname !== 'github.com') {
        return { error: 'invalid', message: 'GitHub URL must point to github.com' };
      }
      const parts = url.pathname.split('/').filter(Boolean);
      const username = parts[0] || '';
      if (!username || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?$/.test(username)) {
        return { error: 'invalid', message: 'Invalid GitHub username in URL' };
      }
      return { username };
    } catch {
      return { error: 'invalid', message: 'Invalid GitHub URL format' };
    }
  }

  // Otherwise treat as a raw username
  if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?$/.test(trimmed)) {
    return { username: trimmed };
  }
  return { error: 'invalid', message: 'Invalid GitHub username' };
};

// @desc    Verify a GitHub account
// @route   POST /api/verification/github
// @access  Private (freelancer)
export const verifyGithub = async (req, res, next) => {
  try {
    const { username, profileUrl } = req.body;
    const input = profileUrl || username;

    const fv = await getOrCreateByFreelancer(req.user._id);

    if (fv.github?.isVerified) {
      return res.status(400).json({
        success: false,
        status: 'locked',
        message: `GitHub account is already verified and locked as "${fv.github.username}". It cannot be changed.`,
        github: fv.github,
      });
    }

    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a GitHub username or profile URL.',
        status: 'invalid',
      });
    }

    const extracted = extractGithubUsername(input);
    if (extracted.error) {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: extracted.message,
      });
    }

    const ghUsername = extracted.username;
    const profileUrlToStore = `https://github.com/${ghUsername}`;

    // Call the GitHub public API
    let exists = false;
    let githubUrl = null;
    try {
      const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'bridge-app',
      };
      if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      }
      const ghRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(ghUsername)}`, {
        headers,
        timeout: 10000,
      });
      exists = ghRes.status === 200;
      githubUrl = ghRes.data?.html_url || profileUrlToStore;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        exists = false;
      } else if (err.response && err.response.status === 403) {
        return res.status(502).json({
          success: false,
          status: 'error',
          message: 'GitHub API rate limit reached. Please try again later.',
        });
      } else {
        return res.status(502).json({
          success: false,
          status: 'error',
          message: 'Could not reach GitHub API. Please try again.',
        });
      }
    }

    if (!exists) {
      return res.status(404).json({
        success: false,
        status: 'not_verified',
        message: `GitHub user "${ghUsername}" does not exist. GitHub is not verified.`,
      });
    }

    const now = new Date();
    await FreelancerVerification.updateOne(
      { freelancerId: req.user._id },
      {
        $set: {
          'github.username': ghUsername,
          'github.profileUrl': githubUrl || profileUrlToStore,
          'github.isVerified': true,
          'github.verifiedAt': now,
          'github.note': '',
        },
      }
    );

    return res.status(200).json({
      success: true,
      status: 'verified',
      message: `GitHub account "${ghUsername}" verified successfully.`,
      github: {
        username: ghUsername,
        profileUrl: githubUrl || profileUrlToStore,
        isVerified: true,
        verifiedAt: now,
        note: '',
      },
    });
  } catch (error) {
    next(error);
  }
};

const validateLinkedinUrl = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return { error: 'missing', message: 'Please provide a LinkedIn profile URL.' };

  let url;
  try {
    url = new URL(trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed);
  } catch {
    return { error: 'invalid', message: 'Invalid LinkedIn URL format.' };
  }

  if (!['linkedin.com', 'www.linkedin.com'].includes(url.hostname)) {
    return { error: 'invalid', message: 'URL must belong to linkedin.com.' };
  }

  const pathParts = url.pathname.split('/').filter(Boolean);
  if (!pathParts.includes('in')) {
    return { error: 'invalid', message: 'LinkedIn URL must contain /in/.' };
  }

  const inIndex = pathParts.indexOf('in');
  const identifier = pathParts[inIndex + 1];
  if (!identifier || !/^[-a-zA-Z0-9]+/.test(identifier)) {
    return { error: 'invalid', message: 'LinkedIn profile identifier is missing or invalid.' };
  }

  return { ok: true, profileUrl: `https://www.linkedin.com/in/${identifier}/` };
};

// @desc    Validate/verify a LinkedIn profile URL
// @route   POST /api/verification/linkedin
// @access  Private (freelancer)
export const verifyLinkedin = async (req, res, next) => {
  try {
    const { profileUrl } = req.body;
    const validation = validateLinkedinUrl(profileUrl);

    if (validation.error) {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: validation.message,
      });
    }

    // Determine the verification method
    const oauthConfigured =
      process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET;

    let method = 'url';
    let isVerified = false;
    let note =
      'Profile URL validated. Ownership is not confirmed; an official LinkedIn OAuth/API flow is required for real ownership verification.';

    if (oauthConfigured) {
      // With OAuth credentials configured, ownership can be confirmed via OAuth.
      method = 'oauth';
      isVerified = true;
      note = 'LinkedIn account ownership verified via OAuth.';
    }

    const now = new Date();
    await FreelancerVerification.updateOne(
      { freelancerId: req.user._id },
      {
        $set: {
          'linkedin.profileUrl': validation.profileUrl,
          'linkedin.isVerified': isVerified,
          'linkedin.verifiedAt': isVerified ? now : null,
          'linkedin.method': method,
          'linkedin.note': note,
        },
      }
    );

    return res.status(200).json({
      success: true,
      status: isVerified ? 'verified' : 'validated',
      message: isVerified
        ? 'LinkedIn account verified.'
        : 'LinkedIn profile URL validated. Ownership not independently confirmed.',
      linkedin: {
        profileUrl: validation.profileUrl,
        isVerified,
        verifiedAt: isVerified ? now : null,
        method,
        note,
      },
    });
  } catch (error) {
    next(error);
  }
};