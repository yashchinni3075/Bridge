import InvestorProfile from '../models/InvestorProfile.js';
import StartupProfile from '../models/StartupProfile.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';
import CalendarEvent from '../models/CalendarEvent.js';
import { parsePagination, paginateQuery, escapeRegex } from '../utils/pagination.js';

// Mirrors the `investmentPreferences.stages` enum on the InvestorProfile schema.
// Values outside this list are dropped before saving because the update runs
// with runValidators and would otherwise reject the whole request.
const INVESTOR_STAGES = ['Idea', 'MVP', 'Early Stage', 'Growth', 'Scaling'];

// @desc    Get current investor's profile
// @route   GET /api/investors/profile
// @access  Private (Investor)
export const getMyInvestorProfile = async (req, res, next) => {
  try {
    let profile = await InvestorProfile.findOne({ userId: req.user._id });
    const user = await User.findById(req.user._id).select('name email role verification isVerified');

    if (!profile) {
      profile = await InvestorProfile.create({
        userId: req.user._id,
        name: user.name,
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

// @desc    Create or update investor profile
// @route   PUT /api/investors/profile
// @access  Private (Investor)
export const updateInvestorProfile = async (req, res, next) => {
  try {
    const {
      name,
      investorName, // legacy client alias for `name`
      bio,
      interests,
      preferredDomains,
      investmentFocus, // legacy client alias for `preferredDomains`
      investmentPreferences,
      experience,
      linkedin,
      minCheckSize,
      maxCheckSize,
      geography,
      preferredStage, // legacy client alias for `investmentPreferences.stages`
    } = req.body;

    // Accept either an array of strings or a comma-separated string.
    const toList = (value) => {
      if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
      if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim()).filter(Boolean);
      }
      return [];
    };

    const resolvedName = (name || investorName || '').trim();

    if (resolvedName) {
      await User.findByIdAndUpdate(req.user._id, { name: resolvedName });
    }

    const incomingPrefs =
      investmentPreferences && typeof investmentPreferences === 'object' ? investmentPreferences : {};

    // `investmentPreferences.stages` has an enum in the schema and the save runs
    // with runValidators, so filter to known stages rather than throwing a 500
    // on a value the client invented (e.g. the legacy "Idea Stage").
    const requestedStages = toList(
      Array.isArray(incomingPrefs.stages) && incomingPrefs.stages.length
        ? incomingPrefs.stages
        : preferredStage
    );
    const stages = requestedStages.filter((s) => INVESTOR_STAGES.includes(s));

    const domains = toList(
      Array.isArray(preferredDomains) && preferredDomains.length ? preferredDomains : investmentFocus
    );

    const profileFields = {
      userId: req.user._id,
      name: resolvedName || req.user.name,
      bio: bio || '',
      interests: toList(interests),
      preferredDomains: domains,
      investmentPreferences: {
        stages: stages.length ? stages : ['Early Stage'],
        minCheckSize: Number(incomingPrefs.minCheckSize ?? minCheckSize) || 0,
        maxCheckSize: Number(incomingPrefs.maxCheckSize ?? maxCheckSize) || 0,
        geography: incomingPrefs.geography || geography || 'Global',
      },
      experience: experience || '',
      linkedin: linkedin || '',
    };

    const profile = await InvestorProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Investor profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Investor Startup Discovery (with domain, stage, and funding filters)
// @route   GET /api/investors/startups?page=&limit=
// @access  Private (Investor)
export const discoverStartupsForInvestors = async (req, res, next) => {
  try {
    const { search, domain, stage, minFunding, maxFunding } = req.query;
    const query = {};

    if (domain && domain !== 'all') {
      query.domain = { $regex: escapeRegex(String(domain)), $options: 'i' };
    }
    if (stage && stage !== 'all') {
      query.stage = stage;
    }
    if (minFunding) {
      query.maximumFunding = { $gte: Number(minFunding) };
    }
    if (maxFunding) {
      query.minimumFunding = { $lte: Number(maxFunding) };
    }
    if (search) {
      // Escaped: an unescaped "(" is an invalid $regex pattern and Mongo
      // rejects the whole query (500).
      const safe = escapeRegex(String(search));
      query.$or = [
        { startupName: { $regex: safe, $options: 'i' } },
        { pitch: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    // Exclude verification docs and sensitive Cloudinary IDs
    const buildQuery = () =>
      StartupProfile.find(query)
        .select('-businessRegistrationDoc -verification -pitchDeckPublicId -pitchDeckText')
        .populate('userId', 'name email isVerified')
        .sort({ createdAt: -1, _id: 1 })
        .lean();

    const { rows: startups, total, meta } = await paginateQuery(
      buildQuery(),
      buildQuery(),
      parsePagination(req.query, { maxLimit: 50 })
    );

    return res.status(200).json({
      success: true,
      count: total,
      startups,
      pagination: meta,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Investor Dashboard Metrics, Recommendations, and Matching Scores
// @route   GET /api/investors/dashboard
// @access  Private (Investor)
export const getInvestorDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name email role verification isVerified');
    const investor = await InvestorProfile.findOne({ userId: req.user._id });

    // Fetch startups for recommendation calculation
    const allStartups = await StartupProfile.find()
      .select('-businessRegistrationDoc -verification -pitchDeckPublicId -pitchDeckText')
      .populate('userId', 'name email isVerified')
      .lean();

    const preferredDomains = investor?.preferredDomains || [];
    const preferredStages = investor?.investmentPreferences?.stages || [];
    const minCheck = investor?.investmentPreferences?.minCheckSize || 0;
    const maxCheck = investor?.investmentPreferences?.maxCheckSize || Infinity;

    // Calculate match score for each startup
    const scoredStartups = allStartups.map((s) => {
      let score = 50; // base score

      // Domain match: +20%
      if (preferredDomains.some((d) => s.domain && s.domain.toLowerCase().includes(d.toLowerCase()))) {
        score += 20;
      }

      // Stage match: +15%
      if (preferredStages.includes(s.stage)) {
        score += 15;
      }

      // Funding overlap match: +10%
      const sMin = s.minimumFunding || 0;
      const sMax = s.maximumFunding || Infinity;
      if (minCheck <= sMax && maxCheck >= sMin) {
        score += 10;
      }

      // Pitch score bonus: up to +15%
      if (s.aiEvaluation?.overallScore) {
        score += Math.round((s.aiEvaluation.overallScore / 100) * 15);
      }

      return {
        ...s,
        matchScore: Math.min(score, 99),
      };
    });

    // Sort by match score descending
    scoredStartups.sort((a, b) => b.matchScore - a.matchScore);

    // Count connections
    const connectionsCount = Connection ? await Connection.countDocuments({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    }) : 0;

    return res.status(200).json({
      success: true,
      user,
      profile: investor,
      metrics: {
        verificationStatus: user.verification?.status || 'not_submitted',
        rejectionReason: user.verification?.rejectionReason || '',
        connectionsCount,
        recommendedCount: scoredStartups.length,
      },
      recommendations: scoredStartups.slice(0, 6),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get investor's investment/funding history
// @route   GET /api/investors/investment-history
// @access  Private (Investor)
export const getInvestmentHistory = async (req, res, next) => {
  try {
    const selfId = req.user._id;

    // An accepted investor<->startup connection can be initiated by either side
    // (investors connect from Discover, startups reach out through their
    // investor applications), so both roles have to be considered. Filtering on
    // `requester` alone silently dropped every startup-initiated relationship.
    const connections = await Connection.find({
      $or: [{ requester: selfId }, { recipient: selfId }],
      connectionType: 'startup_investor',
      status: 'accepted',
    })
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .lean();

    // The counterparty is whichever side of the connection is not this investor.
    const partnerOf = (conn) =>
      (conn.requester?._id?.toString() === selfId.toString() ? conn.recipient : conn.requester) || null;

    const partnerIds = connections.map(partnerOf).filter(Boolean).map((p) => p._id);

    // userId must stay in the projection: `select()` replaces the default
    // projection, and the startupMap below is keyed on it.
    const startupProfiles = await StartupProfile.find({ userId: { $in: partnerIds } })
      .select('userId startupName domain stage fundingRequirement minimumFunding maximumFunding progress')
      .lean();

    // Completed investor pitches. A pitch is usually booked by the startup with
    // the investor as the invited participant, so matching `createdBy` alone
    // dropped every startup-booked pitch and left this list empty.
    const calendarEvents = await CalendarEvent.find({
      $or: [{ participantId: selfId }, { createdBy: selfId }],
      eventType: 'INVESTOR_PITCH',
      status: 'COMPLETED',
    })
      .sort({ date: -1 })
      .lean();

    const startupMap = {};
    startupProfiles.forEach((sp) => {
      if (sp.userId) startupMap[sp.userId.toString()] = sp;
    });

    // The startup side of a pitch event: the participant when this investor
    // booked it, otherwise the creator.
    const counterpartyIdOfEvent = (ev) => {
      const other = ev.createdBy?.toString() === selfId.toString() ? ev.participantId : ev.createdBy;
      return other?.toString() || null;
    };

    const investments = calendarEvents.map((ev) => {
      const startup = startupMap[counterpartyIdOfEvent(ev)] || {};
      return {
        _id: ev._id,
        startupName: startup.startupName || ev.participantName || 'Startup',
        type: 'Equity',
        stage: startup.stage || 'Early Stage',
        amount: startup.fundingRequirement || startup.maximumFunding || 0,
        date: ev.date,
        status: 'completed',
      };
    });

    const completedPartnerIds = new Set(calendarEvents.map(counterpartyIdOfEvent).filter(Boolean));

    // Connected startups with no completed pitch yet, shown as still pending.
    const potentialInvestments = connections
      .map((conn) => {
        const partner = partnerOf(conn);
        if (!partner) return null;
        const partnerId = partner._id.toString();
        if (completedPartnerIds.has(partnerId)) return null;
        const startup = startupMap[partnerId] || {};
        return {
          _id: `pending-${conn._id}`,
          startupName: startup.startupName || partner.name || 'Startup',
          type: 'Equity',
          stage: startup.stage || 'Early Stage',
          amount: startup.fundingRequirement || startup.maximumFunding || 0,
          date: conn.updatedAt,
          status: 'pending',
        };
      })
      .filter(Boolean);

    const allInvestments = [...investments, ...potentialInvestments]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      investments: allInvestments,
    });
  } catch (error) {
    next(error);
  }
};
