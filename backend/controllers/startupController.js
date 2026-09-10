import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';
import StartupProfile from '../models/StartupProfile.js';
import StartupHiring from '../models/StartupHiring.js';
import Application from '../models/Application.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadToCloudinary, deleteCloudinaryResource } from '../utils/cloudinaryService.js';
import { evaluateStartupPitchWithAI } from '../services/aiPitchService.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const SENSITIVE_STARTUP_FIELDS = '-businessRegistrationDoc -verification -pitchDeckPublicId';

// Safe notification dispatch helper
const dispatchNotification = async ({ recipient, sender, type, title, message, relatedId }) => {
  try {
    if (recipient) {
      await Notification.create({
        recipient,
        sender: sender || null,
        type,
        title,
        message,
        relatedId: relatedId || null,
      });
    }
  } catch (err) {
    console.warn('Notification dispatch failure (non-fatal):', err.message);
  }
};

// Safe integer pagination helper
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Get current user's startup profile & verification status
// @route   GET /api/startups/profile/me
// @access  Private (Startup only)
export const getMyStartupProfile = async (req, res, next) => {
  try {
    let profile = await StartupProfile.findOne({ userId: req.user._id });
    const user = await User.findById(req.user._id).select('name email role verification isVerified');

    if (!profile) {
      profile = await StartupProfile.create({
        userId: req.user._id,
        startupName: `${user.name}'s Venture`,
        founderName: user.name,
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

// @desc    Create or update startup profile
// @route   POST /api/startups/profile
// @access  Private (Startup only)
export const createOrUpdateStartupProfile = async (req, res, next) => {
  try {
    const {
      startupName,
      founderName,
      founders,
      pitch,
      description,
      domain,
      stage,
      fundingRequirement,
      minimumFunding,
      maximumFunding,
      website,
      logo,
      progress,
      team,
    } = req.body;

    const profileFields = {
      userId: req.user._id,
      startupName: startupName?.trim() || req.body.startupName,
      founderName: founderName?.trim(),
      founders: Array.isArray(founders) ? founders : [],
      pitch: pitch || '',
      description: description || '',
      domain: domain || 'Technology',
      stage: stage || 'Early Stage',
      fundingRequirement: Number(fundingRequirement) || 0,
      minimumFunding: Number(minimumFunding) || 0,
      maximumFunding: Number(maximumFunding) || 0,
      website: website || '',
      logo: logo || '',
      progress: progress || { milestones: [], metrics: '', currentStatus: 'Building' },
      team: Array.isArray(team) ? team : [],
    };

    const profile = await StartupProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Startup profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MILESTONE MANAGEMENT ENDPOINTS
// ==========================================

// @desc    Create startup milestone
// @route   POST /api/startups/milestones
// @access  Private (Startup only)
export const createMilestone = async (req, res, next) => {
  try {
    const { title, description, state, targetDate } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Milestone title is required.' });
    }

    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    if (!profile.progress) {
      profile.progress = { milestones: [], metrics: '', currentStatus: 'Building MVP' };
    }
    if (!Array.isArray(profile.progress.milestones)) {
      profile.progress.milestones = [];
    }

    const newMilestone = {
      title: title.trim(),
      description: description ? description.trim() : '',
      state: state || 'planned',
      isVerified: false,
      targetDate: targetDate ? new Date(targetDate) : null,
      completedAt: state === 'completed' ? new Date() : null,
    };

    profile.progress.milestones.push(newMilestone);
    await profile.save();

    const created = profile.progress.milestones[profile.progress.milestones.length - 1];
    return res.status(201).json({
      success: true,
      message: 'Milestone created successfully.',
      milestone: created,
      milestones: profile.progress.milestones,
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    next(error);
  }
};

// @desc    Update startup milestone
// @route   PATCH /api/startups/milestones/:milestoneId
// @access  Private (Startup only)
export const updateMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const { title, description, state, targetDate } = req.body;

    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    const milestone = profile.progress.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found.' });
    }

    if (title !== undefined) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (targetDate !== undefined) milestone.targetDate = targetDate ? new Date(targetDate) : null;
    
    if (state !== undefined && milestone.state !== state) {
      milestone.state = state;
      milestone.completedAt = state === 'completed' ? new Date() : null;
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Milestone updated successfully.',
      milestone,
      milestones: profile.progress.milestones,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete startup milestone
// @route   DELETE /api/startups/milestones/:milestoneId
// @access  Private (Startup only)
export const removeMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const startup = await StartupProfile.findOne({ userId: req.user._id });
    
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    startup.progress.milestones = startup.progress.milestones.filter(
      (m) => m._id.toString() !== milestoneId
    );
    await startup.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Milestone deleted successfully', 
      milestones: startup.progress.milestones 
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload or replace Pitch Deck (PPT, PPTX, PDF) to Cloudinary and run AI Evaluation
// @route   POST /api/startups/pitch-deck
// @access  Private (Startup only)
export const uploadPitchDeck = async (req, res, next) => {
  let uploadedCloudinaryPublicId = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a pitch deck file (.ppt, .pptx, or .pdf)' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowed = ['.ppt', '.pptx', '.pdf'];
    if (!allowed.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only PPT, PPTX, and PDF presentations are accepted.',
      });
    }

    let profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await StartupProfile.create({
        userId: req.user._id,
        startupName: `${req.user.name}'s Venture`,
      });
    }

    // Enforce a unique deterministic public ID per startup to overwrite existing files instead of duplicating
    const customPublicId = `bridge/pitch_decks/startup_${req.user._id}`;
    const uploadOptions = {
      folder: 'bridge/pitch_decks',
      publicId: customPublicId,
      overwrite: true,
      invalidate: true,
    };

    // Upload to Cloudinary using buffer and override options
    const uploadResult = await uploadToCloudinary(req.file.buffer, uploadOptions, 'auto');
    uploadedCloudinaryPublicId = uploadResult.publicId;

    const pitchDeckUrl = uploadResult.url;
    const pitchDeckPublicId = uploadResult.publicId;
    const pitchDeckOriginalName = req.file.originalname;
    const pitchDeckUploadedAt = new Date();

    // Extract text from buffer if PDF for AI processing
    let extractedText = '';
    try {
      if (ext === '.pdf') {
        const parsedPdf = await pdfParse(req.file.buffer);
        extractedText = parsedPdf.text;
      } else {
        extractedText = `Presentation file name: ${req.file.originalname}. Description: ${profile.description || ''}`;
      }
    } catch (parseErr) {
      console.warn('Document buffer parsing warning:', parseErr.message);
      extractedText = `Pitch deck name: ${req.file.originalname}`;
    }

    // Run AI Evaluation immediately on upload
    let evaluationData = null;
    try {
      evaluationData = await evaluateStartupPitchWithAI(profile, extractedText);
    } catch (aiErr) {
      console.error('Automatic AI evaluation processing error:', aiErr.message);
    }

    // Force strict database persistence using findOneAndUpdate without strict validators first
    const updatedProfile = await StartupProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          pitchDeck: pitchDeckUrl,
          pitchDeckPublicId: pitchDeckPublicId,
          pitchDeckOriginalName: pitchDeckOriginalName,
          pitchDeckUploadedAt: pitchDeckUploadedAt,
          ...(evaluationData && { aiEvaluation: evaluationData }),
        },
      },
      { new: true } // Removed runValidators to expose if schema shape is the blocker
    );

    
    return res.status(200).json({
      success: true,
      message: 'Pitch deck uploaded, evaluated, and securely saved to database.',
      pitchDeckUrl: updatedProfile.pitchDeck,
      pitchDeckOriginalName: updatedProfile.pitchDeckOriginalName,
      evaluation: updatedProfile.aiEvaluation,
    });
  } catch (error) {
    if (uploadedCloudinaryPublicId) {
      try {
        await deleteCloudinaryResource(uploadedCloudinaryPublicId);
      } catch (rbErr) {
        console.error('Pitch deck rollback error:', rbErr.message);
      }
    }
    next(error);
  }
};

// Alias for uploadPitchDeck to maintain controller compatibility if referenced as uploadAndEvaluatePitch
export const uploadAndEvaluatePitch = uploadPitchDeck;

// @desc    Trigger AI Pitch Evaluation separately
// @route   POST /api/startups/evaluate-pitch
// @access  Private (Startup only)
export const evaluateStartupPitch = async (req, res, next) => {
  try {
    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    if (!profile.pitch && !profile.description && !profile.pitchDeck) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least a short pitch, description, or pitch deck before requesting AI evaluation.',
      });
    }

    const evaluation = await evaluateStartupPitchWithAI(profile);

    profile.aiEvaluation = evaluation;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'AI pitch evaluation completed successfully.',
      evaluation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'AI Pitch Evaluation encountered an error. Evaluation not recorded.',
    });
  }
};

