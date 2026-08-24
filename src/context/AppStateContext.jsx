import { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => save("bridge_auth", auth), [auth]);
  useEffect(() => save("bridge_profile", profile), [profile]);
  useEffect(() => save("bridge_events", events), [events]);

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

  function resetAll() {
    localStorage.removeItem("bridge_auth");
    localStorage.removeItem("bridge_profile");
    localStorage.removeItem("bridge_events");
    setAuth(null);
    setProfile(DEFAULT_PROFILE);
    setEvents([]);
  }

  return (
    <AppStateContext.Provider
      value={{
        auth,
        profile,
        events,
        register,
        updateProfile,
        submitProfileForReview,
        addEvent,
        removeEvent,
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
