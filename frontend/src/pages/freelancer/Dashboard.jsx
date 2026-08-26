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
    ? [
        ...new Set(
          STARTUPS.map((s) => s.domain),
        ),
      ]
        .map((domain) => {
          const matches = STARTUPS.filter((s) => s.domain === domain);
          const value = matches.length
            ? Math.max(
                ...matches.map(
                  (s) =>
                    matchScore(freelancer, s, freelancer.engagement).total,
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
            f.skills.some(
              (x) => x.toLowerCase() === skill.toLowerCase(),
            )
              ? 100
              : 25,
          ),
        ),
      }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">
            {isFreelancer ? "Freelancer workspace" : "Startup workspace"}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-founda-ink">
            Welcome back,{" "}
            {isFreelancer ? freelancer.name.split(" ")[0] : startup.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isFreelancer
              ? "Your dashboard is focused on match quality, application progress and verification health."
              : "Your dashboard is focused on candidate quality, hiring progress and startup credibility."}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setPage("match")}>
          {isFreelancer ? "Find Best Matches \u2192" : "Find Candidates \u2192"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isFreelancer ? (
          <>
            <StatCard
              label="AI Matches"
              value={topMatches.length}
              hint="ranked opportunities"
              icon="\u25CE"
            />
            <StatCard
              label="Applications"
              value={relevantApps.length}
              hint="from Match Engine"
              icon="\u2197"
            />
            <StatCard
              label="Shortlisted"
              value={counts.shortlisted}
              hint="moving forward"
              icon="\u2605"
            />
            <StatCard
              label="Trust Score"
              value={`${freelancer.trustScore}/100`}
              hint="verified evidence"
              icon="\u2713"
            />
          </>
        ) : (
          <>
            <StatCard
              label="AI Candidates"
              value={topMatches.length}
              hint="ranked professionals"
              icon="\u25CE"
            />
            <StatCard
              label="Active Hiring"
              value={relevantApps.length}
              hint="candidate pipeline"
              icon="\u2197"
            />
            <StatCard
              label="Shortlisted"
              value={counts.shortlisted}
              hint="moving forward"
              icon="\u2605"
            />
            <StatCard
              label="Startup Trust"
              value={`${startup.trust}/100`}
              hint="profile credibility"
              icon="\u2713"
            />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-founda-ink">
                {isFreelancer
                  ? "Match performance by domain"
                  : "Candidate skill coverage"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
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
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span className="max-w-[70%] truncate text-slate-600">
                    {item.domain}
                  </span>
                  <span className="text-founda-purple">{item.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-founda-purple via-founda-blue to-founda-teal"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-black text-founda-ink">
            Pipeline distribution
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Current applications linked to this profile.
          </p>
          <div
            className="mx-auto mt-5 grid h-40 w-40 place-items-center rounded-full"
            style={{
              background:
                "conic-gradient(#5B21F4 0 45%, #0879E8 45% 70%, #12C7B0 70% 88%, #CBD5E1 88% 100%)",
            }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
              <div>
                <div className="text-2xl font-black text-founda-ink">
                  {relevantApps.length}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-bold">
            <div>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-founda-purple" />
              Applied {counts.applied}
            </div>
            <div>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-founda-blue" />
              Shortlisted {counts.shortlisted}
            </div>
            <div>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-founda-teal" />
              Interview {counts.interview}
            </div>
            <div>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-300" />
              Accepted {counts.accepted}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black">
                Top ranked {isFreelancer ? "opportunities" : "candidates"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Generated from the same Match Engine used by the Match page.
              </p>
            </div>
            <button
              className="text-xs font-black text-founda-purple"
              onClick={() => setPage("match")}
            >
              View all \u2192
            </button>
          </div>

          <div className="space-y-3">
            {topMatches.slice(0, 4).map((item, index) => {
              const entity = isFreelancer ? item.s : item.f;
              return (
                <div
                  key={entity.id}
                  className="flex items-center gap-3 rounded-xl border border-founda-line p-3"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-founda-purple/10 to-founda-teal/10 text-sm font-black text-founda-purple">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black text-founda-ink">
                        {entity.name}
                      </p>
                      {isFreelancer && entity.verified && <VerifiedBadge />}
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {isFreelancer ? entity.domain : entity.headline}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-founda-purple">
                      {item.bd.total}%
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">
                      MATCH
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-black">
            {isFreelancer
              ? "Profile & verification health"
              : "Startup profile health"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Signals that directly affect trust and match quality.
          </p>
          <div className="mt-5">
            {isFreelancer ? (
              <>
                <MiniBar label="Profile completeness" value={92} />
                <MiniBar
                  label="Verification coverage"
                  value={Math.round(
                    (Object.values(freelancer.verification).filter(
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
          <div className="mt-4 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 p-4 text-xs leading-5 text-slate-600">
            <span className="font-black text-founda-purple">
              AI dashboard signal:
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
