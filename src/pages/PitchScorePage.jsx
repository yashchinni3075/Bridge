import { useState } from "react";
import { Sparkles, GaugeCircle } from "lucide-react";
import { pitchScore as staticScore } from "../data/dummyData";
import { Button, Card, PageHead } from "../components/ui";
import { useAppState } from "../context/AppStateContext";

// Same lightweight rule-based scorer as the backend placeholder,
// reproduced client-side so this page works standalone today.
function scoreText(text) {
  const t = text.toLowerCase();
  const has = (words) => words.some((w) => t.includes(w));
  const words = t.split(/\s+/).filter(Boolean).length;

  const marketClarity = has(["market", "customer", "problem", "target"]) ? Math.min(90, 70 + words / 10) : 40;
  const traction = has(["users", "revenue", "growth", "customers", "sales"]) ? Math.min(90, 65 + words / 12) : 35;
  const team = has(["team", "founder", "experience", "co-founder"]) ? 70 : 45;
  const financials = has(["funding", "raise", "valuation", "revenue", "burn"]) ? 60 : 35;
  const askClarity = has(["ask", "raising", "seeking", "investment of"]) ? 80 : 50;

  const breakdown = {
    "Market Clarity": Math.round(marketClarity),
    "Traction Proof": Math.round(traction),
    "Team Strength": Math.round(team),
    "Financial Model": Math.round(financials),
    "Ask Clarity": Math.round(askClarity),
  };
  const overall = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0) / 5);

  const notes = [];
  if (breakdown["Traction Proof"] < 55) notes.push("Traction proof is weak — add concrete user/revenue numbers.");
  if (breakdown["Financial Model"] < 55) notes.push("Financial details are unclear — clarify ask and use of funds.");
  if (breakdown["Market Clarity"] < 55) notes.push("Market/problem statement needs to be more specific.");
  if (notes.length === 0) notes.push("Solid pitch structure overall.");

  return { overall, breakdown, notes: notes.join(" ") };
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
  const [result, setResult] = useState(staticScore);
  const [scoredThisSession, setScoredThisSession] = useState(false);

  function handleScore() {
    if (!text.trim()) return;
    const r = scoreText(text);
    setResult(r);
    setScoredThisSession(true);
    notify({
      type: r.overall >= 70 ? "success" : "warning",
      icon: "score",
      title: `Pitch scored: ${r.overall}/100`,
      message:
        r.overall >= 70
          ? "Strong pitch — check the breakdown for fine-tuning tips."
          : "See the AI notes below to lift your weaker categories.",
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead
        title="AI Pitch Readiness"
        subtitle="Paste your pitch summary — a rule-based placeholder scorer stands in for the real LLM API until the backend is connected."
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
          <Button onClick={handleScore} disabled={!text.trim()} className="ml-auto w-full sm:w-auto">
            <GaugeCircle size={15} /> Score this pitch
          </Button>
        </div>
      </Card>

      <Card className={`mb-4 ${scoredThisSession ? "animate-pop" : ""}`}>
        <div className="grid items-center gap-7 py-2 sm:grid-cols-[auto_1fr]">
          <ScoreRing value={result.overall} />
          <div className="flex flex-col justify-center gap-3">
            {Object.entries(result.breakdown).map(([label, val]) => (
              <div key={label} className="grid grid-cols-[130px_1fr_34px] items-center gap-3">
                <span className="text-xs font-medium text-muted">{label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-app">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      val >= 70 ? "bg-emerald" : val >= 50 ? "bg-amber" : "bg-rose"
                    }`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-right font-mono text-xs font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex gap-3 rounded-card border border-brand-line bg-gradient-to-br from-brand-soft to-violet-100/60 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-raised text-brand shadow-card">
          <Sparkles size={16} />
        </span>
        <div className="text-sm leading-relaxed text-indigo-950">
          <b className="font-display">AI note:</b> {result.notes}
        </div>
      </div>
    </div>
  );
}
