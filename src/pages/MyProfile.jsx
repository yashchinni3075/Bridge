import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Building2, CalendarDays, CheckCircle2, Clock, FileBadge,
  FileText, Globe, Link2, MapPin, Pencil, Presentation, Rocket, User,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { Button, Card, PageHead, VerifyBadge, Tag } from "../components/ui";
import { API_URL } from "../lib/api";

function SectionCard({ icon: Icon, title, children }) {
  return (
    <Card className="mb-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">
          <Icon size={15} strokeWidth={2.25} />
        </span>
        <h2 className="font-display text-[15px] font-semibold">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function DoubleRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/70 py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="text-right text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function DocRow({ icon: Icon, label, value, added = true }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-app text-muted">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate text-sm font-medium">{value || "Not added yet"}</p>
      </div>
      {value && (
        <span
          className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            added ? "bg-emerald-soft text-emerald" : "bg-amber-soft text-amber"
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
  const { profile, auth, session } = useAppState();
  const navigate = useNavigate();

  const [account, setAccount] = useState(auth);

  // Pull the authenticated user's record straight from the database.
  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (!cancelled && result?.user) setAccount(result.user);
      })
      .catch(() => {
        // keep the context fallback
      });
    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const links = profile.links || [];
  const hasStarted =
    !!(profile.startupName || profile.sector || profile.description || links.length || profile.domainVerification?.domain);

  const ask = profile.ask
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(profile.ask))
    : null;

  const statusCard = {
    verified: {
      cls: "border-emerald/25 bg-emerald-soft text-emerald",
      title: "Verified by Admin",
      text: "Your profile is fully live to investors and freelancers.",
    },
    pending_review: {
      cls: "border-amber/25 bg-amber-soft text-amber",
      title: "Submitted — awaiting Admin review",
      text: "You'll be notified the moment your profile is verified.",
    },
    draft: {
      cls: "border-amber/25 bg-amber-soft text-amber",
      title: "Draft in progress",
      text: "Admin can't verify your profile until it's fully complete.",
    },
  }[profile.status];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead
        title="My Profile"
        subtitle="Everything Admin sees about your startup — fetched from your saved profile."
        actions={
          <>
            <VerifyBadge status={profile.status} />
            <Button onClick={() => navigate("/profile/edit")}>
              <Pencil size={14} /> Edit profile
            </Button>
          </>
        }
      />

      <SectionCard icon={User} title="Account">
        <DoubleRow label="Name" value={account?.name} />
        <DoubleRow label="Email" value={account?.email} />
        <DoubleRow label="Phone" value={account?.phone} />
        <DoubleRow label="Role" value={account?.role} />
        <DoubleRow label="Member since" value={<span className="inline-flex items-center justify-end gap-1.5"><CalendarDays size={13} className="text-muted" />{formatDate(account?.registeredAt)}</span>} />
      </SectionCard>

      {!hasStarted && (
        <Card className="border-dashed py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
              <Rocket size={20} />
            </span>
            <p className="font-display text-base font-semibold">Complete your startup profile</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted">
              Fill in your startup details, upload your registration proof and pitch deck, and optionally verify your domain so
              Admin can review and grant your Verified badge.
            </p>
            <Button onClick={() => navigate("/profile/edit")}>
              Get started <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      )}

      {hasStarted && statusCard && (
        <div className={`mb-5 flex flex-wrap items-center gap-2.5 rounded-card border px-4 py-3.5 text-sm font-semibold ${statusCard.cls}`}>
          {profile.status === "verified" ? <CheckCircle2 size={17} className="shrink-0" /> : <Clock size={17} className="shrink-0" />}
          <span>{statusCard.title}</span>
          <span className="font-medium opacity-80">— {statusCard.text}</span>
        </div>
      )}

      {hasStarted && (
        <>
          <SectionCard icon={Building2} title="Startup Details">
            <DoubleRow label="Startup name" value={profile.startupName} />
            <DoubleRow label="Sector" value={profile.sector} />
            <DoubleRow label="Stage" value={profile.stage} />
            <div className="border-b border-line/70 py-2.5">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">One-line description</span>
              <p className="text-sm leading-relaxed">{profile.description || "—"}</p>
            </div>
            <DoubleRow label="Funding ask" value={ask} />
            <DoubleRow label="City / location" value={profile.city} />

            <div className="border-b border-line/70 py-2.5">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Skills your team has</span>
              {profile.skillsHave?.length ? (
                profile.skillsHave.map((s) => <Tag key={s} tone="brand">{s}</Tag>)
              ) : (
                <p className="text-sm text-muted">None added yet</p>
              )}
            </div>
            <div className="border-b border-line/70 py-2.5">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Skills you're looking for</span>
              {profile.skillsNeeded?.length ? (
                profile.skillsNeeded.map((s) => <Tag key={s} tone="emerald">{s}</Tag>)
              ) : (
                <p className="text-sm text-muted">None added yet</p>
              )}
            </div>

            <div className="pt-2.5">
              <span className="mb-1.5 block flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <Link2 size={12} /> Links
              </span>
              {links.length ? (
                <ul className="grid gap-1.5">
                  {links.map((l, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-32 shrink-0 text-xs font-semibold text-muted">{l.platform}</span>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 truncate text-brand hover:underline"
                      >
                        {l.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <MapPin size={12} /> No links added yet.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={FileBadge} title="Verification Documents">
            <div className="space-y-3">
              <DocRow icon={FileText} label="Business registration proof" value={profile.registrationProofFile} />
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-app text-muted">
                  <Globe size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Company domain</p>
                  <p className={`truncate text-sm font-medium ${profile.domainVerification ? "" : "text-muted"}`}>
                    {profile.domainVerification?.domain || "Not verified yet"}
                  </p>
                </div>
                {profile.domainVerification?.status === "verified" ? (
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-bold text-emerald">
                    <CheckCircle2 size={10} /> Verified
                  </span>
                ) : (
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-soft px-2 py-0.5 text-[10px] font-bold text-rose">
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Presentation} title="Pitch Deck">
            <DocRow icon={FileText} label="Pitch deck (.ppt / .pptx)" value={profile.pitchDeckFile} />
          </SectionCard>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted">
            Want to update something?{" "}
            <Link to="/profile/edit" className="font-bold text-brand hover:underline">
              Edit your profile
            </Link>
            {" "}— any change needs a fresh Admin re-verification.
          </p>
        </>
      )}
    </div>
  );
}