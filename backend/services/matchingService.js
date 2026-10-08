/**
 * Deterministic Multi-Factor Normalized Matching Engine
 * No speculative ML claims: Uses transparent set-theoretic intersection,
 * range overlap, and stage compatibility heuristics.
 */

// Helper to extract clean lowercase token set
const tokenize = (text = '') => {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
};

// Jaccard similarity index between two string arrays or sets
const calculateJaccard = (arrA = [], arrB = []) => {
  const setA = new Set(arrA.map((s) => s.toLowerCase().trim()));
  const setB = new Set(arrB.map((s) => s.toLowerCase().trim()));
  if (setA.size === 0 || setB.size === 0) return { score: 0, intersection: [] };

  const intersection = [...setA].filter((x) => setB.has(x));
  const unionSize = new Set([...setA, ...setB]).size;
  return {
    score: intersection.length / unionSize,
    intersection,
  };
};

// Range overlap ratio [minA, maxA] vs [minB, maxB]
const calculateRangeOverlap = (minA, maxA, minB, maxB) => {
  const low = Math.max(minA || 0, minB || 0);
  const high = Math.min(maxA || Infinity, maxB || Infinity);

  if (low > high) return 0; // Disjoint ranges

  const overlapSpan = high - low;
  const targetSpan = Math.max((maxA || 1) - (minA || 0), 1);
  return Math.min(Math.max(overlapSpan / targetSpan, 0.25), 1.0);
};

/**
 * 1. Startup <-> Freelancer Matching
 */
export const calculateStartupFreelancerMatch = (startup, freelancerProfile) => {
  const matchingFactors = [];
  const unmatchedFactors = [];

  // A. Domain Fit (Weight: 30%)
  const startupDomain = (startup.domain || '').toLowerCase();
  const freelancerDomain = (freelancerProfile.domain || '').toLowerCase();
  let domainScore = 0;

  if (startupDomain && freelancerDomain) {
    if (startupDomain === freelancerDomain || startupDomain.includes(freelancerDomain) || freelancerDomain.includes(startupDomain)) {
      domainScore = 30;
      matchingFactors.push(`Direct domain alignment in ${freelancerProfile.domain}`);
    } else {
      const sTokens = tokenize(startup.domain + ' ' + startup.description);
      const fTokens = tokenize(freelancerProfile.domain);
      const common = [...fTokens].filter((t) => sTokens.has(t));
      if (common.length > 0) {
        domainScore = 18;
        matchingFactors.push(`Related industry relevance: ${common.join(', ')}`);
      } else {
        unmatchedFactors.push(`Different domain focus (${startup.domain} vs ${freelancerProfile.domain})`);
      }
    }
  } else {
    unmatchedFactors.push('Unspecified domain parameters');
  }

  // B. Skillset Coverage (Weight: 35%)
  const fSkills = freelancerProfile.skills || [];
  const startupText = `${startup.pitch || ''} ${startup.description || ''} ${startup.domain || ''}`;
  const sTokens = tokenize(startupText);

  let matchedSkills = fSkills.filter((skill) => {
    const sLower = skill.toLowerCase();
    return sTokens.has(sLower) || startupText.toLowerCase().includes(sLower);
  });

  let skillScore = 0;
  if (fSkills.length > 0) {
    const coverage = matchedSkills.length / Math.min(fSkills.length, 5);
    skillScore = Math.round(Math.min(coverage, 1.0) * 35);
    if (matchedSkills.length > 0) {
      matchingFactors.push(`Key technical skills matched: ${matchedSkills.slice(0, 4).join(', ')}`);
    }
    const missing = fSkills.filter((s) => !matchedSkills.includes(s));
    if (missing.length > 0) {
      unmatchedFactors.push(`Unmatched specialized skills: ${missing.slice(0, 3).join(', ')}`);
    }
  } else {
    unmatchedFactors.push('No technical skills listed on profile');
  }

  // C. Interest Synergy (Weight: 20%)
  const fInterests = freelancerProfile.interests || [];
  let interestScore = 0;
  if (fInterests.length > 0) {
    const matchedInterests = fInterests.filter((interest) =>
      startupText.toLowerCase().includes(interest.toLowerCase())
    );
    if (matchedInterests.length > 0) {
      interestScore = Math.round((matchedInterests.length / fInterests.length) * 20);
      matchingFactors.push(`Mutual project interest: ${matchedInterests.join(', ')}`);
    } else {
      interestScore = 5; // Base exploration credit
      unmatchedFactors.push('Interests not explicitly mirrored in startup pitch');
    }
  }

  // D. Experience & Stage Compatibility (Weight: 15%)
  const experience = (freelancerProfile.experience || '').toLowerCase();
  const stage = (startup.stage || '').toLowerCase();
  let experienceScore = 10;

  if (experience.includes('senior') || experience.includes('5+') || experience.includes('lead') || experience.includes('4')) {
    experienceScore = 15;
    matchingFactors.push('Senior engineering background suitable for high-autonomy environments');
  } else if (stage.includes('idea') || stage.includes('mvp')) {
    experienceScore = 14;
    matchingFactors.push('Experience level corresponds with rapid prototyping stage');
  }

  const overallScore = Math.min(Math.max(domainScore + skillScore + interestScore + experienceScore, 10), 99);

  return {
    overallScore,
    dimensions: {
      domainFit: domainScore,
      skillsetCoverage: skillScore,
      interestSynergy: interestScore,
      experienceStageFit: experienceScore,
    },
    matchingFactors,
    unmatchedFactors,
    explanation:
      overallScore >= 75
        ? `Strong candidate compatibility (${overallScore}%). High alignment between technical skillset and project objectives.`
        : `Moderate compatibility (${overallScore}%). Potential skill synergies exist, with partial domain divergence.`,
  };
};

