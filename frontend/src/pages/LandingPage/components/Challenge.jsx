const problems = [
  {
    title: "Limited Investor Access",
    description: "Early-stage founders struggle to reach the right investors.",
    color: "#ff7a2f",
    bg: "#fff3e9",
    icon: <path d="M4 17V7a2 2 0 0 1 2-2h12v12H6a2 2 0 0 0-2 2M8 9h6M8 13h4" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Skill Gaps in Startups",
    description: "Startups find it hard to get skilled and reliable team members.",
    color: "#d946ef",
    bg: "#fdf0ff",
    icon: <path d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-2a3 3 0 0 1 3-3M20 21v-2a3 3 0 0 0-3-3" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: "Poor Collaboration",
    description: "Ideas stay ideas due to lack of right guidance and network.",
    color: "#5b6cff",
    bg: "#eef0ff",
    icon: <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.5-1.5" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export default function Challenge() {
  return (
    <section className="bg-gradient-to-b from-[#f5f8ff] to-white px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-black tracking-normal text-[#07142f] md:text-4xl">
          The <span className="text-[#3157ff]">Challenge</span>
        </h2>
        <p className="mt-3 text-center text-base font-bold text-slate-700">
          Talented founders and skilled individuals often miss the right opportunities
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {problems.map((problem) => (
            <div key={problem.title} className="rounded-xl border border-slate-200 bg-white p-7 shadow-lg shadow-blue-950/5">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: problem.bg }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={problem.color} strokeWidth="2" className="h-6 w-6">
                    {problem.icon}
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#07142f]">{problem.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{problem.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-5 rounded-2xl border border-blue-100 bg-[#edf3ff] px-8 py-8 text-center shadow-inner md:flex-row md:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-[#3157ff] shadow-lg shadow-blue-500/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-9 w-9">
              <path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c.5.5 1 1.2 1 2.5h6c0-1.3.5-2 1-2.5A6 6 0 0 0 12 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xl font-black leading-8 text-[#07142f] md:text-2xl">
            Bridge is the solution - one platform to{" "}
            <span className="text-[#3157ff]">Connect</span>,{" "}
            <span className="text-[#3157ff]">Collaborate</span> and{" "}
            <span className="text-[#3157ff]">Grow.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
