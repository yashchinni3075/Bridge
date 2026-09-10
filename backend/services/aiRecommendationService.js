/**
 * AI Recommendation & Synthesis Layer
 * Enhances deterministic matches with contextual VC/founder rationale.
 * Grounded strictly on actual DB facts. Falls back to deterministic explanations on failure.
 */

const callGeminiModel = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Active models from ListModels inspection
  const modelsToTry = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
  ];

  for (const modelName of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) continue;

      const json = await response.json();
      const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) continue;

      const cleanedText = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      return JSON.parse(cleanedText);
    } catch {
      // Continue to next candidate model
    }
  }

  return null;
};

/**
 * AI explanation for Investor <-> Startup match
 */
export const enrichInvestorStartupMatchWithAI = async (startup, investorProfile, deterministicData) => {
  const sMin = Number(startup.minimumFunding) || 0;
  const sMax = Number(startup.maximumFunding) || Number(startup.fundingRequirement) || 0;
  const iMin = Number(investorProfile.investmentPreferences?.minCheckSize) || 0;
  const iMax = Number(investorProfile.investmentPreferences?.maxCheckSize) || 0;

  const prompt = `
You are a venture capital matching advisor for the Bridge platform.
Analyze this compatibility match between an Investor and a Startup based ONLY on the provided verified database facts.
DO NOT invent, assume, or fabricate any unlisted investments, traction figures, skills, team members, or funding.

DATABASE FACTS:
- Investor: ${investorProfile.name || 'Anonymous Investor'}
  - Focus Sectors: ${(investorProfile.preferredDomains || []).join(', ') || 'N/A'}
  - Target Stages: ${(investorProfile.investmentPreferences?.stages || []).join(', ') || 'N/A'}
  - Target Check Size: $${iMin.toLocaleString()} - $${iMax.toLocaleString()}
  - Investor Bio/Experience: ${investorProfile.bio || investorProfile.experience || 'N/A'}

- Startup: ${startup.startupName}
  - Domain: ${startup.domain || 'N/A'}
  - Stage: ${startup.stage || 'N/A'}
  - Short Pitch: ${startup.pitch || 'N/A'}
  - Description: ${startup.description || 'N/A'}
  - Funding Ask: $${sMin.toLocaleString()} - $${sMax.toLocaleString()}
  - Reported Milestones: ${JSON.stringify(startup.progress?.milestones || [])}
  - Team: ${JSON.stringify((startup.team || []).map(t => ({ name: t.name, role: t.role })))}
  - Pitch Evaluation Score: ${startup.aiEvaluation?.overallScore || 'N/A'}/100

- Deterministic Compatibility Score: ${deterministicData.overallScore}%
- Deterministic Matches: ${deterministicData.matchingFactors.join('; ')}
- Deterministic Divergences: ${deterministicData.unmatchedFactors.join('; ')}

Respond ONLY with valid JSON:
{
  "aiExplanation": "2-3 concise sentences explaining specifically why this startup matches the investor's stated thesis and where caution is needed based only on facts.",
  "strategicSynergies": ["specific synergy 1", "specific synergy 2"],
  "dueDiligenceFocus": "1 concrete question or risk factor the investor should verify regarding the stated ask or stage."
}
`;

  try {
    const aiResult = await callGeminiModel(prompt);
    if (aiResult && aiResult.aiExplanation) {
      return {
        aiEnriched: true,
        aiExplanation: aiResult.aiExplanation,
        strategicSynergies: aiResult.strategicSynergies || [],
        dueDiligenceFocus: aiResult.dueDiligenceFocus || '',
      };
    }
  } catch {
    // Fail silently to deterministic baseline
  }

  // Graceful fallback
  return {
    aiEnriched: false,
    aiExplanation: deterministicData.explanation,
    strategicSynergies: deterministicData.matchingFactors,
    dueDiligenceFocus: deterministicData.unmatchedFactors[0] || 'Standard milestone validation',
  };
};

/**
 * AI explanation for Freelancer <-> Startup match
 */
export const enrichFreelancerStartupMatchWithAI = async (startup, freelancerProfile, deterministicData) => {
  const fSkills = (freelancerProfile.skills || []).join(', ');
  const fExperience = freelancerProfile.experience || 'Not specified';

  const prompt = `
You are a technical recruiter advisor for the Bridge platform.
Analyze this collaboration match between a Freelancer and a Startup based ONLY on the provided verified database facts.
DO NOT invent or extrapolate any unlisted skills, prior employers, traction, or project details.

DATABASE FACTS:
- Freelancer Profile:
  - Stated Domain: ${freelancerProfile.domain || 'N/A'}
  - Verified Skills: ${fSkills || 'N/A'}
  - Stated Experience: ${fExperience}
  - Listed Bio: ${freelancerProfile.bio || 'N/A'}

- Startup Profile:
  - Name: ${startup.startupName}
  - Domain: ${startup.domain || 'N/A'}
  - Stage: ${startup.stage || 'N/A'}
  - Problem/Pitch: ${startup.pitch || 'N/A'}
  - Current Status: ${startup.progress?.currentStatus || 'N/A'}
  - Existing Team: ${JSON.stringify((startup.team || []).map(t => ({ role: t.role })))}

- Deterministic Compatibility Score: ${deterministicData.overallScore}%
- Deterministic Matches: ${deterministicData.matchingFactors.join('; ')}
- Deterministic Divergences: ${deterministicData.unmatchedFactors.join('; ')}

Respond ONLY with valid JSON:
{
  "aiExplanation": "2-3 concise sentences explaining why this freelancer fits or diverges from the startup's current technical needs based strictly on listed skills and stage.",
  "keyContributions": ["1 specific area where listed skills apply directly"],
  "growthOpportunity": "1 area where freelancer could expand domain understanding"
}
`;

  try {
    const aiResult = await callGeminiModel(prompt);
    if (aiResult && aiResult.aiExplanation) {
      return {
        aiEnriched: true,
        aiExplanation: aiResult.aiExplanation,
        keyContributions: aiResult.keyContributions || [],
        growthOpportunity: aiResult.growthOpportunity || '',
      };
    }
  } catch {
    // Fail silently to deterministic baseline
  }

  // Graceful fallback
  return {
    aiEnriched: false,
    aiExplanation: deterministicData.explanation,
    keyContributions: deterministicData.matchingFactors,
    growthOpportunity: deterministicData.unmatchedFactors[0] || 'General technical onboarding',
  };
};