import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Handshake, Code2, Trash2, CalendarDays } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { Card, PageHead, EmptyState } from "../components/ui";

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year, month) {
  return new Date(year, month, 1).getDay();
}
function fmtDate(year, month, day) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Calendar() {
  const { events, removeEvent, notify } = useAppState();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const totalDays = daysInMonth(year, month);
  const startWeekday = firstWeekday(year, month);
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const upcoming = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  function handleRemove(e) {
    removeEvent(e.id);
    notify({
      type: "info",
      icon: "event",
      title: "Event removed",
      message: `${e.type === "pitch" ? "Pitch meet" : "Skill test"} with ${e.withName} was deleted.`,
    });
  }

  return (
    <div>
      <PageHead title="Calendar" subtitle="Scheduled investor pitch meets and teammate skill tests." />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* month grid */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">
              {MONTH_NAMES[month]} <span className="font-normal text-muted">{year}</span>
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="rounded-lg border border-line p-1.5 transition-colors hover:border-brand-line hover:text-brand" aria-label="Previous month">
                <ChevronLeft size={15} />
              </button>
              <button onClick={nextMonth} className="rounded-lg border border-line p-1.5 transition-colors hover:border-brand-line hover:text-brand" aria-label="Next month">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] font-semibold uppercase tracking-wide text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = fmtDate(year, month, day);
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === fmtDate(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <div
                  key={i}
                  className={`flex aspect-square flex-col rounded-xl border p-1.5 transition-colors ${
                    isToday ? "border-brand bg-brand-soft ring-1 ring-brand/30" : "border-line hover:bg-app"
                  }`}
                >
                  <span className={`font-mono text-[11px] ${isToday ? "font-bold text-brand" : "text-muted"}`}>{day}</span>
                  <div className="mt-auto flex flex-wrap gap-1 pb-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        title={`${e.type === "pitch" ? "Pitch meet" : "Skill test"} · ${e.withName} ${e.time}`}
                        className={`h-1.5 w-full max-w-4 rounded-full ${e.type === "pitch" ? "bg-gradient-to-r from-indigo-500 to-violet-500" : "bg-emerald"}`}
                      />
                    ))}
                    {dayEvents.length > 3 && <span className="font-mono text-[9px] text-muted">+{dayEvents.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-5 border-t border-line pt-3.5 text-xs font-medium text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" /> Pitch meet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full bg-emerald" /> Skill test
            </span>
          </div>
        </Card>

        {/* upcoming */}
        <Card className="self-start">
          <h3 className="mb-3 flex items-center gap-2 font-display text-[15px] font-semibold">
            <CalendarDays size={15} className="text-brand" /> Upcoming
          </h3>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled"
              hint="Schedule a pitch meet from an investor's profile, or a skill test from a teammate's profile."
            />
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((e) => (
                <div key={e.id} className="group rounded-xl border border-line p-3 transition-colors hover:border-brand-line">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-[13px] font-semibold">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-md ${
                          e.type === "pitch" ? "bg-brand-soft text-brand" : "bg-emerald-soft text-emerald"
                        }`}
                      >
                        {e.type === "pitch" ? <Handshake size={12} /> : <Code2 size={12} />}
                      </span>
                      {e.withName}
                    </div>
                    <button onClick={() => handleRemove(e)} title="Delete event" className="rounded-md p-1 text-muted opacity-60 transition-all hover:bg-rose-soft hover:text-rose group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="mt-1.5 pl-8 font-mono text-[11px] text-muted">
                    {e.date} · {e.time}
                  </p>
                  {e.notes && <p className="mt-0.5 pl-8 text-[11px] leading-relaxed text-muted">{e.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
