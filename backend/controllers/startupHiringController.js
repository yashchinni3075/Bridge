import path from 'path';
import mongoose from 'mongoose';
import StartupHiring from '../models/StartupHiring.js';
import StartupProfile from '../models/StartupProfile.js';
import { uploadToCloudinary, deleteCloudinaryResource } from '../utils/cloudinaryService.js';

const sanitizeHiring = (doc) => {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return obj;
};

const getStartupProfile = async (userId) => {
  return await StartupProfile.findOne({ userId });
};

// @desc    Create a hiring opening
// @route   POST /api/startup-hiring
// @access  Private (Startup only)
export const createHiring = async (req, res, next) => {
  try {
    const {
      jobTitle,
      jobDescription,
      vacancies,
      salary,
      employmentType,
      workMode,
      location,
      experienceRequired,
      domain,
      requiredSkills,
      preferredSkills,
      closingDate,
      criteria,
      employeeCount,
      startupStage,
      industryDomain,
    } = req.body;

    if (!jobTitle || !jobTitle.trim()) {
      return res.status(400).json({ success: false, message: 'Job title is required.' });
    }

    const startupProfile = await getStartupProfile(req.user._id);
    if (!startupProfile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found. Please create a startup profile first.' });
    }

    const startupInfo = {
      startupName: startupProfile.startupName || '',
      description: startupProfile.description || '',
      industry: industryDomain || startupProfile.domain || '',
      stage: startupStage || startupProfile.stage || '',
      employeeCount: employeeCount || '',
      location: startupProfile.website ? '' : '',
      website: startupProfile.website || '',
      foundedYear: '',
    };

    const hiring = await StartupHiring.create({
      startupId: startupProfile._id,
      userId: req.user._id,
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription || '',
      vacancies: Number(vacancies) || 1,
      salary: {
        min: Number(salary?.min) || 0,
        max: Number(salary?.max) || 0,
        currency: salary?.currency || 'INR',
      },
      employmentType: employmentType || 'Full Time',
      workMode: workMode || 'On-site',
      location: location || '',
      experienceRequired: experienceRequired || '',
      domain: domain || '',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.filter(Boolean) : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills.filter(Boolean) : [],
      startupInfo,
      criteria: {
        minimumQualification: criteria?.minimumQualification || '',
        eligibleDegrees: Array.isArray(criteria?.eligibleDegrees) ? criteria.eligibleDegrees.filter(Boolean) : [],
        eligibleBranches: Array.isArray(criteria?.eligibleBranches) ? criteria.eligibleBranches.filter(Boolean) : [],
        minimumExperience: criteria?.minimumExperience || '',
        requiredSkills: Array.isArray(criteria?.requiredSkills) ? criteria.requiredSkills.filter(Boolean) : [],
        preferredSkills: Array.isArray(criteria?.preferredSkills) ? criteria.preferredSkills.filter(Boolean) : [],
        certifications: Array.isArray(criteria?.certifications) ? criteria.certifications.filter(Boolean) : [],
        additionalCriteria: criteria?.additionalCriteria || '',
      },
      status: 'open',
      closingDate: closingDate ? new Date(closingDate) : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Hiring opening created successfully.',
      hiring,
    });
  } catch (error) {
    console.error('Create hiring error:', error);
    next(error);
  }
};

// @desc    Get all hiring openings for the logged-in startup
// @route   GET /api/startup-hiring
// @access  Private (Startup only)
export const getMyHirings = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { jobTitle: { $regex: term, $options: 'i' } },
        { domain: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } },
      ];
    }

    const hirings = await StartupHiring.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: hirings.length,
      hirings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single hiring opening
// @route   GET /api/startup-hiring/:id
// @access  Private (Startup only)
export const getHiringById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hiring ID.' });
    }

    const hiring = await StartupHiring.findOne({ _id: id, userId: req.user._id }).lean();
    if (!hiring) {
      return res.status(404).json({ success: false, message: 'Hiring record not found or unauthorized.' });
    }

    return res.status(200).json({ success: true, hiring });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a hiring opening
