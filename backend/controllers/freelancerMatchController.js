import FreelancerProfile from '../models/FreelancerProfile.js';
import StartupHiring from '../models/StartupHiring.js';
import User from '../models/User.js';
import {
  getFreelancerTags,
  getFreelancerTagWeights,
  getHiringTags,
  getHiringTagWeights,
  computeCosineMatches,
  evaluateFreelancerEligibility,
} from '../services/matchingEngineService.js';

const MATCH_THRESHOLD = 40;

const HIRING_PUBLIC_FIELDS =
  'startupId userId jobTitle jobDescription vacancies salary employmentType workMode location experienceRequired domain requiredSkills preferredSkills startupInfo criteria status';

const formatSalary = (salary) => ({
  min: salary?.min || 0,
  max: salary?.max || 0,
  currency: salary?.currency || 'INR',
});

// @desc    Get ranked startup hiring opportunities for the logged-in freelancer
// @route   GET /api/matching/freelancer/hiring
// @access  Private (Freelancer, verified)
export const getFreelancerHiringMatches = async (req, res, next) => {
  try {
    const freelancer = await FreelancerProfile.findOne({ userId: req.user._id }).lean();
    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer profile not found. Please complete your profile first.' });
    }

    const hirings = await StartupHiring.find({ status: 'open' })
      .select(HIRING_PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    if (!hirings.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        matches: [],
        message: 'No startup hiring opportunities available yet.',
      });
    }

    // Collect unique startup userIds from hiring records and check blocked status
    const startupUserIds = [...new Set(hirings.map((h) => h.userId?.toString()).filter(Boolean))];
    const blockedStartups = await User.find({
      _id: { $in: startupUserIds },
      isBlocked: true,
    }).select('_id').lean();
    const blockedStartupIds = new Set(blockedStartups.map((u) => u._id.toString()));

    // Filter out hiring records from blocked startups
    const openHirings = hirings.filter((h) => {
      const uid = h.userId?.toString();
      return uid && !blockedStartupIds.has(uid);
    });

    if (!openHirings.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        matches: [],
        message: 'No startup hiring opportunities available yet.',
      });
    }

    const query = { tags: getFreelancerTags(freelancer), weights: getFreelancerTagWeights(freelancer) };
    const candidates = openHirings.map((hiring) => ({
      id: hiring._id.toString(),
      quantity: hiring,
      tags: getHiringTags(hiring),
      weights: getHiringTagWeights(hiring),
    }));

    const ranked = computeCosineMatches(query, candidates);

    // Filter: only show matchScore >= 40%
    const filtered = ranked.filter((match) => match.matchScore >= MATCH_THRESHOLD);

    const matches = filtered.map((match) => {
      const hiring = match.quantity;
      return {
        hiringId: hiring._id,
        startupId: hiring.startupId,
        startupUserId: hiring.userId,
        startupName: hiring.startupInfo?.startupName || '',
        jobTitle: hiring.jobTitle || '',
        jobDescription: hiring.jobDescription || '',
        vacancies: hiring.vacancies || 0,
        salary: formatSalary(hiring.salary),
        employmentType: hiring.employmentType || 'Full Time',
        workMode: hiring.workMode || 'On-site',
        location: hiring.location || hiring.startupInfo?.location || '',
        requiredSkills: hiring.requiredSkills || [],
        preferredSkills: hiring.preferredSkills || [],
        domain: hiring.domain || '',
        experienceRequired: hiring.experienceRequired || '',
        criteria: hiring.criteria
          ? {
              minimumQualification: hiring.criteria.minimumQualification || '',
              minimumExperience: hiring.criteria.minimumExperience || '',
              eligibleDegrees: hiring.criteria.eligibleDegrees || [],
              eligibleBranches: hiring.criteria.eligibleBranches || [],
              certifications: hiring.criteria.certifications || [],
              additionalCriteria: hiring.criteria.additionalCriteria || '',
            }
          : null,
        matchScore: match.matchScore,
        similarity: match.similarity,
        matchedTags: match.matchedTags,
        freelancerTags: match.queryTags,
        hiringTags: match.candidateTags,
        sharedTags: match.vocabulary,
        freelancerVector: match.queryVector,
        hiringVector: match.candidateVector,
        dotProduct: match.dotProduct,
        freelancerMagnitude: match.queryMagnitude,
        hiringMagnitude: match.candidateMagnitude,
        freelancerDomain: Array.isArray(freelancer?.domains)
          ? freelancer.domains
          : freelancer?.domain || '',
        freelancerSkills: freelancer?.skills || [],
        freelancerInterests: freelancer?.interests || [],
        note: match.note,
        eligibility: evaluateFreelancerEligibility(freelancer, hiring),
      };
    });

    return res.status(200).json({
      success: true,
      count: matches.length,
      message: matches.length ? 'Ranked startup hiring opportunities based on cosine similarity.' : 'No matching opportunities.',
      matches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ranked freelancer profiles for a specific hiring record
// @route   GET /api/matching/startup/hiring/:hiringId/freelancers
// @access  Private (Startup only)
export const getStartupMatchFreelancers = async (req, res, next) => {
  try {
    const { hiringId } = req.params;

    const hiring = await StartupHiring.findOne({ _id: hiringId, userId: req.user._id }).lean();
    if (!hiring) {
      return res.status(404).json({ success: false, message: 'Hiring record not found or unauthorized.' });
    }

    // Fetch all freelancer profiles
    const allFreelancers = await FreelancerProfile.find().lean();
    if (!allFreelancers.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        matches: [],
        hiring,
        message: 'No freelancer profiles available.',
      });
    }

    // Collect freelancer userIds and check blocked status
    const freelancerUserIds = allFreelancers.map((f) => f.userId?.toString()).filter(Boolean);
    const blockedFreelancers = await User.find({
      _id: { $in: freelancerUserIds },
      isBlocked: true,
    }).select('_id').lean();
    const blockedFreelancerIds = new Set(blockedFreelancers.map((u) => u._id.toString()));

    // Filter out blocked freelancers
    const activeFreelancers = allFreelancers.filter((f) => {
      const uid = f.userId?.toString();
      return uid && !blockedFreelancerIds.has(uid);
    });

    if (!activeFreelancers.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        matches: [],
        hiring,
        message: 'No active freelancer profiles available.',
      });
    }

    const query = { tags: getHiringTags(hiring), weights: getHiringTagWeights(hiring) };
    const candidates = activeFreelancers.map((freelancer) => ({
      id: freelancer.userId.toString(),
      quantity: freelancer,
      tags: getFreelancerTags(freelancer),
      weights: getFreelancerTagWeights(freelancer),
    }));

    const ranked = computeCosineMatches(query, candidates);

    // Filter: only show matchScore >= 40%
    const filtered = ranked.filter((match) => match.matchScore >= MATCH_THRESHOLD);

    const matches = filtered.map((match) => {
      const freelancer = match.quantity;
      return {
        freelancerId: freelancer.userId,
        name: freelancer.name || '',
        domain: freelancer.domain || '',
        skills: freelancer.skills || [],
        interests: freelancer.interests || [],
        experience: freelancer.experience || '',
        bio: freelancer.bio || '',
        portfolio: freelancer.portfolio || '',
        matchScore: match.matchScore,
        similarity: match.similarity,
        matchedTags: match.matchedTags,
        hiringTags: match.queryTags,
        freelancerTags: match.candidateTags,
        sharedTags: match.vocabulary,
        hiringVector: match.queryVector,
        freelancerVector: match.candidateVector,
        dotProduct: match.dotProduct,
        hiringMagnitude: match.queryMagnitude,
        freelancerMagnitude: match.candidateMagnitude,
        note: match.note,
        eligibility: evaluateFreelancerEligibility(freelancer, hiring),
      };
    });

    return res.status(200).json({
      success: true,
      count: matches.length,
      message: matches.length ? 'Ranked freelancer profiles based on cosine similarity.' : 'No matching freelancers.',
      hiring: {
        _id: hiring._id,
        jobTitle: hiring.jobTitle,
        jobDescription: hiring.jobDescription,
        domain: hiring.domain,
        requiredSkills: hiring.requiredSkills,
        preferredSkills: hiring.preferredSkills,
        experienceRequired: hiring.experienceRequired,
        criteria: hiring.criteria,
      },
      matches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public profile of a freelancer (for startup to view)
// @route   GET /api/matching/freelancer/:freelancerId/profile
// @access  Private (Startup)
export const getFreelancerPublicProfile = async (req, res, next) => {
  try {
    const { freelancerId } = req.params;

    if (!freelancerId || !freelancerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid freelancer ID.' });
    }

    const user = await User.findById(freelancerId).select('name email role profileImage isBlocked');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Freelancer not found.' });
    }

    if (user.isBlocked) {
      return res.status(404).json({ success: false, message: 'This account is currently unavailable.' });
    }

    const profile = await FreelancerProfile.findOne({ userId: freelancerId }).lean();
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Freelancer profile not found.' });
    }

    // Return only public information - no private verification data
    return res.status(200).json({
      success: true,
      profile: {
        _id: profile._id,
        userId: user._id,
        name: profile.name || user.name,
        bio: profile.bio || '',
        domain: profile.domain || '',
        experience: profile.experience || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
        portfolio: profile.portfolio || '',
        profileImage: user.profileImage || '',
      },
    });
  } catch (error) {
    next(error);
  }
};
