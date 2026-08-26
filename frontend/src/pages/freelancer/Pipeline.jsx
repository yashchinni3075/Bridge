import { useFreelancer } from "../../context/FreelancerContext";
import Badge from "../../components/freelancer/Badge";
import VerifiedBadge from "../../components/freelancer/VerifiedBadge";

const STAGES = ["Applied", "Shortlisted", "Interview", "Accepted", "Rejected"];

export default function Pipeline() {
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
        (a) => a.freelancerId === Number(selectedProfileId),
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
        <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">
          02 \u2014 Workflow
        </p>
        <h1 className="mt-1 text-3xl font-black text-founda-ink">
          Application Pipeline
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Track every application from Applied to the final decision.
          Applications are created only from the Match Engine.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="min-h-[280px] rounded-2xl border border-founda-line bg-slate-50/80 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                {stage}
              </h3>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-black text-founda-purple shadow-sm">
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
                      className="rounded-xl border border-founda-line bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black">
                          {isFreelancer
                            ? startup?.name
                            : freelancer?.name}
                        </p>
                        {isFreelancer && freelancer?.verified && (
                          <VerifiedBadge />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {isFreelancer
                          ? startup?.domain
                          : freelancer?.headline}
                      </p>
                      <Badge tone="purple">{app.engagement}</Badge>
                      <p className="mt-2 text-[10px] font-bold text-slate-400">
                        {app.date}
                      </p>

                      <select
                        className="input mt-2 py-2 text-xs"
                        value={app.status}
                        onChange={(e) =>
                          updateStatus(app.id, e.target.value)
                        }
                      >
                        {STAGES.map((s) => (
                          <option key={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
