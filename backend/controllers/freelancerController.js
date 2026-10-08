import FreelancerProfile from '../models/FreelancerProfile.js';
import StartupProfile from '../models/StartupProfile.js';
import Application, { normalizeApplicationStatus } from '../models/Application.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';

export const getMyFreelancerProfile = async (req, res, next) => {
  try {
    let profile = await FreelancerProfile.findOne({ userId: req.user._id });
    const user = await User.findById(req.user._id).select('name email role verification isVerified');

    if (!profile) {
      profile = await FreelancerProfile.create({
        userId: req.user._id,
        name: user.name,
        bio: '',
        domain: 'General Software',
        experience: '1-3 years',
        skills: [],
        interests: [],
        portfolio: '',
      });
    }

    return res.status(200).json({
      success: true,
      profile,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateFreelancerProfile = async (req, res, next) => {
  try {
    const {
      name,
      bio,
      domain,
      experience,
      skills,
      interests,
      portfolio,
      portfolioUrl,
      highestEducation,
      educationStatus,
      degree,
      branch,
      collegeUniversity,
      graduationYear,
      certifications,
      hourlyCharge,
      resumeVisible,
    } = req.body;

    if (name && name.trim()) {
      await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    }

    const profileFields = {
      userId: req.user._id,
      name: name || req.user.name,
      bio: bio || '',
      domain: domain || 'General Software',
      experience: experience || '1-3 years',
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      portfolio: portfolio || portfolioUrl || '',
      portfolioUrl: portfolioUrl || portfolio || '',
      highestEducation: highestEducation || '',
      educationStatus: educationStatus || '',
      degree: degree || '',
      branch: branch || '',
      collegeUniversity: collegeUniversity || '',
      graduationYear: Number(graduationYear) || null,
      certifications: Array.isArray(certifications) ? certifications.filter((c) => c && String(c).trim()) : [],
      hourlyCharge:
        hourlyCharge === '' || hourlyCharge === null || hourlyCharge === undefined
          ? null
          : Number(hourlyCharge),
      resumeVisible: resumeVisible !== undefined ? Boolean(resumeVisible) : true,
    };

    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Freelancer profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const applyToStartup = async (req, res, next) => {
  try {
    const { startupId } = req.params;
    const { role, message } = req.body;

    const startup = await StartupProfile.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup project not found.' });
    }

    // Check for existing application (either with or without hiringId)
    const existing = await Application.findOne({
      freelancerId: req.user._id,
      startupId: startup._id,
    });

    if (existing) {
      // Allow re-applying if previously withdrawn or rejected
      if (existing.status === 'withdrawn' || existing.status === 'rejected') {
        existing.status = 'submitted';
        existing.message = message || '';
        existing.hiringId = null;
        existing.resume = {
          url: '',
          publicId: '',
          fileName: '',
        };
        await existing.save();

        // Notify startup founder
        await createNotification({
          recipient: startup.userId,
          sender: req.user._id,
          type: 'application_received',
          title: 'New Freelancer Application',
          message: `${req.user.name} re-applied to ${startup.startupName}.`,
          relatedId: existing._id,
          relatedModel: 'Application',
          link: '/startup-dashboard/applications',
        });

        return res.status(200).json({
          success: true,
          message: 'Application submitted successfully!',
          application: existing,
        });
      }
      return res.status(400).json({ success: false, message: 'You have already applied to this startup.' });
    }

    const application = await Application.create({
      freelancerId: req.user._id,
      startupId: startup._id,
      hiringId: null,
      role: role || 'Contributor',
      message: message || '',
      status: 'submitted',
      resume: {
        url: '',
        publicId: '',
        fileName: '',
      },
    });

    // Notify startup founder
    await createNotification({
      recipient: startup.userId,
      sender: req.user._id,
      type: 'application_received',
      title: 'New Freelancer Application',
      message: `${req.user.name} applied to collaborate with ${startup.startupName}.`,
      relatedId: application._id,
      relatedModel: 'Application',
      link: '/startup-dashboard/applications',
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already applied to this startup.' });
    }
    next(error);
  }
};

// Deliberately NOT paginated. Both consumers (FreelancerDashBoard and
// StartupDetail) use the response as a complete per-startup status lookup to
// decide whether the "Apply" button should be shown, plus a total count.
// Returning one page would hide older applications and silently offer a second
// application for a startup the freelancer already applied to. Callers that
// want to browse a page of applications should use GET /applications/my,
// which is paginated.
export const getFreelancerApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ freelancerId: req.user._id })
      .select('-note')
      .populate('startupId', 'startupName name domain stage description')
      .populate('hiringId', 'jobTitle status salary employmentType workMode')
      .sort({ createdAt: -1, _id: 1 })
      .lean();

    const normalized = applications.map((app) => ({ ...app, status: normalizeApplicationStatus(app.status) }));

    return res.status(200).json({
      success: true,
      count: normalized.length,
      applications: normalized,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findOne({
      _id: applicationId,
      freelancerId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // If application was accepted, remove from startup team and connection
    if (application.status === 'selected' || application.engagementStage) {
      const startup = await StartupProfile.findById(application.startupId);
      if (startup) {
        startup.team = startup.team.filter(
          (m) => m.application?.toString() !== application._id.toString()
        );
        await startup.save();
      }
      // Also delete the connection
      await Connection.deleteOne({
        $or: [
          { requester: startup?.userId, recipient: application.freelancerId },
          { requester: application.freelancerId, recipient: startup?.userId },
        ],
      });
    }

    // Change status to withdrawn instead of deleting (allows re-apply)
    application.status = 'withdrawn';
    await application.save();

    return res.status(200).json({ success: true, message: 'Application withdrawn successfully. You can re-apply if needed.' });
  } catch (error) {
    next(error);
  }
};