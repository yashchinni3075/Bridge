import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Building2, CheckCircle2, Clock, FileBadge,
  FileText, Globe, Link2, MapPin, Pencil, Presentation, Rocket, User,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { Button, Card, VerifyBadge, Tag } from "../components/ui";

function SectionCard({ icon: Icon, title, children }) {
  return (
    <Card className="mb-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-lg bg-coral-soft text-coral flex items-center justify-center">
          <Icon size={15} />
        </span>
        <h2 className="font-display font-semibold text-[15px]">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function DoubleRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-line/60 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <span className="text-right text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function DocRow({ icon: Icon, label, value, added = true }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-lg bg-paper flex items-center justify-center text-ink-soft shrink-0">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="text-sm font-medium truncate">{value || "Not added yet"}</p>
      </div>
      {value && (
        <span
          className={`ml-auto shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            added ? "bg-emerald-soft text-emerald" : "bg-amber-soft text-[#8A611E]"
          }`}
        >
          {added ? <CheckCircle2 size={10} /> : <Clock size={10} />}
          {added ? "Added" : "Pending"}
        </span>
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function MyProfile() {
  const { profile, auth } = useAppState();
  const navigate = useNavigate();

  const links = profile.links || [];
  const hasStarted =
    !!(profile.startupName || profile.sector || profile.description || links.length || profile.domainVerification?.domain);

  const ask = profile.ask
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(profile.ask))
    : null;

  const statusCard = {
    verified: {
      cls: "bg-emerald-soft border-emerald/25 text-emerald",
      title: "Verified by Admin",
      text: "Your profile is fully live to investors and freelancers.",
    },
    pending_review: {
      cls: "bg-amber-soft border-amber/25 text-[#8A611E]",
      title: "Submitted — awaiting Admin review",
      text: "You'll be notified the moment your profile is verified.",
    },
    draft: {
      cls: "bg-amber-soft border-amber/25 text-[#8A611E]",
      title: "Draft in progress",
      text: "Admin can't verify your profile until it's fully complete.",
    },
  }[profile.status];

  return (
    <div>
      <header className="border-b border-line pb-5 mb-7">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-semibold text-[28px]">My Profile</h1>
            <p className="text-sm text-ink-soft mt-1.5">
              Everything Admin sees about your startup — fetched from your saved profile.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <VerifyBadge status={profile.status} />
            <Button onClick={() => navigate("/profile/edit")}>
              <Pencil size={14} /> Edit profile
            </Button>
          </div>
        </div>
      </header>

      <SectionCard icon={User} title="Account">
        <DoubleRow label="Name" value={auth?.name} />
        <DoubleRow label="Email" value={auth?.email} />
        <DoubleRow label="Phone" value={auth?.phone} />
        <DoubleRow label="Member since" value={formatDate(auth?.registeredAt)} />
      </SectionCard>

      {!hasStarted && (
        <Card className="mb-5 border-dashed">
          <div className="flex flex-col items-center gap-3 text-center py-8">
            <span className="w-12 h-12 rounded-full bg-coral-soft text-coral flex items-center justify-center">
              <Rocket size={20} />
            </span>
            <p className="font-display font-semibold text-base">Complete your startup profile</p>
            <p className="max-w-sm text-xs text-ink-soft leading-relaxed">
              Fill in your startup details, upload your registration proof and pitch deck, and optionally verify your
              domain so Admin can review and grant your Verified badge.
            </p>
            <Button onClick={() => navigate("/profile/edit")}>
              Get started <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      )}

      {hasStarted && statusCard && (
        <div className={`mb-5 border rounded-card px-4 py-3.5 text-sm font-semibold flex items-center gap-2.5 ${statusCard.cls}`}>
          {profile.status === "verified" ? <CheckCircle2 size={17} className="shrink-0" /> : <Clock size={17} className="shrink-0" />}
          <span>{statusCard.title}</span>
          <span className="opacity-80 font-medium">— {statusCard.text}</span>
        </div>
      )}

      {hasStarted && (
        <>
          <SectionCard icon={Building2} title="Startup Details">
            <DoubleRow label="Startup name" value={profile.startupName} />
            <DoubleRow label="Sector" value={profile.sector} />
            <DoubleRow label="Stage" value={profile.stage} />
            <div className="py-2.5 border-b border-line/60">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">One-line description</span>
              <p className="text-sm leading-relaxed">{profile.description || "—"}</p>
            </div>
            <DoubleRow label="Funding ask" value={ask} />
            <DoubleRow label="City / location" value={profile.city} />

            <div className="py-2.5 border-b border-line/60">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">Skills your team has</span>
              {profile.skillsHave?.length ? (
                profile.skillsHave.map((s) => <Tag key={s} tone="coral">{s}</Tag>)
              ) : (
                <p className="text-sm text-ink-soft">None added yet</p>
              )}
            </div>
            <div className="py-2.5 border-b border-line/60">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">Skills you're looking for</span>
              {profile.skillsNeeded?.length ? (
                profile.skillsNeeded.map((s) => <Tag key={s} tone="emerald">{s}</Tag>)
              ) : (
                <p className="text-sm text-ink-soft">None added yet</p>
              )}
            </div>

            <div className="pt-2.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">
                <Link2 size={12} /> Links
              </span>
              {links.length ? (
                <ul className="grid gap-1.5">
                  {links.map((l, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-32 shrink-0 text-xs font-semibold text-ink-soft">{l.platform}</span>
                      <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-coral hover:underline">
                        {l.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                  <MapPin size={12} /> No links added yet.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={FileBadge} title="Verification Documents">
            <div className="space-y-3">
              <DocRow icon={FileText} label="Business registration proof" value={profile.registrationProofFile} />
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-paper flex items-center justify-center text-ink-soft shrink-0">
                  <Globe size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Company domain</p>
                  <p className={`text-sm font-medium truncate ${profile.domainVerification ? "" : "text-ink-soft"}`}>
                    {profile.domainVerification?.domain || "Not verified yet"}
                  </p>
                </div>
                {profile.domainVerification?.status === "verified" ? (
                  <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-bold text-emerald">
                    <CheckCircle2 size={10} /> Verified
                  </span>
                ) : (
                  <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-rose-soft px-2 py-0.5 text-[10px] font-bold text-rose">
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Presentation} title="Pitch Deck">
            <DocRow icon={FileText} label="Pitch deck (.ppt / .pptx)" value={profile.pitchDeckFile} />
          </SectionCard>

          <p className="mt-5 text-center text-xs text-ink-soft leading-relaxed">
            Want to update something?{" "}
            <Link to="/profile/edit" className="font-bold text-coral hover:underline">
              Edit your profile
            </Link>
            {" "}— any change needs a fresh Admin re-verification.
          </p>
        </>
      )}
    </div>
  );
}