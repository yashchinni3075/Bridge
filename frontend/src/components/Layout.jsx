import { NavLink, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Handshake, Milestone,
  FileText, UserCircle, CalendarDays,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { VerifyBadge } from "./ui";

const navItems = [
  { to: "/startup-dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/investors", label: "Discover Investors", icon: Handshake },
  { to: "/teammates", label: "Find Teammates", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/milestones", label: "Milestones", icon: Milestone },
  { to: "/pitch", label: "Pitch Score", icon: FileText },
  { to: "/profile", label: "Complete Profile", icon: UserCircle },
];

function profileCompletionPercent(profile) {
  const fields = [
    profile.startupName, profile.sector, profile.stage, profile.description,
    profile.ask, profile.city, profile.registrationProofFile,
    profile.domainVerification?.status === "verified", profile.pitchDeckFile,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export default function Layout() {
  const { auth, profile } = useAppState();

  if (!auth) return <Navigate to="/register" replace />;

  const completion = profileCompletionPercent(profile);

  return (
    <div className="grid grid-cols-[250px_1fr] min-h-screen bg-[#0a0f1e] text-gray-100">
      <aside className="bg-[#111827] border-r border-white/10 p-7 flex flex-col gap-7">
        <div className="flex items-baseline gap-2">
          <span className="w-9 h-9 bg-[#3157ff] rounded-xl flex items-center justify-center text-white font-bold text-base">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5">
              <path d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 18h5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-bold text-xl text-white">Bridge</span>
        </div>

        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
            <span>Profile</span>
            <span>{completion}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-[#3157ff] rounded-full" style={{ width: `${completion}%` }} />
          </div>
          <VerifyBadge status={profile.status} />
        </div>

        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] transition-colors ${
                  isActive
                    ? "bg-[#3157ff] text-white font-semibold"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4 text-[11px] text-gray-500 leading-relaxed">
          Signed in as {auth.name}
          <br />
          Startup Module — demo data
        </div>
      </aside>

      <main className="p-9 max-w-5xl w-full">
        <Outlet />
      </main>
    </div>
  );
}
