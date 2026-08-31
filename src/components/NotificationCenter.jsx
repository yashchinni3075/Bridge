import { useEffect, useRef, useState } from "react";
import {
  Bell, X, CheckCircle2, Info, AlertTriangle, CircleAlert,
  Handshake, Code2, Trophy, FileCheck2, Globe2, UploadCloud,
  Sparkles, UserPlus2, CalendarPlus, CheckCheck, Trash2,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";

const ICONS = {
  bell: Bell,
  welcome: Sparkles,
  intro: Handshake,
  invite: UserPlus2,
  event: CalendarPlus,
  "event-pitch": Handshake,
  "event-test": Code2,
  milestone: Trophy,
  doc: FileCheck2,
  domain: Globe2,
  upload: UploadCloud,
  score: Sparkles,
};

const TONES = {
  success: "bg-emerald-soft text-emerald",
  info: "bg-brand-soft text-brand",
  warning: "bg-amber-soft text-amber",
  error: "bg-rose-soft text-rose",
};

const FALLBACK_ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: CircleAlert,
};

export function NotifIcon({ type, icon, size = 14 }) {
  const Icon = ICONS[icon] || FALLBACK_ICONS[type] || Info;
  return <Icon size={size} strokeWidth={2.25} />;
}

export function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------------- bell + dropdown ---------------- */

export function NotificationBell() {
  const { notifications, unreadCount, markAllNotificationsRead, markNotificationRead, deleteNotification, clearNotifications } =
    useAppState();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className={`relative grid h-10 w-10 place-items-center rounded-xl border transition-colors ${
          open ? "border-brand-line bg-brand-soft text-brand" : "border-line bg-raised text-muted hover:text-ink hover:border-slate-300"
        }`}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[10px] font-bold text-white ring-2 ring-raised">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] origin-top-right animate-pop overflow-hidden rounded-card border border-line bg-raised shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  title="Mark all as read"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-emerald"
                >
                  <CheckCheck size={15} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  title="Clear all"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-rose"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-app text-muted">
                  <Bell size={18} />
                </span>
                <p className="text-sm font-semibold">You're all caught up</p>
                <p className="text-xs text-muted">Actions like intros, invites and scheduling will show up here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`group flex gap-3 border-b border-line/70 px-4 py-3 transition-colors last:border-0 hover:bg-app/60 ${
                    n.read ? "" : "bg-brand-soft/40"
                  }`}
                >
                  <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TONES[n.type] || TONES.info}`}>
                    <NotifIcon type={n.type} icon={n.icon} />
                  </span>
                  <button onClick={() => markNotificationRead(n.id)} className="min-w-0 flex-1 text-left">
                    <p className={`truncate text-[13px] ${n.read ? "font-medium text-muted" : "font-semibold text-ink"}`}>
                      {n.title}
                    </p>
                    {n.message && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{n.message}</p>}
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted/80">
                      {timeAgo(n.createdAt)}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    title="Remove"
                    className="h-6 w-6 shrink-0 place-self-start rounded-md text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- live toasts ---------------- */

export function ToastStack() {
  const { toasts, dismissToast } = useAppState();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-[min(92vw,360px)] flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-card border border-line bg-raised p-3.5 shadow-pop"
        >
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TONES[t.type] || TONES.info}`}>
            <NotifIcon type={t.type} icon={t.icon} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] font-semibold leading-snug">{t.title}</p>
            {t.message && <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.message}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="rounded-md p-1 text-muted hover:bg-app hover:text-ink">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
