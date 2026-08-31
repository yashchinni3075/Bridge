import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarPlus, UserPlus, Star, ExternalLink } from "lucide-react";
import { teammateMatches } from "../data/dummyData";
import { Button, VerifyBadge, Tag, Avatar, Card, ScorePill } from "../components/ui";
import ScheduleModal from "../components/ScheduleModal";
import { useAppState } from "../context/AppStateContext";

export default function TeammateProfile() {
  const { id } = useParams();
  const { notify } = useAppState();
  const teammate = teammateMatches.find((t) => t.id === id);
  const [showSchedule, setShowSchedule] = useState(false);
  const [invited, setInvited] = useState(false);

  if (!teammate) return <p className="text-sm text-muted">Profile not found.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/teammates" className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted transition-colors hover:text-brand">
        <ArrowLeft size={14} /> Back to Find Teammates
      </Link>

      {/* header card */}
      <Card className="relative mb-6 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-emerald-500/80 via-teal-500 to-cyan-500" />
        <div className="relative pt-10">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar name={teammate.name} size={68} ring />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">{teammate.name}</h1>
                <VerifyBadge status={teammate.verification} />
              </div>
              <p className="mt-0.5 text-sm font-medium text-muted">{teammate.role}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} /> {teammate.location}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber">
                  <Star size={12} className="fill-amber" /> {teammate.rating}
                </span>
                <span>{teammate.experience} experience</span>
              </div>
            </div>
            <div className="text-right">
              <ScorePill value={teammate.score} size="lg" />
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted">match score</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 border-t border-line pt-5">
            <Button
              variant={invited ? "soft" : "primary"}
              disabled={invited}
              onClick={() => {
                setInvited(true);
                notify({
                  type: "success",
                  icon: "invite",
                  title: `Invite sent — ${teammate.name}`,
                  message: `${teammate.role} · we'll let you know when they respond.`,
                });
              }}
            >
              <UserPlus size={15} /> {invited ? "Invited ✓" : "Invite to team"}
            </Button>
            <Button variant="dark" onClick={() => setShowSchedule(true)}>
              <CalendarPlus size={15} /> Schedule skill test
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <h3 className="mb-2 font-display text-[15px] font-semibold">About</h3>
          <p className="text-sm leading-relaxed text-muted">{teammate.bio}</p>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-[15px] font-semibold">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {teammate.skills.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
          <div className="mt-3 inline-flex rounded-xl bg-app px-3 py-2 text-sm text-muted">
            Availability: <b className="ml-1 text-ink">{teammate.availability}</b>
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 font-display text-[15px] font-semibold">Past work</h3>
          <div className="divide-y divide-line/70">
            {teammate.pastWork.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2.5 font-semibold">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft font-mono text-[10px] text-brand">
                    {p.company.slice(0, 2).toUpperCase()}
                  </span>
                  {p.title}
                </span>
                <span className="text-xs text-muted">
                  {p.company} · {p.year}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-[15px] font-semibold">Links</h3>
          <div className="flex flex-wrap gap-2">
            {teammate.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-brand-line hover:text-brand"
              >
                {l.platform} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </Card>
      </div>

      <ScheduleModal
        open={showSchedule}
        withName={teammate.name}
        type="test"
        onClose={(saved) => {
          setShowSchedule(false);
          if (saved)
            notify({
              type: "success",
              icon: "event-test",
              title: "Skill test scheduled",
              message: `${teammate.name} — added to your Calendar.`,
            });
        }}
      />
    </div>
  );
}
