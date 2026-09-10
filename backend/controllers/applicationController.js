import mongoose from 'mongoose';
import Application from '../models/Application.js';
import StartupProfile from '../models/StartupProfile.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import Notification from '../models/Notification.js';

// Helper to safely send notifications if Notification model is active
const dispatchNotification = async ({ recipient, sender, type, title, message, relatedId }) => {
  try {
    if (recipient) {
      await Notification.create({
        recipient,
        sender,
        type,
        title,
        message,
        relatedId,
      });
    }
  } catch (err) {
    console.warn('Notification dispatch non-fatal failure:', err.message);
  }
};

// @desc    Apply to a startup
// @route   POST /api/applications/:startupId
// @access  Private (Verified Freelancers only)
export const applyToStartup = async (req, res, next) => {
  try {
    const { startupId } = req.params;
    const { message, resumeUrl, resumePublicId, resumeFileName, hiringId } = req.body;
    const freelancerUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      return res.status(400).json({ success: false, message: 'Invalid startup ID' });
    }

    // Resume submission is compulsory
    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Resume submission is compulsory. Please upload your resume before applying.',
      });
    }

    const startup = await StartupProfile.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    // Disallow applying to own startup
    if (startup.userId && startup.userId.toString() === freelancerUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot apply to your own startup' });
    }

    // Check existing applications
    const existing = await Application.findOne({
      freelancerId: freelancerUserId,
      startupId,
    });

    if (existing) {
      if (existing.status === 'withdrawn') {
        // Allow re-applying if previously withdrawn
        existing.status = 'pending';
        existing.message = message || '';
        existing.hiringId = hiringId || existing.hiringId || null;
        existing.resume = {
          url: resumeUrl,
          publicId: resumePublicId || '',
          fileName: resumeFileName || '',
        };
        await existing.save();

        await dispatchNotification({
          recipient: startup.userId,
          sender: freelancerUserId,
          type: 'application_received',
          title: 'New Freelancer Application',
          message: `${req.user.name} re-applied to ${startup.startupName}.`,
          relatedId: existing._id,
        });

        return res.status(200).json({
          success: true,
          message: 'Application submitted successfully',
          application: existing,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You have already applied to this startup. Duplicate applications are not allowed.',
      });
    }

    const application = await Application.create({
      freelancerId: freelancerUserId,
      startupId,
      hiringId: hiringId || null,
      message: message || '',
      resume: {
        url: resumeUrl,
        publicId: resumePublicId || '',
        fileName: resumeFileName || '',
      },
      status: 'pending',
    });

    // Notify startup founder
    await dispatchNotification({
      recipient: startup.userId,
      sender: freelancerUserId,
      type: 'application_received',
      title: 'New Freelancer Application',
      message: `${req.user.name} applied to collaborate with ${startup.startupName}.`,
      relatedId: application._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this startup.',
      });
    }
    next(error);
  }
};

// @desc    Get current freelancer's applications
// @route   GET /api/applications/my
// @access  Private (Freelancer)
export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ freelancerId: req.user._id })
      .populate('startupId', 'startupName domain stage fundingRequirement pitchDeck logo founderName')
      .populate('hiringId', 'jobTitle jobDescription requiredSkills salary employmentType workMode status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw an application
// @route   PATCH /api/applications/:id/withdraw
// @access  Private (Freelancer)
export const withdrawApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const application = await Application.findOne({
      _id: id,
      freelancerId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: 'Application is already withdrawn' });
    }

    application.status = 'withdrawn';
    await application.save();

    // If previously accepted, remove from startup team
    await StartupProfile.updateOne(
      { _id: application.startupId },
      { $pull: { team: { application: application._id } } }
    );

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};