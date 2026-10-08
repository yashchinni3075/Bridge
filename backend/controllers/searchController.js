import StartupProfile from '../models/StartupProfile.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import Application from '../models/Application.js';
import { parsePagination as getPagination, escapeRegex } from '../utils/pagination.js';

const SENSITIVE_STARTUP_FIELDS = '-businessRegistrationDoc -verification -pitchDeckPublicId -pitchDeckText';
const SENSITIVE_USER_FIELDS = '-password -verification -resetPasswordToken -resetPasswordExpire';

// Discovery feeds cap lower than the global MAX_PAGE_SIZE - a page of 100 rich
// startup cards is unusable in the UI.
const DISCOVERY_MAX_PAGE_SIZE = 50;

// ============================================================================
// 1. FREELANCER SEARCH: Discover Startups (Skills, Domain, Stage, Funding)
// ============================================================================
export const searchStartupsForFreelancers = async (req, res, next) => {
  try {
    const { search, domain, skill, stage, minFunding, maxFunding } = req.query;
    const { page, limit, skip } = getPagination(req.query, { maxLimit: DISCOVERY_MAX_PAGE_SIZE });

    const filter = {};

    if (search && search.trim()) {
      // Escaped: an unescaped "(" is an invalid $regex pattern, which makes
      // Mongo reject the whole query (HTTP 500).
      const term = escapeRegex(search.trim());
      filter.$or = [
        { startupName: { $regex: term, $options: 'i' } },
        { pitch: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    if (domain && domain !== 'all') {
      filter.domain = { $regex: escapeRegex(domain.trim()), $options: 'i' };
    }

    if (stage && stage !== 'all') {
      filter.stage = stage.trim();
    }

    if (skill && skill.trim()) {
      const skillRegex = { $regex: escapeRegex(skill.trim()), $options: 'i' };
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

// ============================================================================
// 2. INVESTOR SEARCH: Discover Startups (Domain, Stage, Funding Range, Ask, Milestones)
// ============================================================================
export const searchStartupsForInvestors = async (req, res, next) => {
  try {
    const { search, domain, industry, stage, minFunding, maxFunding, verifiedMilestonesOnly } = req.query;
    const { page, limit, skip } = getPagination(req.query, { maxLimit: DISCOVERY_MAX_PAGE_SIZE });

    const filter = {};

    if (search && search.trim()) {
      // Escaped: an unescaped "(" is an invalid $regex pattern, which makes
      // Mongo reject the whole query (HTTP 500).
      const term = escapeRegex(search.trim());
      filter.$or = [
        { startupName: { $regex: term, $options: 'i' } },
        { pitch: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    const targetDomain = domain || industry;
    if (targetDomain && targetDomain !== 'all') {
      filter.domain = { $regex: escapeRegex(targetDomain.trim()), $options: 'i' };
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

// ============================================================================
// 3. STARTUP SEARCH: Discover Freelancers (Skills, Domain, Experience, Interests)
// ============================================================================
export const searchFreelancersForStartups = async (req, res, next) => {
  try {
    const { search, domain, skill, experience, interest } = req.query;
    const { page, limit, skip } = getPagination(req.query, { maxLimit: DISCOVERY_MAX_PAGE_SIZE });

    const filter = {};

    if (search && search.trim()) {
      // Escaped: an unescaped "(" is an invalid $regex pattern, which makes
      // Mongo reject the whole query (HTTP 500).
      const term = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { bio: { $regex: term, $options: 'i' } },
        { domain: { $regex: term, $options: 'i' } },
      ];
    }

    if (domain && domain !== 'all') {
      filter.domain = { $regex: escapeRegex(domain.trim()), $options: 'i' };
    }

    if (skill && skill.trim()) {
      filter.skills = { $in: [new RegExp(escapeRegex(skill.trim()), 'i')] };
    }

    if (interest && interest.trim()) {
      filter.interests = { $in: [new RegExp(escapeRegex(interest.trim()), 'i')] };
    }

    if (experience && experience !== 'all') {
      filter.experience = { $regex: escapeRegex(experience.trim()), $options: 'i' };
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

// ============================================================================
// 4. STARTUP SEARCH: Discover Investors (Domain, Stage, Check Size, Interests)
// ============================================================================
export const searchInvestorsForStartups = async (req, res, next) => {
  try {
    const { search, domain, stage, minCheck, maxCheck } = req.query;
    const { page, limit, skip } = getPagination(req.query, { maxLimit: DISCOVERY_MAX_PAGE_SIZE });

    const filter = {};

    if (search && search.trim()) {
      // Escaped: an unescaped "(" is an invalid $regex pattern, which makes
      // Mongo reject the whole query (HTTP 500).
      const term = escapeRegex(search.trim());
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

  router.delete('/milestones/:milestoneId', requireVerifiedUser, async (req, res, next) => {
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
});
};
