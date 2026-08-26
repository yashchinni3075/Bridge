import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { investorMatches, teammateMatches, pitchScore } from "../data/dummyData";
import { useAppState } from "../context/AppStateContext";
import { VerifyBadge } from "../components/ui";

function StatCard({ label, value, delta, deltaTone = "up" }) {
  return (
    <div className="bg-[#111827] border border-white/10 p-4 rounded-xl">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="font-bold text-2xl mt-1.5 text-white">{value}</div>
      {delta && (
        <div className={`flex items-center gap-1 text-xs mt-1 ${deltaTone === "up" ? "text-emerald-400" : "text-red-400"}`}>
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
    <Link to={to} className="flex items-center gap-3 py-3.5 border-b border-white/5 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors">
      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#3157ff]/15 text-[#5b8aff] text-xs font-bold">
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-white">{name}</div>
        <div className="text-xs text-gray-500 mt-0.5">{meta}</div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="inline-block rounded-full bg-[#3157ff]/10 px-2 py-0.5 text-[10px] font-bold text-[#5b8aff]">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right font-mono text-[#5b8aff] text-lg shrink-0">
        {score}
        <span className="block text-[10px] text-gray-500 font-sans">match</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { auth, profile } = useAppState();

  return (
    <div>
      <header className="border-b border-white/10 pb-5 mb-7">
        <h1 className="font-bold text-[28px] text-white">
          Welcome back, {auth.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-400 mt-1.5">
          {profile.startupName
            ? `Here's where ${profile.startupName} stands today.`
            : "Complete your profile to start seeing real matches."}
        </p>
      </header>

      {profile.status !== "verified" && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="text-sm text-amber-300">
            <b className="font-bold">
              {profile.status === "not_started" && "Your profile isn't started yet."}
              {profile.status === "draft" && "Your profile is incomplete."}
              {profile.status === "pending_review" && "Your profile is awaiting Admin verification."}
            </b>{" "}
            {profile.status !== "pending_review" &&
              "Admin can't verify your startup until every required field, registration proof, domain check, and pitch deck are complete."}
          </div>
          {profile.status !== "pending_review" && (
            <Link to="/profile" className="shrink-0">
              <button className="rounded-xl bg-[#3157ff] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2447e8]">
                <span className="flex items-center gap-1.5">
                  Complete profile <ArrowRight size={13} />
                </span>
              </button>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Pitch score" value={`${pitchScore.overall}/100`} delta="+6 this week" />
        <StatCard label="Investor matches" value={investorMatches.length} delta="+3 new" />
        <StatCard label="Open roles" value={profile.skillsNeeded?.length || 0} delta="Backend unfilled 18d" deltaTone="down" />
        <StatCard label="Verification" value={<VerifyBadge status={profile.status} />} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Top investor matches</h2>
            <p className="text-xs text-gray-500 mt-0.5">Ranked by AI fit score</p>
          </div>
        </div>
        <div className="border-t border-white/5">
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
          <Link to="/investors" className="text-sm text-[#5b8aff] font-semibold hover:underline">
            View all investor matches →
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Recommended teammates</h2>
            <p className="text-xs text-gray-500 mt-0.5">Based on your open roles</p>
          </div>
        </div>
        <div className="border-t border-white/5">
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
          <Link to="/teammates" className="text-sm text-[#5b8aff] font-semibold hover:underline">
            View all teammate matches →
          </Link>
        </div>
      </div>
    </div>
  );
}
