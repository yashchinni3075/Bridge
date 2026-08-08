const features = [
  {
    title: "Pitch Meets",
    description: "Organize and attend live pitch sessions with investors.",
    color: "#3157ff",
    bg: "#edf0ff",
    icon: <path d="M4 5h13l-3 6 3 6H4V5zM4 21V3" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Milestone Tracking",
    description: "Show real progress with a transparent timeline.",
    color: "#6d5dfc",
    bg: "#f0edff",
    icon: <path d="M3 3v18h18M7 15l4-4 3 3 5-7" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Skill & Team Building",
    description: "Find and onboard the exact skills your startup needs.",
    color: "#ff7a2f",
    bg: "#fff3e9",
    icon: <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Investor Exposure",
    description: "Get discovered by active investors looking for early stage founders.",
    color: "#20aeea",
    bg: "#eaf8ff",
    icon: <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-gradient-to-b from-[#f4f9ff] to-white px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-black tracking-normal text-[#07142f] md:text-4xl">
          Everything You Need to <span className="text-[#3157ff]">Succeed</span>
        </h2>

        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: feature.bg }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={feature.color} strokeWidth="2" className="h-6 w-6">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-black text-[#07142f]">{feature.title}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
