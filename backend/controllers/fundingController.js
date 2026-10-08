import mongoose from 'mongoose';
import FundingOpportunity from '../models/FundingOpportunity.js';
import FundingInterest from '../models/FundingInterest.js';
import StartupProfile from '../models/StartupProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import { createNotification } from '../services/notificationService.js';
import { parsePagination, buildPaginationMeta, escapeRegex } from '../utils/pagination.js';

/**
 * The create endpoint receives multipart/form-data, so multer hands every text
 * field over as a string. Objects/arrays that were JSON-encoded by the client
 * must be parsed before Mongoose sees them, otherwise casting a string to a
 * sub-document/array fails with ObjectExpectedError / ObjectParameterError.
 */
const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return fallback;

  try {
    const parsed = JSON.parse(trimmed);
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

/** Same idea for scalar fields: drop empty / literal-"null" placeholders. */
const cleanField = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
    return trimmed;
  }
  return value;
};

// @desc    Create a new funding opportunity
// @route   POST /api/funding
// @access  Private (startup)
export const createFundingOpportunity = async (req, res, next) => {
  try {
    const startupProfile = await StartupProfile.findOne({ userId: req.user._id });
    if (!startupProfile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    const {
      title,
      description,
      fundingType,
      amountRaising,
      equityOffered,
      valuation,
      useOfFunds,
      milestones,
      pitchDeck,
      financialProjections,
      closingDate,
      preferredInvestorType,
      preferredInvestorStage,
      minimumCheckSize,
      maximumCheckSize,
      startupInfo,
    } = req.body;

    // Validate required fields explicitly (multipart/form-data may send empty strings)
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Funding title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required.' });
    }

    // Unwrap JSON-encoded multipart fields
    const parsedAmountRaising = parseJsonField(amountRaising, undefined);
    const parsedValuation = parseJsonField(valuation, undefined);
    const parsedStartupInfo = parseJsonField(startupInfo, undefined);
    const parsedMilestones = parseJsonField(milestones, []);
    const parsedClosingDate = cleanField(closingDate);

    const opportunity = await FundingOpportunity.create({
      startupId: startupProfile._id,
      userId: req.user._id,
      title,
      description,
      fundingType,
      amountRaising: parsedAmountRaising,
      equityOffered,
      valuation: parsedValuation,
      useOfFunds,
      milestones: Array.isArray(parsedMilestones) ? parsedMilestones : [],
      pitchDeck,
      financialProjections,
      closingDate: parsedClosingDate,
      preferredInvestorType,
      preferredInvestorStage,
      minimumCheckSize,
      maximumCheckSize,
      startupInfo: parsedStartupInfo || {
        startupName: startupProfile.startupName,
        description: startupProfile.description,
        industry: startupProfile.domain,
        stage: startupProfile.stage,
        employeeCount: startupProfile.employeeCount,
        location: startupProfile.location,
        website: startupProfile.website,
        foundedYear: startupProfile.foundedYear,
      },
    });

    res.status(201).json({ success: true, opportunity });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all funding opportunities for a startup
// @route   GET /api/funding
// @access  Private (startup)
export const getMyFundingOpportunities = async (req, res, next) => {
  try {
    const startupProfile = await StartupProfile.findOne({ userId: req.user._id });
    if (!startupProfile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    const filter = { startupId: startupProfile._id };
    const total = await FundingOpportunity.countDocuments(filter);

    const { page, limit, skip } = parsePagination(req.query);
    const opportunities = await FundingOpportunity.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: total,
      opportunities,
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single funding opportunity by ID
// @route   GET /api/funding/:id
// @access  Private (startup owner or investor)
export const getFundingOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID' });
    }

    const opportunity = await FundingOpportunity.findById(id).lean();
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Funding opportunity not found' });
    }

    // Check access: startup owner or investor (for discovery)
    const isOwner = opportunity.userId.toString() === req.user._id.toString();
    const isInvestor = req.user.role === 'investor';

    if (!isOwner && !isInvestor) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this opportunity' });
    }

    res.status(200).json({ success: true, opportunity });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a funding opportunity
// @route   PUT /api/funding/:id
// @access  Private (startup owner)
export const updateFundingOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID' });
    }

    const opportunity = await FundingOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Funding opportunity not found' });
    }

    // Check ownership
    if (opportunity.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this opportunity' });
    }

    const allowedUpdates = [
      'title',
      'description',
      'fundingType',
      'amountRaising',
      'equityOffered',
      'valuation',
      'useOfFunds',
      'milestones',
      'pitchDeck',
      'financialProjections',
      'closingDate',
      'status',
      'preferredInvestorType',
      'preferredInvestorStage',
      'minimumCheckSize',
      'maximumCheckSize',
      'startupInfo',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        opportunity[field] = req.body[field];
      }
    });

    await opportunity.save();

    res.status(200).json({ success: true, opportunity });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a funding opportunity
