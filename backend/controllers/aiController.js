import { GoogleGenAI, Type } from '@google/genai';
import StartupProfile from '../models/StartupProfile.js';

// Helper for exponential backoff retry
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiWithRetry = async (ai, requestConfig, retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(requestConfig);
    } catch (err) {
      const isRateLimitedOrBusy =
        err.message?.includes('503') ||
        err.message?.includes('high demand') ||
        err.message?.includes('429');

      if (isRateLimitedOrBusy && attempt < retries) {
        console.warn(`Gemini busy (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
        await wait(delay);
        delay *= 2; // exponential backoff
      } else {
        throw err;
      }
    }
  }
};

// @desc    Evaluate Startup Pitch Deck with AI
// @route   POST /api/ai/evaluate-pitch
// @access  Private (Startup or Admin)
export const evaluatePitchDeck = async (req, res, next) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: 'AI evaluation service unavailable. GEMINI_API_KEY is not configured.',
      });
    }

    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup profile not found. Please create your profile first.',
      });
    }

    if (!startup.pitchDeck) {
      return res.status(400).json({
        success: false,
        message: 'No pitch deck uploaded. Please upload your deck before requesting evaluation.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a venture capital investment committee analyst evaluating a startup pitch.
Analyze this startup profile data:
- Startup Name: ${startup.startupName}
- Founder: ${startup.founderName}
- Industry: ${startup.industry || 'Technology'}
- Current Stage: ${startup.startupStage || 'Early Stage'}
- Target Funding: $${startup.fundingRequired || 'Undisclosed'}
- Pitch Deck Link: ${startup.pitchDeck}
- Description: ${startup.description || 'Not provided'}

Evaluate this venture against core investor due-diligence criteria.
Scores must be whole integers between 0 and 100.
`;

    const requestConfig = {
     model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            marketClarityScore: { type: Type.INTEGER },
            tractionScore: { type: Type.INTEGER },
            teamStrengthScore: { type: Type.INTEGER },
            financialModelScore: { type: Type.INTEGER },
            askClarityScore: { type: Type.INTEGER },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'overallScore',
            'marketClarityScore',
            'tractionScore',
            'teamStrengthScore',
            'financialModelScore',
            'askClarityScore',
            'strengths',
            'weaknesses',
            'suggestions',
          ],
        },
      },
    };

    let response;
    try {
      response = await callGeminiWithRetry(ai, requestConfig, 3, 2000);
    } catch (primaryErr) {
      // If primary model is unavailable, fall back to gemini-2.5-flash-lite
      console.warn('Primary model busy. Falling back to gemini-2.5-flash-lite...');
      response = await callGeminiWithRetry(
        ai,
        { ...requestConfig, model: 'gemini-2.5-flash-lite' },
        2,
        1500
      );
    }

    if (!response.text) {
      return res.status(502).json({
        success: false,
        message: 'Empty response returned by the AI provider.',
      });
    }

    const parsedData = JSON.parse(response.text);

    // Persist or replace evaluation in MongoDB
    const evaluation = await PitchEvaluation.findOneAndUpdate(
      { startupProfileId: startup._id },
      {
        startupProfileId: startup._id,
        pitchDeckUrl: startup.pitchDeck,
        ...parsedData,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Pitch evaluation completed successfully.',
      evaluation,
    });
  } catch (error) {
    console.error('AI Pitch Evaluation Error:', error.message);

    if (error.message?.includes('503') || error.message?.includes('high demand')) {
      return res.status(503).json({
        success: false,
        message: 'AI service is experiencing temporary peak demand. Please try again in a moment.',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while evaluating your pitch deck.',
    });
  }
};

// @desc    Get Latest Pitch Evaluation for Logged-In Startup
// @route   GET /api/ai/pitch-evaluation
// @access  Private (Startup or Admin)
export const getPitchEvaluation = async (req, res, next) => {
  try {
    const startup = await StartupProfile.findOne({ userId: req.user._id });
    if (!startup) {
      return res.status(200).json({ success: true, evaluation: null });
    }

    const evaluation = await PitchEvaluation.findOne({
      startupProfileId: startup._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      evaluation,
    });
  } catch (error) {
    next(error);
  }
};