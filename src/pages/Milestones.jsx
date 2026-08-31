import { useState } from "react";
import { Plus, Trash2, Trophy, ShieldCheck } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { VerifyBadge, Button, Card, PageHead, EmptyState, inputCls } from "../components/ui";

const CATEGORY_SUGGESTIONS = ["Traction", "Funding", "Team", "Product", "Partnership"];

export default function Milestones() {
  const { milestones, addMilestone, removeMilestone, notify } = useAppState();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  function handleSave() {
    if (!title.trim()) return;
    addMilestone({ title: title.trim(), category: category.trim() || "General" });
    notify({
      type: "info",
      icon: "milestone",
      title: "Milestone logged",
      message: `"${title.trim()}" — starts as unverified until Admin or a connected data source confirms it.`,
    });
    setTitle("");
    setCategory("");
    setShowForm(false);
  }

  function handleDelete(m) {
    removeMilestone(m.id);
    notify({
      type: "info",
      icon: "milestone",
      title: "Milestone deleted",
      message: `"${m.title}" was removed from your timeline.`,
    });
  }

  return (
    <div>
      <PageHead
        title="Milestone Timeline"
        subtitle="Your progress story — verified vs. self-reported, visible to matched investors."
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Close form" : (
              <>
                <Plus size={15} /> Log milestone
              </>
            )}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 animate-pop">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Milestone title</label>
              <input
                className={inputCls}
                placeholder="e.g. Crossed 500 paying users"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold">Category</label>
              <input className={inputCls} placeholder="e.g. Traction" value={category} onChange={(e) => setCategory(e.target.value)} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                      category === c ? "border-brand bg-brand text-white" : "border-line bg-raised text-muted hover:border-brand-line hover:text-ink"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={!title.trim()} className="w-full sm:w-auto">
              Save milestone
            </Button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-muted">
            <ShieldCheck size={13} className="text-amber" />
            Every entry starts unverified — the Verified badge only comes from Admin or a connected data source.
          </p>
        </Card>
      )}

      {milestones.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No milestones yet"
          hint="Log your first win — traction, funding, hires, launches. It builds credibility with investors."
          action={
            <Button variant="soft" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Log your first milestone
            </Button>
          }
        />
      ) : (
        <div className="relative ml-2 space-y-7 border-l-2 border-line pl-7">
          {milestones.map((m) => (
            <div key={m.id} className="group relative">
              <span
                className={`absolute -left-[35px] top-1 grid h-4 w-4 place-items-center rounded-full ring-4 ring-app ${
                  m.verified ? "bg-emerald" : "bg-gradient-to-br from-indigo-500 to-violet-500"
                }`}
              >
                <Trophy size={8} className="text-white" strokeWidth={3} />
              </span>
              <div className="flex items-start justify-between gap-3 rounded-card border border-line bg-raised p-4 shadow-card transition-all group-hover:-translate-y-0.5 group-hover:shadow-pop">
                <div className="min-w-0">
                  <div className="font-mono text-[11px] uppercase tracking-wide text-muted">
                    {m.date} · {m.category}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{m.title}</span>
                    <VerifyBadge status={m.verified ? "verified" : "unverified"} />
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-muted">{m.source}</div>
                </div>
                <button
                  onClick={() => handleDelete(m)}
                  title="Delete milestone"
                  className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-rose-soft hover:text-rose"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
