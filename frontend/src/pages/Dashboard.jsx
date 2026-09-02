import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { investorMatches, teammateMatches, pitchScore } from "../data/dummyData";
import { useAppState } from "../context/AppStateContext";
import { Tag, Button, SectionHead, VerifyBadge, Avatar } from "../components/ui";

function StatCard({ label, value, delta, deltaTone = "up" }) {
  return (
    <div className="bg-paper-raised border border-line p-4">
      <div className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="font-display font-semibold text-2xl mt-1.5">{value}</div>
      {delta && (
        <div className={`flex items-center gap-1 text-xs mt-1 ${deltaTone === "up" ? "text-emerald" : "text-rose"}`}>
          {deltaTone === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </div>
      )}
    </div>
  );
}

function MiniMatchRow({ id, kind, name, meta, tags = [], score }) {
  const to = kind === "investor" ? `/investors/${id}` : `/teammates/${id}`;
  return (
    <Link to={to} className="flex items-center gap-3 py-3.5 border-b border-line hover:bg-paper-raised/60 -mx-2 px-2 rounded-lg transition-colors">
      <Avatar name={name} size={34} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{name}</div>
        <div className="text-xs text-ink-soft mt-0.5">{meta}</div>
        <div className="mt-1.5">
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
      <div className="text-right font-mono text-coral text-lg shrink-0">
        {score}
        <span className="block text-[10px] text-ink-soft font-sans">match</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { auth, profile } = useAppState();

  return (
    <div>
      <header className="border-b border-line pb-5 mb-7">
        <h1 className="font-display font-semibold text-[28px]">
          Welcome back, {auth.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-soft mt-1.5">
          {profile.startupName
            ? `Here's where ${profile.startupName} stands today.`
            : "Complete your profile to start seeing real matches."}
        </p>
      </header>

      {profile.status !== "verified" && (
        <div className="mb-6 bg-amber-soft border border-amber/30 rounded-card p-4 flex items-center justify-between gap-4">
          <div className="text-sm text-[#8A611E]">
            <b className="font-display">
              {profile.status === "not_started" && "Your profile isn't started yet."}
              {profile.status === "draft" && "Your profile is incomplete."}
              {profile.status === "pending_review" && "Your profile is awaiting Admin verification."}
            </b>{" "}
            {profile.status !== "pending_review" &&
              "Admin can't verify your startup until every required field, registration proof, and pitch deck are complete."}
          </div>
          {profile.status !== "pending_review" && (
            <Link to="/profile/edit" className="shrink-0">
              <Button>
                <span className="flex items-center gap-1.5">
                  Complete profile <ArrowRight size={13} />
                </span>
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-px bg-line border border-line">
        <StatCard label="Pitch score" value={`${pitchScore.overall}/100`} delta="+6 this week" />
        <StatCard label="Investor matches" value={investorMatches.length} delta="+3 new" />
        <StatCard label="Open roles" value={profile.skillsNeeded?.length || 0} delta="Backend unfilled 18d" deltaTone="down" />
        <StatCard label="Verification" value={<VerifyBadge status={profile.status} />} />
      </div>

      <SectionHead title="Top investor matches" hint="Ranked by AI fit score" />
      <div className="border-t border-line">
        {investorMatches.slice(0, 3).map((inv) => (
          <MiniMatchRow
            key={inv.id}
            id={inv.id}
            kind="investor"
            name={inv.name}
            meta={`${inv.org} · ${inv.checkRange}`}
            tags={inv.sectors}
            score={inv.score}
          />
        ))}
      </div>
      <div className="mt-3">
        <Link to="/investors" className="text-sm text-coral font-semibold hover:underline">
          View all investor matches →
        </Link>
      </div>

      <SectionHead title="Recommended teammates" hint="Based on your open roles" />
      <div className="border-t border-line">
        {teammateMatches.slice(0, 3).map((t) => (
          <MiniMatchRow
            key={t.id}
            id={t.id}
            kind="teammate"
            name={`${t.name} — ${t.role}`}
            meta={`Available: ${t.availability}`}
            tags={t.skills}
            score={t.score}
          />
        ))}
      </div>
      <div className="mt-3 mb-4">
        <Link to="/teammates" className="text-sm text-coral font-semibold hover:underline">
          View all teammate matches →
        </Link>
      </div>
    </div>
  );
}
