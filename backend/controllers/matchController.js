import StartupProfile from '../models/StartupProfile.js';
import InvestorProfile from '../models/InvestorProfile.js';
import FreelancerProfile from '../models/FreelancerProfile.js';
import Connection from '../models/Connection.js';

// Calculate compatibility between Startup and Investor
const calculateStartupInvestorScore = (startup, investor) => {
  let score = 0;
  const breakdown = [];

  const investorIndustries = Array.isArray(investor.preferredIndustries)
    ? investor.preferredIndustries
    : [];
  const investorStages = Array.isArray(investor.preferredStages)
    ? investor.preferredStages
    : [];

  // 1. Industry Overlap (40%)
  if (startup.industry && investorIndustries.length > 0) {
    const match = investorIndustries.some(
      (ind) => typeof ind === 'string' && ind.trim().toLowerCase() === startup.industry.trim().toLowerCase()
    );
    if (match) {
      score += 40;
      breakdown.push('Industry match (+40%)');
    }
  }

  // 2. Stage Overlap (30%)
  if (startup.startupStage && investorStages.length > 0) {
    const match = investorStages.some(
      (stg) => typeof stg === 'string' && stg.trim().toLowerCase() === startup.startupStage.trim().toLowerCase()
    );
    if (match) {
      score += 30;
      breakdown.push('Stage alignment (+30%)');
    }
  }

  // 3. Investment Range (30%)
  const fundReq = Number(startup.fundingRequired) || 0;
  const minInv = Number(investor.minimumInvestment) || 0;
  const maxInv = Number(investor.maximumInvestment) || Infinity;

  if (fundReq > 0 && fundReq >= minInv && fundReq <= maxInv) {
    score += 30;
    breakdown.push('Target funding fits within ticket range (+30%)');
  }

  return { compatibility: Math.min(score, 100), breakdown };
};

// Calculate compatibility between Startup and Freelancer
const calculateStartupFreelancerScore = (startup, freelancer) => {
  let score = 0;
  const breakdown = [];

  const rawRequired = Array.isArray(startup.requiredSkills) ? startup.requiredSkills : [];
  const rawPossessed = Array.isArray(freelancer.skills) ? freelancer.skills : [];

  const required = rawRequired
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => s.trim().toLowerCase());

  const possessed = rawPossessed
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => s.trim().toLowerCase());

  if (required.length > 0) {
    const matchedSkills = required.filter((skill) => possessed.includes(skill));
    const ratio = matchedSkills.length / required.length;
    const skillScore = Math.round(ratio * 80);
    score += skillScore;
    if (matchedSkills.length > 0) {
      breakdown.push(`Matched skills: ${matchedSkills.join(', ')} (+${skillScore}%)`);
    }
  } else {
    // Default baseline if startup has not itemized skills yet
    score += 40;
    breakdown.push('General skill availability (+40%)');
  }

  // Availability Bonus (20%)
  if (freelancer.availability && freelancer.availability.toLowerCase() !== 'not available') {
    score += 20;
    breakdown.push(`Available for ${freelancer.availability} (+20%)`);
  }

  return { compatibility: Math.min(score, 100), breakdown };
};

// @desc    Get recommended matches for logged-in user
// @route   GET /api/matches/recommendations
// @access  Private
export const getRecommendations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const currentRole = req.user.role;

    // Retrieve active connection pairs to filter out existing requests or connections
    const activeConnections = await Connection.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
      status: { $in: ['pending', 'accepted'] },
    });

    const connectedUserIds = new Set(
      activeConnections.map((c) =>
        c.senderId.toString() === currentUserId.toString()
          ? c.receiverId.toString()
          : c.senderId.toString()
      )
    );
    connectedUserIds.add(currentUserId.toString());

    let recommendations = [];

    if (currentRole === 'startup') {
      const myStartup = await StartupProfile.findOne({ userId: currentUserId });

      if (myStartup) {
        // Recommend Investors
        const rawInvestors = await InvestorProfile.find({
          userId: { $nin: Array.from(connectedUserIds) },
        }).populate('userId', 'name email profileImage isBlocked');

        // Filter out orphaned records and blocked users
        const investors = rawInvestors.filter((inv) => inv.userId && !inv.userId.isBlocked);

        const investorMatches = investors.map((inv) => {
          const { compatibility, breakdown } = calculateStartupInvestorScore(myStartup, inv);
          return {
            targetId: inv.userId._id,
            targetRole: 'investor',
            name: inv.investorName || inv.userId.name || 'Anonymous Investor',
            secondaryInfo: inv.organization || 'Angel Investor',
            profileImage: inv.profileImage || inv.userId.profileImage || '',
            compatibility,
            breakdown,
          };
        });

        // Recommend Freelancers
        const rawFreelancers = await FreelancerProfile.find({
          userId: { $nin: Array.from(connectedUserIds) },
        }).populate('userId', 'name email profileImage isBlocked');

        const freelancers = rawFreelancers.filter((free) => free.userId && !free.userId.isBlocked);

        const freelancerMatches = freelancers.map((free) => {
          const { compatibility, breakdown } = calculateStartupFreelancerScore(myStartup, free);
          const skillsList = Array.isArray(free.skills) ? free.skills.slice(0, 3).join(', ') : '';
          return {
            targetId: free.userId._id,
            targetRole: 'freelancer',
            name: free.name || free.userId.name || 'Independent Talent',
            secondaryInfo: skillsList || 'Available Talent',
            profileImage: free.profileImage || free.userId.profileImage || '',
            compatibility,
            breakdown,
          };
        });

        recommendations = [...investorMatches, ...freelancerMatches];
      }
    } else if (currentRole === 'investor') {
      const myInvestor = await InvestorProfile.findOne({ userId: currentUserId });

      if (myInvestor) {
        const rawStartups = await StartupProfile.find({
          userId: { $nin: Array.from(connectedUserIds) },
        }).populate('userId', 'name email profileImage isBlocked');

        const startups = rawStartups.filter((st) => st.userId && !st.userId.isBlocked);

        recommendations = startups.map((st) => {
          const { compatibility, breakdown } = calculateStartupInvestorScore(st, myInvestor);
          return {
            targetId: st.userId._id,
            targetRole: 'startup',
            name: st.startupName || 'Unnamed Venture',
            secondaryInfo: `${st.industry || 'Tech'} • ${st.startupStage || 'Early Stage'}`,
            profileImage: st.logo || st.userId.profileImage || '',
            compatibility,
            breakdown,
          };
        });
      }
    } else if (currentRole === 'freelancer') {
      const myFreelancer = await FreelancerProfile.findOne({ userId: currentUserId });

      if (myFreelancer) {
        const rawStartups = await StartupProfile.find({
          userId: { $nin: Array.from(connectedUserIds) },
        }).populate('userId', 'name email profileImage isBlocked');

        const startups = rawStartups.filter((st) => st.userId && !st.userId.isBlocked);

        recommendations = startups.map((st) => {
          const { compatibility, breakdown } = calculateStartupFreelancerScore(st, myFreelancer);
          return {
            targetId: st.userId._id,
            targetRole: 'startup',
            name: st.startupName || 'Unnamed Venture',
            secondaryInfo: `${st.industry || 'Tech'} • Seeking Talent`,
            profileImage: st.logo || st.userId.profileImage || '',
            compatibility,
            breakdown,
          };
        });
      }
    }

    // Sort descending by highest compatibility percentage
    recommendations.sort((a, b) => b.compatibility - a.compatibility);

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations: recommendations.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};