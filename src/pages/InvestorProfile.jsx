import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarPlus, Handshake, ExternalLink, TrendingUp } from "lucide-react";
import { investorMatches } from "../data/dummyData";
import { Button, VerifyBadge, Tag, Avatar, Card, ScorePill } from "../components/ui";
import ScheduleModal from "../components/ScheduleModal";
import { useAppState } from "../context/AppStateContext";

export default function InvestorProfile() {
  const { id } = useParams();
  const { notify } = useAppState();
  const investor = investorMatches.find((i) => i.id === id);
  const [showSchedule, setShowSchedule] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!investor) return <p className="text-sm text-muted">Investor not found.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/investors" className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted transition-colors hover:text-brand">
        <ArrowLeft size={14} /> Back to Discover Investors
      </Link>

      {/* header card */}
      <Card className="relative mb-6 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-indigo-500/90 via-brand to-violet-500" />
        <div className="relative pt-10">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar name={investor.name} size={68} ring />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">{investor.name}</h1>
                <VerifyBadge status={investor.verification} />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {investor.title} at <b className="text-ink">{investor.org}</b>
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <MapPin size={12} /> {investor.location}
              </p>
            </div>
            <div className="text-right">
              <ScorePill value={investor.score} size="lg" />
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted">match score</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 border-t border-line pt-5">
            <Button
              variant={requested ? "soft" : "primary"}
              disabled={requested}
              onClick={() => {
                setRequested(true);
                notify({
                  type: "success",
                  icon: "intro",
                  title: `Intro requested — ${investor.name}`,
                  message: "We'll notify you as soon as there's a response.",
                });
              }}
            >
              <Handshake size={15} /> {requested ? "Requested ✓" : "Request intro"}
            </Button>
            <Button variant="dark" onClick={() => setShowSchedule(true)}>
              <CalendarPlus size={15} /> Schedule pitch meet
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <h3 className="mb-2 font-display text-[15px] font-semibold">About</h3>
          <p className="text-sm leading-relaxed text-muted">{investor.bio}</p>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-[15px] font-semibold">Investment focus</h3>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {investor.sectors.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
            <Tag tone="amber">{investor.stage}</Tag>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-app px-3 py-2 text-sm text-muted">
            <TrendingUp size={14} className="text-emerald" />
            Typical check size: <b className="text-ink">{investor.checkRange}</b>
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 font-display text-[15px] font-semibold">Past investments</h3>
          <div className="divide-y divide-line/70">
            {investor.pastInvestments.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2.5 font-semibold">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-soft font-mono text-[10px] text-emerald">
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  {p.name}
                </span>
                <span className="text-xs text-muted">
                  {p.sector} · {p.year}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-[15px] font-semibold">Links</h3>
          <div className="flex flex-wrap gap-2">
            {investor.links.map((l, i) => (
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
        withName={investor.name}
        type="pitch"
        onClose={(saved) => {
          setShowSchedule(false);
          if (saved)
            notify({
              type: "success",
              icon: "event-pitch",
              title: "Pitch meet scheduled",
              message: `${investor.name} — added to your Calendar.`,
            });
        }}
      />
    </div>
  );
}
