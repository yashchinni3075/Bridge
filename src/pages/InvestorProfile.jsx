import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarPlus, Handshake } from "lucide-react";
import { investorMatches } from "../data/dummyData";
import { Button, VerifyBadge, Tag, Avatar, Card } from "../components/ui";
import ScheduleModal from "../components/ScheduleModal";

export default function InvestorProfile() {
  const { id } = useParams();
  const investor = investorMatches.find((i) => i.id === id);
  const [showSchedule, setShowSchedule] = useState(false);
  const [requested, setRequested] = useState(false);
  const [toast, setToast] = useState(false);

  if (!investor) return <p>Investor not found.</p>;

  return (
    <div className="max-w-2xl">
      <Link to="/investors" className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-5">
        <ArrowLeft size={14} /> Back to Discover Investors
      </Link>

      <Card className="mb-6">
        <div className="flex items-start gap-4">
          <Avatar name={investor.name} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold text-2xl">{investor.name}</h1>
              <VerifyBadge status={investor.verification} />
            </div>
            <p className="text-sm text-ink-soft mt-0.5">
              {investor.title} at {investor.org}
            </p>
            <p className="text-xs text-ink-soft flex items-center gap-1 mt-1">
              <MapPin size={12} /> {investor.location}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-coral text-2xl font-semibold">{investor.score}</div>
            <div className="text-[10px] text-ink-soft">match score</div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-5">
          <Button onClick={() => setRequested(true)} disabled={requested}>
            <span className="flex items-center gap-1.5">
              <Handshake size={14} /> {requested ? "Requested" : "Request intro"}
            </span>
          </Button>
          <Button variant="dark" onClick={() => setShowSchedule(true)}>
            <span className="flex items-center gap-1.5">
              <CalendarPlus size={14} /> Schedule pitch meet
            </span>
          </Button>
        </div>
      </Card>

      <Card className="mb-5">
        <h3 className="font-display font-semibold text-[15px] mb-2">About</h3>
        <p className="text-sm text-ink-soft leading-relaxed">{investor.bio}</p>
      </Card>

      <Card className="mb-5">
        <h3 className="font-display font-semibold text-[15px] mb-3">Investment focus</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {investor.sectors.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
          <Tag tone="amber">{investor.stage}</Tag>
        </div>
        <div className="text-sm text-ink-soft">
          Typical check size: <b className="text-ink">{investor.checkRange}</b>
        </div>
      </Card>

      <Card className="mb-5">
        <h3 className="font-display font-semibold text-[15px] mb-3">Past investments</h3>
        <div className="divide-y divide-line">
          {investor.pastInvestments.map((p, i) => (
            <div key={i} className="py-2.5 flex justify-between text-sm">
              <span className="font-semibold">{p.name}</span>
              <span className="text-ink-soft">
                {p.sector} · {p.year}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-[15px] mb-3">Links</h3>
        <div className="flex flex-col gap-1.5">
          {investor.links.map((l, i) => (
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
        withName={investor.name}
        type="pitch"
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
          Pitch meet scheduled — check your Calendar
        </div>
      )}
    </div>
  );
}
