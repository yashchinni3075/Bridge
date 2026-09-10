/**
 * Heuristic Pitch Evaluation Engine
 * Used when external LLM rate limits (429) prevent live AI generation.
 */
function evaluatePitchHeuristically(startupData) {
  const pitchText = `${startupData.pitch || ''} ${startupData.description || ''}`.toLowerCase();
  const teamList = startupData.team || [];
  const milestones = startupData.progress?.milestones || [];
  const metrics = startupData.progress?.metrics || '';
  const minFund = Number(startupData.minimumFunding) || 0;
  const maxFund = Number(startupData.maximumFunding) || 0;

  // 1. Market Clarity (0-100)
  let marketClarity = 65;
  if (startupData.domain) marketClarity += 10;
  if (pitchText.includes('market') || pitchText.includes('customer') || pitchText.includes('enterprise') || pitchText.includes('cloud')) marketClarity += 15;
  marketClarity = Math.min(marketClarity, 95);

  // 2. Traction Proof (0-100)
  let tractionProof = 50;
  if (milestones.length > 0) tractionProof += milestones.length * 8;
  if (metrics.includes('$') || metrics.includes('k') || metrics.includes('arr') || metrics.includes('partner')) tractionProof += 20;
  tractionProof = Math.min(tractionProof, 92);

  // 3. Team Strength (0-100)
  let teamStrength = 60;
  if (teamList.length > 0) teamStrength += 15;
  const expText = teamList.map(m => m.experience || '').join(' ').toLowerCase();
  if (expText.includes('ex-') || expText.includes('staff') || expText.includes('lead') || expText.includes('senior')) teamStrength += 15;
  teamStrength = Math.min(teamStrength, 95);

  // 4. Financial Model (0-100)
  let financialModel = 65;
  if (minFund > 0 && maxFund >= minFund) financialModel += 15;
  if (metrics.length > 0) financialModel += 10;
  financialModel = Math.min(financialModel, 90);

  // 5. Ask Clarity (0-100)
  let askClarity = 60;
  if (maxFund > minFund && minFund > 0) askClarity += 25;
  if (startupData.stage) askClarity += 5;
  askClarity = Math.min(askClarity, 95);

  const overallScore = Math.round(
    marketClarity * 0.25 +
    tractionProof * 0.25 +
    teamStrength * 0.20 +
    financialModel * 0.15 +
    askClarity * 0.15
  );

  const strengths = [];
  if (teamStrength >= 80) strengths.push('Strong core technical execution capability with seasoned industry background.');
  if (tractionProof >= 75) strengths.push('Demonstrated early pilot traction and quantifiable ARR pipeline markers.');
  if (marketClarity >= 75) strengths.push('Clear addressable value proposition in target cloud infrastructure segment.');
  if (strengths.length === 0) strengths.push('Defined problem focus with articulated product concept.');

  const weaknesses = [];
  if (milestones.length < 3) weaknesses.push('Milestone trajectory needs expansion beyond initial launch targets.');
  if (minFund === 0) weaknesses.push('Funding floor and runway requirement boundaries lack specific definition.');
  if (weaknesses.length === 0) weaknesses.push('Monetization metrics require multi-quarter scale validation.');

  const suggestions = [
    'Publish verifiable enterprise case studies quantifying customer cloud cost reductions.',
    'Formulate a 12-month hiring roadmap detailing engineering vs. sales expansion.',
    'Define unit economics per workload migration to showcase capital efficiency.'
  ];

  return {
    overallScore,
    dimensions: {
      marketClarity,
      tractionProof,
      teamStrength,
      financialModel,
      askClarity
    },
    strengths,
    weaknesses,
    suggestions,
    isHeuristicFallback: true,
    evaluatedAt: new Date()
  };
}

export const evaluateStartupPitchWithAI = async (startupData) => {
  const apiKey = process.env.GEMINI_API_KEY;

  // Prioritize Lite & Flash tiers that have active free quota
  const modelsToTry = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-flash-lite-latest',
    'gemini-flash-latest'
  ];

  const prompt = `
You are a venture capital investment analyst evaluating a startup pitch for the Bridge platform.
Evaluate the following startup profile on 5 specific dimensions:
1. Market Clarity: Problem definition, addressable market size, target segment.
2. Traction Proof: Existing users, revenue, milestone progress, growth metrics.
3. Team Strength: Founder experience, engineering/domain competency, execution capabilities.
4. Financial Model: Capital efficiency, unit economics, clarity of funding bands.
5. Ask Clarity: Alignment between stage, capital sought, and stated goals.

Startup Data:
- Name: ${startupData.startupName || 'N/A'}
- Domain / Industry: ${startupData.domain || 'N/A'}
- Stage: ${startupData.stage || 'N/A'}
- Short Pitch: ${startupData.pitch || 'N/A'}
- Detailed Description: ${startupData.description || 'N/A'}
- Minimum Funding Ask: $${startupData.minimumFunding || 0}
- Maximum Funding Ask: $${startupData.maximumFunding || 0}
- Progress & Milestones: ${JSON.stringify(startupData.progress || {})}
- Team: ${JSON.stringify(startupData.team || [])}

Respond ONLY with a valid JSON object matching this schema:
{
  "overallScore": 82,
  "dimensions": {
    "marketClarity": 85,
    "tractionProof": 75,
    "teamStrength": 90,
    "financialModel": 80,
    "askClarity": 80
  },
  "strengths": [ "string", "string" ],
  "weaknesses": [ "string", "string" ],
  "suggestions": [ "string", "string" ]
}
`;

  if (apiKey) {
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

        if (!response.ok) {
          continue;
        }

        const json = await response.json();
        const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) continue;

        const cleanedText = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(cleanedText);

        return {
          overallScore: Math.round(parsed.overallScore),
          dimensions: {
            marketClarity: Math.round(parsed.dimensions?.marketClarity || 0),
            tractionProof: Math.round(parsed.dimensions?.tractionProof || 0),
            teamStrength: Math.round(parsed.dimensions?.teamStrength || 0),
            financialModel: Math.round(parsed.dimensions?.financialModel || 0),
            askClarity: Math.round(parsed.dimensions?.askClarity || 0),
          },
          strengths: (parsed.strengths || []).slice(0, 5),
          weaknesses: (parsed.weaknesses || []).slice(0, 5),
          suggestions: (parsed.suggestions || []).slice(0, 5),
          isHeuristicFallback: false,
          evaluatedAt: new Date(),
        };
      } catch {
        // Fall through to next model candidate
      }
    }
  }

  // Graceful heuristic fallback if Google quota limit (429) is hit across models
  return evaluatePitchHeuristically(startupData);
};