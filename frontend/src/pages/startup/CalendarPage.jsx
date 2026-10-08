import React, { useState, useEffect, useMemo } from 'react';
import calendarApi from '../../services/calendarApi';
import CalendarEventModal from '../../components/calendar/CalendarEventModal';
import TasksPanel from '../../components/calendar/TasksPanel';
import {
  EVENT_TYPE_META,
  STATUS_META,
  formatLocalDate,
  formatLocalTime,
  localDateKey,
} from '../../components/calendar/calendarMeta';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad2 = (n) => String(n).padStart(2, '0');

const dateKey = (year, month, day) => `${year}-${pad2(month + 1)}-${pad2(day)}`;

const ROLE_META = {
  startup: {
    title: 'Startup Calendar',
    subtitle: 'Schedule pitches, interviews, skill tests, and internal meetings.',
  },
  investor: {
    title: 'Investor Calendar',
    subtitle: 'Your pitch meetings and commitments at a glance.',
  },
  freelancer: {
    title: 'Freelancer Calendar',
    subtitle: 'Your interviews, skill tests, and meeting schedule.',
  },
};

export default function CalendarPage({ role = 'startup' }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(dateKey(now.getFullYear(), now.getMonth(), now.getDate()));

  const [modalOpen, setModalOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState(null);
  const [modalPrefill, setModalPrefill] = useState(null);

  const meta = ROLE_META[role] || ROLE_META.startup;
  const isOrganizer = role === 'startup';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // The grid only renders cells for the visible month (the leading cells
      // are empty placeholders), so scoping the query to that month is both
      // correct and bounds the result. Without this the page pulled the entire
      // event history on every filter change.
      const params = {
        startDate: dateKey(viewYear, viewMonth, 1),
        endDate: dateKey(viewYear, viewMonth, new Date(viewYear, viewMonth + 1, 0).getDate()),
        limit: 50,
      };
      if (filterType) params.eventType = filterType;
      if (filterStatus) params.status = filterStatus;
      const [listRes, upcomingRes] = await Promise.all([
        calendarApi.listEvents(params),
        calendarApi.getUpcoming(10),
      ]);
      setEvents(listRes.data.events || []);
      setUpcoming(upcomingRes.data.events || upcomingRes.data.upcoming || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Re-fetch when the visible month changes, since that is now part of the query.
  }, [filterType, filterStatus, role, viewYear, viewMonth]);

  const goToMonth = (year, month) => {
    setViewYear(year);
    setViewMonth(month);
  };

  const moveMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = localDateKey(ev) || ev.date;
      (map[key] = map[key] || []).push(ev);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0))
    );
    return map;
  }, [events]);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const openCreate = (date) => {
    if (!isOrganizer) return;
    setModalEvent(null);
    setModalPrefill({ date });
    setModalOpen(true);
  };

  const openView = (event) => {
    setModalPrefill(null);
    setModalEvent(event);
    setModalOpen(true);
  };

  const handleSaved = () => {
    load();
    const parts = selectedDate.split('-').map(Number);
    goToMonth(parts[0], parts[1] - 1);
  };

  const filterEmpty = events.length === 0 && (filterType || filterStatus);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{meta.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{meta.subtitle}</p>
        </div>
        {isOrganizer && (
          <button
            onClick={() => openCreate(todayKey)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 transition"
          >
            + Schedule Event
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 text-xs rounded-2xl font-medium shadow-inner bg-rose-950/50 border border-rose-800/80 text-rose-300">
          {error}
        </div>
      )}

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => moveMonth(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-sm"
            >
              ‹
            </button>
            <button
              onClick={() => goToMonth(now.getFullYear(), now.getMonth())}
              className="px-3 py-2 rounded-xl text-[11px] font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition uppercase tracking-wider"
            >
              Today
            </button>
            <button
              onClick={() => moveMonth(1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-sm"
            >
              ›
            </button>
            <h3 className="ml-2 text-base font-bold text-white tracking-tight">
              {new Date(viewYear, viewMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
            >
              <option value="">All Event Types</option>
              {Object.entries(EVENT_TYPE_META).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_META).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-500 font-medium">Loading calendar...</div>
          ) : filterEmpty ? (
            <div className="text-center py-16">
              <div className="text-3xl mb-2">🗓️</div>
              <p className="text-xs text-slate-400">No events match the selected filters.</p>
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                }}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-semibold text-slate-200 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {WEEKDAYS.map((d, idx) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, idx) => (
                <div key={`b-${idx}`} className="min-h-16 sm:min-h-20 rounded-2xl" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const key = dateKey(viewYear, viewMonth, day);
                const dayEvents = eventsByDate[key] || [];
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setSelectedDate(key);
                      openCreate(key);
                    }}
                    className={`min-h-16 sm:min-h-20 rounded-2xl border p-1.5 sm:p-2 cursor-pointer transition group space-y-1 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-600/60 shadow-inner'
                        : isToday
                        ? 'bg-slate-800/40 border-indigo-500/40 shadow-inner'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-indigo-600/40 hover:bg-slate-900/80'
                    }`}
                  >
                    <div
                      className={`text-[10px] sm:text-[11px] font-bold ${
                        isToday ? 'text-indigo-300' : 'text-slate-400'
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const eventMeta = EVENT_TYPE_META[ev.eventType] || EVENT_TYPE_META.GENERAL_MEETING;
                        return (
                          <button
                            key={ev._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openView(ev);
                            }}
                            className={`w-full text-left px-1.5 sm:px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-semibold truncate border opacity-90 hover:opacity-100 hover:scale-[1.02] transition ${eventMeta.chip}`}
                          >
                            {formatLocalTime(ev)} {eventMeta.icon} {ev.title}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Events</h3>
            <span className="text-[10px] text-slate-500 font-medium">{upcoming.length} upcoming</span>
          </div>

          {upcoming.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-xs text-slate-400">
                {isOrganizer
                  ? 'No upcoming events. Schedule your next pitch or meeting above.'
                  : 'No upcoming meetings shared with you yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((ev) => {
                const eventMeta = EVENT_TYPE_META[ev.eventType] || EVENT_TYPE_META.GENERAL_MEETING;
                const statusMeta = STATUS_META[ev.status] || STATUS_META.SCHEDULED;
                return (
                  <button
                    key={ev._id}
                    onClick={() => openView(ev)}
                    className="w-full text-left bg-slate-950/60 border border-slate-800/80 hover:border-indigo-600/40 rounded-2xl p-4 flex items-center justify-between gap-4 transition group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-2xl text-base border shadow-inner ${eventMeta.chip}`}>
                        {eventMeta.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white tracking-tight truncate">{ev.title}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-lg border ${statusMeta.chip}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {formatLocalDate(ev)} • {formatLocalTime(ev)}
                          {ev.participantName ? ` • ${ev.participantName}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-600 group-hover:text-slate-400 text-xs transition">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <TasksPanel />
      </div>

      <CalendarEventModal
        open={modalOpen}
        event={modalEvent}
        prefill={modalPrefill}
        role={role}
        onClose={() => {
          setModalOpen(false);
          setModalEvent(null);
          setModalPrefill(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}