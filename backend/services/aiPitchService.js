/**
 * Single canonical AI Pitch Evaluation service for the Bridge platform.
 *
 * Consolidates all pitch-scoring logic into one Gemini-backed implementation.
 * There is intentionally NO heuristic / fallback / mock scoring in the
 * production evaluation path. If Gemini cannot produce a valid structured
 * result, an honest service error is returned and nothing is saved.
 */
import { GoogleGenAI, Type } from '@google/genai';
import PitchEvaluation from '../models/PitchEvaluation.js';

export const INVALID_PITCH_MESSAGE =
  'Please provide a meaningful startup pitch containing the problem, solution, market, traction, team, business model and funding ask.';

export const HONEST_SERVICE_ERROR = 'AI pitch evaluation is temporarily unavailable. Please try again later.';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

// Gemini intermittently returns 503 "experiencing high demand" (UNAVAILABLE) for
// a specific model. Those spikes are per-model, so falling over to the next
// model almost always finds a healthy one. The chain is also the retry order.
export const GEMINI_MODEL_CHAIN = [
  DEFAULT_GEMINI_MODEL,
  'gemini-3-flash-preview',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
];

const MAX_GEMINI_ATTEMPTS = GEMINI_MODEL_CHAIN.length;

// Retryable = transient upstream problem (overload / rate limit / timeout) or a
// model that no longer exists (so a retired name falls over to the next model).
// Matched against both the error message and its status/code.
const RETRYABLE_PATTERN = /503|429|500|404|high demand|resource exhausted|unavailable|overloaded|not found|deadline|timed?\s?out/i;

const isRetryableError = (err) => {
  const message = err?.message || '';
  const status = String(err?.status ?? err?.code ?? '');
  return RETRYABLE_PATTERN.test(message) || RETRYABLE_PATTERN.test(status);
};

export const PITCH_TEXT_MAX = 12000;

const MIN_PITCH_CHARS = 150;
const MIN_MEANINGFUL_WORDS = 40;
const MIN_ALPHA_RATIO = 0.3;
const MIN_DISTINCT_LETTERS = 10;
const MIN_TOPIC_HITS = 3;
const MAX_LIST_ITEMS = 6;

// Backend-authoritative rubric (max per category, sum = 100).
const CATEGORY_MAX = Object.freeze({
  problemClarity: 15,
  solutionValueProposition: 15,
  marketOpportunity: 15,
  businessModel: 15,
  traction: 15,
  team: 10,
  competitiveAdvantage: 5,
  fundingAsk: 10,
});

const GIBBERISH_PATTERNS = Object.freeze([
  'qwerty',
  'asdf',
  'asdfghjkl',
  'zxcvbn',
  'abcdefgh',
  '123abc',
  'abc123',
  'asdfgh',
  'qwer',
  'testtest',
  'lorem ipsum',
  'the quick brown fox',
]);

const TOPIC_KEYWORDS = Object.freeze([
  'startup',
  'venture',
  'founder',
  'problem',
  'customer',
  'market',
  'solution',
  'product',
  'revenue',
  'traction',
  'user',
  'pilot',
  'team',
  'business',
  'model',
  'funding',
  'invest',
  'growth',
  'milestone',
  'roadmap',
  'launch',
  'sales',
  'pitch',
  'subscri',
  'proprietary',
]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class EvaluationError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export { EvaluationError, CATEGORY_MAX };

// ---------------------------------------------------------------
// Phase 3: Strict pitch validation (runs BEFORE any Gemini call)
// ---------------------------------------------------------------

const countMeaningfulWords = (text) => (text.match(/[a-zA-Z]{2,}/g) || []).length;

// 123abd, asdfghjkl, qqqqqqq, keyboard rows and repeated sequences are caught
// here. Valid but imperfectly written pitches are NOT over-rejected: length,
// word count, alphabetic ratio, distinct-letter variety and a light topic
// signal are the gates.
export const validatePitchInput = (rawText) => {
  const reject = () => ({ ok: false, message: INVALID_PITCH_MESSAGE });

  if (typeof rawText !== 'string') return reject();
  const text = rawText.trim();
  if (!text) return reject();

  if (text.length < MIN_PITCH_CHARS) return reject();

  if (countMeaningfulWords(text) < MIN_MEANINGFUL_WORDS) return reject();

  const lettersOnly = text.replace(/[^a-zA-Z]/g, '');
  if (!lettersOnly) return reject();
  if (lettersOnly.length / text.length < MIN_ALPHA_RATIO) return reject();

  const lower = text.toLowerCase();
  if (GIBBERISH_PATTERNS.some((pattern) => lower.includes(pattern))) return reject();

  // Excessive repeated run of the same character (e.g. qqqqqqqqq).
  if (/(.)\1{7,}/.test(text)) return reject();

  // Random strings reuse few distinct letters (e.g. abababab / 123abd).
  const distinctLetters = new Set(lower.replace(/[^a-z]/g, '')).size;
  if (distinctLetters <= MIN_DISTINCT_LETTERS) return reject();

  // Light startup-content signal; low threshold so imperfect pitches pass.
  const topicHits = TOPIC_KEYWORDS.reduce((count, keyword) => count + (lower.includes(keyword) ? 1 : 0), 0);
  if (topicHits < MIN_TOPIC_HITS) return reject();

  return { ok: true, value: text.slice(0, PITCH_TEXT_MAX) };
};

// ---------------------------------------------------------------
// Phase 4/5: validate Gemini structured output
// ---------------------------------------------------------------

export const validateCategoryScores = (scores) => {
  if (!scores || typeof scores !== 'object' || Array.isArray(scores)) {
    return { ok: false, message: 'Gemini returned no scores object.' };
  }
  const validated = {};
  for (const [key, max] of Object.entries(CATEGORY_MAX)) {
    const value = scores[key];
    if (!Number.isInteger(value) || value < 0 || value > max) {
      return { ok: false, message: `Invalid score for ${key}. Expected an integer between 0 and ${max}.` };
    }
    validated[key] = value;
  }
  return { ok: true, value: validated };
};

const parseGeminiText = (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new EvaluationError(502, HONEST_SERVICE_ERROR);
  }
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new EvaluationError(502, HONEST_SERVICE_ERROR);
  }
};

