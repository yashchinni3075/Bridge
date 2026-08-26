import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarPlus, UserPlus, Star } from "lucide-react";
import { teammateMatches } from "../data/dummyData";
import { Button, VerifyBadge, Tag, Avatar, Card } from "../components/ui";
import ScheduleModal from "../components/ScheduleModal";

export default function TeammateProfile() {
  const { id } = useParams();
  const teammate = teammateMatches.find((t) => t.id === id);
  const [showSchedule, setShowSchedule] = useState(false);
  const [invited, setInvited] = useState(false);
  const [toast, setToast] = useState(false);

  if (!teammate) return <p>Profile not found.</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/teammates" className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-5">
        <ArrowLeft size={14} /> Back to Find Teammates
      </Link>

      <Card className="mb-6">
        <div className="flex items-start gap-4">
          <Avatar name={teammate.name} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-2xl">{teammate.name}</h1>
              <VerifyBadge status={teammate.verification} />
            </div>
            <p className="text-sm text-ink-soft mt-0.5">{teammate.role}</p>
            <div className="flex items-center gap-3 text-xs text-ink-soft mt-1">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {teammate.location}
              </span>
              <span className="flex items-center gap-1">
                <Star size={12} className="text-amber fill-amber" /> {teammate.rating}
              </span>
              <span>{teammate.experience} experience</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-coral text-2xl font-semibold">{teammate.score}</div>
            <div className="text-[10px] text-ink-soft">match score</div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-5">
          <Button onClick={() => setInvited(true)} disabled={invited}>
            <span className="flex items-center gap-1.5">
              <UserPlus size={14} /> {invited ? "Invited" : "Invite to team"}
            </span>
          </Button>
          <Button variant="dark" onClick={() => setShowSchedule(true)}>
            <span className="flex items-center gap-1.5">
              <CalendarPlus size={14} /> Schedule skill test
            </span>
          </Button>
        </div>
      </Card>

      <Card className="mb-5">
        <h3 className="font-display font-semibold text-[15px] mb-2">About</h3>
        <p className="text-sm text-ink-soft leading-relaxed">{teammate.bio}</p>
      </Card>

      <Card className="mb-5">
        <h3 className="font-display font-semibold text-[15px] mb-3">Skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {teammate.skills.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
        <div className="text-sm text-ink-soft mt-3">
          Availability: <b className="text-ink">{teammate.availability}</b>
        </div>
      </Card>

      <Card className="mb-5">
        <h3 className="font-display font-semibold text-[15px] mb-3">Past work</h3>
        <div className="divide-y divide-line">
          {teammate.pastWork.map((p, i) => (
            <div key={i} className="py-2.5 flex justify-between text-sm">
              <span className="font-semibold">{p.title}</span>
              <span className="text-ink-soft">
                {p.company} · {p.year}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-[15px] mb-3">Links</h3>
        <div className="flex flex-col gap-1.5">
          {teammate.links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-coral hover:underline"
            >
              {l.platform} ↗
            </a>
          ))}
        </div>
      </Card>

      <ScheduleModal
        open={showSchedule}
        withName={teammate.name}
        type="test"
        onClose={(saved) => {
          setShowSchedule(false);
          if (saved) {
            setToast(true);
            setTimeout(() => setToast(false), 2500);
          }
        }}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm px-5 py-3 rounded-lg shadow-lg">
          Skill test scheduled — check your Calendar
        </div>
      )}
    </div>
  );
}
