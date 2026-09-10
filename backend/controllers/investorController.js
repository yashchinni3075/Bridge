import InvestorProfile from '../models/InvestorProfile.js';
import StartupProfile from '../models/StartupProfile.js';
import Connection from '../models/Connection.js';
import User from '../models/User.js';

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
      bio,
      interests,
      preferredDomains,
      investmentPreferences,
      experience,
      linkedin,
    } = req.body;

    if (name && name.trim()) {
      await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    }

    const profileFields = {
      userId: req.user._id,
      name: name || req.user.name,
      bio: bio || '',
      interests: Array.isArray(interests) ? interests : [],
      preferredDomains: Array.isArray(preferredDomains) ? preferredDomains : [],
      investmentPreferences: investmentPreferences || {
        stages: ['Early Stage'],
        minCheckSize: 25000,
        maxCheckSize: 250000,
        geography: 'Global',
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
// @route   GET /api/investors/startups
// @access  Private (Investor)
export const discoverStartupsForInvestors = async (req, res, next) => {
  try {
    const { search, domain, stage, minFunding, maxFunding } = req.query;
    const query = {};

    if (domain && domain !== 'all') {
      query.domain = { $regex: domain, $options: 'i' };
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
      query.$or = [
        { startupName: { $regex: search, $options: 'i' } },
        { pitch: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Exclude verification docs and sensitive Cloudinary IDs
    const startups = await StartupProfile.find(query)
      .select('-businessRegistrationDoc -verification -pitchDeckPublicId')
      .populate('userId', 'name email isVerified')
      .lean();

    return res.status(200).json({
      success: true,
      count: startups.length,
      startups,
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
      .select('-businessRegistrationDoc -verification -pitchDeckPublicId')
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