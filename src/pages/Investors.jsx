import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { investorMatches } from "../data/dummyData";
import { VerifyBadge, Tag, Button, PageHead, Avatar, ScorePill, EmptyState, inputCls } from "../components/ui";
import { useAppState } from "../context/AppStateContext";

export default function Investors() {
  const { notify } = useAppState();
  const [activeSector, setActiveSector] = useState("All");
  const [query, setQuery] = useState("");
  const [sentTo, setSentTo] = useState([]);

  const sectors = useMemo(() => ["All", ...new Set(investorMatches.flatMap((i) => i.sectors))], []);

  const filtered = useMemo(
    () =>
      investorMatches
        .filter((i) => activeSector === "All" || i.sectors.includes(activeSector))
        .filter((i) => {
          if (!query.trim()) return true;
          const q = query.toLowerCase();
          return (
            i.name.toLowerCase().includes(q) ||
            i.org.toLowerCase().includes(q) ||
            i.sectors.some((s) => s.toLowerCase().includes(q))
          );
        })
        .sort((a, b) => b.score - a.score),
    [activeSector, query]
  );

  function requestIntro(inv) {
    setSentTo((s) => [...s, inv.id]);
    notify({
      type: "success",
      icon: "intro",
      title: `Intro requested — ${inv.name}`,
      message: `We'll ping you when ${inv.org} responds. Track it in Notifications.`,
    });
  }

  return (
    <div>
      <PageHead title="Discover Investors" subtitle="AI-ranked by sector, stage, and check-size fit." />

      {/* filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-64">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className={`${inputCls} py-2 pl-9`}
            placeholder="Search name, firm…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSector(s)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeSector === s
                  ? "border-brand bg-brand text-white shadow-[0_6px_16px_-8px_rgb(79_70_229/0.7)]"
                  : "border-line bg-raised text-muted hover:border-brand-line hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">{filtered.length} investors</p>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No investors match" hint="Try a different sector or clear your search." />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="group flex flex-wrap items-center gap-4 rounded-card border border-line bg-raised p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-line hover:shadow-pop sm:flex-nowrap"
            >
              <Avatar name={inv.name} size={44} />
              <Link to={`/investors/${inv.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold group-hover:text-brand">{inv.name}</span>
                  <VerifyBadge status={inv.verification} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span>{inv.title}</span>·<span>{inv.org}</span>·<span>{inv.checkRange}</span>·
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} /> {inv.location}
                  </span>
                </div>
                <div className="mt-1.5 hidden sm:block">
                  {inv.sectors.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                  <Tag tone="amber">{inv.stage}</Tag>
                </div>
              </Link>
              <div className="flex items-center gap-2.5">
                <Link to={`/investors/${inv.id}`}>
                  <Button variant="ghost">View profile</Button>
                </Link>
                <Button variant={sentTo.includes(inv.id) ? "soft" : "primary"} onClick={() => requestIntro(inv)} disabled={sentTo.includes(inv.id)}>
                  {sentTo.includes(inv.id) ? "Requested ✓" : "Request intro"}
                </Button>
                <ScorePill value={inv.score} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
