import StartupProfile from '../models/StartupProfile.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import User from '../models/User.js';
import {
  calculateStartupFreelancerMatch,
  calculateStartupInvestorMatch,
} from '../services/matchingService.js';
import {
  enrichInvestorStartupMatchWithAI,
  enrichFreelancerStartupMatchWithAI,
} from '../services/aiRecommendationService.js';

// @desc    Get matching startups for the logged-in Freelancer (with AI synthesis on top matches)
// @route   GET /api/matching/freelancer/startups
// @access  Private (Verified Freelancer only)
export const getFreelancerStartupMatches = async (req, res, next) => {
  try {
    const fProfile = await FreelancerProfile.findOne({ userId: req.user._id });
    if (!fProfile) {
      return res.status(404).json({ success: false, message: 'Freelancer profile not found.' });
    }

    const startups = await StartupProfile.find()
      .select('-businessRegistrationDoc -verification -pitchDeckPublicId')
      .lean();

    // 1. Calculate deterministic scores across candidates
    const matches = startups.map((startup) => {
      const matchData = calculateStartupFreelancerMatch(startup, fProfile);
      return {
        startup,
        ...matchData,
      };
    });

    matches.sort((a, b) => b.overallScore - a.overallScore);

    // 2. Enrich top candidates (up to 3) with AI explanation
    const enrichedMatches = await Promise.all(
      matches.map(async (m, index) => {
        if (index < 3) {
          const aiInsight = await enrichFreelancerStartupMatchWithAI(m.startup, fProfile, m);
          return { ...m, aiInsight };
        }
        return {
          ...m,
          aiInsight: {
            aiEnriched: false,
            aiExplanation: m.explanation,
            keyContributions: m.matchingFactors,
            growthOpportunity: m.unmatchedFactors[0] || '',
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedMatches.length,
      matches: enrichedMatches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get matching candidates for a Startup (with AI synthesis)
// @route   GET /api/matching/startup/freelancers
// @access  Private (Verified Startup only)
export const getStartupFreelancerMatches = async (req, res, next) => {
  try {
    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    const verifiedUsers = await User.find({ role: 'freelancer', 'verification.status': 'approved' }).select('_id');
    const verifiedUserIds = verifiedUsers.map((u) => u._id);

    const freelancers = await FreelancerProfile.find({ userId: { $in: verifiedUserIds } })
      .populate('userId', 'name email profileImage')
      .lean();

    const matches = freelancers.map((fProfile) => {
      const matchData = calculateStartupFreelancerMatch(startup, fProfile);
      return {
        freelancer: fProfile,
        ...matchData,
      };
    });

    matches.sort((a, b) => b.overallScore - a.overallScore);

    const enrichedMatches = await Promise.all(
      matches.map(async (m, index) => {
        if (index < 3) {
          const aiInsight = await enrichFreelancerStartupMatchWithAI(startup, m.freelancer, m);
          return { ...m, aiInsight };
        }
        return {
          ...m,
          aiInsight: {
            aiEnriched: false,
            aiExplanation: m.explanation,
            keyContributions: m.matchingFactors,
            growthOpportunity: m.unmatchedFactors[0] || '',
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedMatches.length,
      matches: enrichedMatches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get matching startups for the logged-in Investor (with AI synthesis)
// @route   GET /api/matching/investor/startups
// @access  Private (Verified Investor only)
export const getInvestorStartupMatches = async (req, res, next) => {
  try {
    const investor = await InvestorProfile.findOne({ userId: req.user._id });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor profile not found.' });
    }

    const startups = await StartupProfile.find()
      .select('-businessRegistrationDoc -verification -pitchDeckPublicId')
      .lean();

    const matches = startups.map((startup) => {
      const matchData = calculateStartupInvestorMatch(startup, investor);
      return {
        startup,
        ...matchData,
      };
    });

    matches.sort((a, b) => b.overallScore - a.overallScore);

    const enrichedMatches = await Promise.all(
      matches.map(async (m, index) => {
        if (index < 3) {
          const aiInsight = await enrichInvestorStartupMatchWithAI(m.startup, investor, m);
          return { ...m, aiInsight };
        }
        return {
          ...m,
          aiInsight: {
            aiEnriched: false,
            aiExplanation: m.explanation,
            strategicSynergies: m.matchingFactors,
            dueDiligenceFocus: m.unmatchedFactors[0] || '',
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedMatches.length,
      matches: enrichedMatches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed compatibility between a specific Startup and Freelancer
// @route   GET /api/matching/evaluate/startup/:startupId/freelancer/:freelancerId
// @access  Private (Verified Users)
export const evaluatePairCompatibility = async (req, res, next) => {
  try {
    const { startupId, freelancerId } = req.params;

    const [startup, freelancer] = await Promise.all([
      StartupProfile.findById(startupId).lean(),
      FreelancerProfile.findOne({ userId: freelancerId }).lean(),
    ]);

    if (!startup || !freelancer) {
      return res.status(404).json({ success: false, message: 'Target profile entity not found.' });
    }

    const evaluation = calculateStartupFreelancerMatch(startup, freelancer);
    const aiInsight = await enrichFreelancerStartupMatchWithAI(startup, freelancer, evaluation);

    return res.status(200).json({
      success: true,
      evaluation,
      aiInsight,
    });
  } catch (error) {
    next(error);
  }
};