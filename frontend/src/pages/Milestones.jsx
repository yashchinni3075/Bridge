import { useState } from "react";
import { Plus } from "lucide-react";
import { milestones as initialMilestones } from "../data/dummyData";
import { VerifyBadge, Button, Card } from "../components/ui";

export default function Milestones() {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  function handleSave() {
    if (!title.trim()) return;
    setMilestones((prev) => [
      {
        id: `m${prev.length + 1}`,
        title,
        category: category || "General",
        date: new Date().toISOString().slice(0, 10),
        verified: false,
        source: "Self-reported",
      },
      ...prev,
    ]);
    setTitle("");
    setCategory("");
    setShowForm(false);
  }

  return (
    <div>
      <header className="border-b border-line pb-5 mb-7 flex items-start justify-between">
        <div>
          <h1 className="font-display font-semibold text-[28px]">Milestone Timeline</h1>
          <p className="text-sm text-ink-soft mt-1.5">
            Verified vs. self-reported progress, visible to matched investors.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <span className="flex items-center gap-1.5">
            <Plus size={14} /> Log milestone
          </span>
        </Button>
      </header>

      {showForm && (
        <Card className="mb-7">
          <input
            className="w-full border border-line rounded-lg px-3 py-2 text-sm mb-2.5 bg-white"
            placeholder="Milestone title (e.g. Crossed 500 users)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="w-full border border-line rounded-lg px-3 py-2 text-sm mb-3 bg-white"
            placeholder="Category (e.g. Traction, Funding, Team)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Button onClick={handleSave}>Save (starts as unverified)</Button>
        </Card>
      )}

      <div className="relative pl-7">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-line" />
        {milestones.map((m) => (
          <div key={m.id} className="relative pb-6">
            <div className="absolute -left-7 top-1 w-2.5 h-2.5 rounded-full bg-coral ring-2 ring-coral ring-offset-2 ring-offset-paper" />
            <div className="font-mono text-[11px] text-ink-soft">
              {m.date} · {m.category}
            </div>
            <div className="font-semibold text-sm mt-0.5 flex items-center gap-2">
              {m.title}
              <VerifyBadge status={m.verified ? "verified" : "unverified"} />
            </div>
            <div className="text-xs text-ink-soft mt-1 font-mono">{m.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