// @desc    Get Startup Dashboard Analytics
// @route   GET /api/startups/dashboard/metrics
// @access  Private (Startup only)
export const getStartupDashboardMetrics = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name email role verification isVerified');
    const profile = await StartupProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(200).json({
        success: true,
        metrics: {
          verificationStatus: user.verification?.status || 'not_submitted',
          hasPitchDeck: false,
          pitchScore: null,
          applicationsCount: 0,
          connectionsCount: 0,
          teamCount: 0,
        },
      });
    }

    const [applicationsCount, connectionsCount] = await Promise.all([
      Application.countDocuments({ startupId: profile._id, status: { $ne: 'withdrawn' } }),
      Connection ? Connection.countDocuments({
        $or: [{ requester: req.user._id }, { recipient: req.user._id }, { recipient: profile._id }],
        status: 'accepted',
      }) : 0,
    ]);

    return res.status(200).json({
      success: true,
      profile,
      user,
      metrics: {
        verificationStatus: user.verification?.status || 'not_submitted',
        rejectionReason: user.verification?.rejectionReason || '',
        hasPitchDeck: Boolean(profile.pitchDeck),
        pitchDeckName: profile.pitchDeckOriginalName,
        pitchScore: profile.aiEvaluation?.overallScore ?? null,
        dimensions: profile.aiEvaluation?.dimensions ?? null,
        applicationsCount,
        connectionsCount,
        teamCount: (profile.team?.length || 0) + (profile.founders?.length || 0) + 1,
        progressStatus: profile.progress?.currentStatus || 'Building',
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PUBLIC / DISCOVERY ENDPOINTS
// ==========================================

// @desc    Get all public startups with applicant counts & filters
// @route   GET /api/startups
// @access  Public / Authenticated
export const getPublicStartups = async (req, res, next) => {
  try {
    const { domain, stage, search } = req.query;
    const query = {};

    if (domain && domain !== 'all') {
      query.domain = { $regex: domain, $options: 'i' };
    }
    if (stage && stage !== 'all') {
      query.stage = stage;
    }
    if (search) {
      query.$or = [
        { startupName: { $regex: search, $options: 'i' } },
        { pitch: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const startups = await StartupProfile.find(query)
      .select(SENSITIVE_STARTUP_FIELDS)
      .populate('userId', 'name email isVerified')
      .lean();

    const startupIds = startups.map((s) => s._id);
    const appCounts = await Application.aggregate([
      { $match: { startupId: { $in: startupIds }, status: { $ne: 'withdrawn' } } },
      { $group: { _id: '$startupId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    appCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    // Enrich each startup with its open hiring opportunities (breakdown of roles being hired for)
    const hirings = await StartupHiring.find({
      startupId: { $in: startupIds },
      status: 'open',
    })
      .select(
        'jobTitle jobDescription vacancies salary employmentType workMode location experienceRequired domain requiredSkills preferredSkills status'
      )
      .lean();

    const hiringMap = {};
    hirings.forEach((h) => {
      const sid = h.startupId?.toString();
      if (!sid) return;
      if (!hiringMap[sid]) hiringMap[sid] = [];
      hiringMap[sid].push({
        _id: h._id,
        jobTitle: h.jobTitle || '',
        jobDescription: h.jobDescription || '',
        vacancies: h.vacancies || 0,
        salary: h.salary || { min: 0, max: 0, currency: 'INR' },
        employmentType: h.employmentType || 'Full Time',
        workMode: h.workMode || 'On-site',
        location: h.location || '',
        experienceRequired: h.experienceRequired || '',
        domain: h.domain || '',
        requiredSkills: h.requiredSkills || [],
        preferredSkills: h.preferredSkills || [],
        status: h.status || 'open',
      });
    });

    const enrichedStartups = startups.map((s) => ({
      ...s,
      applicantCount: countMap[s._id.toString()] || 0,
      hirings: hiringMap[s._id.toString()] || [],
    }));

    return res.status(200).json({
      success: true,
      count: enrichedStartups.length,
      startups: enrichedStartups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public startup details by ID
// @route   GET /api/startups/:id
// @access  Public / Authenticated
export const getStartupDetails = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid startup ID' });
    }

    const startup = await StartupProfile.findById(req.params.id)
      .select(SENSITIVE_STARTUP_FIELDS)
      .populate('userId', 'name email isVerified')
      .lean();

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' });
    }

    const applicantCount = await Application.countDocuments({
      startupId: startup._id,
      status: { $ne: 'withdrawn' },
    });

    return res.status(200).json({
      success: true,
      startup: {
        ...startup,
        applicantCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SEARCH STARTUPS & PROFILES
// ==========================================

export const searchStartupsForFreelancers = async (req, res, next) => {
  try {
    const { search, domain, skill, stage, minFunding, maxFunding } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { startupName: { $regex: term, $options: 'i' } },
        { pitch: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    if (domain && domain !== 'all') {
      filter.domain = { $regex: domain.trim(), $options: 'i' };
    }

    if (stage && stage !== 'all') {
      filter.stage = stage.trim();
    }

    if (skill && skill.trim()) {
      const skillRegex = { $regex: skill.trim(), $options: 'i' };
      filter.$or = filter.$or
        ? [{ $and: [{ $or: filter.$or }, { $or: [{ description: skillRegex }, { pitch: skillRegex }] }] }]
        : [{ description: skillRegex }, { pitch: skillRegex }];
    }

    if (minFunding && !isNaN(Number(minFunding))) {
      filter.maximumFunding = { $gte: Number(minFunding) };
    }

    if (maxFunding && !isNaN(Number(maxFunding))) {
      filter.minimumFunding = { $lte: Number(maxFunding) };
    }

    const [total, startups] = await Promise.all([
      StartupProfile.countDocuments(filter),
      StartupProfile.find(filter)
        .select(SENSITIVE_STARTUP_FIELDS)
        .populate('userId', 'name email isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const startupIds = startups.map((s) => s._id);
    const appCounts = await Application.aggregate([
      { $match: { startupId: { $in: startupIds }, status: { $ne: 'withdrawn' } } },
      { $group: { _id: '$startupId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    appCounts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const enriched = startups.map((s) => ({
      ...s,
      applicantCount: countMap[s._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      results: enriched,
    });
  } catch (error) {
    next(error);
  }
};

export const searchStartupsForInvestors = async (req, res, next) => {
  try {
    const { search, domain, industry, stage, minFunding, maxFunding, verifiedMilestonesOnly } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { startupName: { $regex: term, $options: 'i' } },
        { pitch: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    const targetDomain = domain || industry;
    if (targetDomain && targetDomain !== 'all') {
      filter.domain = { $regex: targetDomain.trim(), $options: 'i' };
    }

    if (stage && stage !== 'all') {
      filter.stage = stage.trim();
    }

    if (minFunding && !isNaN(Number(minFunding))) {
      filter.maximumFunding = { $gte: Number(minFunding) };
    }

    if (maxFunding && !isNaN(Number(maxFunding))) {
      filter.minimumFunding = { $lte: Number(maxFunding) };
    }

    if (verifiedMilestonesOnly === 'true') {
      filter['progress.milestones.isVerified'] = true;
    }

    const [total, startups] = await Promise.all([
      StartupProfile.countDocuments(filter),
      StartupProfile.find(filter)
        .select(SENSITIVE_STARTUP_FIELDS)
        .populate('userId', 'name email isVerified')
        .sort({ 'aiEvaluation.overallScore': -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      results: startups,
    });
  } catch (error) {
    next(error);
  }
};

export const searchFreelancersForStartups = async (req, res, next) => {
  try {
    const { search, domain, skill, experience, interest } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { bio: { $regex: term, $options: 'i' } },
        { domain: { $regex: term, $options: 'i' } },
      ];
    }

    if (domain && domain !== 'all') {
      filter.domain = { $regex: domain.trim(), $options: 'i' };
    }

    if (skill && skill.trim()) {
      filter.skills = { $in: [new RegExp(skill.trim(), 'i')] };
    }

    if (interest && interest.trim()) {
      filter.interests = { $in: [new RegExp(interest.trim(), 'i')] };
    }

    if (experience && experience !== 'all') {
      filter.experience = { $regex: experience.trim(), $options: 'i' };
    }

    const [total, freelancers] = await Promise.all([
      FreelancerProfile.countDocuments(filter),
      FreelancerProfile.find(filter)
        .populate('userId', 'name email isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      results: freelancers,
    });
  } catch (error) {
    next(error);
  }
};

export const searchInvestorsForStartups = async (req, res, next) => {
  try {
    const { search, domain, stage, minCheck, maxCheck } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {};

    if (search && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { bio: { $regex: term, $options: 'i' } },
        { experience: { $regex: term, $options: 'i' } },
      ];
    }

    if (domain && domain !== 'all') {
      filter.preferredDomains = { $in: [new RegExp(domain.trim(), 'i')] };
    }

    if (stage && stage !== 'all') {
      filter['investmentPreferences.stages'] = { $in: [new RegExp(stage.trim(), 'i')] };
    }

    if (minCheck && !isNaN(Number(minCheck))) {
      filter['investmentPreferences.maxCheckSize'] = { $gte: Number(minCheck) };
    }

    if (maxCheck && !isNaN(Number(maxCheck))) {
      filter['investmentPreferences.minCheckSize'] = { $lte: Number(maxCheck) };
    }

    const [total, investors] = await Promise.all([
      InvestorProfile.countDocuments(filter),
      InvestorProfile.find(filter)
        .populate('userId', 'name email isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      results: investors,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STARTUP APPLICATION & TEAM COLLABORATION
// ==========================================

export const getStartupApplications = async (req, res, next) => {
  try {
    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    // 1. Fetch Freelancer Applications
    const applications = await Application.find({ startupId: startup._id })
      .populate('freelancerId', 'name email profileImage verification.status')
      .populate('hiringId', 'jobTitle jobDescription requiredSkills salary employmentType workMode')
      .sort({ createdAt: -1 })
      .lean();

    const freelancerUserIds = applications.map((a) => a.freelancerId?._id).filter(Boolean);
    const profiles = await FreelancerProfile.find({ userId: { $in: freelancerUserIds } }).lean();

    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.userId.toString()] = p;
    });

    const enrichedApplications = applications.map((app) => ({
      _id: app._id,
      type: 'freelancer_application',
      name: app.freelancerId?.name || 'Freelancer',
      email: app.freelancerId?.email || '',
      role: app.hiringId?.jobTitle || profileMap[app.freelancerId?._id?.toString()]?.domain || 'Contributor',
      status: app.status,
      createdAt: app.createdAt,
      resume: app.resume || { url: '', fileName: '' },
      hiring: app.hiringId || null,
      message: app.message || '',
      freelancerProfile: profileMap[app.freelancerId?._id?.toString()] || null,
    }));

    // 2. Fetch Investor Connections (matching both user ID and profile ID)
    const investorConnections = await Connection.find({
      recipient: { $in: [req.user._id, startup._id] },
    })
      .populate('requester', 'name email firmName')
      .sort({ createdAt: -1 })
      .lean();

    const enrichedConnections = investorConnections.map((conn) => ({
      _id: conn._id,
      type: 'investor_connection',
      name: conn.requester?.name || 'Investor',
      email: conn.requester?.email || '',
      role: conn.requester?.firmName ? `${conn.requester.firmName} Investor` : 'Investor / Partner',
      status: conn.status === 'pending' ? 'pending' : conn.status,
      createdAt: conn.createdAt,
    }));

    const combinedList = [...enrichedConnections, ...enrichedApplications];

    return res.status(200).json({
      success: true,
      count: combinedList.length,
      applications: combinedList,
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'accepted', 'rejected', or 'pending'",
      });
    }

    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    // 1. Check if it's an Investor Connection Request
    const connection = await Connection.findOne({
      _id: applicationId,
      recipient: { $in: [req.user._id, startup._id] },
    });

    if (connection) {
      connection.status = status;
      await connection.save();

      return res.status(200).json({ success: true, message: `Connection request marked as ${status}` });
    }

    // 2. Otherwise treat as Freelancer Application
    const application = await Application.findOne({
      _id: applicationId,
      startupId: startup._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized to review',
      });
    }

    application.status = status;
    await application.save();

    const freelancerUser = await User.findById(application.freelancerId).select('name email');
    const fProfile = await FreelancerProfile.findOne({ userId: application.freelancerId });

    if (status === 'accepted') {
      const alreadyInTeam = startup.team.some(
        (member) => member.application?.toString() === application._id.toString() ||
                    member.name === freelancerUser?.name
      );

      if (!alreadyInTeam) {
        startup.team.push({
          name: freelancerUser?.name || 'Contributor',
          role: fProfile?.domain || 'Technical Contributor',
          experience: fProfile?.experience || '1-3 years',
          application: application._id,
        });
        await startup.save();
      }
    } else {
      startup.team = startup.team.filter(
        (m) => m.application?.toString() !== application._id.toString()
      );
      await startup.save();
    }

    return res.status(200).json({
      success: true,
      message: `Application marked as ${status}`,
      application,
      team: startup.team,
    });
  } catch (error) {
    next(error);
  }
};

export const getStartupTeam = async (req, res, next) => {
  try {
    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    return res.status(200).json({
      success: true,
      founders: startup.founders || [],
      team: startup.team || [],
      totalCount: (startup.team?.length || 0) + (startup.founders?.length || 0) + 1,
    });
  } catch (error) {
    next(error);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const { memberIndex } = req.params;
    const idx = parseInt(memberIndex, 10);

    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    if (isNaN(idx) || idx < 0 || idx >= startup.team.length) {
      return res.status(400).json({ success: false, message: 'Invalid team member index' });
    }

    const removed = startup.team.splice(idx, 1)[0];
    await startup.save();

    return res.status(200).json({
      success: true,
      message: `Team member ${removed.name} removed successfully`,
      team: startup.team,
    });
  } catch (error) {
    next(error);
  }
};