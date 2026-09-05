import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_META = {
  freelancer: {
    label: "Freelancer",
    color: "bg-founda-purple text-white",
    dot: "bg-founda-purple",
  },
  investor: {
    label: "Investor",
    color: "bg-founda-teal text-white",
    dot: "bg-founda-teal",
  },
  startup: {
    label: "Startup",
    color: "bg-founda-blue text-white",
    dot: "bg-founda-blue",
  },
};

export default function Navbar() {
  const { user, role, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = (newRole) => {
    switchRole(newRole);
    setOpen(false);
  };

  const handleExit = () => {
    logout();
    navigate("/");
  };

  const meta = ROLE_META[role] || ROLE_META.freelancer;

  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center border-b border-founda-line bg-white/80 px-4 backdrop-blur-md sm:px-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-founda-purple shadow-glow-sm">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </div>
        <span className="text-base font-extrabold tracking-tight text-founda-ink">Bridge</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Active role badge */}
        <span className={`hidden rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider sm:inline-block ${meta.color}`}>
          {meta.label}
        </span>

        {/* User name */}
        {user && (
          <span className="hidden text-sm font-medium text-founda-ink sm:inline">
            {user.name}
          </span>
        )}

        {/* Role Switcher */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="btn-ghost flex items-center gap-1.5 rounded-xl border border-founda-line bg-white px-3 py-2 text-xs font-semibold text-founda-ink transition-all hover:border-founda-purple hover:text-founda-purple"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <span className="hidden sm:inline">Switch Role</span>
            <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-founda-line bg-white shadow-card-hover animate-slide-up">
              <div className="px-4 pt-3 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-founda-muted">Switch to</p>
              </div>
              {Object.entries(ROLE_META).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => handleSwitch(key)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-founda-surface ${
                    role === key ? "font-bold text-founda-ink" : "text-founda-muted"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${val.dot}`} />
                  {val.label}
                  {role === key && (
                    <svg className="ml-auto h-4 w-4 text-founda-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}

              <div className="border-t border-founda-line" />

              <button
                onClick={handleExit}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Clear Session / Exit
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