// @route   PUT /api/startup-hiring/:id
// @access  Private (Startup only)
export const updateHiring = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hiring ID.' });
    }

    const hiring = await StartupHiring.findOne({ _id: id, userId: req.user._id });
    if (!hiring) {
      return res.status(404).json({ success: false, message: 'Hiring record not found or unauthorized.' });
    }

    const allowedUpdates = [
      'jobTitle', 'jobDescription', 'vacancies', 'salary',
      'employmentType', 'workMode', 'location', 'experienceRequired',
      'domain', 'requiredSkills', 'preferredSkills', 'status',
      'closingDate', 'criteria', 'employeeCount', 'startupStage',
      'industryDomain', 'applicationsCount',
    ];

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        if (field === 'salary' && typeof req.body[field] === 'object') {
          hiring.salary = {
            ...hiring.salary.toObject(),
            ...req.body[field],
          };
        } else if (field === 'criteria' && typeof req.body[field] === 'object') {
          hiring.criteria = {
            ...hiring.criteria.toObject(),
            ...req.body[field],
          };
        } else if (field === 'employeeCount') {
          hiring.startupInfo.employeeCount = req.body[field];
        } else if (field === 'startupStage') {
          hiring.startupInfo.stage = req.body[field];
        } else if (field === 'industryDomain') {
          hiring.startupInfo.industry = req.body[field];
          hiring.domain = req.body[field];
        } else {
          hiring[field] = req.body[field];
        }
      }
    }

    await hiring.save();

    return res.status(200).json({
      success: true,
      message: 'Hiring opening updated successfully.',
      hiring,
    });
  } catch (error) {
    console.error('Update hiring error:', error);
    next(error);
  }
};

// @desc    Delete a hiring opening
// @route   DELETE /api/startup-hiring/:id
// @access  Private (Startup only)
export const deleteHiring = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hiring ID.' });
    }

    const hiring = await StartupHiring.findOne({ _id: id, userId: req.user._id });
    if (!hiring) {
      return res.status(404).json({ success: false, message: 'Hiring record not found or unauthorized.' });
    }

    if (hiring.jobDescriptionPdf?.publicId) {
      try {
        await deleteCloudinaryResource(hiring.jobDescriptionPdf.publicId);
      } catch (err) {
        console.warn('Failed to delete PDF from Cloudinary:', err.message);
      }
    }

    await StartupHiring.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Hiring opening deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload/replace Job Description PDF for a hiring opening
// @route   POST /api/startup-hiring/:id/upload-pdf
// @access  Private (Startup only)
export const uploadJobDescriptionPdf = async (req, res, next) => {
  let uploadedPublicId = null;
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hiring ID.' });
    }

    const hiring = await StartupHiring.findOne({ _id: id, userId: req.user._id });
    if (!hiring) {
      return res.status(404).json({ success: false, message: 'Hiring record not found or unauthorized.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      return res.status(400).json({ success: false, message: 'Only PDF files are accepted.' });
    }

    if (hiring.jobDescriptionPdf?.publicId) {
      try {
        await deleteCloudinaryResource(hiring.jobDescriptionPdf.publicId);
      } catch (err) {
        console.warn('Old PDF deletion failed (non-fatal):', err.message);
      }
    }

    const customPublicId = `bridge/hiring_pdf/startup_${req.user._id}_hiring_${hiring._id}`;
    const uploadOptions = {
      folder: 'bridge/hiring_pdf',
      publicId: customPublicId,
      overwrite: true,
      invalidate: true,
    };

    const uploadResult = await uploadToCloudinary(req.file.buffer, uploadOptions, 'raw');
    uploadedPublicId = uploadResult.publicId;

    hiring.jobDescriptionPdf = {
      fileName: req.file.originalname,
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      uploadedAt: new Date(),
    };

    await hiring.save();

    return res.status(200).json({
      success: true,
      message: 'Job description PDF uploaded successfully.',
      jobDescriptionPdf: hiring.jobDescriptionPdf,
    });
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await deleteCloudinaryResource(uploadedPublicId);
      } catch (rbErr) {
        console.error('PDF rollback error:', rbErr.message);
      }
    }
    next(error);
  }
};

// @desc    Get startup info for pre-populating the hiring form
// @route   GET /api/startup-hiring/meta/startup-info
// @access  Private (Startup only)
export const getStartupInfoForHiring = async (req, res, next) => {
  try {
    const startupProfile = await getStartupProfile(req.user._id);
    if (!startupProfile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    return res.status(200).json({
      success: true,
      startupInfo: {
        startupName: startupProfile.startupName || '',
        description: startupProfile.description || '',
        industry: startupProfile.domain || '',
        stage: startupProfile.stage || '',
        website: startupProfile.website || '',
        location: '',
        foundedYear: '',
      },
    });
  } catch (error) {
    next(error);
  }
};
