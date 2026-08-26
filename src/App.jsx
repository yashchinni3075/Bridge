import React, { useMemo, useState } from "react";

const DOMAINS = [
  "Web Development",
  "Mobile Development",
  "DevOps",
  "Data & AI/ML",
  "Design & Creative",
  "Digital Marketing",
  "Content & Writing",
  "Finance & Accounting",
  "Admin & Support",
  "Engineering & Architecture"
];

const STARTUPS = [
  {
    id: 101,
    name: "FinFlow",
    domain: "Web Development",
    stage: "Seed",
    engagement: "Ongoing",
    budget: "₹50k/month",
    location: "Remote (India)",
    teamSize: 6,
    requiredSkills: ["React", "Node.js", "PostgreSQL", "REST APIs"],
    tagline: "Real-time cash-flow forecasting for Indian SMEs.",
    about: "FinFlow helps small businesses predict cash shortfalls two months in advance using bank-feed data and lightweight ML models.",
    responsibilities: ["Build React dashboard features", "Design REST APIs", "Own PostgreSQL data models", "Work directly with the founding team"],
    trust: 78,
    competition: "High",
    verified: true
  },
  {
    id: 102,
    name: "Designly",
    domain: "Design & Creative",
    stage: "Pre-seed",
    engagement: "One-off",
    budget: "₹40k/project",
    location: "Ahmedabad (Hybrid)",
    teamSize: 3,
    requiredSkills: ["Figma", "Design Systems", "Prototyping", "User Research"],
    tagline: "A design studio-in-a-box for early founders.",
    about: "Designly packages an MVP-ready design system for pre-seed founders in under three weeks.",
    responsibilities: ["Design a reusable Figma system", "Run lightweight user interviews", "Create investor-demo prototypes", "Deliver developer-ready specs"],
    trust: 70,
    competition: "Medium",
    verified: true
  },
  {
    id: 103,
    name: "DataNest",
    domain: "Data & AI/ML",
    stage: "Seed",
    engagement: "Co-founder",
    budget: "Equity",
    location: "Solapur / Remote",
    teamSize: 2,
    requiredSkills: ["Python", "NLP", "Pandas", "Cosine Similarity"],
    tagline: "Turning scattered founder data into credibility intelligence.",
    about: "DataNest is building the scoring layer behind AI-driven investor matching and is looking for a technical co-founder.",
    responsibilities: ["Own the similarity matching engine", "Evaluate precision@k and recall@k", "Build the scoring pipeline", "Help set technical direction"],
    trust: 85,
    competition: "Low",
    verified: true
  },
  {
    id: 104,
    name: "CloudScale",
    domain: "DevOps",
    stage: "Seed",
    engagement: "Ongoing",
    budget: "₹60k/month",
    location: "Remote (India)",
    teamSize: 5,
    requiredSkills: ["Docker", "Kubernetes", "AWS", "CI/CD"],
    tagline: "One-click infrastructure scaling for growing SaaS startups.",
    about: "CloudScale automates infrastructure scaling for early SaaS teams.",
    responsibilities: ["Own CI/CD", "Manage Kubernetes", "Set up AWS scaling", "Improve release reliability"],
    trust: 80,
    competition: "Medium",
    verified: true
  },
  {
    id: 105,
    name: "GrowthLoop",
    domain: "Digital Marketing",
    stage: "Pre-seed",
    engagement: "One-off",
    budget: "₹35k/project",
    location: "Remote (India)",
    teamSize: 4,
    requiredSkills: ["SEO", "Google Ads", "Content Strategy", "Analytics"],
    tagline: "Performance marketing playbooks for pre-seed D2C founders.",
    about: "GrowthLoop helps first-time D2C founders launch their first paid and organic acquisition funnel.",
    responsibilities: ["Audit technical SEO", "Optimize Google Ads", "Build a 90-day content plan", "Set up analytics dashboards"],
    trust: 65,
    competition: "High",
    verified: true
  }
];

