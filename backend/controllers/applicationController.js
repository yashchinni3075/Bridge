import mongoose from 'mongoose';
import Application, { normalizeApplicationStatus } from '../models/Application.js';
import StartupProfile from '../models/StartupProfile.js';
import StartupHiring from '../models/StartupHiring.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import { createNotification } from '../services/notificationService.js';
import { parsePagination, paginateQuery } from '../utils/pagination.js';

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

    // When a specific hiring post is chosen, verify it exists, belongs to this
    // startup, and is still accepting applications.
    let hiring = null;
    if (hiringId) {
      if (!mongoose.Types.ObjectId.isValid(hiringId)) {
        return res.status(400).json({ success: false, message: 'Invalid hiring ID' });
      }
      hiring = await StartupHiring.findOne({ _id: hiringId, startupId: startup._id });
      if (!hiring) {
        return res.status(400).json({ success: false, message: 'This job posting does not belong to this startup' });
      }
      if (hiring.status === 'closed' || hiring.status === 'draft') {
        return res.status(400).json({ success: false, message: 'This position is no longer accepting applications' });
      }
    }

    // Duplicate prevention is per hiring post (falling back to a startup-level
    // application when no hiring post is chosen).
    const dupQuery = hiringId
      ? { freelancerId: freelancerUserId, hiringId }
      : { freelancerId: freelancerUserId, startupId, hiringId: null };

    const existing = await Application.findOne(dupQuery);

    if (existing) {
      // Allow re-applying if previously withdrawn OR rejected
      if (existing.status === 'withdrawn' || existing.status === 'rejected') {
        // If applying to same hiring, allow re-apply
        // If applying to different hiring, check for active application on that hiring
        if (hiringId && existing.hiringId && existing.hiringId.toString() !== hiringId.toString()) {
          const anotherActive = await Application.findOne({
            freelancerId: freelancerUserId,
            hiringId,
            status: { $ne: 'withdrawn', $ne: 'rejected' },
          });
          if (anotherActive) {
            return res.status(400).json({
              success: false,
              message: 'You have already applied to this position. Duplicate applications are not allowed.',
            });
          }
        }
        existing.status = 'submitted';
        existing.message = message || '';
        existing.hiringId = hiringId || existing.hiringId || null;
        existing.resume = {
          url: resumeUrl,
          publicId: resumePublicId || '',
          fileName: resumeFileName || '',
        };
        await existing.save();

        // Re-applying after withdrawal is a fresh submission
        if (hiringId && hiring) {
          await StartupHiring.updateOne(
            { _id: hiring._id },
            { $inc: { applicationsCount: 1 } }
          ).catch(() => {});
        }

        await createNotification({
          recipient: startup.userId,
          sender: freelancerUserId,
          type: 'application_received',
          title: 'New Freelancer Application',
          message: `${req.user.name} re-applied to ${startup.startupName}.`,
          relatedId: existing._id,
          relatedModel: 'Application',
          link: '/startup-dashboard/applications',
        });

        return res.status(200).json({
          success: true,
          message: 'Application submitted successfully',
          application: existing,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You have already applied to this position. Duplicate applications are not allowed.',
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
      status: 'submitted',
    });

    // Track application count on the hiring post (non-fatal on failure)
    if (hiringId && hiring) {
      await StartupHiring.updateOne(
        { _id: hiring._id },
        { $inc: { applicationsCount: 1 } }
      ).catch(() => {});
    }

    // Notify startup founder
    await createNotification({
      recipient: startup.userId,
      sender: freelancerUserId,
      type: 'application_received',
      title: 'New Freelancer Application',
      message: `${req.user.name} applied to collaborate with ${startup.startupName}.`,
      relatedId: application._id,
      relatedModel: 'Application',
      link: '/startup-dashboard/applications',
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
// @route   GET /api/applications/my?page=&limit=
// @access  Private (Freelancer)
export const getMyApplications = async (req, res, next) => {
  try {
    const filter = { freelancerId: req.user._id };
    const buildQuery = () =>
      Application.find(filter)
        .select('-note')
        .populate('startupId', 'startupName domain stage fundingRequirement pitchDeck logo founderName')
        .populate('hiringId', 'jobTitle jobDescription requiredSkills salary employmentType workMode status')
        .sort({ createdAt: -1, _id: 1 });

    const { rows: applications, total, meta } = await paginateQuery(
      buildQuery(),
      buildQuery(),
      parsePagination(req.query)
    );

    const normalized = applications.map((app) => {
      const doc = app.toObject();
      return { ...doc, status: normalizeApplicationStatus(doc.status) };
    });

    return res.status(200).json({
      success: true,
      count: total,
      applications: normalized,
      pagination: meta,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get application status for multiple startups (batch check)
// @route   POST /api/applications/status/startups
// @access  Private (Freelancer)
export const getApplicationStatusForStartups = async (req, res, next) => {
  try {
    const { startupIds } = req.body;
    if (!Array.isArray(startupIds) || startupIds.length === 0) {
      return res.status(200).json({ success: true, statuses: {} });
    }

    const validIds = startupIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(200).json({ success: true, statuses: {} });
    }

    const applications = await Application.find({
      freelancerId: req.user._id,
      startupId: { $in: validIds },
    }).select('startupId status hiringId');

    const statuses = {};
    for (const app of applications) {
      const sid = app.startupId.toString();
      // Keep the most recent active application per startup
      if (!statuses[sid] || app.status === 'submitted' || app.status === 'under_review') {
        statuses[sid] = app.status;
      }
    }

    return res.status(200).json({ success: true, statuses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get application status for multiple hirings (batch check)
// @route   POST /api/applications/status/hirings
// @access  Private (Freelancer)
export const getApplicationStatusForHirings = async (req, res, next) => {
  try {
    const { hiringIds } = req.body;
    if (!Array.isArray(hiringIds) || hiringIds.length === 0) {
      return res.status(200).json({ success: true, statuses: {} });
    }

    const validIds = hiringIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(200).json({ success: true, statuses: {} });
    }

    const applications = await Application.find({
      freelancerId: req.user._id,
      hiringId: { $in: validIds },
    }).select('hiringId status startupId');

    const statuses = {};
    for (const app of applications) {
      const hid = app.hiringId.toString();
      if (!statuses[hid]) {
        statuses[hid] = app.status;
      }
    }

    return res.status(200).json({ success: true, statuses });
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

    // Decrement the hiring post application count (non-fatal on failure)
    if (application.hiringId) {
      await StartupHiring.updateOne(
        { _id: application.hiringId },
        { $inc: { applicationsCount: -1 } }
      ).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};