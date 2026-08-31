import { CheckCircle2, Plus, X, ShieldCheck, Circle, Building2, FileBadge, Presentation, ClipboardCheck } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { LINK_PLATFORMS } from "../data/dummyData";
import { Button, Card, VerifyBadge, PageHead, inputCls } from "../components/ui";
import FileUpload from "../components/FileUpload";
import DomainVerify from "../components/DomainVerify";

const SECTORS = ["Fintech", "Consumer", "SaaS", "Climate", "Healthcare", "Marketplace"];
const STAGES = ["Idea", "Pre-seed", "Seed", "Series A"];
const SKILL_OPTIONS = [
  "Product", "Frontend", "Backend", "Design", "Sales",
  "Finance", "Growth Marketing", "Data Science",
];

function Field({ label, children, required, hint }) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="mb-1.5 block text-[13px] font-semibold">
        {label} {required && <span className="text-rose">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
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
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              active
                ? "border-brand bg-brand text-white shadow-[0_6px_16px_-8px_rgb(79_70_229/0.7)]"
                : "border-line bg-raised text-muted hover:border-brand-line hover:text-ink"
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
          <select className={`${inputCls} w-44 shrink-0`} value={link.platform} onChange={(e) => updateLink(i, { platform: e.target.value })}>
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
          <button onClick={() => removeLink(i)} className="shrink-0 px-1 text-muted hover:text-rose" title="Remove link">
            <X size={16} />
          </button>
        </div>
      ))}
      <button onClick={addLink} className="flex items-center gap-1.5 rounded-lg text-xs font-bold text-brand hover:underline">
        <Plus size={13} /> Add another link
      </button>
    </div>
  );
}

