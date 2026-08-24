import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { teammateMatches } from "../data/dummyData";
import { useAppState } from "../context/AppStateContext";
import { VerifyBadge, Tag, Button, Card, SectionHead, Avatar } from "../components/ui";

const STANDARD_ROLES = ["Product", "Backend", "Frontend", "Design", "Sales", "Growth Marketing", "Finance"];

export default function Teammates() {
  const { profile } = useAppState();
  const [activeRole, setActiveRole] = useState("All");
  const [invited, setInvited] = useState([]);

  const skillGaps = STANDARD_ROLES.filter((r) => !profile.skillsHave.includes(r));

  const roles = useMemo(
    () => ["All", ...new Set(teammateMatches.map((t) => t.role))],
    []
  );

  const filtered = useMemo(() => {
    return teammateMatches
      .filter((t) => activeRole === "All" || t.role === activeRole)
      .sort((a, b) => b.score - a.score);
  }, [activeRole]);

  return (
    <div>
      <header className="border-b border-line pb-5 mb-7">
        <h1 className="font-display font-semibold text-[28px]">Find Teammates</h1>
        <p className="text-sm text-ink-soft mt-1.5">
          Freelancers and co-founders matched to your open roles.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <Card>
          <h3 className="font-display font-semibold text-[15px] mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald" /> Skills your team has
          </h3>
          <div>
            {profile.skillsHave.length > 0 ? (
              profile.skillsHave.map((s) => <Tag key={s}>{s}</Tag>)
            ) : (
              <p className="text-xs text-ink-soft">Add these in Complete Profile.</p>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold text-[15px] mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose" /> AI-detected skill gaps
          </h3>
          <div>
            {skillGaps.map((s) => (
              <Tag key={s} tone="rose">
                {s}
              </Tag>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRole(r)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${
              activeRole === r
                ? "bg-ink text-white border-ink"
                : "bg-paper-raised text-ink-soft border-line"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <SectionHead title="Suggested collaborators" hint={`${filtered.length} matches`} />
      <div className="border-t border-line">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 py-4 border-b border-line hover:bg-paper-raised/60 transition-colors"
          >
            <Avatar name={t.name} size={40} />
            <Link to={`/teammates/${t.id}`} className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2">
                {t.name} — {t.role}
                <VerifyBadge status={t.verification} />
              </div>
              <div className="text-xs text-ink-soft mt-0.5">Available: {t.availability}</div>
              <div className="mt-1.5">
                {t.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </Link>
            <div className="flex items-center gap-3 shrink-0">
              <Link to={`/teammates/${t.id}`}>
                <Button variant="ghost">View profile</Button>
              </Link>
              <Button
                variant={invited.includes(t.id) ? "ghost" : "primary"}
                onClick={() => setInvited((s) => [...s, t.id])}
                disabled={invited.includes(t.id)}
              >
                {invited.includes(t.id) ? "Invited" : "Invite"}
              </Button>
              <div className="text-right font-mono text-coral text-xl w-10">
                {t.score}
                <span className="block text-[10px] text-ink-soft font-sans">match</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