const cleanStringList = (value) => {
  if (!Array.isArray(value)) throw new EvaluationError(502, HONEST_SERVICE_ERROR);
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
    .filter(Boolean)
    .map((item) => item.slice(0, 500))
    .slice(0, MAX_LIST_ITEMS);
};

// Turns raw Gemini JSON into a normalized evaluation. The backend computes the
// authoritative overallScore by summing validated category scores.
const buildEvaluationResult = (raw, geminiModel) => {
  if (!raw || typeof raw !== 'object') throw new EvaluationError(502, HONEST_SERVICE_ERROR);

  const scoreResult = validateCategoryScores(raw.scores);
  if (!scoreResult.ok) throw new EvaluationError(502, scoreResult.message);

  const overallScore = Object.values(scoreResult.value).reduce((sum, value) => sum + value, 0);

  const summary = typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 800) : '';
  if (!summary) throw new EvaluationError(502, HONEST_SERVICE_ERROR);

  return {
    scores: scoreResult.value,
    overallScore,
    strengths: cleanStringList(raw.strengths),
    weaknesses: cleanStringList(raw.weaknesses),
    missingSections: cleanStringList(raw.missingSections),
    recommendations: cleanStringList(raw.recommendations),
    summary,
    geminiModel,
  };
};

// ---------------------------------------------------------------
// Gemini prompt / SDK call
// ---------------------------------------------------------------

const buildPrompt = ({ startupName, pitchText }) => `
You are a venture capital investment committee analyst evaluating a startup pitch on the Bridge platform.

Evaluate the pitch below for the startup "${startupName || 'Startup'}".

Rubric: score every category below with a whole integer from 0 up to its listed maximum. Do not invent an overall score.

- problemClarity (max 15): clarity of the problem being solved
- solutionValueProposition (max 15): strength of the solution and value proposition
- marketOpportunity (max 15): market size, target segment and opportunity
- businessModel (max 15): business model, unit economics and go-to-market
- traction (max 15): existing users, revenue, pilots, milestone progress
- team (max 10): founder and team credibility, relevant experience
- competitiveAdvantage (max 5): defensibility and differentiation
- fundingAsk (max 10): clarity of the funding ask and planned use of funds

Respond ONLY with a valid JSON object. No markdown, no code fences, no extra keys, no overallScore.

{
  "scores": {
    "problemClarity": 0,
    "solutionValueProposition": 0,
    "marketOpportunity": 0,
    "businessModel": 0,
    "traction": 0,
    "team": 0,
    "competitiveAdvantage": 0,
    "fundingAsk": 0
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingSections": ["string"],
  "recommendations": ["string"],
  "summary": "one concise paragraph"
}

PITCH TEXT:
"""${pitchText}
"""
`;

export const callGeminiWithRetry = async (ai, prompt) => {
  const primary = process.env.GEMINI_PITCH_MODEL || DEFAULT_GEMINI_MODEL;
  const chain = [primary, ...GEMINI_MODEL_CHAIN.filter((model) => model !== primary)];

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt += 1) {
    const model = chain[(attempt - 1) % chain.length];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scores: {
                type: Type.OBJECT,
                properties: Object.keys(CATEGORY_MAX).reduce((acc, key) => {
                  acc[key] = { type: Type.INTEGER };
                  return acc;
                }, {}),
                required: Object.keys(CATEGORY_MAX),
              },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingSections: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
            },
            required: ['scores', 'strengths', 'weaknesses', 'missingSections', 'recommendations', 'summary'],
          },
        },
      });
      return { response, model };
    } catch (err) {
      lastError = err;
      if (!isRetryableError(err) || attempt === MAX_GEMINI_ATTEMPTS) break;
      // Exponential backoff with jitter (≈1s, 2s, 4s) before trying the next model.
      const delay = Math.min(8000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 400);
      console.warn(
        `Gemini ${model} attempt ${attempt}/${MAX_GEMINI_ATTEMPTS} failed (transient); retrying in ${delay}ms`
      );
      await wait(delay);
    }
  }
  console.error('Gemini pitch evaluation failure:', lastError?.message || 'unknown error');
  throw new EvaluationError(503, HONEST_SERVICE_ERROR);
};

