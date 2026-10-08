import path from 'path';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import StartupProfile from '../models/StartupProfile.js';
import StartupHiring from '../models/StartupHiring.js';
import FundingOpportunity from '../models/FundingOpportunity.js';
import Application, { normalizeApplicationStatus } from '../models/Application.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import Connection, { CONNECTION_STATUSES, normalizeConnectionStatus } from '../models/Connection.js';
import User from '../models/User.js';
import PitchEvaluation from '../models/PitchEvaluation.js';
import { uploadToCloudinary, deleteCloudinaryResource } from '../utils/cloudinaryService.js';
import { evaluatePitchForStartup } from '../services/aiPitchService.js';
import { extractPdfText } from '../services/pdfTextService.js';
import { createNotification } from '../services/notificationService.js';
import { parsePagination, buildPaginationMeta, escapeRegex } from '../utils/pagination.js';

const SENSITIVE_STARTUP_FIELDS = '-businessRegistrationDoc -verification -pitchDeckPublicId -pitchDeckText';

// Shared pagination helper (see utils/pagination.js). Capped at 50 because a
// page of 50 rich startup cards is already unusable in the UI.
const getPagination = (query) => parsePagination(query, { maxLimit: 50 });

// ==========================================
// STARTUP PROFILE VALIDATION & COMPLETION
// ==========================================

const STARTUP_STAGES = ['Idea', 'MVP', 'Early Stage', 'Growth', 'Scaling'];
const URL_LENGTH_LIMIT = 300;

const cleanText = (value, fieldName, { max = 500, required = false } = {}) => {
  if (value === undefined || value === null) {
    if (required) return { ok: false, message: `${fieldName} is required.` };
    return { ok: true, value: '' };
  }
  if (typeof value !== 'string') return { ok: false, message: `${fieldName} must be a string.` };
  const cleaned = value.trim();
  if (required && !cleaned) return { ok: false, message: `${fieldName} is required.` };
  if (cleaned.length > max) return { ok: false, message: `${fieldName} cannot exceed ${max} characters.` };
  return { ok: true, value: cleaned };
};

const parseNonNegativeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return { ok: true, value: 0 };
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num) || num < 0) {
    return { ok: false, message: `${fieldName} must be a non-negative number.` };
  }
  return { ok: true, value: Math.round(num) };
};

const normalizeHttpUrl = (value, fieldName) => {
  if (value === undefined || value === null) return { ok: true, value: '' };
  if (typeof value !== 'string') return { ok: false, message: `${fieldName} must be a string.` };
  const cleaned = value.trim();
  if (!cleaned) return { ok: true, value: '' };
  if (cleaned.length > URL_LENGTH_LIMIT) return { ok: false, message: `${fieldName} cannot exceed ${URL_LENGTH_LIMIT} characters.` };
  let candidate = cleaned;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const url = new URL(candidate);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')) {
      return { ok: true, value: candidate };
    }
  } catch (err) {
    /* fall through to invalid */
  }
  return { ok: false, message: `${fieldName} must be a valid URL (e.g. https://example.com).` };
};

const cleanStringArray = (value, fieldName, { maxItems = 100, maxItemLen = 100 } = {}) => {
  if (value === undefined || value === null) return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, message: `${fieldName} must be an array.` };
  const seen = new Set();
  const cleaned = [];
  for (const item of value) {
    if (item === undefined || item === null) continue;
    if (typeof item !== 'string') return { ok: false, message: `${fieldName} must be an array of strings.` };
    const entry = item.trim();
    if (!entry) continue;
    if (entry.length > maxItemLen) return { ok: false, message: `${fieldName} entries cannot exceed ${maxItemLen} characters.` };
    const key = entry.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(entry);
    }
  }
  if (cleaned.length > maxItems) return { ok: false, message: `${fieldName} cannot contain more than ${maxItems} entries.` };
  return { ok: true, value: cleaned };
};

const cleanTeam = (value) => {
  if (value === undefined || value === null) return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, message: 'Team must be an array of member objects.' };
  const cleaned = [];
  for (const member of value) {
    if (!member || typeof member !== 'object') continue;
    const name = cleanText(member.name, 'Team member name', { max: 100 });
    if (!name.ok) return { ok: false, message: name.message };
    if (!name.value) continue;
    const role = cleanText(member.role, 'Team member role', { max: 100 });
    const experience = cleanText(member.experience, 'Team member experience', { max: 200 });
    if (!role.ok) return { ok: false, message: role.message };
    if (!experience.ok) return { ok: false, message: experience.message };
    cleaned.push({ name: name.value, role: role.value, experience: experience.value });
  }
  if (cleaned.length > 50) return { ok: false, message: 'Team cannot contain more than 50 members.' };
  return { ok: true, value: cleaned };
};

const cleanSocialLinks = (value) => {
  if (value === undefined || value === null) return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, message: 'Social links must be an array.' };
  const cleaned = [];
  for (const link of value) {
    if (!link || typeof link !== 'object') continue;
    const label = cleanText(link.label, 'Social link label', { max: 50 });
    if (!label.ok) return { ok: false, message: label.message };
    const url = normalizeHttpUrl(link.url, 'Social link URL');
    if (!url.ok) return { ok: false, message: url.message };
    if (url.value) cleaned.push({ label: label.value || 'Link', url: url.value });
  }
  if (cleaned.length > 20) return { ok: false, message: 'Social links cannot contain more than 20 entries.' };
  return { ok: true, value: cleaned };
};