// @route   DELETE /api/funding/:id
// @access  Private (startup owner)
export const deleteFundingOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID' });
    }

    const opportunity = await FundingOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Funding opportunity not found' });
    }

    // Check ownership
    if (opportunity.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this opportunity' });
    }

    // Also delete associated interests
    await FundingInterest.deleteMany({ fundingOpportunityId: id });

    await opportunity.deleteOne();

    res.status(200).json({ success: true, message: 'Funding opportunity deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all funding opportunities for investor discovery
// @route   GET /api/funding/discover
// @access  Private (investor)
export const discoverFundingOpportunities = async (req, res, next) => {
  try {
    const {
      search,
      fundingType,
      stage,
      industry,
      minAmount,
      maxAmount,
      minEquity,
      maxEquity,
      status = 'open',
    } = req.query;

    const filter = { status };

    if (search) {
      // Escaped: an unescaped "(" is an invalid pattern and Mongo rejects the
      // whole query (500).
      const safe = escapeRegex(String(search).trim());
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { 'startupInfo.startupName': { $regex: safe, $options: 'i' } },
      ];
    }

    if (fundingType) filter.fundingType = fundingType;
    if (stage) filter['startupInfo.stage'] = stage;
    if (industry) filter['startupInfo.industry'] = industry;

    if (minAmount || maxAmount) {
      filter['amountRaising.min'] = {};
      if (minAmount) filter['amountRaising.min'].$gte = Number(minAmount);
      if (maxAmount) filter['amountRaising.min'].$lte = Number(maxAmount);
    }

    if (minEquity || maxEquity) {
      filter.equityOffered = {};
      if (minEquity) filter.equityOffered.$gte = Number(minEquity);
      if (maxEquity) filter.equityOffered.$lte = Number(maxEquity);
    }

    const { page, limit } = parsePagination(req.query, { defaultLimit: 20 });

    const [opportunities, total] = await Promise.all([
      FundingOpportunity.find(filter)
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FundingOpportunity.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: opportunities.length,
      opportunities,
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Express interest in a funding opportunity (Investor)
// @route   POST /api/funding/:id/interest
// @access  Private (investor)
export const expressInterest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID' });
    }

    const opportunity = await FundingOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Funding opportunity not found' });
    }

    if (opportunity.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This opportunity is no longer accepting interest' });
    }

    // Check if investor already expressed interest (duplicate prevention)
    const existingInterest = await FundingInterest.findOne({
      investorId: req.user._id,
      fundingOpportunityId: id,
    });

    if (existingInterest) {
      return res.status(409).json({
        success: false,
        message: 'You have already expressed interest in this opportunity',
        interest: existingInterest,
      });
    }

    const investorProfile = await InvestorProfile.findOne({ userId: req.user._id });

    const {
      checkSize,
      equityRequested,
      message,
      proposedTerms,
      timeline,
    } = req.body;

    const interest = await FundingInterest.create({
      investorId: req.user._id,
      fundingOpportunityId: id,
      startupId: opportunity.startupId,
      investorUserId: req.user._id,
      investorProfileId: investorProfile?._id,
      startupUserId: opportunity.userId,
      startupProfileId: opportunity.startupId,
      checkSize,
      equityRequested,
      message,
      proposedTerms,
      timeline,
      status: 'pending',
    });

    // Increment interests count on opportunity
    await FundingOpportunity.findByIdAndUpdate(id, { $inc: { interestsCount: 1 } });

    // Notify startup owner about the new investor interest
    await createNotification({
      recipient: opportunity.userId,
      sender: req.user._id,
      type: 'investor_interest',
      title: 'New Investor Interest',
      message: `${req.user.name} expressed interest in "${opportunity.title}".`,
      relatedId: interest._id,
      relatedModel: 'FundingInterest',
      link: '/startup-dashboard/funding',
    });

    res.status(201).json({ success: true, interest });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already expressed interest in this opportunity' });
    }
    next(error);
  }
};

