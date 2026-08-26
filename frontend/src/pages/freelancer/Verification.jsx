import { useFreelancer } from "../../context/FreelancerContext";
import { VERIFICATION_ITEMS } from "../../data/freelancerData";
import Badge from "../../components/freelancer/Badge";
import VerifiedBadge from "../../components/freelancer/VerifiedBadge";
import StatCard from "../../components/freelancer/StatCard";

export default function Verification() {
  const { freelancer, setFreelancers } = useFreelancer();
  const verifiedCount = Object.values(freelancer.verification).filter(
    (x) => x === "verified",
  ).length;
  const score = freelancer.trustScore;
  const level =
    score >= 90
      ? "Professionally Verified"
      : score >= 75
        ? "Identity Verified"
        : "Basic Verified";

  const requestReview = (key) => {
    setFreelancers((prev) =>
      prev.map((f) => {
        if (f.id !== freelancer.id) return f;
        return {
          ...f,
          verification: { ...f.verification, [key]: "pending" },
        };
      }),
    );
  };

  const approve = (key) => {
    setFreelancers((prev) =>
      prev.map((f) => {
        if (f.id !== freelancer.id) return f;
        const next = {
          ...f.verification,
          [key]: "verified",
        };
        const points = {
          email: 10,
          mobile: 10,
          identity: 25,
          education: 20,
          portfolio: 20,
          reference: 15,
        };
        const newScore = Object.entries(next).reduce(
          (sum, [k, v]) => sum + (v === "verified" ? points[k] : 0),
          0,
        );
        return {
          ...f,
          verification: next,
          trustScore: Math.min(100, newScore),
        };
      }),
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">
          03 \u2014 Trust
        </p>
        <h1 className="mt-1 text-3xl font-black text-founda-ink">
          Verification & Credibility
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Verification is evidence-based. There is no Skill Assessment module
          here; professional verification is represented by the Verified badge.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="card p-5 text-center">
          <div
            className="mx-auto grid h-40 w-40 place-items-center rounded-full"
            style={{
              background:
                "conic-gradient(#5B21F4 0deg, #0879E8 190deg, #12C7B0 295deg, #E8ECF4 295deg)",
            }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
              <div>
                <div className="text-3xl font-black text-founda-purple">
                  {score}
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Trust Score
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <VerifiedBadge />
          </div>
          <p className="mt-2 text-sm font-black text-founda-ink">{level}</p>
          <p className="mt-1 text-xs text-slate-500">
            {verifiedCount}/6 verification items verified.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Verified profile badge</h2>
              <p className="mt-1 text-sm text-slate-500">
                The badge appears on your profile and match cards when core
                identity and professional evidence are verified.
              </p>
            </div>
            <VerifiedBadge />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {VERIFICATION_ITEMS.map(([key, name, desc, points]) => {
              const status = freelancer.verification[key];
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-founda-line p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black">{name}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {desc}
                      </p>
                    </div>
                    <span className="text-xs font-black text-founda-purple">
                      +{points}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge
                      tone={
                        status === "verified"
                          ? "green"
                          : status === "pending"
                            ? "orange"
                            : "gray"
                      }
                    >
                      {status === "verified"
                        ? "✓ Verified"
                        : status === "pending"
                          ? "Pending Review"
                          : "Not Verified"}
                    </Badge>
                    {status === "unverified" && (
                      <button
                        className="text-xs font-black text-founda-purple"
                        onClick={() => requestReview(key)}
                      >
                        Submit \u2192
                      </button>
                    )}
                    {status === "pending" && (
                      <button
                        className="text-xs font-black text-emerald-700"
                        onClick={() => approve(key)}
                      >
                        Approve Demo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Verified Evidence"
          value={`${verifiedCount}/6`}
          hint="reviewed items"
          icon="\u2713"
        />
        <StatCard
          label="Profile Trust"
          value={`${score}%`}
          hint="used by Match Engine"
          icon="\u25C8"
        />
        <StatCard
          label="Professional Badge"
          value="Active"
          hint="visible on match cards"
          icon="\u2605"
        />
      </div>
    </div>
  );
}
