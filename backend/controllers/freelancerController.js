import FreelancerProfile from '../models/FreelancerProfile.js';
import StartupProfile from '../models/StartupProfile.js';
import Application from '../models/Application.js';
import User from '../models/User.js';

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
    const { role } = req.body;

    const startup = await StartupProfile.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup project not found.' });
    }

    const existing = await Application.findOne({
      freelancerId: req.user._id,
      startupId: startup._id,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this startup.' });
    }

    const application = await Application.create({
      freelancerId: req.user._id,
      startupId: startup._id,
      role: role || 'Contributor',
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application,
    });
  } catch (error) {
    next(error);
  }
};

export const getFreelancerApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ freelancerId: req.user._id })
      .populate('startupId', 'startupName name domain stage description')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findOneAndDelete({
      _id: applicationId,
      freelancerId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    return res.status(200).json({ success: true, message: 'Application cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};