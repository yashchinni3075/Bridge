import { useState } from "react";
import { useFreelancer } from "../../context/FreelancerContext";
import { DOMAINS } from "../../data/freelancerData";
import { initials } from "../../utils/matchEngine";
import Badge from "../../components/freelancer/Badge";
import VerifiedBadge from "../../components/freelancer/VerifiedBadge";

export default function Profile() {
  const { freelancer, setFreelancers } = useFreelancer();
  const [draft, setDraft] = useState({
    ...freelancer,
    skills: [...freelancer.skills],
  });

  const update = (key, value) => setDraft((p) => ({ ...p, [key]: value }));

  const save = () => {
    setFreelancers((prev) =>
      prev.map((f) => (f.id === draft.id ? draft : f)),
    );
  };

  const toggleDomain = (domain) => {
    setDraft((p) => ({
      ...p,
      domains: p.domains.includes(domain)
        ? p.domains.filter((d) => d !== domain)
        : [...p.domains, domain],
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">
          04 \u2014 Identity
        </p>
        <h1 className="mt-1 text-3xl font-black text-founda-ink">Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          The selected profile is the source of truth for matching, availability,
          engagement and verification.
        </p>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-4 border-b border-founda-line pb-5 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-founda-purple via-founda-blue to-founda-teal text-2xl font-black text-white">
            {initials(draft.name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">{draft.name}</h2>
              <VerifiedBadge />
            </div>
            <p className="text-sm text-slate-500">
              {draft.headline} · {draft.location}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="green">{draft.availability}</Badge>
              <Badge tone="purple">{draft.engagement}</Badge>
              <Badge tone="blue">Trust {draft.trustScore}/100</Badge>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Professional Headline</label>
            <input
              className="input"
              value={draft.headline}
              onChange={(e) => update("headline", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Experience</label>
            <input
              className="input"
              type="number"
              value={draft.experience}
              onChange={(e) =>
                update("experience", Number(e.target.value))
              }
            />
          </div>
          <div>
            <label className="label">Hourly Rate (\u20B9)</label>
            <input
              className="input"
              type="number"
              value={draft.rate}
              onChange={(e) => update("rate", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Availability</label>
            <select
              className="input"
              value={draft.availability}
              onChange={(e) => update("availability", e.target.value)}
            >
              <option>Open to Work</option>
              <option>Currently Engaged</option>
              <option>Not Available</option>
            </select>
          </div>
          <div>
            <label className="label">Engagement Preference</label>
            <select
              className="input"
              value={draft.engagement}
              onChange={(e) => update("engagement", e.target.value)}
            >
              <option>One-off</option>
              <option>Ongoing</option>
              <option>Co-founder</option>
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={draft.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </div>
          <div>
            <label className="label">GitHub / Portfolio</label>
            <input
              className="input"
              value={draft.github}
              onChange={(e) => update("github", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Professional Domains</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => toggleDomain(domain)}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                  draft.domains.includes(domain)
                    ? "border-founda-purple bg-violet-50 text-founda-purple"
                    : "border-founda-line bg-white text-slate-500 hover:border-violet-200"
                }`}
              >
                {draft.domains.includes(domain) ? "✓ " : ""}
                {domain}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Skills</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {draft.skills.map((skill) => (
              <Badge key={skill} tone="purple">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Bio</label>
          <textarea
            className="input min-h-28"
            value={draft.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>

        <button className="btn-primary mt-5" onClick={save}>
          Save Profile
        </button>
      </div>
    </div>
  );
}
