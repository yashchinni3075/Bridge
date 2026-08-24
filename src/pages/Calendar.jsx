import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Handshake, Code2, Trash2 } from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { Card } from "../components/ui";

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
  const { events, removeEvent } = useAppState();
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
  const cells = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

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

  return (
    <div>
      <header className="border-b border-line pb-5 mb-7">
        <h1 className="font-display font-semibold text-[28px]">Calendar</h1>
        <p className="text-sm text-ink-soft mt-1.5">
          Scheduled investor pitch meets and freelancer skill tests.
        </p>
      </header>

      <div className="grid grid-cols-[1fr_280px] gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base">
              {MONTH_NAMES[month]} {year}
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded hover:bg-paper border border-line">
                <ChevronLeft size={15} />
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded hover:bg-paper border border-line">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-ink-soft mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = fmtDate(year, month, day);
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday =
                dateStr === fmtDate(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <div
                  key={i}
                  className={`aspect-square border rounded-lg p-1 text-[11px] flex flex-col ${
                    isToday ? "border-coral bg-coral-soft/40" : "border-line"
                  }`}
                >
                  <span className={isToday ? "font-bold text-coral" : "text-ink-soft"}>{day}</span>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={`w-full h-1.5 rounded-full ${
                          e.type === "pitch" ? "bg-coral" : "bg-emerald"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-coral inline-block" /> Pitch meet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald inline-block" /> Skill test
            </span>
          </div>
        </Card>

        <Card>
          <h3 className="font-display font-semibold text-[15px] mb-3">Upcoming</h3>
          {upcoming.length === 0 && (
            <p className="text-xs text-ink-soft">
              Nothing scheduled yet. Schedule a pitch meet from an investor's
              profile, or a skill test from a freelancer's profile.
            </p>
          )}
          <div className="space-y-3">
            {upcoming.map((e) => (
              <div key={e.id} className="border border-line rounded-lg p-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {e.type === "pitch" ? (
                      <Handshake size={12} className="text-coral" />
                    ) : (
                      <Code2 size={12} className="text-emerald" />
                    )}
                    {e.withName}
                  </div>
                  <button onClick={() => removeEvent(e.id)} className="text-ink-soft hover:text-rose">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="text-[11px] text-ink-soft font-mono mt-1">
                  {e.date} · {e.time}
                </div>
                {e.notes && <div className="text-[11px] text-ink-soft mt-1">{e.notes}</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
