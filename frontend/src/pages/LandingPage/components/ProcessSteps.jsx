const steps = [
  {
    number: "01",
    color: "#8b5cf6",
    bg: "#8b5cf622",
    title: "Create Your Profile",
    description: "Sign up and verify your role (Entrepreneur, Freelancer or Investor).",
  },
  {
    number: "02",
    color: "#ff7a2f",
    bg: "#ff7a2f22",
    title: "Get Matched",
    description: "AI-powered matching based on skills, goals and interests.",
  },
  {
    number: "03",
    color: "#3157ff",
    bg: "#3157ff22",
    title: "Collaborate",
    description: "Work together, track milestones and share progress.",
  },
  {
    number: "04",
    color: "#21b984",
    bg: "#21b98422",
    title: "Grow & Succeed",
    description: "Get funded, build great products and create impact.",
  },
];

export default function ProcessSteps() {
  return (
    <section id="process" className="px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-black tracking-normal text-white md:text-4xl">
          How <span className="text-[#5b8aff]">Bridge</span> Works
        </h2>
        <p className="mt-3 text-center text-base font-medium text-gray-400">
          From idea to impact - in just 3 simple steps
        </p>

        <div className="relative mt-14">
          <div className="absolute left-[10%] right-[10%] top-5 hidden border-t-2 border-dashed border-[#3157ff]/20 md:block" />
          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative rounded-xl border border-white/10 bg-[#111827] px-6 pb-8 pt-11 text-center shadow-sm">
                <div
                  className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#0a0f1e] text-lg font-black shadow-lg"
                  style={{ backgroundColor: step.bg, color: step.color }}
                >
                  {step.number}
                </div>
                <h3 className="text-base font-black text-white">{step.title}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
