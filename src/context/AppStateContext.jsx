import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { milestones as seedMilestones } from "../data/dummyData";
import { API_URL } from "../lib/api";

function profileKey(userId) {
  return userId ? `bridge_profile_${userId}` : "bridge_profile";
}

const AppStateContext = createContext(null);

const DEFAULT_PROFILE = {
  status: "not_started",
  startupName: "",
  sector: "",
  stage: "",
  description: "",
  ask: "",
  skillsHave: [],
  skillsNeeded: [],
  city: "",
  links: [],
  registrationProofFile: null,
  domainVerification: null,
  pitchDeckFile: null,
};

const TOKEN_KEY = "bridge_token";
const USER_KEY = "bridge_user";

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
    // ignore
  }
}

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(() => load(USER_KEY, null));
  const [token, setToken] = useState(() => load(TOKEN_KEY, null));
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(() => load(profileKey(load(USER_KEY, null)?.id), DEFAULT_PROFILE));
  const [events, setEvents] = useState(() => load("bridge_events", []));
  const [milestones, setMilestones] = useState(() => load("bridge_milestones", seedMilestones));
  const [notifications, setNotifications] = useState(() => load("bridge_notifications", []));
  const [toasts, setToasts] = useState([]);

  // Restore the user session from the backend using the saved token
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const savedToken = load(TOKEN_KEY, null);
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (res.ok) {
          const result = await res.json();
          const restoredUser = result.user || load(USER_KEY, null);
          if (!cancelled) {
            setUser(restoredUser);
            setToken(savedToken);
          }
          try {
            const profRes = await fetch(`${API_URL}/api/profile`, {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            if (profRes.ok) {
              const profResult = await profRes.json();
              if (profResult.profile && !cancelled) {
                setProfile({ ...DEFAULT_PROFILE, ...profResult.profile });
              }
            }
          } catch {
            // profile fetch failed — fall back to local cache
          }
        } else {
          if (!cancelled) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            setToken(null);
          }
        }
      } catch {
        // network error — keep cached user but don't crash
        if (!cancelled) setUser(load(USER_KEY, null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => save(TOKEN_KEY, token), [token]);
  useEffect(() => save(USER_KEY, user), [user]);
  useEffect(() => save(profileKey(user?.id), profile), [profile, user]);
  useEffect(() => save("bridge_events", events), [events]);
  useEffect(() => save("bridge_milestones", milestones), [milestones]);
  useEffect(() => save("bridge_notifications", notifications), [notifications]);

  const session = user ? { user, access_token: token } : null;

  const auth = user
    ? {
        name: user.name || user.email?.split("@")[0] || "User",
        email: user.email,
        phone: user.phone || "",
        registeredAt: user.registeredAt,
      }
    : null;

  function notify({ type = "info", icon = "bell", title, message }) {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item = { id, type, icon, title, message, read: false, createdAt: new Date().toISOString() };
    setNotifications((n) => [item, ...n].slice(0, 60));
    setToasts((t) => [...t.slice(-3), item]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }

  function dismissToast(id) { setToasts((t) => t.filter((x) => x.id !== id)); }
  function markNotificationRead(id) { setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x))); }
  function markAllNotificationsRead() { setNotifications((n) => n.map((x) => ({ ...x, read: true }))); }
  function deleteNotification(id) { setNotifications((n) => n.filter((x) => x.id !== id)); }
  function clearNotifications() { setNotifications([]); }
  const unreadCount = notifications.filter((n) => !n.read).length;

  const login = useCallback(function login(userData, accessToken) {
    setUser(userData);
    setToken(accessToken);
    // Pull the user's saved profile from the backend on every login so they
    // never have to re-enter details they already completed.
    if (accessToken) {
      fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((result) => {
          if (result?.profile) {
            const p = result.profile;
            // Only restore when the backend actually has profile data — a bare
            // "not_started" fallback shouldn't wipe a freshly-registered draft.
            if (p.startupName || p.status !== "not_started") {
              setProfile({ ...DEFAULT_PROFILE, ...p });
            }
          }
        })
        .catch((err) => console.error("failed to load profile after login:", err));
    }
    return userData;
  }, []);

  const register = useCallback(function register(userData, accessToken) {
    setUser(userData);
    setToken(accessToken);
    setProfile({ ...DEFAULT_PROFILE, status: "draft" });
    return userData;
  }, []);

  function persistProfile(data) {
    if (!token) return;
    fetch(`${API_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...data,
        user_id: user?.id,
      }),
    }).catch((err) => console.error("failed to save profile:", err));
  }

  function updateProfile(patch) {
    setProfile((p) => {
      const next = { ...p, ...patch };
      persistProfile(next);
      return next;
    });
  }

  function submitProfileForReview() {
    setProfile((p) => {
      const next = { ...p, status: "pending_review" };
      persistProfile(next);
      return next;
    });
    if (token) {
      fetch(`${API_URL}/api/profile/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => console.error("failed to submit profile:", err));
    }
  }
  function addEvent(evt) { setEvents((e) => [...e, { id: `evt_${Date.now()}`, ...evt }]); }
  function removeEvent(id) { setEvents((e) => e.filter((x) => x.id !== id)); }

  function addMilestone(m) {
    setMilestones((prev) => [
      { id: `m_${Date.now()}`, verified: false, source: "Self-reported", date: new Date().toISOString().slice(0, 10), ...m },
      ...prev,
    ]);
  }
  function removeMilestone(id) { setMilestones((prev) => prev.filter((m) => m.id !== id)); }

  async function signOut() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setProfile(DEFAULT_PROFILE);
    try { localStorage.removeItem("bridge_profile"); } catch { /* ignore */ }
    setEvents([]);
    setMilestones(seedMilestones);
    setNotifications([]);
    setToasts([]);
  }

  return (
    <AppStateContext.Provider
      value={{
        auth,
        user,
        session,
        loading,
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
        login,
        updateProfile,
        submitProfileForReview,
        addEvent,
        removeEvent,
        addMilestone,
        removeMilestone,
        signOut,
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
