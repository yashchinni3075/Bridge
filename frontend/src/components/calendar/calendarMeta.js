export const EVENT_TYPE_META = {
  INVESTOR_PITCH: {
    label: 'Investor Pitch',
    short: 'Pitch',
    icon: '💰',
    color: 'text-indigo-400',
    chip: 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/70',
  },
  FREELANCER_INTERVIEW: {
    label: 'Freelancer Interview',
    short: 'Interview',
    icon: '🗣️',
    color: 'text-emerald-400',
    chip: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/70',
  },
  FREELANCER_SKILL_TEST: {
    label: 'Freelancer Skill Test',
    short: 'Skill Test',
    icon: '🧪',
    color: 'text-violet-400',
    chip: 'bg-violet-950/60 text-violet-300 border border-violet-800/70',
  },
  GENERAL_MEETING: {
    label: 'General Meeting',
    short: 'General',
    icon: '🤝',
    color: 'text-amber-400',
    chip: 'bg-amber-950/60 text-amber-300 border border-amber-800/70',
  },
};

export const EVENT_TYPES = Object.keys(EVENT_TYPE_META);

export const STATUS_META = {
  SCHEDULED: {
    label: 'Scheduled',
    chip: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/70',
  },
  COMPLETED: {
    label: 'Completed',
    chip: 'bg-blue-950/60 text-blue-300 border border-blue-800/70',
  },
  CANCELLED: {
    label: 'Cancelled',
    chip: 'bg-rose-950/60 text-rose-300 border border-rose-800/70',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    chip: 'bg-amber-950/60 text-amber-300 border border-amber-800/70',
  },
};

export const EVENT_STATUSES = Object.keys(STATUS_META);

export const PARTICIPANT_TYPE_LABEL = {
  investor: 'Investor',
  freelancer: 'Freelancer',
  user: 'User',
  general: 'General',
};

const pad2 = (n) => String(n).padStart(2, '0');

// Local (not UTC) YYYY-MM-DD for "today".
export const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

// Local HH:mm for right now.
export const nowTimeStr = () => {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 === 0 ? 12 : h % 12;
  return `${hours12}:${pad2(m)} ${period}`;
};

// IANA timezone of the current browser/user (used when scheduling events).
export const getBrowserTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch (err) {
    return 'UTC';
  }
};

// Correct local (viewer-timezone) date for a stored UTC instant, with fallback
// to the raw wall-clock string for legacy events that predate timezone storage.
export const formatLocalDate = (ev) => {
  if (!ev) return '';
  if (ev.startAt) {
    const d = new Date(ev.startAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  return formatDate(ev.date);
};

// Correct local time range for a stored UTC instant, falling back to raw
// wall-clock strings when startAt is unavailable.
export const formatLocalTime = (ev) => {
  if (!ev) {
    return '';
  }
  if (ev.startAt) {
    const s = new Date(ev.startAt);
    const e = ev.endAt ? new Date(ev.endAt) : null;
    if (!Number.isNaN(s.getTime()) && (!e || !Number.isNaN(e.getTime()))) {
      const fmt = (d) =>
        d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return e ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
    }
  }
  if (ev.startTime) {
    const t = formatTime(ev.startTime);
    return ev.endTime ? `${t} – ${formatTime(ev.endTime)}` : t;
  }
  return '';
};

// Local YYYY-MM-DD grouping key for a stored UTC instant (falls back to ev.date).
export const localDateKey = (ev) => {
  if (ev?.startAt) {
    const d = new Date(ev.startAt);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }
  }
  return ev?.date || '';
};

export const isValidMeetingLink = (value) => {
  if (!value || !value.trim()) return true;
  let candidate = value.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const url = new URL(candidate);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch (err) {
    return false;
  }
};