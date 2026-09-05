import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "bridge_session";

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  const user = session?.user ?? null;
  const token = session?.token ?? null;
  const role = session?.user?.role ?? null;

  const login = useCallback((userData, jwtToken) => {
    const next = { user: userData, token: jwtToken };
    setSession(next);
    saveSession(next);
  }, []);

  const setUser = useCallback((userObj, selectedRole) => {
    const next = { user: { ...userObj, role: selectedRole }, token: session?.token };
    setSession(next);
    saveSession(next);
  }, [session?.token]);

  const switchRole = useCallback((newRole) => {
    setSession((prev) => {
      if (!prev?.user) return prev;
      const next = { ...prev, user: { ...prev.user, role: newRole } };
      saveSession(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    saveSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, role, login, setUser, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