// ---------------------------------------------------------------
// Test-only mock guard. The production path never touches this; it exists
// strictly so the automated test harness can exercise the full pipeline
// (scoring validation, persistence, history, isolation) without network.
// ---------------------------------------------------------------

const MOCK_EVALUATION_JSON = {
  scores: {
    problemClarity: 12,
    solutionValueProposition: 11,
    marketOpportunity: 10,
    businessModel: 9,
    traction: 8,
    team: 7,
    competitiveAdvantage: 4,
    fundingAsk: 6,
  },
  strengths: ['Clear problem framing and customer pain point'],
  weaknesses: ['Traction numbers are still early stage'],
  missingSections: ['Detailed financial projections'],
  recommendations: ['Add unit economics and a 12-month hiring roadmap'],
  summary: 'A solid early-stage pitch with room to strengthen market sizing and financial depth.',
};

const mockGeminiResponse = () => {
  const mode = process.env.GEMINI_EVAL_MOCK_MODE || 'ok';
  if (mode === 'fail') throw new EvaluationError(503, HONEST_SERVICE_ERROR);
  if (mode === 'bad') return 'this is definitely not JSON';
  return JSON.stringify(MOCK_EVALUATION_JSON);
};

// ---------------------------------------------------------------
// Persistence + legacy summary sync
// ---------------------------------------------------------------

const saveEvaluation = async ({ startupProfile, inputSource, evaluationText, result }) => {
  const evaluation = await PitchEvaluation.create({
    startupProfileId: startupProfile._id,
    userId: startupProfile.userId,
    inputSource,
    pitchText: inputSource === 'MANUAL_TEXT' ? evaluationText : '',
    pitchDeckUrl: inputSource === 'PITCH_DECK' ? startupProfile.pitchDeck : null,
    pitchDeckFileName: inputSource === 'PITCH_DECK' ? startupProfile.pitchDeckOriginalName : null,
    scores: result.scores,
    overallScore: result.overallScore,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    missingSections: result.missingSections,
    recommendations: result.recommendations,
    summary: result.summary,
    geminiModel: result.geminiModel,
  });

  // Keep the compact legacy summary field in sync so the (frozen) matching /
  // search modules that sort by aiEvaluation.overallScore keep working.
  try {
    startupProfile.aiEvaluation = {
      overallScore: result.overallScore,
      dimensions: { ...result.scores },
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      suggestions: result.recommendations,
      evaluatedAt: new Date(),
    };
    await startupProfile.save();
  } catch (err) {
    console.warn('startupProfile.aiEvaluation sync skipped:', err.message);
  }

  return evaluation;
};

// ---------------------------------------------------------------
// Canonical entry point used by both controllers (manual + deck)
// ---------------------------------------------------------------

export const evaluatePitchForStartup = async ({ startupProfile, inputSource, pitchText }) => {
  if (!startupProfile || !startupProfile._id) {
    throw new EvaluationError(404, 'Startup profile not found. Complete your startup profile first.');
  }

  const source = inputSource === 'PITCH_DECK' ? 'PITCH_DECK' : 'MANUAL_TEXT';

  let evaluationText;

  if (source === 'PITCH_DECK') {
    if (!startupProfile.pitchDeck) {
      throw new EvaluationError(400, 'No pitch deck uploaded. Please upload a deck before requesting evaluation.');
    }
    const deckText = (startupProfile.pitchDeckText || '').trim();
    if (!deckText || deckText.length < MIN_PITCH_CHARS) {
      throw new EvaluationError(
        400,
        'This PDF does not contain enough extractable text for evaluation. Please upload a text-based PDF or enter the pitch manually.'
      );
    }
    evaluationText = deckText.slice(0, PITCH_TEXT_MAX);
  } else {
    const validation = validatePitchInput(pitchText);
    if (!validation.ok) throw new EvaluationError(400, INVALID_PITCH_MESSAGE);
    evaluationText = validation.value;
  }

  if (process.env.GEMINI_EVAL_MOCK === '1') {
    const raw = mockGeminiResponse();
    let result;
    try {
      result = buildEvaluationResult(typeof raw === 'string' ? parseGeminiText(raw) : raw, DEFAULT_GEMINI_MODEL);
    } catch (err) {
      if (err.status) throw err;
      throw new EvaluationError(502, HONEST_SERVICE_ERROR);
    }
    return saveEvaluation({ startupProfile, inputSource: source, evaluationText, result });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new EvaluationError(503, HONEST_SERVICE_ERROR);
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt({ startupName: startupProfile.startupName, pitchText: evaluationText });
  const { response, model } = await callGeminiWithRetry(ai, prompt);

  const raw = parseGeminiText(response?.text);
  const result = buildEvaluationResult(raw, model);

  return saveEvaluation({ startupProfile, inputSource: source, evaluationText, result });
};