import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Rocket,
  ShieldCheck,
  Search,
  X,
  Menu,
  LogOut,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Check,
  XCircle,
  Clock,
  Eye,
  ArrowLeft,
  FileCheck,
} from "lucide-react";
import {
  ADMIN_FREELANCERS,
  ADMIN_INVESTORS,
  ADMIN_STARTUPS,
} from "../../data/adminData.js";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "freelancers", label: "Freelancers", icon: Users },
  { id: "investors", label: "Investors", icon: TrendingUp },
  { id: "startups", label: "Startups", icon: Rocket },
  { id: "verification", label: "Verification", icon: ShieldCheck },
];

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [freelancers, setFreelancers] = useState(ADMIN_FREELANCERS);
  const [investors, setInvestors] = useState(ADMIN_INVESTORS);
  const [startups, setStartups] = useState(ADMIN_STARTUPS);

  const allProfiles = useMemo(
    () => [...freelancers, ...investors, ...startups],
    [freelancers, investors, startups],
  );

  const stats = useMemo(
    () => ({
      freelancers: freelancers.length,
      investors: investors.length,
      startups: startups.length,
      total: freelancers.length + investors.length + startups.length,
      pending: allProfiles.filter((p) => p.verificationStatus === "pending")
        .length,
      verified: allProfiles.filter((p) => p.verificationStatus === "verified")
        .length,
      rejected: allProfiles.filter((p) => p.verificationStatus === "rejected")
        .length,
    }),
    [freelancers, investors, startups, allProfiles],
  );

  const pendingProfiles = useMemo(
    () => allProfiles.filter((p) => p.verificationStatus === "pending"),
    [allProfiles],
  );

  const handleVerify = (profileId, newStatus) => {
    const updater = (list) =>
      list.map((p) =>
        p.id === profileId ? { ...p, verificationStatus: newStatus, verified: newStatus === "verified" } : p,
      );
    setFreelancers(updater);
    setInvestors(updater);
    setStartups(updater);
    if (selectedProfile && selectedProfile.id === profileId) {
      setSelectedProfile((prev) =>
        prev
          ? { ...prev, verificationStatus: newStatus, verified: newStatus === "verified" }
          : prev,
      );
    }
  };

  const handleNavigate = (id) => {
    setActiveNav(id);
    setSelectedProfile(null);
    setSearchQuery("");
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-100">
      <Sidebar
        open={sidebarOpen}
        activeItem={activeNav}
        onNavigate={handleNavigate}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopHeader
          onMenuClick={() => setSidebarOpen(true)}
          stats={stats}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {selectedProfile ? (
            <ProfileDetail
              profile={selectedProfile}
              onBack={() => setSelectedProfile(null)}
              onVerify={handleVerify}
            />
          ) : (
            <>
              {activeNav === "overview" && (
                <OverviewView
                  stats={stats}
                  allProfiles={allProfiles}
                  onSelectProfile={setSelectedProfile}
                />
              )}
              {activeNav === "freelancers" && (
                <ProfileListView
                  title="Freelancers"
                  profiles={freelancers}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectProfile={setSelectedProfile}
                  onVerify={handleVerify}
                  roleFilter="Freelancer"
                />
              )}
              {activeNav === "investors" && (
                <ProfileListView
                  title="Investors"
                  profiles={investors}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectProfile={setSelectedProfile}
                  onVerify={handleVerify}
                  roleFilter="Investor"
                />
              )}
              {activeNav === "startups" && (
                <ProfileListView
                  title="Startups"
                  profiles={startups}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectProfile={setSelectedProfile}
                  onVerify={handleVerify}
                  roleFilter="Startup"
                />
              )}
              {activeNav === "verification" && (
                <VerificationView
                  pendingProfiles={pendingProfiles}
                  allProfiles={allProfiles}
                  onSelectProfile={setSelectedProfile}
                  onVerify={handleVerify}
                />
              )}
            </>
          )}
        </main>

        <footer className="border-t border-white/10 bg-[#060b18] py-5">
          <p className="px-4 text-center text-xs text-gray-500">
            Bridge · Admin Dashboard
          </p>
        </footer>
      </div>
    </div>
  );
}

