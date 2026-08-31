import { createContext, useContext, useEffect, useState } from "react";
import { milestones as seedMilestones } from "../data/dummyData";

const AppStateContext = createContext(null);

const DEFAULT_PROFILE = {
  status: "not_started", // not_started | draft | pending_review | verified
  startupName: "",
  sector: "",
  stage: "",
  description: "",
  ask: "",
  skillsHave: [],
  skillsNeeded: [],
  city: "",
  links: [], // [{platform: "Website", url: "..."}]
  registrationProofFile: null, // license/incorporation certificate
  domainVerification: null, // { domain, status: 'unverified'|'checking'|'verified', whois: {...} }
  pitchDeckFile: null, // .ppt/.pptx
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors in demo context
  }
}

export function AppStateProvider({ children }) {
  const [auth, setAuth] = useState(() => load("bridge_auth", null));
  const [profile, setProfile] = useState(() => load("bridge_profile", DEFAULT_PROFILE));
  const [events, setEvents] = useState(() => load("bridge_events", []));
  const [milestones, setMilestones] = useState(() => load("bridge_milestones", seedMilestones));
  const [notifications, setNotifications] = useState(() => load("bridge_notifications", []));
  const [toasts, setToasts] = useState([]);

  useEffect(() => save("bridge_auth", auth), [auth]);
  useEffect(() => save("bridge_profile", profile), [profile]);
  useEffect(() => save("bridge_events", events), [events]);
  useEffect(() => save("bridge_milestones", milestones), [milestones]);
  useEffect(() => save("bridge_notifications", notifications), [notifications]);

  /* ---------- notifications ---------- */

  function notify({ type = "info", icon = "bell", title, message }) {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item = {
      id,
      type, // success | info | warning | error
      icon,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((n) => [item, ...n].slice(0, 60));
    setToasts((t) => [...t.slice(-3), item]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }

  function dismissToast(id) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  function markNotificationRead(id) {
    setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  }

  function markAllNotificationsRead() {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }

  function deleteNotification(id) {
    setNotifications((n) => n.filter((x) => x.id !== id));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ---------- core flow ---------- */

  function register({ name, email, phone }) {
    setAuth({ name, email, phone, registeredAt: new Date().toISOString() });
    setProfile((p) => ({ ...p, status: "draft" }));
  }

  function updateProfile(patch) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  function submitProfileForReview() {
    setProfile((p) => ({ ...p, status: "pending_review" }));
  }

  function addEvent(evt) {
    setEvents((e) => [...e, { id: `evt_${Date.now()}`, ...evt }]);
  }

  function removeEvent(id) {
    setEvents((e) => e.filter((x) => x.id !== id));
  }

  function addMilestone(m) {
    setMilestones((prev) => [
      { id: `m_${Date.now()}`, verified: false, source: "Self-reported", date: new Date().toISOString().slice(0, 10), ...m },
      ...prev,
    ]);
  }

  function removeMilestone(id) {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }

  function resetAll() {
    ["bridge_auth", "bridge_profile", "bridge_events", "bridge_milestones", "bridge_notifications"].forEach((k) =>
      localStorage.removeItem(k)
    );
    setAuth(null);
    setProfile(DEFAULT_PROFILE);
    setEvents([]);
    setMilestones(seedMilestones);
    setNotifications([]);
    setToasts([]);
  }

  return (
    <AppStateContext.Provider
      value={{
        auth,
        profile,
        events,
        milestones,
        notifications,
        unreadCount,
        toasts,
        notify,
        dismissToast,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearNotifications,
        register,
        updateProfile,
        submitProfileForReview,
        addEvent,
        removeEvent,
        addMilestone,
        removeMilestone,
        resetAll,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
