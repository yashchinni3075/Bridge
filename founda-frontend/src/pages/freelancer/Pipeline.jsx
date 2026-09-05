import { useFreelancer } from "../../context/FreelancerContext";
import Badge from "../../components/freelancer/Badge";
import VerifiedBadge from "../../components/freelancer/VerifiedBadge";

const STAGES = ["Applied", "Shortlisted", "Interview", "Accepted", "Rejected"];

const STAGE_COLORS = {
  Applied: "bg-founda-purple/10 text-founda-purple",
  Shortlisted: "bg-founda-blue/10 text-founda-blue",
  Interview: "bg-founda-teal/10 text-founda-teal",
  Accepted: "bg-emerald-50 text-emerald-600",
  Rejected: "bg-red-50 text-red-500",
};

const STAGE_DOT = {
  Applied: "bg-founda-purple",
  Shortlisted: "bg-founda-blue",
  Interview: "bg-founda-teal",
  Accepted: "bg-emerald-500",
  Rejected: "bg-red-400",
};

export default function Pipeline({ setPage }) {
  const {
    role,
    selectedProfileId,
    applications,
    freelancers,
    startups,
    setApplications,
  } = useFreelancer();
  const isFreelancer = role === "Freelancer";
  const current = isFreelancer
    ? applications.filter(
        (a) => a.freelancerId === selectedProfileId,
      )
    : applications.filter(
        (a) => a.startupId === Number(selectedProfileId),
      );

  const updateStatus = (id, status) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-founda-purple">
          02 — Workflow
        </p>
        <h1 className="mt-1 text-2xl font-bold text-founda-ink lg:text-3xl">
          Application Pipeline
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-founda-muted">
          Track every application from submission to final decision.
          Applications are created from the Match Engine.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="rounded-2xl border border-founda-line bg-white p-3 shadow-card min-h-[280px]"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STAGE_DOT[stage]}`} />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {stage}
                </h3>
              </div>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-founda-surface text-[10px] font-bold text-founda-purple">
                {current.filter((a) => a.status === stage).length}
              </span>
            </div>

            <div className="space-y-2">
              {current
                .filter((a) => a.status === stage)
                .map((app) => {
                  const startup = startups.find(
                    (s) => s.id === app.startupId,
                  );
                  const freelancer = freelancers.find(
                    (f) => f.id === app.freelancerId,
                  );
                  return (
                    <div
                      key={app.id}
                      className="rounded-xl border border-founda-line bg-founda-surface/50 p-3 transition-all hover:border-founda-purple/20 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">
                          {isFreelancer
                            ? startup?.name
                            : freelancer?.name}
                        </p>
                        {isFreelancer && freelancer?.verified && (
                          <VerifiedBadge />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-founda-muted truncate">
                        {isFreelancer
                          ? startup?.domain
                          : freelancer?.headline}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge tone="purple">{app.engagement}</Badge>
                        <span className="text-[10px] font-medium text-founda-muted">
                          {app.date}
                        </span>
                      </div>

                      <select
                        className="input mt-2 py-1.5 text-xs"
                        value={app.status}
                        onChange={(e) =>
                          updateStatus(app.id, e.target.value)
                        }
                      >
                        {STAGES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}

              {current.filter((a) => a.status === stage).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-2xl text-founda-muted/30">&#8943;</div>
                  <p className="mt-1 text-[11px] text-founda-muted">No items</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