// Weighted, deterministic profile-completion score. Each category counts only once and
// only when it holds real data (trimmed text or a non-empty array). Weights sum to 100.
const COMPLETION_WEIGHTS = {
  startupName: 10,
  founderName: 10,
  pitch: 8,
  description: 10,
  domain: 8,
  stage: 5,
  fundingRequirement: 8,
  location: 8,
  website: 8,
  linkedin: 5,
  github: 3,
  traction: 8,
  team: 4,
  teamSkills: 2,
  requiredSkills: 2,
  openRoles: 1,
};

export const computeStartupProfileCompletion = (profile) => {
  const data = profile?._doc ? profile._doc : profile || {};
  const hasText = (v) => typeof v === 'string' && v.trim().length > 0;
  const hasArr = (v) => Array.isArray(v) && v.length > 0;
  let score = 0;
  if (hasText(data.startupName)) score += COMPLETION_WEIGHTS.startupName;
  if (hasText(data.founderName)) score += COMPLETION_WEIGHTS.founderName;
  if (hasText(data.pitch)) score += COMPLETION_WEIGHTS.pitch;
  if (hasText(data.description)) score += COMPLETION_WEIGHTS.description;
  if (hasText(data.domain)) score += COMPLETION_WEIGHTS.domain;
  if (hasText(data.stage)) score += COMPLETION_WEIGHTS.stage;
  if (Number(data.fundingRequirement) > 0) score += COMPLETION_WEIGHTS.fundingRequirement;
  if (hasText(data.location)) score += COMPLETION_WEIGHTS.location;
  if (hasText(data.website)) score += COMPLETION_WEIGHTS.website;
  if (hasText(data.linkedin)) score += COMPLETION_WEIGHTS.linkedin;
  if (hasText(data.github)) score += COMPLETION_WEIGHTS.github;
  if (hasText(data.traction)) score += COMPLETION_WEIGHTS.traction;
  if (hasArr(data.team)) score += COMPLETION_WEIGHTS.team;
  if (hasArr(data.teamSkills)) score += COMPLETION_WEIGHTS.teamSkills;
  if (hasArr(data.requiredSkills)) score += COMPLETION_WEIGHTS.requiredSkills;
  if (hasArr(data.openRoles)) score += COMPLETION_WEIGHTS.openRoles;
  return Math.min(100, Math.max(0, Math.round(score)));
};