/**
 * 2. Startup <-> Investor Matching
 */
export const calculateStartupInvestorMatch = (startup, investorProfile) => {
  const matchingFactors = [];
  const unmatchedFactors = [];

  // A. Domain & Industry Fit (Weight: 30%)
  const preferredDomains = (investorProfile.preferredDomains || []).map((d) => d.toLowerCase());
  const sDomain = (startup.domain || '').toLowerCase();
  let domainScore = 0;

  if (preferredDomains.some((d) => sDomain.includes(d) || d.includes(sDomain))) {
    domainScore = 30;
    matchingFactors.push(`Direct portfolio domain focus in ${startup.domain}`);
  } else {
    unmatchedFactors.push(`Startup domain (${startup.domain}) is outside primary preferred sectors`);
  }

  // B. Stage Alignment (Weight: 25%)
  const targetStages = (investorProfile.investmentPreferences?.stages || []).map((s) => s.toLowerCase());
  const sStage = (startup.stage || '').toLowerCase();
  let stageScore = 0;

  if (targetStages.some((st) => sStage.includes(st) || st.includes(sStage))) {
    stageScore = 25;
    matchingFactors.push(`Stage match: currently at ${startup.stage}`);
  } else {
    stageScore = 8;
    unmatchedFactors.push(`Stage divergence: startup is ${startup.stage}, investor targets ${targetStages.join(', ')}`);
  }

  // C. Capital & Check-Size Overlap (Weight: 30%)
  const sMin = Number(startup.minimumFunding) || 0;
  const sMax = Number(startup.maximumFunding) || Number(startup.fundingRequirement) || 0;
  const iMin = Number(investorProfile.investmentPreferences?.minCheckSize) || 0;
  const iMax = Number(investorProfile.investmentPreferences?.maxCheckSize) || Infinity;

  let capitalScore = 0;
  const overlapRatio = calculateRangeOverlap(sMin, sMax, iMin, iMax);

  if (overlapRatio > 0.6) {
    capitalScore = 30;
    matchingFactors.push(`Funding requirements ($${sMin.toLocaleString()} - $${sMax.toLocaleString()}) fit investor check window`);
  } else if (overlapRatio > 0) {
    capitalScore = 18;
    matchingFactors.push('Partial funding window overlap');
  } else {
    unmatchedFactors.push(`Funding ask ($${sMin.toLocaleString()} - $${sMax.toLocaleString()}) falls outside typical check size`);
  }

  // D. Strategic Pitch Viability (Weight: 15%)
  let pitchScore = 10;
  if (startup.aiEvaluation?.overallScore) {
    const aiPoints = Math.round((startup.aiEvaluation.overallScore / 100) * 15);
    pitchScore = Math.max(aiPoints, 8);
    matchingFactors.push(`Independent pitch viability score: ${startup.aiEvaluation.overallScore}/100`);
  }

  const overallScore = Math.min(Math.max(domainScore + stageScore + capitalScore + pitchScore, 10), 99);

  return {
    overallScore,
    dimensions: {
      domainFit: domainScore,
      stageAlignment: stageScore,
      capitalFit: capitalScore,
      pitchViability: pitchScore,
    },
    matchingFactors,
    unmatchedFactors,
    explanation:
      overallScore >= 75
        ? `High investment thesis alignment (${overallScore}%). Strong sector, stage, and check-size compatibility.`
        : `Moderate thesis fit (${overallScore}%). Review capital requirements and sector boundaries.`,
  };
};