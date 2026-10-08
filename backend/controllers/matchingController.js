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
import StartupHiring from '../models/StartupHiring.js';
import {
  computeStartupFreelancerMatches,
  computeInvestorStartupMatches,
  computeStartupFreelancerMatchesForStartup,
  computeStartupInvestorMatchesForStartup,
  computeFreelancerStartupMatches,
  computeStartupFreelancerMatchEngine,
  computeInvestorStartupMatchEngine,
  computeFreelancerHiringMatches,
  computeStartupHiringMatches,
  computeStartupHiringMatchesForDiscovery,
  getFreelancerDiscoveryTagWeights,
  getStartupDiscoveryTagWeights,
  getInvestorDiscoveryTagWeights,
  getStartupInvestorTagWeights,
} from '../services/matchingEngineService.js';

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
      .select('-businessRegistrationDoc -verification -pitchDeckPublicId -pitchDeckText')
      .lean();

    // 1. Calculate cosine similarity matches (Match Engine: 40% threshold, 60% strong filter)
    const cosineMatches = computeFreelancerStartupMatches(fProfile, startups);

    // 2. Also calculate deterministic multi-factor scores for backward compatibility
    const multiFactorMatches = startups.map((startup) => {
      const matchData = calculateStartupFreelancerMatch(startup, fProfile);
      return {
        startup,
        ...matchData,
      };
    });

    multiFactorMatches.sort((a, b) => b.overallScore - a.overallScore);

    // 3. Merge: prioritize cosine matches (already >= 40%), supplement with multi-factor >= 40% for rest
    const cosineStartupIds = new Set(cosineMatches.map((m) => m.id));
    const combined = [...cosineMatches];

    for (const mf of multiFactorMatches) {
      if (!cosineStartupIds.has(mf.startup._id.toString()) && mf.overallScore >= 40) {
        combined.push({
          id: mf.startup._id.toString(),
          quantity: mf.startup,
          matchScore: mf.overallScore,
          similarity: mf.overallScore / 100,
          matchedTags: [],
          isStrongMatch: mf.overallScore >= 60,
          reasons: mf.matchingFactors.length > 0 ? mf.matchingFactors : ['Domain and skill overlap'],
          startup: mf.startup,
          multiFactor: true,
          dimensions: mf.dimensions,
        });
      }
    }

    combined.sort((a, b) => b.matchScore - a.matchScore);

    // 4. Enrich top candidates (up to 3) with AI explanation
    const enrichedMatches = await Promise.all(
      combined.map(async (m, index) => {
        if (index < 3) {
          const startupData = m.quantity || m.startup;
          const aiInsight = await enrichFreelancerStartupMatchWithAI(startupData, fProfile, m);
          return { ...m, aiInsight, startup: startupData };
        }
        return {
          ...m,
          aiInsight: {
            aiEnriched: false,
            aiExplanation: m.multiFactor ? m.explanation : 'Cosine similarity match based on skills and domain overlap.',
            keyContributions: m.matchedTags || m.matchingFactors || [],
            growthOpportunity: m.unmatchedFactors?.[0] || m.reasons?.[0] || '',
          },
          startup: m.quantity || m.startup,
        };
      })
    );

    // Distinguish "profile has no signal" from "profile is fine, nothing matches".
    // Without this the client can only show a generic empty state, which is
    // actively misleading when the real cause is zero startup overlap.
    const hasSignal = Boolean(
      (fProfile.domain && String(fProfile.domain).trim()) ||
        (Array.isArray(fProfile.skills) && fProfile.skills.length) ||
        (Array.isArray(fProfile.interests) && fProfile.interests.length),
    );

    return res.status(200).json({
      success: true,
      count: enrichedMatches.length,
      matches: enrichedMatches,
      emptyReason:
        enrichedMatches.length === 0 ? (hasSignal ? 'no_overlap' : 'incomplete_profile') : null,
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

    // 1. Calculate cosine similarity matches (Match Engine: 40% threshold, 60% strong filter)
    const cosineMatches = computeStartupFreelancerMatchEngine(startup, freelancers);

    // 2. Also calculate deterministic multi-factor scores for backward compatibility
    const multiFactorMatches = freelancers.map((fProfile) => {
      const matchData = calculateStartupFreelancerMatch(startup, fProfile);
      return {
        freelancer: fProfile,
        ...matchData,
      };
    });

    multiFactorMatches.sort((a, b) => b.overallScore - a.overallScore);

    // 3. Merge: prioritize cosine matches (already >= 40%), supplement with multi-factor >= 40% for rest
    const cosineFreelancerIds = new Set(cosineMatches.map((m) => m.id));
    const combined = [...cosineMatches];

    for (const mf of multiFactorMatches) {
      if (!cosineFreelancerIds.has(mf.freelancer._id.toString()) && mf.overallScore >= 40) {
        combined.push({
          id: mf.freelancer._id.toString(),
          quantity: mf.freelancer,
          matchScore: mf.overallScore,
          similarity: mf.overallScore / 100,
          matchedTags: [],
          isStrongMatch: mf.overallScore >= 60,
          reasons: mf.matchingFactors.length > 0 ? mf.matchingFactors : ['Domain and skill overlap'],
          freelancer: mf.freelancer,
          multiFactor: true,
          dimensions: mf.dimensions,
        });
      }
    }

    combined.sort((a, b) => b.matchScore - a.matchScore);

    // 4. Optionally enrich top candidates (up to 3) with an AI explanation.
    // Each enriched candidate costs a Gemini round-trip, so clients that do not
    // render aiInsight should pass ?enrich=0.
    const wantsEnrichment = !['0', 'false', 'no'].includes(String(req.query.enrich ?? '1').toLowerCase());

    const enrichedMatches = wantsEnrichment
      ? await Promise.all(
          combined.map(async (m, index) => {
            if (index < 3) {
              const freelancerData = m.quantity || m.freelancer;
              const aiInsight = await enrichFreelancerStartupMatchWithAI(startup, freelancerData, m);
              return { ...m, aiInsight, freelancer: freelancerData };
            }
            return {
              ...m,
              aiInsight: {
                aiEnriched: false,
                aiExplanation: m.multiFactor ? m.explanation : 'Cosine similarity match based on skills and domain overlap.',
                keyContributions: m.matchedTags || m.matchingFactors || [],
                growthOpportunity: m.unmatchedFactors?.[0] || m.reasons?.[0] || '',
              },
              freelancer: m.quantity || m.freelancer,
            };
          }),
        )
      : combined;

    // Distinguish "no verified freelancers on the platform" from "freelancers
    // exist but none clear the 40% threshold", so the client can explain an
    // empty feed instead of implying a problem with the startup's profile.
    return res.status(200).json({
      success: true,
      count: enrichedMatches.length,
      matches: enrichedMatches,
      emptyReason:
        enrichedMatches.length === 0
          ? freelancers.length === 0
            ? 'no_candidates'
            : 'no_overlap'
          : null,
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
      .select('-businessRegistrationDoc -verification -pitchDeckPublicId -pitchDeckText')
      .lean();

    // 1. Calculate cosine similarity matches (Match Engine: 40% threshold, 60% strong filter)
    const cosineMatches = computeInvestorStartupMatchEngine(investor, startups);

    // 2. Also calculate deterministic multi-factor scores for backward compatibility
    const multiFactorMatches = startups.map((startup) => {
      const matchData = calculateStartupInvestorMatch(startup, investor);
      return {
        startup,
        ...matchData,
      };
    });

    multiFactorMatches.sort((a, b) => b.overallScore - a.overallScore);

    // 3. Merge: prioritize cosine matches (already >= 40%), supplement with multi-factor >= 40% for rest
    const cosineStartupIds = new Set(cosineMatches.map((m) => m.id));
    const combined = [...cosineMatches];

    for (const mf of multiFactorMatches) {
      if (!cosineStartupIds.has(mf.startup._id.toString()) && mf.overallScore >= 40) {
        combined.push({
          id: mf.startup._id.toString(),
          quantity: mf.startup,
          matchScore: mf.overallScore,
          similarity: mf.overallScore / 100,
          matchedTags: [],
          isStrongMatch: mf.overallScore >= 60,
          reasons: mf.matchingFactors.length > 0 ? mf.matchingFactors : ['Sector and stage alignment'],
          startup: mf.startup,
          multiFactor: true,
          dimensions: mf.dimensions,
        });
      }
    }

    combined.sort((a, b) => b.matchScore - a.matchScore);

    // 4. Optionally enrich top candidates (up to 3) with an AI explanation.
// Each enriched candidate costs a Gemini round-trip (callGeminiModel tries up
// to four models sequentially, with no timeout), which dominates the response
// time. Clients that do not render aiInsight should pass ?enrich=0.
const wantsEnrichment = !['0', 'false', 'no'].includes(String(req.query.enrich ?? '1').toLowerCase());

const finalMatches = wantsEnrichment
  ? await Promise.all(
      combined.map(async (m, index) => {
        if (index < 3) {
          const startupData = m.quantity || m.startup;
          const aiInsight = await enrichInvestorStartupMatchWithAI(startupData, investor, m);
          return { ...m, aiInsight, startup: startupData };
        }
        return {
          ...m,
          aiInsight: {
            aiEnriched: false,
            aiExplanation: m.multiFactor ? m.explanation : 'Cosine similarity match based on sector, stage, and funding preferences.',
            strategicSynergies: m.matchedTags || m.matchingFactors || [],
            dueDiligenceFocus: m.unmatchedFactors?.[0] || m.reasons?.[0] || '',
          },
          startup: m.quantity || m.startup,
        };
      })
    )
  : combined.map((m) => ({ ...m, startup: m.quantity || m.startup }));

return res.status(200).json({
      success: true,
      count: finalMatches.length,
      matches: finalMatches,
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

// @desc    Get eligible freelancers for Startup discovery (hiring-specific matching)
// @route   GET /api/matching/startup/freelancers/discovery
// @access  Private (Verified Startup only)
export const getStartupDiscoveryFreelancers = async (req, res, next) => {
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

    // Get the startup's active hiring posts for hiring-specific matching
    const hirings = await StartupHiring.find({ startupId: startup._id, status: 'open' })
      .select('jobTitle jobDescription requiredSkills preferredSkills domain startupInfo status')
      .lean();

    // Use hiring-specific matching when hirings exist, fall back to profile matching
    let combined;
    if (hirings.length > 0) {
      combined = computeStartupHiringMatchesForDiscovery(hirings, freelancers);
    } else {
      // Fall back to profile-based matching when no hirings exist
      const cosineMatches = computeStartupFreelancerMatchesForStartup(startup, freelancers);
      combined = cosineMatches.map((m) => ({
        ...m,
        freelancer: m.quantity,
        hiringId: null,
        jobTitle: null,
      }));
    }

    // Also calculate multi-factor scores for enrichment
    const multiFactorMatches = freelancers.map((fProfile) => {
      const matchData = calculateStartupFreelancerMatch(startup, fProfile);
      return {
        freelancer: fProfile,
        ...matchData,
      };
    });

    // Merge with multi-factor data for enrichment
    const enriched = combined.map((m) => {
      const mf = multiFactorMatches.find((mf) => mf.freelancer._id.toString() === m.id);
      return {
        ...m,
        freelancer: m.quantity || m.freelancer,
        dimensions: mf?.dimensions || null,
        multiFactor: !!mf,
        multiFactorExplanation: mf?.explanation || null,
      };
    });

    enriched.sort((a, b) => b.matchScore - a.matchScore);

    // Enrich the top candidates with an AI rationale. This mirrors the investor
    // discovery feed (and getStartupFreelancerMatches): FreelancerDiscovery.jsx
    // renders m.aiInsight.aiExplanation, so without this block the AI panel was
    // silently absent from the one discovery page that never enriched. Clients
    // that do not render aiInsight should pass ?enrich=0 to skip the round-trips.
    const wantsEnrichment = !['0', 'false', 'no'].includes(String(req.query.enrich ?? '1').toLowerCase());

    const finalMatches = wantsEnrichment
      ? await Promise.all(
          enriched.map(async (m, index) => {
            const freelancerData = m.quantity || m.freelancer;
            if (index < 3) {
              const aiInsight = await enrichFreelancerStartupMatchWithAI(startup, freelancerData, m);
              return { ...m, aiInsight, freelancer: freelancerData };
            }
            return {
              ...m,
              aiInsight: {
                aiEnriched: false,
                aiExplanation:
                  m.multiFactorExplanation ||
                  'Matched on skill and domain overlap with the startup\u2019s current hiring needs.',
                keyContributions: m.matchedTags || [],
                growthOpportunity: m.reasons?.[0] || '',
              },
              freelancer: freelancerData,
            };
          })
        )
      : enriched;

    return res.status(200).json({
      success: true,
      count: finalMatches.length,
      matches: finalMatches,
      emptyReason:
        finalMatches.length === 0
          ? freelancers.length === 0
            ? 'no_candidates'
            : 'no_overlap'
          : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get eligible investors for Startup discovery (cosine similarity 40%/60%)
// @route   GET /api/matching/startup/investors/discovery
// @access  Private (Verified Startup only)
export const getStartupDiscoveryInvestors = async (req, res, next) => {
  try {
    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found.' });
    }

    const verifiedUsers = await User.find({ role: 'investor', 'verification.status': 'approved' }).select('_id');
    const verifiedUserIds = verifiedUsers.map((u) => u._id);

    const investors = await InvestorProfile.find({ userId: { $in: verifiedUserIds } })
      .populate('userId', 'name email profileImage')
      .lean();

    // Calculate cosine similarity matches (40% threshold, 60% strong filter)
    const cosineMatches = computeStartupInvestorMatchesForStartup(startup, investors);

    // Also calculate multi-factor scores for enrichment
    const multiFactorMatches = investors.map((invProfile) => {
      const matchData = calculateStartupInvestorMatch(startup, invProfile);
      return {
        investor: invProfile,
        ...matchData,
      };
    });

    // Merge cosine matches with multi-factor data for enrichment
    const combined = cosineMatches.map((m) => {
      const mf = multiFactorMatches.find((mf) => mf.investor._id.toString() === m.id);
      return {
        ...m,
        investor: m.quantity,
        dimensions: mf?.dimensions || null,
        multiFactor: !!mf,
        multiFactorExplanation: mf?.explanation || null,
      };
    });

    combined.sort((a, b) => b.matchScore - a.matchScore);

    // Enrich the top candidates with an AI rationale. Mirrors the freelancer
    // feed. callGeminiModel tries several models sequentially with no timeout,
    // so clients that do not render aiInsight should pass ?enrich=0.
    const wantsEnrichment = !['0', 'false', 'no'].includes(String(req.query.enrich ?? '1').toLowerCase());

    const finalMatches = wantsEnrichment
      ? await Promise.all(
          combined.map(async (m, index) => {
            if (index < 3) {
              const investorData = m.quantity || m.investor;
              const aiInsight = await enrichInvestorStartupMatchWithAI(startup, investorData, m);
              return { ...m, aiInsight, investor: investorData };
            }
            return {
              ...m,
              aiInsight: {
                aiEnriched: false,
                aiExplanation:
                  m.multiFactorExplanation ||
                  'Matched on shared investment preferences across sector and stage.',
                strategicSynergies: m.matchedTags || [],
                dueDiligenceFocus: m.reasons?.[0] || '',
              },
              investor: m.quantity || m.investor,
            };
          }),
        )
      : combined;

    // Distinguish "no investors on the platform" from "investors exist but none
    // clear the 40% threshold", so the client can explain an empty feed.
    return res.status(200).json({
      success: true,
      count: finalMatches.length,
      matches: finalMatches,
      emptyReason:
        finalMatches.length === 0 ? (investors.length === 0 ? 'no_candidates' : 'no_overlap') : null,
    });
  } catch (error) {
    next(error);
  }
};