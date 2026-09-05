import { useFreelancer } from "../../context/FreelancerContext";
import { STARTUPS } from "../../data/freelancerData";
import { matchScore, candidateScore } from "../../utils/matchEngine";
import Badge from "../../components/freelancer/Badge";
import VerifiedBadge from "../../components/freelancer/VerifiedBadge";
import MiniBar from "../../components/freelancer/MiniBar";
import StatCard from "../../components/freelancer/StatCard";

export default function Dashboard({ setPage }) {
  const { role, freelancer, startup, startups, freelancers, applications } =
    useFreelancer();
  const isFreelancer = role === "Freelancer";

  if (!freelancer) {
    return (
      <div className="p-6 text-sm text-founda-muted">Loading dashboard...</div>
    );
  }

  const topMatches = isFreelancer
    ? STARTUPS.map((s) => ({
        s,
        bd: matchScore(freelancer, s, freelancer.engagement),
      }))
        .sort((a, b) => b.bd.total - a.bd.total)
    : freelancers
        .map((f) => ({ f, bd: candidateScore(f, startup) }))
        .sort((a, b) => b.bd.total - a.bd.total);

  const relevantApps = applications.filter((a) =>
    isFreelancer ? a.freelancerId === freelancer.id : a.startupId === startup.id,
  );

  const counts = {
    applied: relevantApps.filter((a) => a.status === "Applied").length,
    shortlisted: relevantApps.filter((a) => a.status === "Shortlisted").length,
    interview: relevantApps.filter((a) => a.status === "Interview").length,
    accepted: relevantApps.filter((a) => a.status === "Accepted").length,
  };

  const domainData = isFreelancer
    ? [...new Set(STARTUPS.map((s) => s.domain))]
        .map((domain) => {
          const matches = STARTUPS.filter((s) => s.domain === domain);
          const value = matches.length
            ? Math.max(
                ...matches.map(
                  (s) => matchScore(freelancer, s, freelancer.engagement).total,
                ),
              )
            : 0;
          return { domain, value };
        })
        .filter((x) => x.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    : startup.requiredSkills.map((skill) => ({
        domain: skill,
        value: Math.max(
          ...freelancers.map((f) =>
            f.skills.some((x) => x.toLowerCase() === skill.toLowerCase())
              ? 100
              : 25,
          ),
        ),
      }));

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-founda-purple";
    if (score >= 40) return "text-amber-500";
    return "text-slate-400";
  };

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-card lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-founda-purple">
            {isFreelancer ? "Freelancer workspace" : "Startup workspace"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-founda-ink lg:text-3xl">
            Welcome back,{" "}
            {isFreelancer
              ? (freelancer?.name || "").split(" ")[0] || "there"
              : startup.name}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-founda-muted">
            {isFreelancer
              ? "Your dashboard shows match quality, application progress, and verification health at a glance."
              : "Your dashboard shows candidate quality, hiring progress, and startup credibility at a glance."}
          </p>
        </div>
        <button className="btn-primary self-start lg:self-center" onClick={() => setPage("match")}>
          {isFreelancer ? "Find Best Matches" : "Find Candidates"}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isFreelancer ? (
          <>
            <StatCard
              label="AI Matches"
              value={topMatches.length}
              hint="ranked opportunities"
              icon={<span className="text-founda-purple">&#9889;</span>}
            />
            <StatCard
              label="Applications"
              value={relevantApps.length}
              hint="from Match Engine"
              icon={<span className="text-founda-blue">&#8599;</span>}
            />
            <StatCard
              label="Shortlisted"
              value={counts.shortlisted}
              hint="moving forward"
              icon={<span className="text-founda-teal">&#9733;</span>}
            />
            <StatCard
              label="Trust Score"
              value={`${freelancer.trustScore}/100`}
              hint="verified evidence"
              icon={<span className="text-emerald-500">&#10003;</span>}
            />
          </>
        ) : (
          <>
            <StatCard
              label="AI Candidates"
              value={topMatches.length}
              hint="ranked professionals"
              icon={<span className="text-founda-purple">&#9889;</span>}
            />
            <StatCard
              label="Active Hiring"
              value={relevantApps.length}
              hint="candidate pipeline"
              icon={<span className="text-founda-blue">&#8599;</span>}
            />
            <StatCard
              label="Shortlisted"
              value={counts.shortlisted}
              hint="moving forward"
              icon={<span className="text-founda-teal">&#9733;</span>}
            />
            <StatCard
              label="Startup Trust"
              value={`${startup.trust}/100`}
              hint="profile credibility"
              icon={<span className="text-emerald-500">&#10003;</span>}
            />
          </>
        )}
      </div>

      {/* Domain performance + Pipeline */}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-founda-ink">
                {isFreelancer
                  ? "Match performance by domain"
                  : "Candidate skill coverage"}
              </h2>
              <p className="mt-1 text-xs text-founda-muted">
                {isFreelancer
                  ? "Highest AI match score available in each domain."
                  : "How strongly the current candidate pool covers your required skills."}
              </p>
            </div>
            <Badge tone="teal">Live</Badge>
          </div>

          <div className="space-y-4">
            {domainData.map((item) => (
              <div key={item.domain}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="max-w-[70%] truncate font-medium text-slate-600">
                    {item.domain}
                  </span>
                  <span className={`font-semibold ${getScoreColor(item.value)}`}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-founda-purple via-founda-blue to-founda-teal transition-all duration-700 ease-out"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold text-founda-ink">
            Pipeline distribution
          </h2>
          <p className="mt-1 text-xs text-founda-muted">
            Current applications linked to this profile.
          </p>
          <div className="mx-auto mt-6 flex flex-col items-center">
            <div
              className="grid h-36 w-36 place-items-center rounded-full"
              style={{
                background:
                  "conic-gradient(#5B21F4 0 45%, #0879E8 45% 70%, #12C7B0 70% 88%, #CBD5E1 88% 100%)",
              }}
            >
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                <div>
                  <div className="text-2xl font-bold text-founda-ink">
                    {relevantApps.length}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-founda-muted">
                    Total
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 grid w-full grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-founda-purple" />
                <span className="font-medium text-slate-600">Applied {counts.applied}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-founda-blue" />
                <span className="font-medium text-slate-600">Shortlisted {counts.shortlisted}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-founda-teal" />
                <span className="font-medium text-slate-600">Interview {counts.interview}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="font-medium text-slate-600">Accepted {counts.accepted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top matches + Health */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">
                Top ranked {isFreelancer ? "opportunities" : "candidates"}
              </h2>
              <p className="mt-1 text-xs text-founda-muted">
                Generated from the same Match Engine used by the Match page.
              </p>
            </div>
            <button
              className="text-xs font-semibold text-founda-purple hover:underline"
              onClick={() => setPage("match")}
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {topMatches.slice(0, 4).map((item, index) => {
              const entity = isFreelancer ? item.s : item.f;
              return (
                <div
                  key={entity.id}
                  className="flex items-center gap-3 rounded-2xl border border-founda-line p-3.5 transition-all hover:border-founda-purple/30 hover:shadow-sm"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-founda-purple/10 to-founda-teal/10 text-sm font-bold text-founda-purple">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-founda-ink">
                        {entity.name}
                      </p>
                      {isFreelancer && entity.verified && <VerifiedBadge />}
                    </div>
                    <p className="truncate text-xs text-founda-muted">
                      {isFreelancer ? entity.domain : entity.headline}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(item.bd.total)}`}>
                      {item.bd.total}%
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-founda-muted">
                      Match
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold">
            {isFreelancer
              ? "Profile & verification health"
              : "Startup profile health"}
          </h2>
          <p className="mt-1 text-xs text-founda-muted">
            Signals that directly affect trust and match quality.
          </p>
          <div className="mt-5">
            {isFreelancer ? (
              <>
                <MiniBar label="Profile completeness" value={92} />
                <MiniBar
                  label="Verification coverage"
                  value={Math.round(
                    (Object.values(freelancer.verification || {}).filter(
                      (v) => v === "verified",
                    ).length /
                      6) *
                      100,
                  )}
                />
                <MiniBar label="Portfolio strength" value={90} />
              </>
            ) : (
              <>
                <MiniBar label="Startup credibility" value={startup.trust} />
                <MiniBar label="Role clarity" value={92} />
                <MiniBar label="Hiring readiness" value={86} />
              </>
            )}
          </div>
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-violet-50 to-cyan-50 p-4 text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-founda-purple">
              AI insight:
            </span>{" "}
            {isFreelancer
              ? `Your strongest current match is ${topMatches[0]?.s.name} at ${topMatches[0]?.bd.total}%.`
              : `Your strongest current candidate is ${topMatches[0]?.f.name} at ${topMatches[0]?.bd.total}%.`}
          </div>
        </div>
      </div>
    </div>
  );
}