// @desc    Get interests for a funding opportunity (Startup owner)
// @route   GET /api/funding/:id/interests
// @access  Private (startup owner)
export const getFundingInterests = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID' });
    }

    const opportunity = await FundingOpportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Funding opportunity not found' });
    }

    // Check ownership
    if (opportunity.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view interests for this opportunity' });
    }

    const { status } = req.query;

    const filter = { fundingOpportunityId: id };
    if (status) filter.status = status;

    const { page, limit } = parsePagination(req.query, { defaultLimit: 20 });

    const [interests, total] = await Promise.all([
      FundingInterest.find(filter)
        .populate('investorUserId', 'name email avatar')
        .populate('investorProfileId', 'firmName investmentFocus typicalCheckSize portfolioWebsite')
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FundingInterest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: interests.length,
      interests,
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get investor's own funding interests
// @route   GET /api/funding/my-interests
// @access  Private (investor)
export const getMyFundingInterests = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = { investorId: req.user._id };
    if (status) filter.status = status;

    const { page, limit } = parsePagination(req.query, { defaultLimit: 20 });

    const [interests, total] = await Promise.all([
      FundingInterest.find(filter)
        .populate('fundingOpportunityId', 'title amountRaising equityOffered fundingType status startupInfo')
        .populate('startupUserId', 'name email')
        .populate('startupProfileId', 'startupName domain stage')
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FundingInterest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: interests.length,
      interests,
      pagination: buildPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to funding interest (Startup accepts/rejects/negotiates)
// @route   PATCH /api/funding/interests/:interestId/respond
// @access  Private (startup owner)
export const respondToInterest = async (req, res, next) => {
  try {
    const { interestId } = req.params;
    const { status, startupResponse, committedAmount, equityAgreed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(interestId)) {
      return res.status(400).json({ success: false, message: 'Invalid interest ID' });
    }

    const validStatuses = ['accepted', 'rejected', 'negotiating'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be accepted, rejected, or negotiating' });
    }

    const interest = await FundingInterest.findById(interestId).populate('fundingOpportunityId');
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Interest not found' });
    }

    // Check ownership - must be the startup owner
    if (interest.startupUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this interest' });
    }

    // Check if opportunity is still open for acceptance
    if (status === 'accepted' && interest.fundingOpportunityId.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Cannot accept interest for a closed opportunity' });
    }

    const previousStatus = interest.status;
    interest.status = status;
    interest.startupResponse = startupResponse || '';
    interest.respondedAt = new Date();

    if (status === 'accepted') {
      interest.committedAmount = committedAmount || 0;
      interest.committedAt = new Date();
      interest.equityAgreed = equityAgreed || 0;

      // Update opportunity committed amount
      await FundingOpportunity.findByIdAndUpdate(
        interest.fundingOpportunityId._id,
        { $inc: { committedAmount: interest.committedAmount } }
      );

      // Create or update Connection between startup and investor
      const existingConnection = await Connection.findOne({
        $or: [
          { requester: interest.startupUserId, recipient: interest.investorId },
          { requester: interest.investorId, recipient: interest.startupUserId },
        ],
      });

      if (!existingConnection) {
        await Connection.create({
          requester: interest.startupUserId,
          recipient: interest.investorId,
          requesterRole: 'startup',
          recipientRole: 'investor',
          connectionType: 'startup_investor',
          status: 'accepted',
          note: `Connected via funding interest: ${interest.fundingOpportunityId.title}`,
        });
      } else if (existingConnection.status !== 'accepted') {
        existingConnection.status = 'accepted';
        await existingConnection.save();
      }

      // Notify investor about acceptance and connection (skip if already accepted)
      if (previousStatus !== 'accepted') {
        await createNotification({
          recipient: interest.investorId,
          sender: interest.startupUserId,
          type: 'investor_interest_accepted',
          title: 'Investment Interest Accepted',
          message: `Your interest in "${interest.fundingOpportunityId.title}" has been accepted. You are now connected with the startup!`,
          relatedId: interest._id,
          relatedModel: 'FundingInterest',
          link: '/investor-dashboard/my-interests',
        });
      }
    }

    await interest.save();

    // Notify investor about status change (rejected/negotiating)
    if (status !== 'accepted' && previousStatus !== status) {
      const statusMessages = {
        rejected: `Your interest in "${interest.fundingOpportunityId.title}" was not accepted.`,
        negotiating: `The startup wants to negotiate terms for "${interest.fundingOpportunityId.title}".`,
      };
      await createNotification({
        recipient: interest.investorId,
        sender: interest.startupUserId,
        type: status === 'rejected' ? 'investor_interest_rejected' : 'general',
        title: 'Interest Status Updated',
        message: statusMessages[status] || `Your interest status has been updated to ${status}.`,
        relatedId: interest._id,
        relatedModel: 'FundingInterest',
        link: '/investor-dashboard/my-interests',
      });
    }

    res.status(200).json({ success: true, interest });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Connection already exists between these users' });
    }
    next(error);
  }
};

// @desc    Update interest status (Investor can withdraw, negotiate)
// @route   PATCH /api/funding/interests/:interestId
// @access  Private (investor)
export const updateInterest = async (req, res, next) => {
  try {
    const { interestId } = req.params;
    const { status, investorNote, checkSize, equityRequested } = req.body;

    if (!mongoose.Types.ObjectId.isValid(interestId)) {
      return res.status(400).json({ success: false, message: 'Invalid interest ID' });
    }

    const interest = await FundingInterest.findById(interestId);
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Interest not found' });
    }

    // Check ownership - must be the investor
    if (interest.investorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this interest' });
    }

    const validStatuses = ['pending', 'withdrawn', 'negotiating'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status for investor update' });
    }

    if (status) interest.status = status;
    if (investorNote !== undefined) interest.investorNote = investorNote;
    if (checkSize !== undefined) interest.checkSize = checkSize;
    if (equityRequested !== undefined) interest.equityRequested = equityRequested;

    await interest.save();

    res.status(200).json({ success: true, interest });
  } catch (error) {
    next(error);
  }
};

// @desc    Get funding opportunity stats for startup dashboard
// @route   GET /api/funding/stats
// @access  Private (startup)
export const getFundingStats = async (req, res, next) => {
  try {
    const startupProfile = await StartupProfile.findOne({ userId: req.user._id });
    if (!startupProfile) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' });
    }

    const [totalOpportunities, openOpportunities, totalInterests, totalCommitted] = await Promise.all([
      FundingOpportunity.countDocuments({ startupId: startupProfile._id }),
      FundingOpportunity.countDocuments({ startupId: startupProfile._id, status: 'open' }),
      FundingInterest.countDocuments({ startupId: startupProfile._id }),
      FundingInterest.aggregate([
        { $match: { startupId: startupProfile._id, status: 'accepted' } },
        { $group: { _id: null, total: { $sum: '$committedAmount' } } },
      ]),
    ]);

    const committedAmount = totalCommitted.length > 0 ? totalCommitted[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalOpportunities,
        openOpportunities,
        totalInterests,
        committedAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};