// Lazy, idempotent migration: maps a legacy `fundingRequired` value onto the canonical
// `fundingRequirement` field (only when the canonical field is still empty/zero) and then
// removes the legacy field so later writes always target the single canonical field.
const migrateLegacyFunding = async (profile) => {
  if (!profile || !profile._id) return profile;
  // Legacy fields are not on the schema; Mongoose hides them from direct property
  // access, so read the raw stored document (`_doc`) to detect them.
  const doc = profile._doc ? profile._doc : profile;
  const canonical = Number(doc.fundingRequirement) || 0;
  const legacy = Number(doc.fundingRequired) || 0;
  if (canonical === 0 && legacy > 0) {
    profile.fundingRequirement = legacy;
    // Bypass Mongoose update casting: it silently drops the `$unset` for paths
    // that are absent from the schema. Run the migration on the raw collection.
    await StartupProfile.collection.updateOne(
      { _id: profile._id },
      { $set: { fundingRequirement: legacy }, $unset: { fundingRequired: '' } }
    );
  }
  return profile;
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
        startupName: `${user?.name || 'Founder'}'s Venture`,
        founderName: user?.name || '',
        domain: 'Technology',
        stage: 'Early Stage',
      });
    } else {
      profile = await migrateLegacyFunding(profile);
      // Normalize fields that may be missing on older documents (read-side only).
      profile.founders = Array.isArray(profile.founders) ? profile.founders : [];
      profile.team = Array.isArray(profile.team) ? profile.team : [];
      profile.teamSkills = Array.isArray(profile.teamSkills) ? profile.teamSkills : [];
      profile.requiredSkills = Array.isArray(profile.requiredSkills) ? profile.requiredSkills : [];
      profile.openRoles = Array.isArray(profile.openRoles) ? profile.openRoles : [];
      profile.socialLinks = Array.isArray(profile.socialLinks) ? profile.socialLinks : [];
      profile.pitch = profile.pitch || '';
      profile.description = profile.description || '';
      profile.domain = profile.domain || '';
      profile.stage = profile.stage || 'Early Stage';
      profile.website = profile.website || '';
      profile.location = profile.location || '';
      profile.phone = profile.phone || '';
      profile.linkedin = profile.linkedin || '';
      profile.github = profile.github || '';
      profile.traction = profile.traction || '';
    }

    if (!profile.progress) profile.progress = { milestones: [], metrics: '', currentStatus: 'Building' };
    if (!Array.isArray(profile.progress.milestones)) profile.progress.milestones = [];

    const profileCompletion = computeStartupProfileCompletion(profile);

    return res.status(200).json({
      success: true,
      profile,
      profileCompletion,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update startup profile
// @route   POST /api/startups/profile | PUT /api/startups/profile
// @access  Private (Startup only)
export const createOrUpdateStartupProfile = async (req, res, next) => {
  try {
    const {
      startupName,
      founderName,
      phone,
      pitch,
      description,
      domain,
      stage,
      fundingRequirement,
      minimumFunding,
      maximumFunding,
      location,
      website,
      linkedin,
      github,
      traction,
      logo,
      team,
      teamSkills,
      requiredSkills,
      openRoles,
      socialLinks,
    } = req.body;

    // --- Text fields ---
    const name = cleanText(startupName, 'Startup name', { required: true, max: 150 });
    if (!name.ok) return res.status(400).json({ success: false, message: name.message });
    const founder = cleanText(founderName, 'Founder name', { max: 100 });
    if (!founder.ok) return res.status(400).json({ success: false, message: founder.message });
    const phoneField = cleanText(phone, 'Phone', { max: 30 });
    const tagline = cleanText(pitch, 'Tagline', { max: 300 });
    const desc = cleanText(description, 'Description', { max: 2000 });
    const industry = cleanText(domain, 'Industry/domain', { max: 100 });
    const city = cleanText(location, 'Location', { max: 100 });
    const metricsField = cleanText(traction, 'Key metrics/traction', { max: 2000 });
    const logoField = cleanText(logo, 'Logo URL', { max: URL_LENGTH_LIMIT });
    const textResults = [phoneField, tagline, desc, industry, city, metricsField, logoField];
    const firstTextError = textResults.find((r) => !r.ok);
    if (firstTextError) return res.status(400).json({ success: false, message: firstTextError.message });

    // --- Stage ---
    const finalStage =
      stage === undefined || stage === null || stage === '' ? 'Early Stage' : String(stage).trim();
    if (!STARTUP_STAGES.includes(finalStage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid stage. Allowed values: ${STARTUP_STAGES.join(', ')}.`,
      });
    }

    // --- Funding ---
    const funding = parseNonNegativeNumber(fundingRequirement, 'Funding requirement');
    const minFunding = parseNonNegativeNumber(minimumFunding, 'Minimum funding');
    const maxFunding = parseNonNegativeNumber(maximumFunding, 'Maximum funding');
    const firstFundingError = [funding, minFunding, maxFunding].find((r) => !r.ok);
    if (firstFundingError) return res.status(400).json({ success: false, message: firstFundingError.message });

    // --- URLs (validated only when provided) ---
    const websiteUrl = normalizeHttpUrl(website, 'Website URL');
    const linkedinUrl = normalizeHttpUrl(linkedin, 'LinkedIn URL');
    const githubUrl = normalizeHttpUrl(github, 'GitHub URL');
    const firstUrlError = [websiteUrl, linkedinUrl, githubUrl].find((r) => !r.ok);
    if (firstUrlError) return res.status(400).json({ success: false, message: firstUrlError.message });

    // --- Arrays ---
    const members = cleanTeam(team);
    const teamSkillsList = cleanStringArray(teamSkills, 'Existing team skills');
    const requiredSkillsList = cleanStringArray(requiredSkills, 'Required skills');
    const openRolesList = cleanStringArray(openRoles, 'Open roles', { maxItems: 50, maxItemLen: 100 });
    const links = cleanSocialLinks(socialLinks);
    const firstArrayError = [members, teamSkillsList, requiredSkillsList, openRolesList, links].find((r) => !r.ok);
    if (firstArrayError) return res.status(400).json({ success: false, message: firstArrayError.message });

    // --- Build update (never touches `progress`, preserving milestones) ---
    const updateData = {
      startupName: name.value,
      founderName: founder.value || req.user?.name || 'Founder',
      phone: phoneField.value,
      pitch: tagline.value,
      description: desc.value,
      domain: industry.value || 'Technology',
      stage: finalStage,
      fundingRequirement: funding.value,
      minimumFunding: minFunding.value,
      maximumFunding: maxFunding.value,
      location: city.value,
      website: websiteUrl.value,
      linkedin: linkedinUrl.value,
      github: githubUrl.value,
      traction: metricsField.value,
      logo: logoField.value,
      team: members.value,
      teamSkills: teamSkillsList.value,
      requiredSkills: requiredSkillsList.value,
      openRoles: openRolesList.value,
      socialLinks: links.value,
    };

    const profile = await StartupProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    const profileCompletion = computeStartupProfileCompletion(profile);

    return res.status(200).json({
      success: true,
      message: 'Startup profile updated successfully.',
      profile,
      profileCompletion,
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join('; '),
      });
    }
    if (error?.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'One or more fields contain invalid values.' });
    }
    next(error);
  }
};

// REST-style alias so PUT /api/startups/profile and POST /api/startups/profile share
// exactly the same behaviour (single canonical write endpoint).
export const updateStartupProfile = createOrUpdateStartupProfile;

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

    // Extract real text from the deck buffer when supported (text-based PDF).
    // PPT/PPTX extraction is not available, so those decks are stored without
    // text; they will not be claim-evaluated (honest behavior).
    let extractedText = '';
    let deckTextExtractable = false;
    try {
      if (ext === '.pdf') {
        const extraction = await extractPdfText(req.file.buffer);
        extractedText = extraction.text;
        deckTextExtractable = extraction.extractable;
      } else {
        extractedText = '';
        deckTextExtractable = false;
      }
    } catch (parseErr) {
      console.warn('Pitch deck text extraction warning:', parseErr.message);
      extractedText = '';
      deckTextExtractable = false;
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
          pitchDeckText: extractedText,
        },
      },
      { new: true } // Removed runValidators to expose if schema shape is the blocker
    );

    // Run an AI evaluation immediately ONLY when real deck text was extracted.
    // The evaluation must run against the UPDATED profile so the service can
    // read pitchDeck + pitchDeckText. If the evaluation service is unavailable,
    // the upload still succeeds.
    let evaluationData = null;
    if (deckTextExtractable) {
      try {
        evaluationData = await evaluatePitchForStartup({
          startupProfile: updatedProfile,
          inputSource: 'PITCH_DECK',
          pitchText: '',
        });
      } catch (aiErr) {
        console.warn('Automatic pitch deck evaluation skipped:', aiErr.message);
      }
    }

    const uploadMessage = evaluationData
      ? 'Pitch deck uploaded and evaluated successfully.'
      : deckTextExtractable
        ? 'Pitch deck uploaded and saved, but automatic AI evaluation could not be completed. Click "Evaluate Uploaded Deck" to retry.'
        : 'Pitch deck uploaded and saved. Text extraction is supported for PDF decks only, so AI evaluation was not run.';

    return res.status(200).json({
      success: true,
      message: uploadMessage,
      pitchDeckUrl: updatedProfile.pitchDeck,
      pitchDeckOriginalName: updatedProfile.pitchDeckOriginalName,
      evaluation: evaluationData ? evaluationData.toObject() : null,
      evaluationAvailable: deckTextExtractable,
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

// @desc    Trigger AI Pitch Evaluation separately (manual text or uploaded deck)
// @route   POST /api/startups/evaluate-pitch
// @access  Private (Startup only)
export const evaluateStartupPitch = async (req, res, next) => {
  try {
    const profile = await StartupProfile.findOne({ userId: req.user._id });
    const inputSource = req.body?.inputSource === 'PITCH_DECK' ? 'PITCH_DECK' : 'MANUAL_TEXT';

    const evaluation = await evaluatePitchForStartup({
      startupProfile: profile,
      inputSource,
      pitchText: req.body?.pitchText,
    });

    return res.status(201).json({
      success: true,
      message: 'AI pitch evaluation completed successfully.',
      evaluation,
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status >= 500) console.error('AI pitch evaluation error:', error?.message || error);
    return res.status(status).json({
      success: false,
      message: error?.message || 'AI pitch evaluation encountered an error. Evaluation not recorded.',
    });
  }
};

// @desc    Get the current startup's pitch evaluation history (newest first)
// @route   GET /api/startups/pitch-evaluations
// @access  Private (Startup only)
export const getPitchEvaluations = async (req, res, next) => {
  try {
    const profile = await StartupProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    const { page, skip, limit } = getPagination(req.query);
    const filter = { startupProfileId: profile._id };

    const [total, evaluations] = await Promise.all([
      PitchEvaluation.countDocuments(filter),
      PitchEvaluation.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: evaluations.length,
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      evaluations,
    });
  } catch (error) {
    next(error);
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

    const [applicationsCount, connectionsCount, latestEvaluation] = await Promise.all([
      Application.countDocuments({ startupId: profile._id, status: { $ne: 'withdrawn' } }),
      Connection ? Connection.countDocuments({
        $or: [{ requester: req.user._id }, { recipient: req.user._id }, { recipient: profile._id }],
        status: 'accepted',
      }) : 0,
      PitchEvaluation.findOne({ startupProfileId: profile._id }).sort({ createdAt: -1 }).lean(),
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
        pitchScore: latestEvaluation?.overallScore ?? profile.aiEvaluation?.overallScore ?? null,
        dimensions: latestEvaluation?.scores ?? profile.aiEvaluation?.dimensions ?? null,
        evaluationSource: latestEvaluation?.inputSource ?? null,
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

    // Every user-supplied regex is escaped - a bare "(" or "[" is otherwise a
    // hard 500 from Mongo, not an empty result.
    if (domain && domain !== 'all') {
      query.domain = { $regex: escapeRegex(domain), $options: 'i' };
    }
    if (stage && stage !== 'all') {
      query.stage = stage;
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { startupName: { $regex: safeSearch, $options: 'i' } },
        { pitch: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const total = await StartupProfile.countDocuments(query);

    // Page first, enrich after - the applicant/hiring/funding lookups below are
    // all keyed off the page's ids, so running them on the full collection would
    // be wasted work.
    const { page, limit, skip } = getPagination(req.query);
    const startups = await StartupProfile.find(query)
      .select(SENSITIVE_STARTUP_FIELDS)
      .populate('userId', 'name email isVerified')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
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

    // Check for active funding opportunities (status: 'open') per startup
    const fundingOpps = await FundingOpportunity.find({
      startupId: { $in: startupIds },
      status: 'open',
    })
      .select('startupId')
      .lean();

    const fundingSet = new Set(fundingOpps.map((f) => f.startupId?.toString()));

    const enrichedStartups = startups.map((s) => ({
      ...s,
      applicantCount: countMap[s._id.toString()] || 0,
      hirings: hiringMap[s._id.toString()] || [],
      hasActiveHiring: hiringMap[s._id.toString()]?.length > 0,
      hasActiveFunding: fundingSet.has(s._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      // Total matching rows, not the length of this page - pre-existing contract.
      count: total,
      startups: enrichedStartups,
      pagination: buildPaginationMeta({ page, limit, total }),
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

    // Optional `type` filter. The UI renders this feed as two independent tabs
    // (freelancer applications / investor connections), so each tab needs its own
    // coherent total and page - filtering the merged page client-side would both
    // misreport the badge count and hide rows that live on later pages.
    const typeFilter = req.query.type === 'freelancer_application' || req.query.type === 'investor_connection'
      ? req.query.type
      : null;

    const combinedList = typeFilter === 'freelancer_application'
      ? enrichedApplications
      : typeFilter === 'investor_connection'
        ? enrichedConnections
        : [...enrichedConnections, ...enrichedApplications];

    // Two collections are merged into one feed, so the page has to be cut from
    // the combined list rather than pushed down to either query - otherwise a
    // page could contain rows from only one of them.
    combinedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const { page, limit, skip } = getPagination(req.query);
    const paged = combinedList.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      count: combinedList.length,
      applications: paged,
      pagination: buildPaginationMeta({ page, limit, total: combinedList.length }),
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    // 1. Investor Connection branch (legacy statuses only)
    const connection = await Connection.findOne({
      _id: applicationId,
      recipient: { $in: [req.user._id, startup._id] },
    });

    if (connection) {
      // Tolerate legacy client values (e.g. 'selected') plus casing/whitespace
      const normalizedStatus = normalizeConnectionStatus(status);
      if (!CONNECTION_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Connection status must be one of 'pending', 'accepted', or 'rejected'",
        });
      }
      const previousConnectionStatus = connection.status;
      connection.status = normalizedStatus;
      await connection.save();

      // Notify the investor on accept/decline. This endpoint (PATCH
      // /startups/applications/:id) is the only path the startup dashboard uses
      // to respond to an investor connection, so without this the investor is
      // never told their request was declined. respondToConnectionRequest does
      // send notifications, but nothing in the startup dashboard calls it.
      if (normalizedStatus !== previousConnectionStatus) {
        // Whichever side is not the startup is the investor.
        const startupSide = new Set(
          [startup.userId?.toString(), req.user._id.toString(), startup._id.toString()].filter(Boolean),
        );
        const requesterId = connection.requester?._id?.toString() ?? connection.requester?.toString();
        const recipientId = connection.recipient?._id?.toString() ?? connection.recipient?.toString();
        const investorId = startupSide.has(requesterId) ? recipientId : requesterId;

        if (investorId) {
          const startupName = startup.startupName || req.user.name || 'The startup';

          if (normalizedStatus === 'accepted') {
            await createNotification({
              recipient: investorId,
              sender: req.user._id,
              type: 'connection_accepted',
              title: 'Connection Accepted',
              message: `${startupName} accepted your connection request.`,
              relatedId: connection._id,
              relatedModel: 'Connection',
              link: '/investor-dashboard/connections',
            });
          } else if (normalizedStatus === 'rejected') {
            const reasonMsg = rejectionReason ? ` Reason: ${rejectionReason}` : '';
            await createNotification({
              recipient: investorId,
              sender: req.user._id,
              type: 'connection_rejected',
              title: 'Connection Declined',
              message: `${startupName} declined your connection request.${reasonMsg}`,
              relatedId: connection._id,
              relatedModel: 'Connection',
              link: '/investor-dashboard/connections',
            });
          }
        }
      }

      return res.status(200).json({ success: true, message: `Connection request marked as ${normalizedStatus}` });
    }

    // 2. Otherwise treat as Freelancer Application
    if (
      !['submitted', 'under_review', 'shortlisted', 'interview', 'skill_test', 'selected', 'rejected', 'accepted', 'pending'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application status',
      });
    }

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

    const previousStatus = application.status;

    application.status = normalizeApplicationStatus(status);
    
    // Store rejection reason if provided
    if (rejectionReason && application.status === 'rejected') {
      application.rejectionReason = rejectionReason;
    }
    
    await application.save();

    const freelancerUser = await User.findById(application.freelancerId).select('name email');
    const fProfile = await FreelancerProfile.findOne({ userId: application.freelancerId });

    // Create Connection when application is accepted (for BOTH general and job applications)
    const isAccepted = application.status === 'selected' || status === 'accepted';
    if (isAccepted) {
      application.engagementStage = 'accepted';
      application.engagementStartedAt = new Date();
      await application.save();

      // Create or update Connection between startup and freelancer
      const existingConnection = await Connection.findOne({
        $or: [
          { requester: startup.userId, recipient: application.freelancerId },
          { requester: application.freelancerId, recipient: startup.userId },
        ],
      });

      if (!existingConnection) {
        await Connection.create({
          requester: startup.userId,
          recipient: application.freelancerId,
          requesterRole: 'startup',
          recipientRole: 'freelancer',
          connectionType: 'startup_freelancer',
          status: 'accepted',
          note: `Connected via application: ${fProfile?.domain || 'Collaboration'}`,
        });
      } else if (existingConnection.status !== 'accepted') {
        existingConnection.status = 'accepted';
        await existingConnection.save();
      }

      // Notify freelancer about connection
      await createNotification({
        recipient: application.freelancerId,
        sender: startup.userId,
        type: 'connection_accepted',
        title: 'Connection Established',
        message: `${startup.startupName} accepted your application and you are now connected!`,
        relatedId: application._id,
        relatedModel: 'Application',
        link: '/freelancer-dashboard',
      });
    } else if (application.status === 'rejected' && previousStatus !== 'rejected') {
      // Remove connection if application is rejected
      await Connection.deleteOne({
        $or: [
          { requester: startup.userId, recipient: application.freelancerId },
          { requester: application.freelancerId, recipient: startup.userId },
        ],
      });

      // Delete resume from Cloudinary if exists
      if (application.resume?.publicId) {
        try {
          await deleteCloudinaryResource(application.resume.publicId);
        } catch (cloudErr) {
          console.error('[updateApplicationStatus] Cloudinary delete error:', cloudErr.message);
        }
      }

      // Notify freelancer about rejection with reason
      const hiringTitle = (await StartupHiring.findById(application.hiringId).select('jobTitle').lean().catch(() => null)) || null;
      const jobTitle = hiringTitle?.jobTitle || 'the position';
      const reasonMsg = rejectionReason ? ` Reason: ${rejectionReason}` : '';
      await createNotification({
        recipient: application.freelancerId,
        sender: startup.userId,
        type: 'application_rejected',
        title: 'Application Declined',
        message: `Your application for ${jobTitle} was declined.${reasonMsg}`,
        relatedId: application._id,
        relatedModel: 'Application',
        link: '/freelancer-dashboard',
      });
    }

    if (isAccepted) {
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

// @desc    Stream applicant resume PDF through backend proxy (inline display)
  // @route   GET /api/startups/applicants/:applicationId/resume/view
  // @access  Private (Startup only)
  export const viewApplicantResume = async (req, res, next) => {
    try {
      const { applicationId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        return res.status(400).json({ success: false, message: 'Invalid application ID' });
      }

      const application = await Application.findById(applicationId).lean();
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      // Verify the requesting user owns the startup that received this application
      const startup = await StartupProfile.findOne({ userId: req.user._id });
      if (!startup) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this resume' });
      }
      if (startup._id.toString() !== application.startupId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this resume' });
      }

      const resumeUrl = application.resume?.url;
      if (!resumeUrl) {
        return res.status(404).json({ success: false, message: 'No resume found for this application' });
      }

      // Fetch the PDF from Cloudinary and stream it with proper inline headers
      const response = await axios.get(resumeUrl, { 
        responseType: 'stream',
        timeout: 30000,
      });

      const contentType = response.headers['content-type'] || '';

      // If Cloudinary returns an error page (HTML) instead of PDF, handle it
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        console.error('[viewApplicantResume] Cloudinary returned error page instead of PDF');
        return res.status(502).json({ 
          success: false, 
          message: 'Resume file is corrupted or not accessible on storage. Please re-upload.' 
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(application.resume.fileName || 'resume.pdf')}"`);
      res.setHeader('Cache-Control', 'private, max-age=300');
      response.data.pipe(res);
    } catch (error) {
      console.error('[viewApplicantResume] Error:', error);
      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({ success: false, message: 'Request timeout while fetching resume' });
      }
      if (error.response?.status === 404) {
        return res.status(404).json({ success: false, message: 'Resume file not found on storage' });
      }
      if (error.response?.status === 403) {
        return res.status(403).json({ success: false, message: 'Access denied to resume file' });
      }
      next(error);
    }
  };

// ==========================================
// STARTUP APPLICANT MANAGEMENT (JOB MODULE)
// ==========================================

// Allowed forward transitions for job applications.
const APPLICANT_TRANSITIONS = {
  submitted: ['under_review', 'shortlisted', 'interview', 'skill_test', 'selected', 'rejected'],
  under_review: ['shortlisted', 'interview', 'skill_test', 'selected', 'rejected'],
  shortlisted: ['interview', 'skill_test', 'selected', 'rejected'],
  interview: ['skill_test', 'selected', 'rejected'],
  skill_test: ['selected', 'rejected'],
};

// Notification type + copy used when a startup updates an applicant's status.
const APPLICANT_STATUS_NOTIFICATIONS = {
  under_review: {
    type: 'application_under_review',
    message: (job) => `Your application for ${job} is now under review.`,
  },
  shortlisted: {
    type: 'application_shortlisted',
    message: (job) => `Your application for ${job} has been shortlisted.`,
  },
  interview: {
    type: 'application_interview',
    message: (job) => `You have been selected for an interview for ${job}.`,
  },
  skill_test: {
    type: 'application_skill_test',
    message: (job) => `You are invited to take a skill test for ${job}.`,
  },
  selected: {
    type: 'application_selected',
    message: (job) => `Congratulations! Your application for ${job} has been selected.`,
  },
  rejected: {
    type: 'application_rejected',
    message: (job) => `Your application for ${job} was not selected for this opportunity.`,
  },
};

const serializeApplicant = (app, profile) => {
  const user = app.freelancerId || {};
  const hiring = app.hiringId || null;
  return {
    _id: app._id,
    name: user.name || '',
    email: user.email || '',
    profileImage: user.profileImage || '',
    verificationStatus: user.verification?.status || (user.isVerified ? 'approved' : 'not_submitted'),
    freelancerProfile: profile
      ? {
          domain: profile.domain || '',
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          experience: profile.experience || '',
          hourlyCharge: profile.hourlyCharge ?? null,
          bio: profile.bio || '',
          interests: Array.isArray(profile.interests) ? profile.interests : [],
          portfolio: profile.portfolio || '',
          highestEducation: profile.highestEducation || '',
          degree: profile.degree || '',
          collegeUniversity: profile.collegeUniversity || '',
          graduationYear: profile.graduationYear || null,
          certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        }
      : null,
    hiring: hiring
      ? {
          _id: hiring._id,
          jobTitle: hiring.jobTitle,
          jobDescription: hiring.jobDescription,
          requiredSkills: Array.isArray(hiring.requiredSkills) ? hiring.requiredSkills : [],
          salary: hiring.salary,
          employmentType: hiring.employmentType,
          workMode: hiring.workMode,
          status: hiring.status,
        }
      : null,
    message: app.message || '',
    resume: app.resume || { url: '', publicId: '', fileName: '' },
    note: app.note || '',
    status: normalizeApplicationStatus(app.status),
    engagementStage: app.engagementStage || null,
    engagementStartedAt: app.engagementStartedAt || null,
    engagementCompletedAt: app.engagementCompletedAt || null,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };
};

export const getStartupApplicants = async (req, res, next) => {
  try {
    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    const { hiringId, status, search } = req.query;
    const filter = { startupId: startup._id };

    if (hiringId) {
      if (!mongoose.Types.ObjectId.isValid(hiringId)) {
        return res.status(400).json({ success: false, message: 'Invalid hiring ID' });
      }
      filter.hiringId = hiringId;
    }
    if (status && status !== 'all') {
      filter.status = normalizeApplicationStatus(String(status));
    }

    const { page, skip, limit } = getPagination(req.query);

    // The free-text search below spans the freelancer's name/email, the hiring
    // title and fields on FreelancerProfile, so it cannot be expressed as one
    // Mongo query. Without a search term (the common case) the page is pushed
    // down to the database, so this never loads the full applicant history;
    // with a search term we must filter in memory first, then slice.
    const isSearching = Boolean(search && String(search).trim());

    const baseQuery = () =>
      Application.find(filter)
        .populate('freelancerId', 'name email profileImage isVerified verification.status')
        .populate('hiringId', 'jobTitle jobDescription requiredSkills salary employmentType workMode')
        .sort({ createdAt: -1, _id: 1 });

    const profileMapFor = async (rows) => {
      const ids = rows.map((a) => a.freelancerId?._id).filter(Boolean);
      const profiles = ids.length ? await FreelancerProfile.find({ userId: { $in: ids } }).lean() : [];
      const map = {};
      profiles.forEach((p) => {
        map[p.userId.toString()] = p;
      });
      return map;
    };

    let applicants;
    let total;

    if (isSearching) {
      const applications = await baseQuery().lean();
      const profileMap = await profileMapFor(applications);

      let searched = applications.map((app) =>
        serializeApplicant(app, profileMap[app.freelancerId?._id?.toString()] || null)
      );

      const q = String(search).trim().toLowerCase();
      searched = searched.filter((a) => {
        const haystack = [
          a.name,
          a.email,
          a.hiring?.jobTitle,
          a.freelancerProfile?.domain,
          ...(a.freelancerProfile?.skills || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });

      total = searched.length;
      applicants = searched.slice(skip, skip + limit);
    } else {
      const [rows, count] = await Promise.all([
        baseQuery().skip(skip).limit(limit).lean(),
        Application.countDocuments(filter),
      ]);
      const profileMap = await profileMapFor(rows);

      total = count;
      applicants = rows.map((app) =>
        serializeApplicant(app, profileMap[app.freelancerId?._id?.toString()] || null)
      );
    }

    return res.status(200).json({
      success: true,
      count: total,
      pagination: buildPaginationMeta({ page, limit, total }),
      applicants,
    });
  } catch (error) {
    next(error);
  }
};

export const getStartupApplicantDetail = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    const application = await Application.findOne({
      _id: applicationId,
      startupId: startup._id,
    })
      .populate('freelancerId', 'name email profileImage isVerified verification.status')
      .populate('hiringId', 'jobTitle jobDescription requiredSkills salary employmentType workMode status')
      .lean();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized to review' });
    }

    const profile = await FreelancerProfile.findOne({ userId: application.freelancerId?._id }).lean();

    return res.status(200).json({
      success: true,
      applicant: serializeApplicant(application, profile || null),
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplicantStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    const application = await Application.findOne({
      _id: applicationId,
      startupId: startup._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized to review' });
    }

    // Client must never set the owner/startup/freelancer/hiring references
    if (req.body.startupId || req.body.freelancerId || req.body.hiringId || req.body.ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Ownership and reference fields cannot be changed via this endpoint',
      });
    }

    const currentStatus = normalizeApplicationStatus(application.status);

    if (note !== undefined) {
      if (typeof note !== 'string') {
        return res.status(400).json({ success: false, message: 'Note must be a string' });
      }
      application.note = note.trim().slice(0, 1000);
    }

    if (!status || typeof status !== 'string') {
      if (application.isModified('note')) await application.save();
      return res.status(200).json({
        success: true,
        message: 'Application updated',
        application,
        noteSaved: true,
      });
    }

    const targetStatus = normalizeApplicationStatus(status);

    if (currentStatus === targetStatus) {
      if (application.isModified('note')) await application.save();
      const noopEnriched = await Application.findOne({ _id: application._id })
        .populate('freelancerId', 'name email profileImage isVerified verification.status')
        .populate('hiringId', 'jobTitle jobDescription requiredSkills salary employmentType workMode status')
        .lean();
      const noopProfile = await FreelancerProfile.findOne({ userId: application.freelancerId }).lean();
      return res.status(200).json({
        success: true,
        message: 'Application status unchanged',
        applicant: serializeApplicant(noopEnriched, noopProfile || null),
      });
    }

    const allowedNext = APPLICANT_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move an application from ${currentStatus} to ${targetStatus}`,
      });
    }

    application.status = targetStatus;

    const freelancerUser = await User.findById(application.freelancerId).select('name email');
    const fProfile = await FreelancerProfile.findOne({ userId: application.freelancerId });

    // When application is accepted (selected), create Connection and set engagement stage
    if (targetStatus === 'selected') {
      application.engagementStage = 'accepted';
      application.engagementStartedAt = new Date();

      // Create or update Connection between startup and freelancer
      const existingConnection = await Connection.findOne({
        $or: [
          { requester: startup.userId, recipient: application.freelancerId },
          { requester: application.freelancerId, recipient: startup.userId },
        ],
      });

      if (!existingConnection) {
        await Connection.create({
          requester: startup.userId,
          recipient: application.freelancerId,
          requesterRole: 'startup',
          recipientRole: 'freelancer',
          connectionType: 'startup_freelancer',
          status: 'accepted',
          note: `Connected via job application: ${fProfile?.domain || 'Collaboration'}`,
        });
      } else if (existingConnection.status !== 'accepted') {
        existingConnection.status = 'accepted';
        await existingConnection.save();
      }

      // Add to startup team
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

    await application.save();

    // Notify the freelancer about their status change
    const hiringTitle =
      (await StartupHiring.findById(application.hiringId).select('jobTitle').lean().catch(() => null)) ||
      null;
    const jobTitle = hiringTitle?.jobTitle || 'the position';
    const notification = APPLICANT_STATUS_NOTIFICATIONS[targetStatus];
    if (notification) {
      await createNotification({
        recipient: application.freelancerId,
        sender: startup.userId,
        type: notification.type,
        title: 'Application Status Updated',
        message: notification.message(jobTitle),
        relatedId: application._id,
        relatedModel: 'Application',
        link: '/freelancer-dashboard',
      });
    }

    // Also notify about connection if created
    if (targetStatus === 'selected') {
      await createNotification({
        recipient: application.freelancerId,
        sender: startup.userId,
        type: 'connection_accepted',
        title: 'Connection Established',
        message: `${startup.startupName} accepted your application and you are now connected!`,
        relatedId: application._id,
        relatedModel: 'Application',
        link: '/freelancer-dashboard',
      });
    }

    const enriched = await Application.findOne({ _id: application._id })
      .populate('freelancerId', 'name email profileImage isVerified verification.status')
      .populate('hiringId', 'jobTitle status')
      .lean();
    const profile = await FreelancerProfile.findOne({ userId: application.freelancerId }).lean();

    return res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      applicant: serializeApplicant(enriched, profile || null),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Connection already exists between these users' });
    }
    next(error);
  }
};

// @desc    Update engagement stage for accepted freelancer application
// @route   PATCH /api/startups/applicants/:applicationId/engagement
// @access  Private (Startup owner)
export const updateEngagementStage = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { engagementStage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const validStages = ['accepted', 'onboarding', 'active', 'completed'];
    if (!validStages.includes(engagementStage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid engagement stage. Must be one of: ${validStages.join(', ')}`,
      });
    }

    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    const application = await Application.findOne({
      _id: applicationId,
      startupId: startup._id,
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized to update' });
    }

    // Only allow engagement stage updates for accepted/selected applications
    const normalizedStatus = normalizeApplicationStatus(application.status);
    if (normalizedStatus !== 'selected') {
      return res.status(400).json({
        success: false,
        message: 'Engagement stage can only be updated for accepted (selected) applications',
      });
    }

    // Prevent moving backward in engagement stages (optional business rule)
    const stageOrder = { accepted: 1, onboarding: 2, active: 3, completed: 4 };
    const currentStage = application.engagementStage || 'accepted';
    if (stageOrder[engagementStage] < stageOrder[currentStage]) {
      return res.status(400).json({
        success: false,
        message: `Cannot move engagement stage backward from ${currentStage} to ${engagementStage}`,
      });
    }

    const previousStage = application.engagementStage;
    application.engagementStage = engagementStage;

    if (engagementStage === 'onboarding' && !application.engagementStartedAt) {
      application.engagementStartedAt = new Date();
    }
    if (engagementStage === 'completed') {
      application.engagementCompletedAt = new Date();
    }

    await application.save();

    // Notify freelancer about engagement stage change
    const stageMessages = {
      onboarding: `Your collaboration with ${startup.startupName} has moved to onboarding.`,
      active: `Your collaboration with ${startup.startupName} is now active.`,
      completed: `Your collaboration with ${startup.startupName} has been marked as completed.`,
    };

    await createNotification({
      recipient: application.freelancerId,
      sender: startup.userId,
      type: 'general',
      title: 'Engagement Stage Updated',
      message: stageMessages[engagementStage] || `Your engagement stage has been updated to ${engagementStage}.`,
      relatedId: application._id,
      relatedModel: 'Application',
      link: '/freelancer-dashboard',
    });

    const enriched = await Application.findOne({ _id: application._id })
      .populate('freelancerId', 'name email profileImage isVerified verification.status')
      .populate('hiringId', 'jobTitle status')
      .lean();
    const fProfile = await FreelancerProfile.findOne({ userId: application.freelancerId }).lean();

    return res.status(200).json({
      success: true,
      message: `Engagement stage updated to ${engagementStage}`,
      applicant: serializeApplicant(enriched, fProfile || null),
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