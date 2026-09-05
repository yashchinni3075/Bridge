import { useFreelancer } from "../../context/FreelancerContext";

const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    key: "match",
    label: "Match Engine",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: "pipeline",
    label: "Pipeline",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: "verification",
    label: "Verification",
    freelancerOnly: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Profile",
    freelancerOnly: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function Sidebar({ page, setPage }) {
  const { role } = useFreelancer();
  const items = NAV.filter((item) => !item.freelancerOnly || role === "Freelancer");

  return (
    <aside className="shrink-0 border-b border-founda-line bg-white p-3 md:w-[232px] md:border-b-0 md:border-r md:p-4">
      <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all md:w-full ${
              page === item.key
                ? "bg-founda-purple/10 text-founda-purple font-semibold"
                : "text-founda-muted hover:bg-founda-surface hover:text-founda-ink"
            }`}
          >
            <span className={`shrink-0 ${page === item.key ? "text-founda-purple" : "text-founda-muted"}`}>
              {item.icon}
            </span>
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
