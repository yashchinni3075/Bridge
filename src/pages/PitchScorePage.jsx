import { useState } from "react";
import { Sparkles, GaugeCircle, Loader2, CircleCheck, TriangleAlert, Lightbulb } from "lucide-react";
import { Button, Card, PageHead } from "../components/ui";
import { useAppState } from "../context/AppStateContext";
import { API_URL } from "../lib/api";

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

function scoreToneLabel(v) {
  if (v >= 75) return { text: "Investor-ready", cls: "text-emerald" };
  if (v >= 55) return { text: "Getting there", cls: "text-amber" };
  return { text: "Needs work", cls: "text-rose" };
}

function ScoreRing({ value }) {
  const deg = (value / 100) * 360;
  const tone = scoreToneLabel(value);
  return (
    <div
      className="grid h-36 w-36 shrink-0 place-items-center rounded-full transition-all duration-700"
      style={{ background: `conic-gradient(#4f46e5 0deg ${deg}deg, #e4e8f2 ${deg}deg 360deg)` }}
    >
      <div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-raised">
        <span className="font-display text-3xl font-bold tracking-tight">{value}</span>
        <span className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${tone.cls}`}>{tone.text}</span>
      </div>
    </div>
  );
}

export default function PitchScorePage() {
  const { notify } = useAppState();
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
      notify({
        type: data.totalScore >= 75 ? "success" : "warning",
        icon: "score",
        title: `Pitch scored: ${data.totalScore}/100`,
        message: "Review the AI suggestions below to raise your score.",
      });
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
    <div className="mx-auto max-w-3xl">
      <PageHead
        title="AI Pitch Readiness"
        subtitle="Paste your pitch summary — AI analyzes it, scores it, and suggests concrete ways to raise the score."
      />

      <Card className="mb-6">
        <textarea
          rows={6}
          className="w-full resize-none rounded-xl border border-line bg-app/50 px-4 py-3 text-sm leading-relaxed transition-shadow focus:border-brand-line focus:bg-raised focus:outline-none focus:ring-4 focus:ring-brand/10"
          placeholder="Paste your pitch deck summary text here… mention your market, traction numbers, team and funding ask."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted sm:flex">
            <Sparkles size={12} className="text-brand" /> {text.trim() ? `${text.trim().split(/\s+/).length} words` : "Awaiting input"}
          </p>
          <Button onClick={handleScore} disabled={!text.trim() || scoring} className="ml-auto w-full sm:w-auto">
            {scoring ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <GaugeCircle size={15} /> Score this pitch
              </>
            )}
          </Button>
        </div>
      </Card>

      {result?.valid === false && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose/25 bg-rose-soft p-4 text-sm font-medium text-rose">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          <span>{result.message}</span>
        </div>
      )}

      {result?.valid && (
        <Card className="mb-4 animate-pop">
          <div className="grid items-center gap-7 py-2 sm:grid-cols-[auto_1fr]">
            <ScoreRing value={result.totalScore} />
            <div className="flex flex-col justify-center gap-3">
              {categories.map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[130px_1fr_50px] items-center gap-3">
                  <span className="text-xs font-medium text-muted">{label}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-app">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        value >= 14 ? "bg-emerald" : value >= 9 ? "bg-amber" : "bg-rose"
                      }`}
                      style={{ width: `${(value / 20) * 100}%` }}
                    />
                  </div>
                  <span className="text-right font-mono text-xs font-semibold">{value}/20</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {result?.valid && (
        <div className="space-y-3 rounded-card border border-line bg-app/60 p-5">
          <Section
            icon={<CircleCheck size={15} className="text-emerald" />}
            title="Strengths"
            items={result.strengths}
            emptyText="No specific strengths identified."
          />
          <Section
            icon={<TriangleAlert size={15} className="text-rose" />}
            title="Weaknesses"
            items={result.weaknesses}
            emptyText="No specific weaknesses identified."
          />
          <Section
            icon={<Lightbulb size={15} className="text-brand" />}
            title="Suggestions to raise your score"
            items={result.suggestions}
            emptyText="No specific suggestions."
          />
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, items, emptyText }) {
  if (!items?.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted">
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
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</span>
        <ul className="mt-1 space-y-1 text-sm leading-relaxed text-ink/80">
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