import { useState } from "react";
import { pitchScore as staticScore } from "../data/dummyData";
import { Button, Card } from "../components/ui";

// Same lightweight rule-based scorer as the backend placeholder,
// reproduced client-side so this page works standalone today.
function scoreText(text) {
  const t = text.toLowerCase();
  const has = (words) => words.some((w) => t.includes(w));
  const words = t.split(/\s+/).filter(Boolean).length;

  const marketClarity = has(["market", "customer", "problem", "target"])
    ? Math.min(90, 70 + words / 10)
    : 40;
  const traction = has(["users", "revenue", "growth", "customers", "sales"])
    ? Math.min(90, 65 + words / 12)
    : 35;
  const team = has(["team", "founder", "experience", "co-founder"]) ? 70 : 45;
  const financials = has(["funding", "raise", "valuation", "revenue", "burn"])
    ? 60
    : 35;
  const askClarity = has(["ask", "raising", "seeking", "investment of"]) ? 80 : 50;

  const breakdown = {
    "Market Clarity": Math.round(marketClarity),
    "Traction Proof": Math.round(traction),
    "Team Strength": Math.round(team),
    "Financial Model": Math.round(financials),
    "Ask Clarity": Math.round(askClarity),
  };
  const overall = Math.round(
    Object.values(breakdown).reduce((a, b) => a + b, 0) / 5
  );

  const notes = [];
  if (breakdown["Traction Proof"] < 55)
    notes.push("Traction proof is weak — add concrete user/revenue numbers.");
  if (breakdown["Financial Model"] < 55)
    notes.push("Financial details are unclear — clarify ask and use of funds.");
  if (breakdown["Market Clarity"] < 55)
    notes.push("Market/problem statement needs to be more specific.");
  if (notes.length === 0) notes.push("Solid pitch structure overall.");

  return { overall, breakdown, notes: notes.join(" ") };
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

export default function PitchScore() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(staticScore);

  function handleScore() {
    if (!text.trim()) return;
    const r = scoreText(text);
    setResult(r);
  }

  return (
    <div>
      <header className="border-b border-line pb-5 mb-7">
        <h1 className="font-display font-semibold text-[28px]">AI Pitch Readiness</h1>
        <p className="text-sm text-ink-soft mt-1.5">
          Paste your pitch summary — this is a placeholder rule-based scorer;
          swap for a real LLM API call once the backend is connected.
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
        <Button onClick={handleScore}>Score this pitch</Button>
      </Card>

      <div className="bg-paper-raised border border-line rounded-card p-6 grid grid-cols-[150px_1fr] gap-7">
        <ScoreRing value={result.overall} />
        <div className="flex flex-col gap-2.5 justify-center">
          {Object.entries(result.breakdown).map(([label, val]) => (
            <div key={label} className="grid grid-cols-[130px_1fr_34px] items-center gap-2.5">
              <span className="text-xs text-ink-soft">{label}</span>
              <div className="h-1.5 bg-line rounded-full overflow-hidden">
                <div className="h-full bg-emerald rounded-full" style={{ width: `${val}%` }} />
              </div>
              <span className="text-xs font-mono text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 bg-amber-soft border border-[#F0D19E] rounded-card p-4 text-sm text-[#8A611E]">
        <b className="font-display">AI note:</b> {result.notes}
      </div>
    </div>
  );
}
