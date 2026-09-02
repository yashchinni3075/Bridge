import { useState } from "react";
import { Button, Card } from "../components/ui";
import { Loader2, CircleCheck, TriangleAlert, Lightbulb } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const MIN_CHARS = 150;
const MIN_WORDS = 30;
const LETTER_RATIO = 0.6;
const REJECTION_MSG =
  "Please provide a meaningful startup pitch containing problem, solution, market, traction, team, business model and funding ask.";
const UNAVAILABLE_MSG = "Pitch scoring service is temporarily unavailable. Please try again.";

function validatePitch(text) {
  if (text.length < MIN_CHARS) return REJECTION_MSG;
  if (text.trim().split(/\s+/).filter(Boolean).length < MIN_WORDS) return REJECTION_MSG;
  if (text.replace(/[^a-zA-Z]/g, "").length / text.length < LETTER_RATIO) return REJECTION_MSG;
  return null;
}

function ScoreRing({ value }) {
  const deg = (value / 100) * 360;
  return (
    <div
      className="w-[130px] h-[130px] rounded-full flex items-center justify-center shrink-0"
      style={{
        background: `conic-gradient(#FF6B4A 0deg ${deg}deg, #E4E2DC ${deg}deg 360deg)`,
      }}
    >
      <div className="w-[102px] h-[102px] rounded-full bg-paper-raised flex flex-col items-center justify-center">
        <span className="font-display font-semibold text-3xl">{value}</span>
        <span className="text-[11px] text-ink-soft">out of 100</span>
      </div>
    </div>
  );
}

function Section({ icon, title, items, emptyText }) {
  if (!items?.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-soft">
        {icon}
        <span className="font-medium">{title}:</span>
        <span>{emptyText}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 shrink-0">{icon}</span>
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{title}</span>
        <ul className="mt-1 space-y-1 text-sm leading-relaxed">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PitchScore() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [scoring, setScoring] = useState(false);

  async function handleScore() {
    if (!text.trim() || scoring) return;

    const validationErr = validatePitch(text.trim());
    if (validationErr) {
      setResult({ valid: false, message: validationErr });
      return;
    }

    setScoring(true);
    try {
      const res = await fetch(`${API_URL}/api/pitch-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.valid === false) {
        throw new Error(data.message || `Scoring failed (${res.status})`);
      }
      setResult(data);
    } catch (err) {
      setResult({ valid: false, message: err.message || UNAVAILABLE_MSG });
    } finally {
      setScoring(false);
    }
  }

  const categories = result?.valid
    ? [
        { label: "Market Clarity", value: result.marketClarity },
        { label: "Traction Proof", value: result.tractionProof },
        { label: "Team Strength", value: result.teamStrength },
        { label: "Financial Model", value: result.financialModel },
        { label: "Ask Clarity", value: result.askClarity },
      ]
    : [];

  return (
    <div>
      <header className="border-b border-line pb-5 mb-7">
        <h1 className="font-display font-semibold text-[28px]">AI Pitch Readiness</h1>
        <p className="text-sm text-ink-soft mt-1.5">
          Paste your pitch summary — AI analyzes it, scores it, and suggests concrete ways to raise the score.
        </p>
      </header>

      <Card className="mb-6">
        <textarea
          rows={5}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-white mb-3"
          placeholder="Paste your pitch deck summary text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button onClick={handleScore} disabled={!text.trim() || scoring}>
          {scoring ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Analyzing…
            </>
          ) : (
            "Score this pitch"
          )}
        </Button>
      </Card>

      {result?.valid === false && (
        <div className="mb-4 flex items-start gap-2 rounded-card border border-rose/25 bg-rose-soft p-4 text-sm font-medium text-rose">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          <span>{result.message}</span>
        </div>
      )}

      {result?.valid && (
        <>
          <div className="bg-paper-raised border border-line rounded-card p-6 grid grid-cols-[150px_1fr] gap-7">
            <ScoreRing value={result.totalScore} />
            <div className="flex flex-col gap-2.5 justify-center">
              {categories.map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[130px_1fr_50px] items-center gap-2.5">
                  <span className="text-xs text-ink-soft">{label}</span>
                  <div className="h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        value >= 14 ? "bg-emerald" : value >= 9 ? "bg-amber" : "bg-rose"
                      }`}
                      style={{ width: `${(value / 20) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-right">{value}/20</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3 border border-line rounded-card bg-paper-raised p-5">
            <Section
              icon={<CircleCheck size={14} className="text-emerald" />}
              title="Strengths"
              items={result.strengths}
              emptyText="No specific strengths identified."
            />
            <Section
              icon={<TriangleAlert size={14} className="text-rose" />}
              title="Weaknesses"
              items={result.weaknesses}
              emptyText="No specific weaknesses identified."
            />
            <Section
              icon={<Lightbulb size={14} />}
              title="Suggestions to raise your score"
              items={result.suggestions}
              emptyText="No specific suggestions."
            />
          </div>
        </>
      )}
    </div>
  );
}