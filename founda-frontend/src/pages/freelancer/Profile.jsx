import { useEffect, useState } from "react";
import { useFreelancer } from "../../context/FreelancerContext";
import { DOMAINS } from "../../data/freelancerData";
import { initials } from "../../utils/matchEngine";
import Badge from "../../components/freelancer/Badge";
import VerifiedBadge from "../../components/freelancer/VerifiedBadge";
import StarRating from "../../components/freelancer/StarRating";

export default function Profile({ setPage }) {
  const { freelancer, profileLoaded, saveFreelancer } = useFreelancer();
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (freelancer) {
      setDraft({
        ...freelancer,
        skills: Array.isArray(freelancer.skills) ? [...freelancer.skills] : [],
        domains: Array.isArray(freelancer.domains) ? [...freelancer.domains] : [],
      });
    }
  }, [freelancer]);

  const update = (key, value) =>
    setDraft((p) => (p ? { ...p, [key]: value } : p));

  const addSkill = () => {
    const val = skillInput.trim();
    if (!val) return;
    setDraft((p) => {
      if (!p) return p;
      if (p.skills.includes(val)) {
        setSkillInput("");
        return p;
      }
      return { ...p, skills: [...p.skills, val] };
    });
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setDraft((p) =>
      p ? { ...p, skills: p.skills.filter((s) => s !== skill) } : p,
    );
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      await saveFreelancer({
        name: draft.name,
        headline: draft.headline,
        location: draft.location,
        experience: draft.experience,
        rate: draft.rate,
        availability: draft.availability,
        engagement: draft.engagement,
        domains: draft.domains,
        skills: draft.skills,
        bio: draft.bio,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleDomain = (domain) => {
    setDraft((p) =>
      p
        ? {
            ...p,
            domains: p.domains.includes(domain)
              ? p.domains.filter((d) => d !== domain)
              : [...p.domains, domain],
          }
        : p,
    );
  };

  if (!profileLoaded) {
    return (
      <div className="card p-10 text-center text-sm text-founda-muted">
        Loading profile...
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="card p-10 text-center text-sm text-founda-muted">
        No profile found. Please log in again.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-founda-purple">
          04 — Identity
        </p>
        <h1 className="mt-1 text-2xl font-bold text-founda-ink lg:text-3xl">
          Profile
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-founda-muted">
          The selected profile is the source of truth for matching, availability,
          engagement, and verification.
        </p>
      </div>

      <div className="card p-5">
        {/* Profile header */}
        <div className="flex flex-col gap-4 border-b border-founda-line pb-5 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-founda-purple via-founda-blue to-founda-teal text-2xl font-bold text-white shadow-glow-sm">
            {initials(draft.name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{draft.name || "Your Name"}</h2>
              <StarRating rating={draft.starRating || 0} size="sm" />
              {draft.verified && draft.starRating === 5 && (
                <Badge tone="purple">Verified Pro</Badge>
              )}
              {draft.verified && <VerifiedBadge />}
            </div>
            <p className="text-sm text-founda-muted">
              {draft.headline}{draft.headline && draft.location ? " · " : ""}{draft.location}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="green">{draft.availability}</Badge>
              {draft.engagement && <Badge tone="purple">{draft.engagement}</Badge>}
              {draft.trustScore > 0 && <Badge tone="blue">Trust {draft.trustScore}/100</Badge>}
            </div>
          </div>
        </div>

        {/* Form fields */}
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
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>
          <div>
            <label className="label">Experience (years)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={draft.experience}
              onChange={(e) => update("experience", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Hourly Rate</label>
            <input
              className="input"
              type="number"
              min="0"
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
            <label className="label">Location</label>
            <input
              className="input"
              value={draft.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Bengaluru, India"
            />
          </div>

        </div>

        {/* Domains */}
        <div className="mt-5">
          <label className="label">Professional Domains</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => toggleDomain(domain)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                  draft.domains.includes(domain)
                    ? "border-founda-purple bg-founda-purple/5 text-founda-purple shadow-sm"
                    : "border-founda-line bg-white text-founda-muted hover:border-violet-200 hover:text-founda-ink"
                }`}
              >
                {draft.domains.includes(domain) ? "\u2713 " : ""}
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Skills — fully editable */}
        <div className="mt-5">
          <label className="label">Skills</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {draft.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full bg-founda-purple/10 px-3 py-1 text-xs font-medium text-founda-purple"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-founda-purple/20"
                  aria-label={`Remove ${skill}`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="input flex-1"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Type a skill and press Enter or click Add"
            />
            <button
              type="button"
              onClick={addSkill}
              className="btn-secondary shrink-0"
            >
              Add
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-5">
          <label className="label">Bio</label>
          <textarea
            className="input min-h-[120px] resize-y"
            value={draft.bio}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Tell startups about yourself, your experience, and what you're looking for..."
          />
        </div>

        {/* Save */}
        <div className="mt-5 flex items-center gap-3">
          <button
            className="btn-primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : saved ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </>
            ) : (
              "Save Profile"
            )}
          </button>
          {saved && (
            <span className="text-xs font-medium text-emerald-600 animate-fade-in">
              Profile saved successfully
            </span>
          )}
          {error && (
            <span className="text-xs font-medium text-red-500 animate-fade-in">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
