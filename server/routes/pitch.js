import { Router } from "express";

const router = Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const MIN_CHARS = 150;
const MIN_WORDS = 30;
const MAX_CHARS = 6000;
const LETTER_RATIO = 0.6;

const REJECTION_MSG =
  "Please provide a meaningful startup pitch containing problem, solution, market, traction, team, business model and funding ask.";
const UNAVAILABLE_MSG = "Pitch scoring service is temporarily unavailable. Please try again.";

function isValidPitch(text) {
  if (text.length < MIN_CHARS) return false;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS) return false;
  const letters = text.replace(/[^a-zA-Z]/g, "").length;
  if (letters / text.length < LETTER_RATIO) return false;
  return true;
}

const SYSTEM_PROMPT = `You are an expert startup pitch and fundraising analyst. Evaluate ONLY the information actually present in the pitch. NEVER invent, assume, or extrapolate details that are not explicitly stated.

Score each of the 5 categories 0-20 using this rubric:
- 0-4: missing or meaningless
- 5-8: very weak
- 9-12: partial
- 13-16: good
- 17-20: excellent with evidence

Categories:
1. marketClarity — how clearly the problem, target customer and market size are defined.
2. tractionProof — evidence of users, revenue, growth or customer traction.
3. teamStrength — founder/team background and relevant experience.
4. financialModel — business model, revenue, funding raised, valuation or burn.
5. askClarity — how explicit the funding ask and use of funds are.

Respond ONLY with valid JSON in this exact shape:
{
  "marketClarity": <integer 0-20>,
  "tractionProof": <integer 0-20>,
  "teamStrength": <integer 0-20>,
  "financialModel": <integer 0-20>,
  "askClarity": <integer 0-20>,
  "strengths": ["<string>", "..."],
  "weaknesses": ["<string>", "..."],
  "suggestions": ["<string>", "..."]
}

Rules:
- Every category value must be an integer in the range 0-20.
- strengths, weaknesses and suggestions must each be an array of 2-4 concise strings.
- Derive ALL analysis only from the pitch content (or its absence). Never fabricate details.
- If a category is missing from the pitch, score it 0-4 and note the gap in weaknesses/suggestions.
- strengths: what the pitch does well.
- weaknesses: what is missing, vague or unconvincing.
- suggestions: specific actions to raise the score.`;

function askGemini(text) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              marketClarity: { type: "INTEGER" },
              tractionProof: { type: "INTEGER" },
              teamStrength: { type: "INTEGER" },
              financialModel: { type: "INTEGER" },
              askClarity: { type: "INTEGER" },
              strengths: { type: "ARRAY", items: { type: "STRING" } },
              weaknesses: { type: "ARRAY", items: { type: "STRING" } },
              suggestions: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: [
              "marketClarity",
              "tractionProof",
              "teamStrength",
              "financialModel",
              "askClarity",
              "strengths",
              "weaknesses",
              "suggestions",
            ],
          },
        },
      }),
    }
  );
}

function askOpenAI(text) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });
}

async function callAI(text) {
  if (GEMINI_API_KEY) {
    const resp = await askGemini(text);
    if (resp.ok) {
      const data = await resp.json();
      const content = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "{}";
      return content;
    }
    const body = await resp.text().catch(() => "");
    console.error("Gemini error:", resp.status, body.slice(0, 300));
    throw new Error("gemini_failed");
  }

  if (OPENAI_API_KEY) {
    const resp = await askOpenAI(text);
    if (resp.ok) {
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || "{}";
    }
    const body = await resp.text().catch(() => "");
    console.error("OpenAI error:", resp.status, body.slice(0, 300));
    throw new Error("openai_failed");
  }

  throw new Error("no_ai_configured");
}

function clamp(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(20, Math.round(n))) : 0;
}

function cleanList(v) {
  return Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 5) : [];
}

/* POST /api/pitch-score
 * Validates the pitch text, then AI-scored via Gemini (preferred) or OpenAI.
 * Returns { valid: false, message } for invalid pitches or unavailable AI. */
router.post("/", async (req, res) => {
  const text = String(req.body?.text || "").trim();

  if (!text) {
    return res.status(400).json({ valid: false, message: REJECTION_MSG });
  }
  if (text.length > MAX_CHARS) {
    return res.status(400).json({ valid: false, message: "Pitch text is too long (max 6000 characters)." });
  }
  if (!isValidPitch(text)) {
    return res.json({ valid: false, message: REJECTION_MSG });
  }

  let content;
  try {
    content = await callAI(text);
  } catch (err) {
    console.error("pitch score AI error:", err.message);
    return res.status(503).json({ valid: false, message: UNAVAILABLE_MSG });
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("pitch score: AI returned invalid JSON");
    return res.status(503).json({ valid: false, message: UNAVAILABLE_MSG });
  }

  const marketClarity = clamp(parsed.marketClarity);
  const tractionProof = clamp(parsed.tractionProof);
  const teamStrength = clamp(parsed.teamStrength);
  const financialModel = clamp(parsed.financialModel);
  const askClarity = clamp(parsed.askClarity);
  const totalScore = marketClarity + tractionProof + teamStrength + financialModel + askClarity;

  return res.json({
    valid: true,
    totalScore,
    marketClarity,
    tractionProof,
    teamStrength,
    financialModel,
    askClarity,
    strengths: cleanList(parsed.strengths),
    weaknesses: cleanList(parsed.weaknesses),
    suggestions: cleanList(parsed.suggestions),
    provider: GEMINI_API_KEY ? "gemini" : "openai",
  });
});

export default router;