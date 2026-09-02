import { NavLink, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Handshake, Milestone,
  FileText, UserCircle, CalendarDays,
} from "lucide-react";
import { useAppState } from "../context/AppStateContext";
import { VerifyBadge } from "./ui";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/investors", label: "Discover Investors", icon: Handshake },
  { to: "/teammates", label: "Find Teammates", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/milestones", label: "Milestones", icon: Milestone },
  { to: "/pitch", label: "Pitch Score", icon: FileText },
  { to: "/profile", label: "My Profile", icon: UserCircle },
];

function profileCompletionPercent(profile) {
  const fields = [
    profile.startupName, profile.sector, profile.stage, profile.description,
    profile.ask, profile.city, profile.registrationProofFile,
    profile.domainVerification?.domain ? profile.domainVerification?.status === "verified" : true,
    profile.pitchDeckFile,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export default function Layout() {
  const { auth, profile } = useAppState();

  if (!auth) return <Navigate to="/register" replace />;

  const completion = profileCompletionPercent(profile);

  return (
    <div className="grid grid-cols-[250px_1fr] min-h-screen">
      <aside className="bg-ink text-white p-7 flex flex-col gap-7">
        <div className="flex items-baseline gap-2">
          <span className="w-7 h-7 bg-coral rounded-md flex items-center justify-center text-white font-display font-bold text-base">
            B
          </span>
          <span className="font-display font-semibold text-xl">Bridge</span>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between text-[11px] text-white/50 mb-1.5">
            <span>Profile</span>
            <span>{completion}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-coral rounded-full" style={{ width: `${completion}%` }} />
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
                    ? "bg-coral text-white font-semibold"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4 text-[11px] text-white/40 leading-relaxed">
          Signed in as {auth.name}
          <br />
          Startup Module — dummy data
        </div>
      </aside>

      <main className="p-9 max-w-5xl w-full">
        <Outlet />
      </main>
    </div>
  );
}
