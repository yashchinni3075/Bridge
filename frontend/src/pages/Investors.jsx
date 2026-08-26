import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { investorMatches } from "../data/dummyData";
import { VerifyBadge, Tag, Button, SectionHead, Avatar } from "../components/ui";

export default function Investors() {
  const [activeSector, setActiveSector] = useState("All");
  const [sentTo, setSentTo] = useState([]);

  const sectors = useMemo(
    () => ["All", ...new Set(investorMatches.flatMap((i) => i.sectors))],
    []
  );

  const filtered = useMemo(() => {
    return investorMatches
      .filter((i) => activeSector === "All" || i.sectors.includes(activeSector))
      .sort((a, b) => b.score - a.score);
  }, [activeSector]);

  return (
    <div>
      <header className="border-b border-line pb-5 mb-7">
        <h1 className="font-display font-semibold text-[28px]">Discover Investors</h1>
        <p className="text-sm text-ink-soft mt-1.5">
          AI-ranked by sector, stage, and check-size fit.
        </p>
      </header>

      <div className="flex gap-2 flex-wrap mb-2">
        {sectors.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSector(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border ${
              activeSector === s
                ? "bg-ink text-white border-ink"
                : "bg-paper-raised text-ink-soft border-line"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <SectionHead title="All matches" hint={`${filtered.length} investors`} />
      <div className="border-t border-line">
        {filtered.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-4 py-4 border-b border-line hover:bg-paper-raised/60 transition-colors"
          >
            <Avatar name={inv.name} size={40} />
            <Link to={`/investors/${inv.id}`} className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2">
                {inv.name}
                <VerifyBadge status={inv.verification} />
              </div>
              <div className="text-xs text-ink-soft mt-0.5">
                {inv.org} · {inv.checkRange} check size
              </div>
              <div className="mt-1.5">
                {inv.sectors.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
                <Tag tone="amber">{inv.stage}</Tag>
              </div>
            </Link>
            <div className="flex items-center gap-3 shrink-0">
              <Link to={`/investors/${inv.id}`}>
                <Button variant="ghost">View profile</Button>
              </Link>
              <Button
                variant={sentTo.includes(inv.id) ? "ghost" : "primary"}
                onClick={() => setSentTo((s) => [...s, inv.id])}
                disabled={sentTo.includes(inv.id)}
              >
                {sentTo.includes(inv.id) ? "Requested" : "Request intro"}
              </Button>
              <div className="text-right font-mono text-coral text-xl w-10">
                {inv.score}
                <span className="block text-[10px] text-ink-soft font-sans">match</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