const FREELANCERS = [
  {
    id: 1,
    name: "Ishaan Verma",
    headline: "Full Stack Developer",
    domains: ["Web Development", "Data & AI/ML"],
    skills: ["React", "Node.js", "Express", "MongoDB", "TypeScript"],
    interests: ["Data & AI/ML"],
    experience: 2,
    rate: 900,
    location: "Pune, India",
    availability: "Open to Work",
    engagement: "Ongoing",
    trustScore: 82,
    projects: 8,
    contracts: 6,
    rating: 4.8,
    verified: true,
    verification: {
      email: "verified",
      mobile: "verified",
      identity: "verified",
      education: "verified",
      portfolio: "verified",
      reference: "pending"
    },
    skillsGrowth: ["PostgreSQL", "REST APIs", "AWS"],
    bio: "Full stack developer building startup products end-to-end, from data models to polished UI.",
    github: "https://github.com/",
    linkedin: "https://linkedin.com/"
  },
  {
    id: 2,
    name: "Aarav Shah",
    headline: "Senior UI/UX Designer",
    domains: ["Design & Creative"],
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    interests: ["Web Development"],
    experience: 3,
    rate: 1100,
    location: "Ahmedabad, India",
    availability: "Open to Work",
    engagement: "One-off",
    trustScore: 91,
    projects: 12,
    contracts: 9,
    rating: 4.9,
    verified: true,
    verification: {
      email: "verified",
      mobile: "verified",
      identity: "verified",
      education: "verified",
      portfolio: "verified",
      reference: "verified"
    },
    skillsGrowth: ["Accessibility", "Product Analytics"],
    bio: "Product designer who has shipped startup MVPs from wireframe to launch.",
    github: "",
    linkedin: "https://linkedin.com/"
  },
  {
    id: 3,
    name: "Meera Joshi",
    headline: "Data Scientist / ML Engineer",
    domains: ["Data & AI/ML"],
    skills: ["Python", "scikit-learn", "Pandas", "NLP", "Cosine Similarity"],
    interests: ["Web Development"],
    experience: 2,
    rate: 1000,
    location: "Solapur, India",
    availability: "Currently Engaged",
    engagement: "Co-founder",
    trustScore: 87,
    projects: 9,
    contracts: 7,
    rating: 4.7,
    verified: true,
    verification: {
      email: "verified",
      mobile: "verified",
      identity: "verified",
      education: "verified",
      portfolio: "verified",
      reference: "pending"
    },
    skillsGrowth: ["MLOps", "FastAPI"],
    bio: "ML engineer focused on recommendation systems and NLP-based scoring pipelines.",
    github: "https://github.com/",
    linkedin: "https://linkedin.com/"
  }
];

const INITIAL_APPLICATIONS = [
  { id: 9001, freelancerId: 1, startupId: 101, status: "Applied", date: "14 Aug 2026", engagement: "Ongoing" },
  { id: 9002, freelancerId: 1, startupId: 103, status: "Shortlisted", date: "12 Aug 2026", engagement: "Co-founder" }
];

const VERIFICATION_ITEMS = [
  ["email", "Email Verification", "Account ownership confirmed.", 10],
  ["mobile", "Mobile OTP Verification", "Phone ownership confirmed.", 10],
  ["identity", "Identity Verification", "Government identity evidence reviewed.", 25],
  ["education", "Education Verification", "Institution and qualification evidence reviewed.", 20],
  ["portfolio", "Portfolio Verification", "Work samples and portfolio links reviewed.", 20],
  ["reference", "Professional Reference", "Past client or employer reference reviewed.", 15]
];

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(n)));

function similarity(a, b) {
  const A = new Set(a.map((x) => x.toLowerCase()));
  const B = new Set(b.map((x) => x.toLowerCase()));
  const intersection = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? intersection / union : 0;
}

function matchScore(freelancer, startup, engagement) {
  const skill = similarity(freelancer.skills, startup.requiredSkills) * 100;
  const domain = freelancer.domains.includes(startup.domain)
    ? 100
    : freelancer.interests.includes(startup.domain)
      ? 60
      : 20;
  const experience = clamp(freelancer.experience * 32);
  const engagementFit = startup.engagement === engagement ? 100 : 35;
  const trust = freelancer.trustScore;

  const total = clamp(
    skill * 0.42 +
    domain * 0.20 +
    experience * 0.10 +
    engagementFit * 0.10 +
    trust * 0.18
  );

  const shared = startup.requiredSkills.filter((skillName) =>
    freelancer.skills.some((x) => x.toLowerCase() === skillName.toLowerCase())
  );

  const missing = startup.requiredSkills.filter((skillName) => !shared.includes(skillName));

  return { total, skill: clamp(skill), domain, experience, engagementFit, trust, shared, missing };
}

function candidateScore(freelancer, startup) {
  return matchScore(freelancer, startup, startup.engagement);
}

function initials(name) {
  return name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
}

function Badge({ children, tone = "purple" }) {
  const tones = {
    purple: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-teal-50 text-teal-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    gray: "bg-slate-100 text-slate-600"
  };
  return <span className={`badge ${tones[tone] || tones.gray}`}>{children}</span>;
}