function Sidebar({ open, activeItem, onNavigate, onClose }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#111827] transition-transform duration-200 lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3157ff] text-lg font-bold text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className="h-5 w-5"
            >
              <path
                d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9.5 18h5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            Bridge
          </span>
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-4 mb-3 rounded-lg bg-[#3157ff]/10 px-3 py-2">
        <span className="text-xs font-semibold text-[#5b8aff]">
          Admin Panel
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-4 pb-4">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeItem === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-[#3157ff]/15 text-[#5b8aff]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-[#5b8aff]" : "text-gray-500"}`}
                strokeWidth={1.8}
              />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5 text-gray-500" strokeWidth={1.8} />
          Logout
        </button>
      </div>
    </aside>
  );
}

function TopHeader({ onMenuClick, stats }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0f1e]/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
            Admin Dashboard
          </p>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
            {stats.pending} Pending
          </span>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            {stats.verified} Verified
          </span>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl p-1.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7a2f] text-sm font-semibold text-white">
            AD
          </span>
          <span className="hidden text-left md:block">
            <span className="block text-sm font-semibold text-white">
              Admin
            </span>
            <span className="block text-xs text-gray-500">
              Administrator
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  const colors = {
    blue: "bg-[#3157ff]/15 text-[#5b8aff]",
    green: "bg-emerald-500/15 text-emerald-400",
    purple: "bg-purple-500/15 text-purple-400",
    amber: "bg-amber-500/15 text-amber-400",
    red: "bg-red-500/15 text-red-400",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#111827] p-5 text-left transition hover:border-white/20 hover:bg-[#1a2235]"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}>
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </button>
  );
}

function VerificationBadge({ status }) {
  const map = {
    verified: {
      label: "Verified",
      icon: Check,
      cls: "bg-emerald-500/15 text-emerald-400",
    },
    pending: {
      label: "Pending",
      icon: Clock,
      cls: "bg-amber-500/15 text-amber-400",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      cls: "bg-red-500/15 text-red-400",
    },
  };
  const item = map[status] || map.pending;
  const Icon = item.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.cls}`}
    >
      <Icon size={10} strokeWidth={3} />
      {item.label}
    </span>
  );
}

