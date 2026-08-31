import { useState } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Handshake, Milestone, FileText,
  UserCircle, CalendarDays, RotateCcw, Menu, X,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { VerifyBadge, Avatar } from "./ui";
import { NotificationBell } from "./NotificationCenter";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/investors", label: "Discover Investors", icon: Handshake },
  { to: "/teammates", label: "Find Teammates", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/milestones", label: "Milestones", icon: Milestone },
  { to: "/pitch", label: "Pitch Score", icon: FileText },
  { to: "/profile", label: "Complete Profile", icon: UserCircle },
];

const SECTION_TITLES = {
  "/": "Dashboard",
  "/investors": "Discover Investors",
  "/teammates": "Find Teammates",
  "/calendar": "Calendar",
  "/milestones": "Milestones",
  "/pitch": "Pitch Score",
  "/profile": "Complete Profile",
};

function profileCompletionPercent(profile) {
  const fields = [
    profile.startupName, profile.sector, profile.stage, profile.description,
    profile.ask, profile.city, profile.registrationProofFile,
    profile.domainVerification?.status === "verified", profile.pitchDeckFile,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function SidebarContent({ auth, profile, completion, onNavigate }) {
  const { resetAll } = useAppState();
  return (
    <div className="flex h-full flex-col gap-7 overflow-y-auto p-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-brand to-violet-500 font-display text-base font-bold text-white shadow-[0_8px_20px_-8px_rgb(79_70_229/0.7)]">
          B
        </span>
        <div>
          <span className="block font-display text-lg font-bold leading-none tracking-tight">Bridge</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Startup module</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
        <div className="mb-1.5 flex justify-between text-[11px] font-medium text-white/50">
          <span>Profile strength</span>
          <span className="font-mono text-white/80">{completion}%</span>
        </div>
        <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all duration-500"
            style={{ width: `${Math.max(completion, 3)}%` }}
          />
        </div>
        <VerifyBadge status={profile.status} />
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] transition-all ${
                isActive
                  ? "bg-gradient-to-r from-brand to-violet-500 font-semibold text-white shadow-[0_8px_20px_-8px_rgb(79_70_229/0.7)]"
                  : "text-white/60 hover:bg-white/[0.07] hover:text-white"
              }`
            }
          >
            <item.icon size={16} strokeWidth={2.25} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2.5">
          <Avatar name={auth.name} size={32} />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{auth.name}</p>
            <p className="truncate text-[11px] text-white/40">{auth.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Reset all demo data (account, profile, events, notifications)?")) resetAll();
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          <RotateCcw size={11} /> Reset demo data
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { auth, profile } = useAppState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (!auth) return <Navigate to="/register" replace />;

  const completion = profileCompletionPercent(profile);
  const sectionTitle =
    SECTION_TITLES[location.pathname] ||
    (location.pathname.startsWith("/investors/") ? "Investor Profile" : location.pathname.startsWith("/teammates/") ? "Teammate Profile" : "Bridge");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* desktop sidebar */}
      <aside className="hidden bg-ink lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent auth={auth} profile={profile} completion={completion} />
        </div>
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 animate-slide-down bg-ink">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={17} />
            </button>
            <SidebarContent auth={auth} profile={profile} completion={completion} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-40 border-b border-line bg-app/85 backdrop-blur-md">
          <div className="flex items-center gap-3 px-5 py-3 sm:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-raised text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>
            <span className="font-display text-sm font-semibold tracking-tight">{sectionTitle}</span>
            <div className="ml-auto flex items-center gap-2.5">
              <span className="mr-1 hidden sm:block">
                <VerifyBadge status={profile.status} />
              </span>
              <NotificationBell />
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-raised py-1.5 pl-1.5 pr-3">
                <Avatar name={auth.name} size={26} />
                <span className="hidden max-w-28 truncate text-xs font-semibold md:block">{auth.name.split(" ")[0]}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 animate-fade-up px-5 py-7 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