function VerifiedBadge() {
  return (
    <span className="badge bg-gradient-to-r from-founda-purple to-founda-blue text-white shadow-sm">
      ✓ Verified
    </span>
  );
}

function MiniBar({ value, label, suffix = "%" }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
        <span>{label}</span><span>{value}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-founda-purple via-founda-blue to-founda-teal"
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-founda-ink">{value}</p>
          {hint && <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-50 to-cyan-50 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, role }) {
  const items = [
    ["dashboard", "◈", "Dashboard"],
    ["match", "◎", "01 — Match Engine"],
    ["pipeline", "▣", "02 — Pipeline"],
    ["verification", "✓", "03 — Verification"],
    ["profile", "●", "04 — Profile"]
  ];

  return (
    <aside className="w-full shrink-0 border-b border-founda-line bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="sticky top-[68px] p-4 md:min-h-[calc(100vh-68px)]">
        <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Workspace</p>
        <div className="space-y-1">
          {items.slice(0, 3).map(([id, icon, label], index) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                page === id
                  ? "bg-gradient-to-r from-founda-purple to-founda-blue text-white shadow-glow"
                  : "text-slate-600 hover:bg-violet-50 hover:text-founda-purple"
              }`}
            >
              <span className="w-5 text-center">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <p className="mb-3 mt-7 px-3 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Trust & Profile</p>
        <div className="space-y-1">
          {items.slice(3).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                page === id
                  ? "bg-gradient-to-r from-founda-purple to-founda-blue text-white shadow-glow"
                  : "text-slate-600 hover:bg-violet-50 hover:text-founda-purple"
              }`}
            >
              <span className="w-5 text-center">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-founda-navy p-4 text-white">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-founda-teal" />
            <span className="text-xs font-black uppercase tracking-wider">Live profile</span>
          </div>
          <p className="text-xs leading-5 text-slate-300">
            {role === "Freelancer"
              ? "Your selected freelancer profile controls matching, availability and trust data."
              : "Your selected startup profile controls candidate ranking and hiring context."}
          </p>
        </div>
      </div>
    </aside>
  );
}

function Header({ role, setRole, activeProfile, activeStartup }) {
  const isFreelancer = role === "Freelancer";
  const status = isFreelancer
    ? activeProfile?.availability || "Not Available"
    : `${activeStartup?.stage || "Startup"} · ${activeStartup?.engagement || "Hiring"}`;

  return (
    <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-founda-line bg-founda-navy px-4 text-white shadow-lg md:px-7">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-founda-purple via-founda-blue to-founda-teal text-sm font-black">
          F
        </div>
        <div>
          <div className="text-xl font-black tracking-tight">Founda<span className="text-founda-teal">.</span></div>
          <div className="hidden text-[9px] font-bold uppercase tracking-[.2em] text-slate-400 sm:block">Build · Connect · Grow</div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold sm:flex">
          <span className="h-2 w-2 rounded-full bg-founda-teal" />
          {status}
        </div>
        <button
          onClick={() => setRole(isFreelancer ? "Startup" : "Freelancer")}
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur transition hover:bg-white/15"
        >
          {isFreelancer ? "Switch to Startup" : "Switch to Freelancer"}
        </button>
      </div>
    </header>
  );
}

