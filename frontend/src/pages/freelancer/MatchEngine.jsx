import { useMemo, useState } from "react";
import { useFreelancer } from "../../context/FreelancerContext";
import { DOMAINS, FREELANCERS, STARTUPS } from "../../data/freelancerData";
import {
  matchScore,
  candidateScore,
  initials,
} from "../../utils/matchEngine";
import Badge from "../../components/freelancer/Badge";
import VerifiedBadge from "../../components/freelancer/VerifiedBadge";
import MiniBar from "../../components/freelancer/MiniBar";

export default function MatchEngine({ setPage }) {
  const {
    role,
    freelancer,
    startup,
    freelancers,
    selectedProfileId,
    setSelectedProfileId,
    applications,
    setApplications,
  } = useFreelancer();
  const isFreelancer = role === "Freelancer";
  const profileId = selectedProfileId;
  const setProfileId = setSelectedProfileId;
  const [engagement, setEngagement] = useState(
    isFreelancer ? freelancer.engagement : startup.engagement,
  );
  const [domain, setDomain] = useState("All Domains");
  const [selected, setSelected] = useState(null);

  const activeFreelancer = isFreelancer
    ? freelancers.find((f) => f.id === Number(profileId)) || freelancer
    : null;
  const activeStartup = !isFreelancer
    ? STARTUPS.find((s) => s.id === Number(profileId)) || startup
    : null;

  const results = useMemo(() => {
    if (isFreelancer) {
      return STARTUPS.filter(
        (s) => domain === "All Domains" || s.domain === domain,
      )
        .map((s) => ({
          entity: s,
          score: matchScore(activeFreelancer, s, engagement),
        }))
        .sort((a, b) => b.score.total - a.score.total);
    }
    return FREELANCERS.filter(
      (f) => domain === "All Domains" || f.domains.includes(domain),
    )
      .map((f) => ({
        entity: f,
        score: candidateScore(f, activeStartup),
      }))
      .sort((a, b) => b.score.total - a.score.total);
  }, [isFreelancer, activeFreelancer, activeStartup, domain, engagement]);

  const apply = (startupId) => {
    const exists = applications.some(
      (a) =>
        a.startupId === startupId && a.freelancerId === activeFreelancer.id,
    );
    if (exists) return;
    setApplications((prev) => [
      ...prev,
      {
        id: Date.now(),
        freelancerId: activeFreelancer.id,
        startupId,
        status: "Applied",
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        engagement,
      },
    ]);
  };

  const alreadyApplied = (startupId) =>
    applications.some(
      (a) =>
        a.startupId === startupId &&
        a.freelancerId === activeFreelancer?.id,
    );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">
          01 \u2014 Matching
        </p>
        <h1 className="mt-1 text-3xl font-black text-founda-ink">
          Match Engine
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Select the profile first. The engine then ranks the opposite side by
          skill-vector similarity, domain fit, experience, engagement and trust.
        </p>
      </div>

      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Select Profile</label>
            <select
              className="input"
              value={profileId}
              onChange={(e) => setProfileId(Number(e.target.value))}
            >
              {(isFreelancer ? FREELANCERS : STARTUPS).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Domain Filter</label>
            <select
              className="input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              <option>All Domains</option>
              {DOMAINS.map((d) => (
                <option key={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Engagement Preference</label>
            <select
              className="input"
              value={engagement}
              onChange={(e) => setEngagement(e.target.value)}
            >
              <option>One-off</option>
              <option>Ongoing</option>
              <option>Co-founder</option>
            </select>
          </div>
        </div>
      </div>

      {isFreelancer && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Selected profile
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-founda-purple to-founda-blue font-black text-white">
                {initials(activeFreelancer.name)}
              </div>
              <div>
                <p className="font-black">{activeFreelancer.name}</p>
                <p className="text-xs text-slate-500">
                  {activeFreelancer.headline}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Current availability
            </p>
            <p className="mt-3 text-lg font-black text-founda-ink">
              {activeFreelancer.availability}
            </p>
            <VerifiedBadge />
          </div>
          <div className="card p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Engagement selected
            </p>
            <p className="mt-3 text-lg font-black text-founda-ink">
              {engagement}
            </p>
            <p className="text-xs text-slate-500">Used in the match score.</p>
          </div>
        </div>
      )}

      {!isFreelancer && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Selected startup
              </p>
              <h2 className="mt-1 text-lg font-black">
                {activeStartup.name} <VerifiedBadge />
              </h2>
              <p className="text-xs text-slate-500">
                {activeStartup.domain} · {activeStartup.stage} ·{" "}
                {activeStartup.engagement}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-founda-purple">
                {activeStartup.trust}/100
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Trust
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {results.map(({ entity, score }) => {
          const applied = isFreelancer && alreadyApplied(entity.id);
          return (
            <div
              key={entity.id}
              className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="border-b border-founda-line bg-gradient-to-r from-white to-violet-50/50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-founda-ink">
                        {entity.name}
                      </h2>
                      {entity.verified && <VerifiedBadge />}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {isFreelancer
                        ? entity.tagline
                        : `${entity.headline} · ${entity.experience} yrs`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-founda-purple">
                      {score.total}%
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Match
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(isFreelancer
                    ? entity.requiredSkills
                    : entity.skills
                  )
                    .slice(0, 5)
                    .map((s) => (
                      <Badge
                        key={s}
                        tone={score.shared.includes(s) ? "teal" : "gray"}
                      >
                        {s}
                        {score.shared.includes(s) ? " \u2713" : ""}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <MiniBar label="Skill similarity" value={score.skill} />
                  <MiniBar label="Domain fit" value={score.domain} />
                  <MiniBar label="Experience fit" value={score.experience} />
                  <MiniBar
                    label="Trust contribution"
                    value={score.trust}
                  />
                </div>

                <div className="mt-3 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 p-3 text-xs leading-5 text-slate-600">
                  <b className="text-founda-purple">AI reason:</b>{" "}
                  {score.shared.length
                    ? `${score.shared.length} required skill${score.shared.length > 1 ? "s" : ""} overlap directly. `
                    : "There is limited direct skill overlap. "}
                  {score.missing.length
                    ? `Adding ${score.missing.slice(0, 2).join(" and ")} would strengthen the fit.`
                    : "The profile covers all listed skills."}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => setSelected({ entity, score })}
                  >
                    View breakdown
                  </button>
                  {isFreelancer ? (
                    applied ? (
                      <button
                        className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700"
                        onClick={() => setPage("pipeline")}
                      >
                        \u2713 Applied · View Pipeline
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => apply(entity.id)}
                      >
                        Apply
                      </button>
                    )
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => setPage("pipeline")}
                    >
                      Review Pipeline
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-founda-navy/60 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge tone="purple">
                  AI MATCH · {selected.score.total}%
                </Badge>
                <h2 className="mt-2 text-2xl font-black">
                  {selected.entity.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isFreelancer
                    ? selected.entity.tagline
                    : selected.entity.headline}
                </p>
              </div>
              <button
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 font-bold"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MiniBar
                label="Skill Vector Similarity"
                value={selected.score.skill}
              />
              <MiniBar label="Domain Fit" value={selected.score.domain} />
              <MiniBar
                label="Experience Fit"
                value={selected.score.experience}
              />
              <MiniBar
                label="Engagement Fit"
                value={selected.score.engagementFit}
              />
              <MiniBar
                label="Trust Score"
                value={selected.score.trust}
              />
              <MiniBar
                label="Overall Match"
                value={selected.score.total}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-founda-line p-4">
              <h3 className="text-sm font-black">Matched skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.score.shared.length ? (
                  selected.score.shared.map((s) => (
                    <Badge key={s} tone="teal">
                      ✓ {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    No direct skill overlap.
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <h3 className="text-sm font-black text-amber-800">
                Potential gaps
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {selected.score.missing.length
                  ? selected.score.missing.join(", ")
                  : "No major skill gaps detected."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
