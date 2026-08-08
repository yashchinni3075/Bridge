const stats = [
  { value: "500+", label: "Entrepreneurs", icon: "users" },
  { value: "300+", label: "Freelancers", icon: "person" },
  { value: "120+", label: "Investors", icon: "chart" },
  { value: "Rs 10Cr+", label: "Potential Funding", icon: "coin" },
];

function StatIcon({ type }) {
  const paths = {
    users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />,
    person: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" strokeLinecap="round" strokeLinejoin="round" />,
    chart: <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" strokeLinecap="round" strokeLinejoin="round" />,
    coin: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v10M16 9H9.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 1 0 5H8" strokeLinecap="round" strokeLinejoin="round" />,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-9 w-9 text-[#3157ff]">
      {paths[type]}
    </svg>
  );
}

export default function CommunityStats() {
  return (
    <section className="px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl rounded-2xl bg-[#061330] px-8 py-10 text-center shadow-2xl shadow-blue-950/20">
        <p className="text-lg font-medium text-white">Our Growing Community</p>
        <div className="mt-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-center gap-4 lg:border-r lg:border-white/20 last:lg:border-r-0">
              <StatIcon type={stat.icon} />
              <div className="text-left">
                <div className="text-3xl font-black text-white">{stat.value}</div>
                <div className="text-sm font-medium text-slate-300">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
