const roles = [
  {
    title: "Entrepreneur",
    description: "Showcase your startup, track milestones and pitch to investors.",
    cta: "Join as Entrepreneur",
    color: "#ff7a2f",
    bg: "from-orange-500/10 to-transparent",
    border: "border-orange-500/20",
    icon: (
      <path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8.8-2.2 0-3s-2.2-.8-3 0zM15 9l-3 3M9.5 6.5c1-1 2.5-2.5 4.5-3.5 3-1.5 6-1 6-1s.5 3-1 6c-1 2-2.5 3.5-3.5 4.5M14.5 14.5l-9-9" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Freelancer",
    description: "Find startups, use your skills and build something meaningful.",
    cta: "Join as Freelancer",
    color: "#3157ff",
    bg: "from-blue-500/10 to-transparent",
    border: "border-blue-500/20",
    icon: (
      <path d="M4 6h16v12H4zM8 21h8M12 18v3" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Investor",
    description: "Discover vetted founders and invest in the next big thing.",
    cta: "Join as Investor",
    color: "#21b984",
    bg: "from-emerald-500/10 to-transparent",
    border: "border-emerald-500/20",
    icon: (
      <path d="M3 8h18v10H3zM7 8V6h10v2M8 13h.01M16 13h.01M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="roles" className="px-5 pb-8 pt-6 md:px-10 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-black tracking-normal text-white md:text-4xl">
          Join as the role that fits you
        </h2>
        <p className="mt-3 text-center text-base font-medium text-gray-400">
          Be a part of the innovation ecosystem
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.title}
              className={`rounded-2xl border ${role.border} bg-gradient-to-br ${role.bg} p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${role.color}22` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={role.color} strokeWidth="2" className="h-8 w-8">
                  {role.icon}
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-black text-white">{role.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-6 text-gray-400">
                {role.description}
              </p>
              <button
                className="mt-7 w-full max-w-[230px] rounded-lg border-2 bg-white/5 px-5 py-3 text-sm font-extrabold transition hover:bg-white/10"
                style={{ borderColor: role.color, color: role.color }}
              >
                {role.cta} -&gt;
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
