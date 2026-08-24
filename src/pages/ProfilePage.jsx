import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Plus, X, ShieldCheck } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { LINK_PLATFORMS } from "../data/dummyData";
import { Button, Card, VerifyBadge } from "../components/ui";
import FileUpload from "../components/FileUpload";
import DomainVerify from "../components/DomainVerify";

const SECTORS = ["Fintech", "Consumer", "SaaS", "Climate", "Healthcare", "Marketplace"];
const STAGES = ["Idea", "Pre-seed", "Seed", "Series A"];
const SKILL_OPTIONS = [
  "Product", "Frontend", "Backend", "Design", "Sales",
  "Finance", "Growth Marketing", "Data Science",
];

const inputCls =
  "w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-coral/30";

function Field({ label, children, required, hint }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold mb-1.5">
        {label} {required && <span className="text-rose">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-soft mt-1.5">{hint}</p>}
    </div>
  );
}

function MultiSelect({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              active
                ? "bg-ink text-white border-ink"
                : "bg-white text-ink-soft border-line hover:border-ink"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function LinksEditor({ links, onChange }) {
  function updateLink(i, patch) {
    const next = [...links];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function addLink() {
    onChange([...links, { platform: LINK_PLATFORMS[0], url: "" }]);
  }
  function removeLink(i) {
    onChange(links.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2.5">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2">
          <select
            className={`${inputCls} w-40 shrink-0`}
            value={link.platform}
            onChange={(e) => updateLink(i, { platform: e.target.value })}
          >
            {LINK_PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="https://..."
            value={link.url}
            onChange={(e) => updateLink(i, { url: e.target.value })}
          />
          <button
            onClick={() => removeLink(i)}
            className="text-ink-soft hover:text-rose shrink-0 px-1"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={addLink}
        className="flex items-center gap-1.5 text-xs font-semibold text-coral hover:underline"
      >
        <Plus size={13} /> Add another link
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, updateProfile, submitProfileForReview } = useAppState();
  const navigate = useNavigate();

  const requiredFilled =
    profile.startupName &&
    profile.sector &&
    profile.stage &&
    profile.description &&
    profile.ask &&
    profile.city;

  const verificationDocsReady =
    profile.registrationProofFile &&
    profile.domainVerification?.status === "verified" &&
    profile.pitchDeckFile;

  const readyToSubmit = requiredFilled && verificationDocsReady;

  function handleSubmit() {
    submitProfileForReview();
  }

  return (
    <div className="max-w-2xl">
      <header className="border-b border-line pb-5 mb-7">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-semibold text-[28px]">Complete Your Profile</h1>
          <VerifyBadge status={profile.status} />
        </div>
        <p className="text-sm text-ink-soft mt-1.5">
          Registration only asked for the basics. Everything below is what
          Admin actually checks before your "Verified" badge goes live —
          fill it in carefully.
        </p>
      </header>

      {profile.status === "pending_review" && (
        <div className="mb-6 bg-amber-soft border border-amber/30 rounded-card p-4 flex items-center gap-2 text-[#8A611E] text-sm font-semibold">
          <ShieldCheck size={16} />
          Submitted — awaiting Admin review. You'll be notified once verified.
        </div>
      )}
      {profile.status === "verified" && (
        <div className="mb-6 bg-emerald-soft border border-emerald/30 rounded-card p-4 flex items-center gap-2 text-emerald text-sm font-semibold">
          <CheckCircle2 size={16} />
          Verified by Admin. Your profile is fully live to investors and freelancers.
        </div>
      )}

      {/* Section 1: Basic startup details */}
      <Card className="mb-5">
        <h3 className="font-display font-semibold text-[15px] mb-4">1. Startup Details</h3>

        <Field label="Startup name" required>
          <input
            className={inputCls}
            value={profile.startupName}
            onChange={(e) => updateProfile({ startupName: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Sector" required>
            <select
              className={inputCls}
              value={profile.sector}
              onChange={(e) => updateProfile({ sector: e.target.value })}
            >
              <option value="">Select sector</option>
              {SECTORS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Stage" required>
            <select
              className={inputCls}
              value={profile.stage}
              onChange={(e) => updateProfile({ stage: e.target.value })}
            >
              <option value="">Select stage</option>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="One-line description" required>
          <textarea
            rows={2}
            className={inputCls}
            value={profile.description}
            onChange={(e) => updateProfile({ description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Funding ask (USD)" required>
            <input
              type="number"
              className={inputCls}
              value={profile.ask}
              onChange={(e) => updateProfile({ ask: e.target.value })}
            />
          </Field>
          <Field label="City / location" required>
            <input
              className={inputCls}
              placeholder="e.g. Solapur, Maharashtra"
              value={profile.city}
              onChange={(e) => updateProfile({ city: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Skills your team already has">
          <MultiSelect
            options={SKILL_OPTIONS}
            selected={profile.skillsHave}
            onToggle={(s) =>
              updateProfile({
                skillsHave: profile.skillsHave.includes(s)
                  ? profile.skillsHave.filter((x) => x !== s)
                  : [...profile.skillsHave, s],
              })
            }
          />
        </Field>

        <Field label="Skills / roles you're looking for">
          <MultiSelect
            options={SKILL_OPTIONS}
            selected={profile.skillsNeeded}
            onToggle={(s) =>
              updateProfile({
                skillsNeeded: profile.skillsNeeded.includes(s)
                  ? profile.skillsNeeded.filter((x) => x !== s)
                  : [...profile.skillsNeeded, s],
              })
            }
          />
        </Field>

        <Field label="Links" hint="Add your website, LinkedIn, Crunchbase, or other public profiles.">
          <LinksEditor
            links={profile.links}
            onChange={(links) => updateProfile({ links })}
          />
        </Field>
      </Card>

      {/* Section 2: Verification — what Admin actually checks */}
      <Card className="mb-5">
        <h3 className="font-display font-semibold text-[15px] mb-1">2. Verification Documents</h3>
        <p className="text-xs text-ink-soft mb-4">
          This is what lets Admin confirm you're a real, registered business —
          required before your "Verified" badge is granted.
        </p>

        <Field
          label="Business registration proof"
          required
          hint="Certificate of Incorporation, Udyam/MSME certificate, GST certificate, or equivalent business license (PDF or image)."
        >
          <FileUpload
            file={profile.registrationProofFile}
            onChange={(f) => updateProfile({ registrationProofFile: f })}
            accept=".pdf,.jpg,.jpeg,.png"
            label="Upload registration certificate"
          />
        </Field>

        <Field
          label="Company domain"
          required
          hint="We verify domain ownership and registration age via WHOIS — helps Admin confirm this isn't a throwaway/fake domain."
        >
          <DomainVerify
            value={profile.domainVerification}
            onChange={(v) => updateProfile({ domainVerification: v })}
          />
        </Field>
      </Card>

      {/* Section 3: Pitch deck */}
      <Card className="mb-6">
        <h3 className="font-display font-semibold text-[15px] mb-1">3. Pitch Deck</h3>
        <p className="text-xs text-ink-soft mb-4">
          Upload as a PowerPoint file — this is what gets AI-scored and shown
          to matched investors.
        </p>
        <Field label="Pitch deck (.ppt / .pptx)" required>
          <FileUpload
            file={profile.pitchDeckFile}
            onChange={(f) => updateProfile({ pitchDeckFile: f })}
            accept=".ppt,.pptx"
            label="Upload your pitch deck (PPT format)"
          />
        </Field>
      </Card>

      <Button
        className="w-full"
        disabled={!readyToSubmit || profile.status === "pending_review" || profile.status === "verified"}
        onClick={handleSubmit}
      >
        {profile.status === "pending_review"
          ? "Submitted — awaiting review"
          : profile.status === "verified"
          ? "Already verified"
          : readyToSubmit
          ? "Submit for Admin review"
          : "Fill all required fields + documents to submit"}
      </Button>

      {profile.status !== "verified" && profile.status !== "pending_review" && (
        <p className="text-center text-xs text-ink-soft mt-3">
          Admin cannot review or verify your startup until every required
          field, the registration proof, domain verification, and pitch
          deck are all complete.
        </p>
      )}
    </div>
  );
}