function OverviewView({ stats, allProfiles, onSelectProfile }) {
  const recentProfiles = [...allProfiles]
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))
    .slice(0, 5);

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-white">Overview</h2>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Freelancers"
          value={stats.freelancers}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Investors"
          value={stats.investors}
          color="green"
        />
        <StatCard
          icon={Rocket}
          label="Startups"
          value={stats.startups}
          color="purple"
        />
        <StatCard
          icon={ShieldCheck}
          label="Pending Verification"
          value={stats.pending}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <h3 className="mb-4 text-lg font-bold text-white">
            Verification Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Verified
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                {stats.verified}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Pending
              </span>
              <span className="text-sm font-semibold text-amber-400">
                {stats.pending}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Rejected
              </span>
              <span className="text-sm font-semibold text-red-400">
                {stats.rejected}
              </span>
            </div>
          </div>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/5">
            {stats.total > 0 && (
              <>
                <div
                  className="bg-emerald-400"
                  style={{
                    width: `${(stats.verified / stats.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-amber-400"
                  style={{
                    width: `${(stats.pending / stats.total) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-400"
                  style={{
                    width: `${(stats.rejected / stats.total) * 100}%`,
                  }}
                />
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <h3 className="mb-4 text-lg font-bold text-white">
            Recent Registrations
          </h3>
          <div className="space-y-3">
            {recentProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelectProfile(profile)}
                className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left transition hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={profile.name} size={36} />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {profile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.role === "Startup"
                        ? profile.name
                        : profile.role === "Investor"
                          ? profile.org || profile.role
                          : profile.headline || profile.role}
                    </p>
                  </div>
                </div>
                <VerificationBadge status={profile.verificationStatus} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileListView({
  title,
  profiles,
  searchQuery,
  onSearchChange,
  onSelectProfile,
  onVerify,
}) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, location..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111827] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-[#3157ff]/50 sm:w-80"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#111827] p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-600" />
          <p className="text-sm text-gray-400">No profiles found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <ProfileRow
              key={profile.id}
              profile={profile}
              onSelect={() => onSelectProfile(profile)}
              onVerify={onVerify}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileRow({ profile, onSelect, onVerify }) {
  const roleColor = {
    Freelancer: "bg-[#3157ff]/15 text-[#5b8aff]",
    Investor: "bg-emerald-500/15 text-emerald-400",
    Startup: "bg-purple-500/15 text-purple-400",
  };

  const subtitle =
    profile.role === "Startup"
      ? profile.tagline
      : profile.role === "Investor"
        ? `${profile.title} at ${profile.org}`
        : profile.headline;

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-4 transition hover:border-white/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} size={44} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-white">{profile.name}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleColor[profile.role] || "bg-white/10 text-gray-400"}`}
              >
                {profile.role}
              </span>
              <VerificationBadge status={profile.verificationStatus} />
            </div>
            <p className="mt-0.5 truncate text-xs text-gray-400">{subtitle}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {profile.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-[60px] sm:pl-0">
          {profile.verificationStatus === "pending" && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVerify(profile.id, "verified");
                }}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/25"
              >
                <Check className="h-3.5 w-3.5" />
                Verify
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVerify(profile.id, "rejected");
                }}
                className="flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/25"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onSelect}
            className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-white/10"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileDetail({ profile, onBack, onVerify }) {
  const roleColor = {
    Freelancer: "bg-[#3157ff]/15 text-[#5b8aff]",
    Investor: "bg-emerald-500/15 text-emerald-400",
    Startup: "bg-purple-500/15 text-purple-400",
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
            <div className="mb-4 flex flex-col items-center text-center">
              <Avatar name={profile.name} size={72} />
              <h3 className="mt-3 text-xl font-bold text-white">
                {profile.name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColor[profile.role] || "bg-white/10 text-gray-400"}`}
                >
                  {profile.role}
                </span>
                <VerificationBadge status={profile.verificationStatus} />
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4">
              <InfoRow icon={Mail} label="Email" value={profile.email} />
              <InfoRow icon={Phone} label="Phone" value={profile.phone} />
              <InfoRow icon={MapPin} label="Location" value={profile.location} />
              {profile.registeredAt && (
                <InfoRow
                  icon={Clock}
                  label="Registered"
                  value={profile.registeredAt}
                />
              )}
            </div>

            <div className="mt-5 flex gap-2">
              {profile.verificationStatus === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => onVerify(profile.id, "verified")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <Check className="h-4 w-4" />
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => onVerify(profile.id, "rejected")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </>
              )}
              {profile.verificationStatus === "verified" && (
                <button
                  type="button"
                  onClick={() => onVerify(profile.id, "rejected")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-red-500/10 hover:text-red-400"
                >
                  <XCircle className="h-4 w-4" />
                  Revoke Verification
                </button>
              )}
              {profile.verificationStatus === "rejected" && (
                <button
                  type="button"
                  onClick={() => onVerify(profile.id, "verified")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {profile.bio && (
            <DetailSection title="About">
              <p className="text-sm leading-relaxed text-gray-300">
                {profile.bio}
              </p>
            </DetailSection>
          )}

          {profile.role === "Freelancer" && (
            <FreelancerDetails profile={profile} />
          )}
          {profile.role === "Investor" && (
            <InvestorDetails profile={profile} />
          )}
          {profile.role === "Startup" && (
            <StartupDetails profile={profile} />
          )}

          {(profile.github || profile.linkedin) && (
            <DetailSection title="Links">
              <div className="flex flex-wrap gap-3">
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

function FreelancerDetails({ profile }) {
  return (
    <>
      <DetailSection title="Professional Info">
        <div className="grid grid-cols-2 gap-4">
          <InfoBlock label="Headline" value={profile.headline} />
          <InfoBlock label="Experience" value={profile.experience} />
          <InfoBlock label="Rate" value={profile.rate} />
          <InfoBlock label="Availability" value={profile.availability} />
          <InfoBlock label="Projects" value={String(profile.projects)} />
          <InfoBlock label="Trust Score" value={`${profile.trustScore}%`} />
          <InfoBlock label="Rating" value={`${profile.rating} / 5.0`} />
        </div>
      </DetailSection>

      {profile.skills && (
        <DetailSection title="Skills">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-[#3157ff]/10 px-3 py-1 text-xs font-medium text-[#5b8aff]"
              >
                {skill}
              </span>
            ))}
          </div>
        </DetailSection>
      )}
    </>
  );
}

function InvestorDetails({ profile }) {
  return (
    <>
      <DetailSection title="Investment Info">
        <div className="grid grid-cols-2 gap-4">
          <InfoBlock label="Organization" value={profile.org} />
          <InfoBlock label="Title" value={profile.title} />
          <InfoBlock label="Stage" value={profile.stage} />
          <InfoBlock label="Check Range" value={profile.checkRange} />
        </div>
      </DetailSection>

      {profile.sectors && (
        <DetailSection title="Sectors">
          <div className="flex flex-wrap gap-2">
            {profile.sectors.map((sector) => (
              <span
                key={sector}
                className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
              >
                {sector}
              </span>
            ))}
          </div>
        </DetailSection>
      )}

      {profile.pastInvestments && (
        <DetailSection title="Past Investments">
          <div className="space-y-2">
            {profile.pastInvestments.map((inv, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2"
              >
                <span className="text-sm font-medium text-white">
                  {inv.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                    {inv.sector}
                  </span>
                  <span className="text-xs text-gray-500">{inv.year}</span>
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
      )}
    </>
  );
}

function StartupDetails({ profile }) {
  return (
    <>
      <DetailSection title="Startup Info">
        <div className="grid grid-cols-2 gap-4">
          <InfoBlock label="Domain" value={profile.domain} />
          <InfoBlock label="Stage" value={profile.stage} />
          <InfoBlock label="Team Size" value={String(profile.teamSize)} />
          <InfoBlock label="Budget" value={profile.budget} />
          <InfoBlock label="Trust Score" value={`${profile.trust}%`} />
        </div>
      </DetailSection>

      {profile.tagline && (
        <DetailSection title="Tagline">
          <p className="text-sm italic text-gray-300">
            &ldquo;{profile.tagline}&rdquo;
          </p>
        </DetailSection>
      )}

      {profile.requiredSkills && (
        <DetailSection title="Required Skills">
          <div className="flex flex-wrap gap-2">
            {profile.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </DetailSection>
      )}
    </>
  );
}

function VerificationView({
  pendingProfiles,
  allProfiles,
  onSelectProfile,
  onVerify,
}) {
  const [filter, setFilter] = useState("pending");

  const displayed =
    filter === "pending"
      ? pendingProfiles
      : allProfiles.filter((p) => p.verificationStatus === filter);

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-white">
        Verification Management
      </h2>
      <p className="mb-6 text-sm text-gray-400">
        Review and manage profile verification requests.
      </p>

      <div className="mb-6 flex gap-2">
        {["pending", "verified", "rejected"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filter === s
                ? s === "pending"
                  ? "bg-amber-500/15 text-amber-400"
                  : s === "verified"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
              {allProfiles.filter((p) => p.verificationStatus === s).length}
            </span>
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#111827] p-12 text-center">
          <FileCheck className="mx-auto mb-3 h-10 w-10 text-gray-600" />
          <p className="text-sm text-gray-400">
            {filter === "pending"
              ? "No pending verification requests"
              : `No ${filter} profiles`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((profile) => (
            <ProfileRow
              key={profile.id}
              profile={profile}
              onSelect={() => onSelectProfile(profile)}
              onVerify={onVerify}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, size = 44 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#3157ff] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-gray-500" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <p className="truncate text-sm text-gray-200">{value}</p>
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-gray-200">{value}</p>
    </div>
  );
}

export default AdminDashboard;
