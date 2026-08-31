import { Link } from "react-router-dom";
import {
  ArrowRight, TrendingUp, Handshake, Users, ShieldCheck,
  GaugeCircle, ChevronRight, Rocket,
} from "lucide-react";
import { investorMatches, teammateMatches, pitchScore } from "../data/dummyData";
import { useAppState } from "../context/AppStateContext";
import { Tag, Button, VerifyBadge, Avatar, ScorePill } from "../components/ui";

function StatCard({ label, value, sub, icon: Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    emerald: "bg-emerald-soft text-emerald",
    amber: "bg-amber-soft text-amber",
    violet: "bg-violet-100 text-violet-600",
  };
  return (
    <div className="group rounded-card border border-line bg-raised p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-center justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
        {sub && <span className="text-[11px] font-medium text-muted">{sub}</span>}
      </div>
      <p className="mt-3.5 font-display text-[26px] font-bold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function MiniMatchRow({ id, kind, name, meta, tags = [], score }) {
  const to = kind === "investor" ? `/investors/${id}` : `/teammates/${id}`;
  return (
    <Link
      to={to}
      className="group -mx-2 flex items-center gap-3.5 rounded-xl px-2 py-3.5 transition-colors hover:bg-app"
    >
      <Avatar name={name} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-sm font-semibold">
          <span className="truncate">{name}</span>
          <ChevronRight size={14} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
        </div>
        <div className="mt-0.5 truncate text-xs text-muted">{meta}</div>
        <div className="mt-1.5">
          {tags.slice(0, 3).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
      <ScorePill value={score} />
    </Link>
  );
}

export default function Dashboard() {
  const { auth, profile } = useAppState();
  const firstName = auth.name.split(" ")[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {/* hero */}
      <div className="relative mb-7 overflow-hidden rounded-card bg-ink p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-brand/50 blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-500/30 blur-[90px]" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-indigo-300/80">
              {greeting}, {firstName}
            </p>
            <h1 className="mt-2 font-display text-[26px] font-bold tracking-tight text-white sm:text-3xl">
              {profile.startupName ? (
                <>
                  <Rocket size={22} className="mr-2 inline-block -translate-y-0.5 text-indigo-300" />
                  {profile.startupName} is on the runway.
                </>
              ) : (
                <>Let's get your startup noticed.</>
              )}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/60">
              {profile.startupName
                ? `Here's where things stand — matches, meetings and momentum.`
                : "Complete your profile to start seeing real investor and teammate matches."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {profile.status !== "verified" && profile.status !== "pending_review" && (
                <Link to="/profile">
                  <Button variant="primary">
                    Complete profile <ArrowRight size={14} />
                  </Button>
                </Link>
              )}
              <Link to="/investors">
                <Button variant="ghost" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-white/30">
                  Discover investors
                </Button>
              </Link>
              <Link to="/pitch">
                <Button variant="ghost" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-white/30">
                  Score my pitch
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* status nudge */}
      {profile.status === "draft" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-amber/25 bg-amber-soft px-4 py-3.5 text-sm font-medium text-amber">
          Your profile is a draft — Admin can't verify it until every required field, document, domain check and pitch deck are in.
          <Link to="/profile" className="font-bold underline underline-offset-2 hover:no-underline">
            Finish it now
          </Link>
        </div>
      )}
      {profile.status === "not_started" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-rose/25 bg-rose-soft px-4 py-3.5 text-sm font-medium text-rose">
          You haven't started your startup profile yet.
          <Link to="/profile" className="font-bold underline underline-offset-2 hover:no-underline">
            Start now
          </Link>
        </div>
      )}
      {profile.status === "pending_review" && (
        <div className="mb-6 rounded-card border border-emerald/25 bg-emerald-soft px-4 py-3.5 text-sm font-medium text-emerald">
          Profile submitted — awaiting Admin verification. You'll get a notification the moment your Verified badge lands.
        </div>
      )}

      {/* stats */}
      <div className="mb-9 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Pitch score" value={`${pitchScore.overall}`} sub="+6 this week" icon={GaugeCircle} tone="violet" />
        <StatCard label="Investor matches" value={investorMatches.length} sub="AI ranked" icon={Handshake} tone="brand" />
        <StatCard
          label="Open roles"
          value={profile.skillsNeeded?.length || 0}
          sub={<span className="inline-flex items-center gap-1"><TrendingUp size={11} /> hiring</span>}
          icon={Users}
          tone="emerald"
        />
        <StatCard label="Verification" value={<VerifyBadge status={profile.status} />} sub="Admin gated" icon={ShieldCheck} tone="amber" />
      </div>

      {/* matches */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-raised p-5 shadow-card">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold">Top investor matches</h2>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">by fit score</span>
          </div>
          <div className="divide-y divide-line/70">
            {investorMatches.slice(0, 3).map((inv) => (
              <MiniMatchRow
                key={inv.id}
                id={inv.id}
                kind="investor"
                name={`${inv.name} · ${inv.org}`}
                meta={`${inv.title} · ${inv.checkRange} check`}
                tags={inv.sectors}
                score={inv.score}
              />
            ))}
          </div>
          <Link to="/investors" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            View all investors <ArrowRight size={13} />
          </Link>
        </section>

        <section className="rounded-card border border-line bg-raised p-5 shadow-card">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold">Recommended teammates</h2>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">close skill gaps</span>
          </div>
          <div className="divide-y divide-line/70">
            {teammateMatches.slice(0, 3).map((t) => (
              <MiniMatchRow
                key={t.id}
                id={t.id}
                kind="teammate"
                name={`${t.name} · ${t.role}`}
                meta={`Available: ${t.availability} · ★ ${t.rating}`}
                tags={t.skills}
                score={t.score}
              />
            ))}
          </div>
          <Link to="/teammates" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            View all teammates <ArrowRight size={13} />
          </Link>
        </section>
      </div>
    </div>
  );
}
