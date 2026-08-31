import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Search, Star } from "lucide-react";
import { teammateMatches } from "../data/dummyData";
import { useAppState } from "../context/AppStateContext";
import { VerifyBadge, Tag, Button, PageHead, Card, Avatar, ScorePill, EmptyState, inputCls } from "../components/ui";

const STANDARD_ROLES = ["Product", "Backend", "Frontend", "Design", "Sales", "Growth Marketing", "Finance"];

export default function Teammates() {
  const { profile, notify } = useAppState();
  const [activeRole, setActiveRole] = useState("All");
  const [query, setQuery] = useState("");
  const [invited, setInvited] = useState([]);

  const skillGaps = STANDARD_ROLES.filter((r) => !profile.skillsHave.includes(r));

  const roles = useMemo(() => ["All", ...new Set(teammateMatches.map((t) => t.role))], []);

  const filtered = useMemo(
    () =>
      teammateMatches
        .filter((t) => activeRole === "All" || t.role === activeRole)
        .filter((t) => {
          if (!query.trim()) return true;
          const q = query.toLowerCase();
          return (
            t.name.toLowerCase().includes(q) ||
            t.role.toLowerCase().includes(q) ||
            t.skills.some((s) => s.toLowerCase().includes(q))
          );
        })
        .sort((a, b) => b.score - a.score),
    [activeRole, query]
  );

  function invite(t) {
    setInvited((s) => [...s, t.id]);
    notify({
      type: "success",
      icon: "invite",
      title: `Invite sent — ${t.name}`,
      message: `${t.role} · we'll notify you when they respond.`,
    });
  }

  return (
    <div>
      <PageHead title="Find Teammates" subtitle="Freelancers and co-founders matched to your open roles." />

      {/* skill gap panel */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald/20">
          <h3 className="mb-3 flex items-center gap-2 font-display text-[15px] font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-soft text-emerald">
              <CheckCircle2 size={14} />
            </span>
            Skills your team has
          </h3>
          {profile.skillsHave.length > 0 ? (
            profile.skillsHave.map((s) => <Tag key={s} tone="emerald">{s}</Tag>)
          ) : (
            <Link to="/profile" className="text-xs font-semibold text-brand hover:underline">
              + Add them in Complete Profile
            </Link>
          )}
        </Card>
        <Card className="border-rose/20">
          <h3 className="mb-3 flex items-center gap-2 font-display text-[15px] font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-soft text-rose">
              <AlertTriangle size={14} />
            </span>
            AI-detected skill gaps
          </h3>
          {skillGaps.length > 0 ? (
            skillGaps.map((s) => <Tag key={s} tone="rose">{s}</Tag>)
          ) : (
            <p className="text-xs font-medium text-emerald">No gaps — your roster covers every core role.</p>
          )}
        </Card>
      </div>

      {/* filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-64">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className={`${inputCls} py-2 pl-9`}
            placeholder="Search name, role, skill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeRole === r
                  ? "border-brand bg-brand text-white shadow-[0_6px_16px_-8px_rgb(79_70_229/0.7)]"
                  : "border-line bg-raised text-muted hover:border-brand-line hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">{filtered.length} matches</p>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No teammates match" hint="Try another role filter or clear the search." />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="group flex flex-wrap items-center gap-4 rounded-card border border-line bg-raised p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-line hover:shadow-pop sm:flex-nowrap"
            >
              <Avatar name={t.name} size={44} />
              <Link to={`/teammates/${t.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold group-hover:text-brand">{t.name}</span>
                  <span className="text-xs text-muted">· {t.role}</span>
                  <VerifyBadge status={t.verification} />
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                  <span>Available: {t.availability}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber">
                    <Star size={11} className="fill-amber" /> {t.rating}
                  </span>
                  <span>{t.experience}</span>
                </div>
                <div className="mt-1.5 hidden sm:block">
                  {t.skills.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              </Link>
              <div className="flex items-center gap-2.5">
                <Link to={`/teammates/${t.id}`}>
                  <Button variant="ghost">View profile</Button>
                </Link>
                <Button variant={invited.includes(t.id) ? "soft" : "primary"} onClick={() => invite(t)} disabled={invited.includes(t.id)}>
                  {invited.includes(t.id) ? "Invited ✓" : "Invite"}
                </Button>
                <ScorePill value={t.score} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