function SectionCard({ step, icon: Icon, title, blurb, children }) {
  return (
    <Card className="relative overflow-hidden pl-7 sm:pl-9">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-indigo-500 to-violet-500" />
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Icon size={17} strokeWidth={2.25} />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold">
            <span className="mr-1.5 font-mono text-xs text-muted">STEP {step}</span>
            <br className="sm:hidden" />
            {title}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{blurb}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function ProfilePage() {
  const { profile, updateProfile, submitProfileForReview, notify } = useAppState();

  const requiredFilled =
    profile.startupName && profile.sector && profile.stage && profile.description && profile.ask && profile.city;

  const verificationDocsReady =
    profile.registrationProofFile && profile.domainVerification?.status === "verified" && profile.pitchDeckFile;

  const readyToSubmit = requiredFilled && verificationDocsReady;

  const checklist = [
    { done: !!requiredFilled, label: "All basic details filled" },
    { done: !!profile.registrationProofFile, label: "Registration proof uploaded" },
    { done: profile.domainVerification?.status === "verified", label: "Company domain verified (WHOIS)" },
    { done: !!profile.pitchDeckFile, label: "Pitch deck uploaded (.ppt/.pptx)" },
  ];

  function handleSubmit() {
    submitProfileForReview();
    notify({
      type: "success",
      icon: "doc",
      title: "Profile submitted for review",
      message: "Your startup is now pending Admin verification. We'll notify you once it's reviewed.",
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead
        title="Complete Your Profile"
        subtitle="Registration only asked for the basics. Everything below is what Admin actually checks before your Verified badge goes live — fill it in carefully."
        actions={<VerifyBadge status={profile.status} />}
      />

      {profile.status === "pending_review" && (
        <div className="mb-6 flex items-center gap-2.5 rounded-card border border-amber/25 bg-amber-soft p-4 text-sm font-semibold text-amber">
          <ShieldCheck size={17} className="shrink-0" />
          Submitted — awaiting Admin review. You'll be notified once verified.
        </div>
      )}
      {profile.status === "verified" && (
        <div className="mb-6 flex items-center gap-2.5 rounded-card border border-emerald/25 bg-emerald-soft p-4 text-sm font-semibold text-emerald">
          <CheckCircle2 size={17} className="shrink-0" />
          Verified by Admin. Your profile is fully live to investors and freelancers.
        </div>
      )}

      {/* readiness checklist */}
      {!readyToSubmit && profile.status !== "pending_review" && profile.status !== "verified" && (
        <Card className="mb-5">
          <h3 className="mb-3 flex items-center gap-2 font-display text-[15px] font-semibold">
            <ClipboardCheck size={16} className="text-brand" /> Submission checklist
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label} className={`flex items-center gap-2 text-[13px] ${c.done ? "text-emerald" : "text-muted"}`}>
                {c.done ? <CheckCircle2 size={15} className="shrink-0" /> : <Circle size={13} className="shrink-0 opacity-40" />}
                {c.label}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="space-y-5">
        {/* Section 1 */}
        <SectionCard
          step={1}
          icon={Building2}
          title="Startup Details"
          blurb="Who you are, what you're building, and what your team looks like today."
        >
          <Field label="Startup name" required>
            <input className={inputCls} value={profile.startupName} onChange={(e) => updateProfile({ startupName: e.target.value })} />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Sector" required>
              <select className={inputCls} value={profile.sector} onChange={(e) => updateProfile({ sector: e.target.value })}>
                <option value="">Select sector</option>
                {SECTORS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Stage" required>
              <select className={inputCls} value={profile.stage} onChange={(e) => updateProfile({ stage: e.target.value })}>
                <option value="">Select stage</option>
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="One-line description" required>
            <textarea rows={2} className={`${inputCls} resize-none`} value={profile.description} onChange={(e) => updateProfile({ description: e.target.value })} />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Funding ask (USD)" required>
              <input type="number" className={inputCls} value={profile.ask} onChange={(e) => updateProfile({ ask: e.target.value })} />
            </Field>
            <Field label="City / location" required>
              <input className={inputCls} placeholder="e.g. Solapur, Maharashtra" value={profile.city} onChange={(e) => updateProfile({ city: e.target.value })} />
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
            <LinksEditor links={profile.links} onChange={(links) => updateProfile({ links })} />
          </Field>
        </SectionCard>

        {/* Section 2 */}
        <SectionCard
          step={2}
          icon={FileBadge}
          title="Verification Documents"
          blurb="What lets Admin confirm you're a real, registered business — required before the Verified badge is granted."
        >
          <Field
            label="Business registration proof"
            required
            hint="Certificate of Incorporation, Udyam/MSME certificate, GST certificate, or equivalent business license (PDF or image)."
          >
            <FileUpload
              file={profile.registrationProofFile}
              onChange={(f) => {
                updateProfile({ registrationProofFile: f });
                if (f)
                  notify({
                    type: "info",
                    icon: "upload",
                    title: "Registration proof uploaded",
                    message: `${f} is attached and ready for review.`,
                  });
              }}
              accept=".pdf,.jpg,.jpeg,.png"
              label="Click to upload, or drag and drop"
            />
          </Field>

          <Field
            label="Company domain"
            required
            hint="We verify domain ownership and registration age via WHOIS — helps Admin confirm this isn't a throwaway/fake domain."
          >
            <DomainVerify
              value={profile.domainVerification}
              onChange={(v) => {
                const wasVerified = profile.domainVerification?.status === "verified";
                updateProfile({ domainVerification: v });
                if (!wasVerified && v?.status === "verified")
                  notify({
                    type: "success",
                    icon: "domain",
                    title: "Domain verified",
                    message: `${v.domain} passed the WHOIS check.`,
                  });
              }}
            />
          </Field>
        </SectionCard>

        {/* Section 3 */}
        <SectionCard
          step={3}
          icon={Presentation}
          title="Pitch Deck"
          blurb="Uploaded as PowerPoint — this gets AI-scored and shown to matched investors."
        >
          <Field label="Pitch deck (.ppt / .pptx)" required>
            <FileUpload
              file={profile.pitchDeckFile}
              onChange={(f) => {
                updateProfile({ pitchDeckFile: f });
                if (f)
                  notify({
                    type: "info",
                    icon: "upload",
                    title: "Pitch deck uploaded",
                    message: `${f} attached. Run it through Pitch Score for instant feedback.`,
                  });
              }}
              accept=".ppt,.pptx"
              label="Upload your pitch deck (PPT format)"
            />
          </Field>
        </SectionCard>
      </div>

      <Button
        className="mt-6 w-full py-3"
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
        <p className="mt-3 text-center text-xs leading-relaxed text-muted">
          Admin cannot review or verify your startup until every required field, the registration proof, domain
          verification, and pitch deck are all complete.
        </p>
      )}
    </div>
  );
}