function Dashboard({ role, freelancer, startup, startups, freelancers, applications, setPage }) {
  const isFreelancer = role === "Freelancer";

  const topMatches = isFreelancer
    ? startups
        .map((s) => ({ s, bd: matchScore(freelancer, s, freelancer.engagement) }))
        .sort((a, b) => b.bd.total - a.bd.total)
    : freelancers
        .map((f) => ({ f, bd: candidateScore(f, startup) }))
        .sort((a, b) => b.bd.total - a.bd.total);

  const relevantApps = applications.filter((a) =>
    isFreelancer ? a.freelancerId === freelancer.id : a.startupId === startup.id
  );

  const counts = {
    applied: relevantApps.filter((a) => a.status === "Applied").length,
    shortlisted: relevantApps.filter((a) => a.status === "Shortlisted").length,
    interview: relevantApps.filter((a) => a.status === "Interview").length,
    accepted: relevantApps.filter((a) => a.status === "Accepted").length
  };

  const domainData = isFreelancer
    ? DOMAINS.map((domain) => {
        const matches = startups.filter((s) => s.domain === domain);
        const value = matches.length
          ? Math.max(...matches.map((s) => matchScore(freelancer, s, freelancer.engagement).total))
          : 0;
        return { domain, value };
      }).filter((x) => x.value > 0).sort((a, b) => b.value - a.value).slice(0, 5)
    : startup.requiredSkills.map((skill) => ({
        domain: skill,
        value: Math.max(...freelancers.map((f) =>
          f.skills.some((x) => x.toLowerCase() === skill.toLowerCase()) ? 100 : 25
        ))
      }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">
            {isFreelancer ? "Freelancer workspace" : "Startup workspace"}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-founda-ink">
            Welcome back, {isFreelancer ? freelancer.name.split(" ")[0] : startup.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isFreelancer
              ? "Your dashboard is focused on match quality, application progress and verification health."
              : "Your dashboard is focused on candidate quality, hiring progress and startup credibility."}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setPage("match")}>
          {isFreelancer ? "Find Best Matches →" : "Find Candidates →"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isFreelancer ? (
          <>
            <StatCard label="AI Matches" value={topMatches.length} hint="ranked opportunities" icon="◎" />
            <StatCard label="Applications" value={relevantApps.length} hint="from Match Engine" icon="↗" />
            <StatCard label="Shortlisted" value={counts.shortlisted} hint="moving forward" icon="★" />
            <StatCard label="Trust Score" value={`${freelancer.trustScore}/100`} hint="verified evidence" icon="✓" />
          </>
        ) : (
          <>
            <StatCard label="AI Candidates" value={topMatches.length} hint="ranked professionals" icon="◎" />
            <StatCard label="Active Hiring" value={relevantApps.length} hint="candidate pipeline" icon="↗" />
            <StatCard label="Shortlisted" value={counts.shortlisted} hint="moving forward" icon="★" />
            <StatCard label="Startup Trust" value={`${startup.trust}/100`} hint="profile credibility" icon="✓" />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-founda-ink">
                {isFreelancer ? "Match performance by domain" : "Candidate skill coverage"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {isFreelancer ? "Highest AI match score available in each domain." : "How strongly the current candidate pool covers your required skills."}
              </p>
            </div>
            <Badge tone="teal">Live</Badge>
          </div>

          <div className="space-y-4">
            {domainData.map((item) => (
              <div key={item.domain}>
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span className="max-w-[70%] truncate text-slate-600">{item.domain}</span>
                  <span className="text-founda-purple">{item.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-founda-purple via-founda-blue to-founda-teal"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-black text-founda-ink">Pipeline distribution</h2>
          <p className="mt-1 text-xs text-slate-500">Current applications linked to this profile.</p>
          <div className="mx-auto mt-5 grid h-40 w-40 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#5B21F4 0 45%, #0879E8 45% 70%, #12C7B0 70% 88%, #CBD5E1 88% 100%)`
            }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
              <div>
                <div className="text-2xl font-black text-founda-ink">{relevantApps.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</div>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-bold">
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-founda-purple" />Applied {counts.applied}</div>
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-founda-blue" />Shortlisted {counts.shortlisted}</div>
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-founda-teal" />Interview {counts.interview}</div>
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-300" />Accepted {counts.accepted}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black">Top ranked {isFreelancer ? "opportunities" : "candidates"}</h2>
              <p className="mt-1 text-xs text-slate-500">Generated from the same Match Engine used by the Match page.</p>
            </div>
            <button className="text-xs font-black text-founda-purple" onClick={() => setPage("match")}>View all →</button>
          </div>

          <div className="space-y-3">
            {topMatches.slice(0, 4).map((item, index) => {
              const entity = isFreelancer ? item.s : item.f;
              return (
                <div key={entity.id} className="flex items-center gap-3 rounded-xl border border-founda-line p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-founda-purple/10 to-founda-teal/10 text-sm font-black text-founda-purple">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black text-founda-ink">{entity.name}</p>
                      {isFreelancer && entity.verified && <VerifiedBadge />}
                    </div>
                    <p className="truncate text-xs text-slate-500">{isFreelancer ? entity.domain : entity.headline}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-founda-purple">{item.bd.total}%</div>
                    <div className="text-[10px] font-bold text-slate-400">MATCH</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-black">{isFreelancer ? "Profile & verification health" : "Startup profile health"}</h2>
          <p className="mt-1 text-xs text-slate-500">Signals that directly affect trust and match quality.</p>
          <div className="mt-5">
            {isFreelancer ? (
              <>
                <MiniBar label="Profile completeness" value={92} />
                <MiniBar label="Verification coverage" value={Math.round((Object.values(freelancer.verification).filter(v => v === "verified").length / 6) * 100)} />
                <MiniBar label="Portfolio strength" value={90} />
              </>
            ) : (
              <>
                <MiniBar label="Startup credibility" value={startup.trust} />
                <MiniBar label="Role clarity" value={92} />
                <MiniBar label="Hiring readiness" value={86} />
              </>
            )}
          </div>
          <div className="mt-4 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 p-4 text-xs leading-5 text-slate-600">
            <span className="font-black text-founda-purple">AI dashboard signal:</span>{" "}
            {isFreelancer
              ? `Your strongest current match is ${topMatches[0]?.s.name} at ${topMatches[0]?.bd.total}%.`
              : `Your strongest current candidate is ${topMatches[0]?.f.name} at ${topMatches[0]?.bd.total}%.`}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchEngine({ role, freelancer, startup, freelancers, selectedProfileId, setSelectedProfileId, setApplications, applications, setPage }) {
  const isFreelancer = role === "Freelancer";
  const profileId = selectedProfileId;
  const setProfileId = setSelectedProfileId;
  const [engagement, setEngagement] = useState(isFreelancer ? freelancer.engagement : startup.engagement);
  const [domain, setDomain] = useState("All Domains");
  const [selected, setSelected] = useState(null);

  const activeFreelancer = isFreelancer ? freelancers.find((f) => f.id === Number(profileId)) || freelancer : null;
  const activeStartup = !isFreelancer ? STARTUPS.find((s) => s.id === Number(profileId)) || startup : null;

  const results = useMemo(() => {
    if (isFreelancer) {
      return STARTUPS
        .filter((s) => domain === "All Domains" || s.domain === domain)
        .map((s) => ({ entity: s, score: matchScore(activeFreelancer, s, engagement) }))
        .sort((a, b) => b.score.total - a.score.total);
    }
    return FREELANCERS
      .filter((f) => domain === "All Domains" || f.domains.includes(domain))
      .map((f) => ({ entity: f, score: candidateScore(f, activeStartup) }))
      .sort((a, b) => b.score.total - a.score.total);
  }, [isFreelancer, activeFreelancer, activeStartup, domain, engagement]);

  const apply = (startupId) => {
    const exists = applications.some((a) => a.startupId === startupId && a.freelancerId === activeFreelancer.id);
    if (exists) return;
    setApplications((prev) => [
      ...prev,
      {
        id: Date.now(),
        freelancerId: activeFreelancer.id,
        startupId,
        status: "Applied",
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        engagement
      }
    ]);
  };

  const alreadyApplied = (startupId) =>
    applications.some((a) => a.startupId === startupId && a.freelancerId === activeFreelancer?.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">01 — Matching</p>
        <h1 className="mt-1 text-3xl font-black text-founda-ink">Match Engine</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Select the profile first. The engine then ranks the opposite side by skill-vector similarity, domain fit, experience, engagement and trust.
        </p>
      </div>

      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Select Profile</label>
            <select
              className="input"
              value={profileId}
              onChange={(e) => setProfileId(Number(e.target.value))}
            >
              {(isFreelancer ? FREELANCERS : STARTUPS).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Domain Filter</label>
            <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option>All Domains</option>
              {DOMAINS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Engagement Preference</label>
            <select className="input" value={engagement} onChange={(e) => setEngagement(e.target.value)}>
              <option>One-off</option>
              <option>Ongoing</option>
              <option>Co-founder</option>
            </select>
          </div>
        </div>
      </div>

      {isFreelancer && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Selected profile</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-founda-purple to-founda-blue font-black text-white">{initials(activeFreelancer.name)}</div>
              <div><p className="font-black">{activeFreelancer.name}</p><p className="text-xs text-slate-500">{activeFreelancer.headline}</p></div>
            </div>
          </div>
          <div className="card p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Current availability</p>
            <p className="mt-3 text-lg font-black text-founda-ink">{activeFreelancer.availability}</p>
            <VerifiedBadge />
          </div>
          <div className="card p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Engagement selected</p>
            <p className="mt-3 text-lg font-black text-founda-ink">{engagement}</p>
            <p className="text-xs text-slate-500">Used in the match score.</p>
          </div>
        </div>
      )}

      {!isFreelancer && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Selected startup</p>
              <h2 className="mt-1 text-lg font-black">{activeStartup.name} <VerifiedBadge /></h2>
              <p className="text-xs text-slate-500">{activeStartup.domain} · {activeStartup.stage} · {activeStartup.engagement}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-founda-purple">{activeStartup.trust}/100</div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Trust</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {results.map(({ entity, score }) => {
          const applied = isFreelancer && alreadyApplied(entity.id);
          return (
            <div key={entity.id} className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-glow">
              <div className="border-b border-founda-line bg-gradient-to-r from-white to-violet-50/50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-founda-ink">{entity.name}</h2>
                      {entity.verified && <VerifiedBadge />}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{isFreelancer ? entity.tagline : `${entity.headline} · ${entity.experience} yrs`}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-founda-purple">{score.total}%</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(isFreelancer ? entity.requiredSkills : entity.skills).slice(0, 5).map((s) => (
                    <Badge key={s} tone={score.shared.includes(s) ? "teal" : "gray"}>{s}{score.shared.includes(s) ? " ✓" : ""}</Badge>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  <MiniBar label="Skill similarity" value={score.skill} />
                  <MiniBar label="Domain fit" value={score.domain} />
                  <MiniBar label="Experience fit" value={score.experience} />
                  <MiniBar label="Trust contribution" value={score.trust} />
                </div>

                <div className="mt-3 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 p-3 text-xs leading-5 text-slate-600">
                  <b className="text-founda-purple">AI reason:</b>{" "}
                  {score.shared.length
                    ? `${score.shared.length} required skill${score.shared.length > 1 ? "s" : ""} overlap directly. `
                    : "There is limited direct skill overlap. "}
                  {score.missing.length
                    ? `Adding ${score.missing.slice(0, 2).join(" and ")} would strengthen the fit.`
                    : "The profile covers all listed skills."}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => setSelected({ entity, score })}>View breakdown</button>
                  {isFreelancer ? (
                    applied ? (
                      <button className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700" onClick={() => setPage("pipeline")}>
                        ✓ Applied · View Pipeline
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={() => apply(entity.id)}>Apply</button>
                    )
                  ) : (
                    <button className="btn-primary" onClick={() => setPage("pipeline")}>Review Pipeline</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-founda-navy/60 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge tone="purple">AI MATCH · {selected.score.total}%</Badge>
                <h2 className="mt-2 text-2xl font-black">{selected.entity.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{isFreelancer ? selected.entity.tagline : selected.entity.headline}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 font-bold" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MiniBar label="Skill Vector Similarity" value={selected.score.skill} />
              <MiniBar label="Domain Fit" value={selected.score.domain} />
              <MiniBar label="Experience Fit" value={selected.score.experience} />
              <MiniBar label="Engagement Fit" value={selected.score.engagementFit} />
              <MiniBar label="Trust Score" value={selected.score.trust} />
              <MiniBar label="Overall Match" value={selected.score.total} />
            </div>

            <div className="mt-5 rounded-2xl border border-founda-line p-4">
              <h3 className="text-sm font-black">Matched skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.score.shared.length
                  ? selected.score.shared.map((s) => <Badge key={s} tone="teal">✓ {s}</Badge>)
                  : <span className="text-sm text-slate-500">No direct skill overlap.</span>}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <h3 className="text-sm font-black text-amber-800">Potential gaps</h3>
              <p className="mt-1 text-sm text-amber-700">
                {selected.score.missing.length ? selected.score.missing.join(", ") : "No major skill gaps detected."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pipeline({ role, selectedProfileId, applications, freelancers, startups, setApplications }) {
  const isFreelancer = role === "Freelancer";
  const current = isFreelancer
    ? applications.filter((a) => a.freelancerId === Number(selectedProfileId))
    : applications.filter((a) => a.startupId === Number(selectedProfileId));
  const stages = ["Applied", "Shortlisted", "Interview", "Accepted", "Rejected"];

  const updateStatus = (id, status) => {
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">02 — Workflow</p>
        <h1 className="mt-1 text-3xl font-black text-founda-ink">Application Pipeline</h1>
        <p className="mt-2 text-sm text-slate-500">Track every application from Applied to the final decision. Applications are created only from the Match Engine.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {stages.map((stage) => (
          <div key={stage} className="min-h-[280px] rounded-2xl border border-founda-line bg-slate-50/80 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">{stage}</h3>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-black text-founda-purple shadow-sm">
                {current.filter((a) => a.status === stage).length}
              </span>
            </div>

            <div className="space-y-2">
              {current.filter((a) => a.status === stage).map((app) => {
                const startup = startups.find((s) => s.id === app.startupId);
                const freelancer = freelancers.find((f) => f.id === app.freelancerId);
                return (
                  <div key={app.id} className="rounded-xl border border-founda-line bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black">{isFreelancer ? startup?.name : freelancer?.name}</p>
                      {isFreelancer && freelancer?.verified && <VerifiedBadge />}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {isFreelancer ? startup?.domain : freelancer?.headline}
                    </p>
                    <Badge tone="purple">{app.engagement}</Badge>
                    <p className="mt-2 text-[10px] font-bold text-slate-400">{app.date}</p>

                    <select
                      className="input mt-2 py-2 text-xs"
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                    >
                      {stages.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Verification({ freelancer, setFreelancers }) {
  const verifiedCount = Object.values(freelancer.verification).filter((x) => x === "verified").length;
  const score = freelancer.trustScore;
  const level = score >= 90 ? "Professionally Verified" : score >= 75 ? "Identity Verified" : "Basic Verified";

  const requestReview = (key) => {
    setFreelancers((prev) => prev.map((f) => {
      if (f.id !== freelancer.id) return f;
      return { ...f, verification: { ...f.verification, [key]: "pending" } };
    }));
  };

  const approve = (key) => {
    setFreelancers((prev) => prev.map((f) => {
      if (f.id !== freelancer.id) return f;
      const next = { ...f.verification, [key]: "verified" };
      const points = { email: 10, mobile: 10, identity: 25, education: 20, portfolio: 20, reference: 15 };
      const newScore = Object.entries(next).reduce((sum, [k, v]) => sum + (v === "verified" ? points[k] : 0), 0);
      return { ...f, verification: next, trustScore: Math.min(100, newScore) };
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">03 — Trust</p>
        <h1 className="mt-1 text-3xl font-black text-founda-ink">Verification & Credibility</h1>
        <p className="mt-2 text-sm text-slate-500">Verification is evidence-based. There is no Skill Assessment module here; professional verification is represented by the Verified badge.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="card p-5 text-center">
          <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-[conic-gradient(#5B21F4_0deg,#0879E8_190deg,#12C7B0_295deg,#E8ECF4_295deg)]">
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
              <div>
                <div className="text-3xl font-black text-founda-purple">{score}</div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Trust Score</div>
              </div>
            </div>
          </div>
          <div className="mt-4"><VerifiedBadge /></div>
          <p className="mt-2 text-sm font-black text-founda-ink">{level}</p>
          <p className="mt-1 text-xs text-slate-500">{verifiedCount}/6 verification items verified.</p>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Verified profile badge</h2>
              <p className="mt-1 text-sm text-slate-500">The badge appears on your profile and match cards when core identity and professional evidence are verified.</p>
            </div>
            <VerifiedBadge />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {VERIFICATION_ITEMS.map(([key, name, desc, points]) => {
              const status = freelancer.verification[key];
              return (
                <div key={key} className="rounded-2xl border border-founda-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black">{name}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
                    </div>
                    <span className="text-xs font-black text-founda-purple">+{points}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge tone={status === "verified" ? "green" : status === "pending" ? "orange" : "gray"}>
                      {status === "verified" ? "✓ Verified" : status === "pending" ? "Pending Review" : "Not Verified"}
                    </Badge>
                    {status === "unverified" && (
                      <button className="text-xs font-black text-founda-purple" onClick={() => requestReview(key)}>Submit →</button>
                    )}
                    {status === "pending" && (
                      <button className="text-xs font-black text-emerald-700" onClick={() => approve(key)}>Approve Demo</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Verified Evidence" value={`${verifiedCount}/6`} hint="reviewed items" icon="✓" />
        <StatCard label="Profile Trust" value={`${score}%`} hint="used by Match Engine" icon="◈" />
        <StatCard label="Professional Badge" value="Active" hint="visible on match cards" icon="★" />
      </div>
    </div>
  );
}

function Profile({ freelancer, setFreelancers }) {
  const [draft, setDraft] = useState({ ...freelancer, skills: [...freelancer.skills] });

  const update = (key, value) => setDraft((p) => ({ ...p, [key]: value }));

  const save = () => {
    setFreelancers((prev) => prev.map((f) => f.id === draft.id ? draft : f));
  };

  const toggleDomain = (domain) => {
    setDraft((p) => ({
      ...p,
      domains: p.domains.includes(domain) ? p.domains.filter((d) => d !== domain) : [...p.domains, domain]
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-founda-purple">04 — Identity</p>
        <h1 className="mt-1 text-3xl font-black text-founda-ink">Profile</h1>
        <p className="mt-2 text-sm text-slate-500">The selected profile is the source of truth for matching, availability, engagement and verification.</p>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-4 border-b border-founda-line pb-5 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-founda-purple via-founda-blue to-founda-teal text-2xl font-black text-white">
            {initials(draft.name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">{draft.name}</h2>
              <VerifiedBadge />
            </div>
            <p className="text-sm text-slate-500">{draft.headline} · {draft.location}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="green">{draft.availability}</Badge>
              <Badge tone="purple">{draft.engagement}</Badge>
              <Badge tone="blue">Trust {draft.trustScore}/100</Badge>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={draft.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <label className="label">Professional Headline</label>
            <input className="input" value={draft.headline} onChange={(e) => update("headline", e.target.value)} />
          </div>
          <div>
            <label className="label">Experience</label>
            <input className="input" type="number" value={draft.experience} onChange={(e) => update("experience", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Hourly Rate (₹)</label>
            <input className="input" type="number" value={draft.rate} onChange={(e) => update("rate", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Availability</label>
            <select className="input" value={draft.availability} onChange={(e) => update("availability", e.target.value)}>
              <option>Open to Work</option>
              <option>Currently Engaged</option>
              <option>Not Available</option>
            </select>
          </div>
          <div>
            <label className="label">Engagement Preference</label>
            <select className="input" value={draft.engagement} onChange={(e) => update("engagement", e.target.value)}>
              <option>One-off</option>
              <option>Ongoing</option>
              <option>Co-founder</option>
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={draft.location} onChange={(e) => update("location", e.target.value)} />
          </div>
          <div>
            <label className="label">GitHub / Portfolio</label>
            <input className="input" value={draft.github} onChange={(e) => update("github", e.target.value)} />
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Professional Domains</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => toggleDomain(domain)}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                  draft.domains.includes(domain)
                    ? "border-founda-purple bg-violet-50 text-founda-purple"
                    : "border-founda-line bg-white text-slate-500 hover:border-violet-200"
                }`}
              >
                {draft.domains.includes(domain) ? "✓ " : ""}{domain}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Skills</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {draft.skills.map((skill) => <Badge key={skill} tone="purple">{skill}</Badge>)}
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Bio</label>
          <textarea
            className="input min-h-28"
            value={draft.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>

        <button className="btn-primary mt-5" onClick={save}>Save Profile</button>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [role, setRoleState] = useState("Freelancer");
  const [freelancers, setFreelancers] = useState(FREELANCERS);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [selectedProfileId, setSelectedProfileId] = useState(FREELANCERS[0].id);

  const freelancer = freelancers.find((f) => f.id === Number(selectedProfileId)) || freelancers[0];
  const startup = STARTUPS.find((s) => s.id === Number(selectedProfileId)) || STARTUPS[0];

  const activeProfile = role === "Freelancer" ? freelancer : null;
  const activeStartup = role === "Startup" ? startup : null;

  const setRole = (nextRole) => {
    setRoleState(nextRole);
    setSelectedProfileId(nextRole === "Freelancer" ? FREELANCERS[0].id : STARTUPS[0].id);
  };

  return (
    <div className="min-h-screen">
      <Header
        role={role}
        setRole={setRole}
        activeProfile={activeProfile}
        activeStartup={activeStartup}
      />

      <div className="flex min-h-[calc(100vh-68px)] flex-col md:flex-row">
        <Sidebar page={page} setPage={setPage} role={role} />

        <main className="min-w-0 flex-1 p-4 md:p-7">
          <div className="mx-auto max-w-[1450px]">
            {page === "dashboard" && (
              <Dashboard
                role={role}
                freelancer={freelancer}
                startup={startup}
                startups={STARTUPS}
                freelancers={freelancers}
                applications={applications}
                setPage={setPage}
              />
            )}

            {page === "match" && (
              <MatchEngine
                role={role}
                freelancer={freelancer}
                startup={startup}
                freelancers={freelancers}
                selectedProfileId={selectedProfileId}
                setSelectedProfileId={setSelectedProfileId}
                applications={applications}
                setApplications={setApplications}
                setPage={setPage}
              />
            )}

            {page === "pipeline" && (
              <Pipeline
                role={role}
                selectedProfileId={selectedProfileId}
                applications={applications}
                freelancers={freelancers}
                startups={STARTUPS}
                setApplications={setApplications}
              />
            )}

            {page === "verification" && (
              <Verification freelancer={freelancer} setFreelancers={setFreelancers} />
            )}

            {page === "profile" && (
              <Profile freelancer={freelancer} setFreelancers={setFreelancers} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
