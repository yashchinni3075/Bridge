export default function Hero({ onRegister }) {
  const photoFrame =
    "relative overflow-hidden rounded-[34%] border-[3px] border-white/20 bg-[#1a2235] shadow-2xl shadow-blue-900/30";
  const glowPad =
    "absolute -inset-5 -z-10 rounded-[42%] bg-gradient-to-br from-[#3157ff]/20 via-[#1a2235] to-transparent blur-sm";
  const labelCard =
    "absolute z-30 flex items-center gap-2 rounded-xl bg-[#111827]/95 px-3 py-2 shadow-xl shadow-blue-900/20 ring-1 ring-white/10";

  return (
    <section id="top" className="relative px-5 pb-12 pt-12 md:px-10 md:pb-14 md:pt-14">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_74%_8%,rgba(49,87,255,0.15)_0,#0f172a_31%,#0a0f1e_65%)]" />
      <div className="absolute left-0 top-0 -z-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#3157ff]/15 px-3 py-1.5 text-xs font-extrabold text-[#5b8aff] shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="m5 12 14-7-7 14-2-7-5-0Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Skill-Linked Investing Platform
          </span>

          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-black leading-[1.04] tracking-normal text-white md:mx-0 md:text-5xl lg:text-[56px]">
            Ideas deserve the right <span className="text-[#5b8aff]">People</span> &{" "}
            <span className="text-[#5b8aff]">Funding.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base font-semibold leading-7 text-gray-400 md:mx-0">
            Bridge connects entrepreneurs, skilled freelancers and investors on one platform -
            to turn innovative ideas into real, successful businesses.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-start">
            <button onClick={onRegister} className="w-full rounded-lg bg-[#3157ff] px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 transition hover:bg-[#2447e8] sm:w-auto">
              Register
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#3157ff]/35 bg-white/5 px-6 py-3.5 text-sm font-extrabold text-gray-200 shadow-sm transition hover:border-[#3157ff] sm:w-auto">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#3157ff] text-[#3157ff]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-2.5 w-2.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              Watch How It Works
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-gray-400 md:justify-start">
            {["No intermediaries", "Transparent progress", "Opportunity for all"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4 text-[#5b8aff]">
                  <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-[330px] w-full max-w-[540px] md:h-[405px]">
          <div className="absolute left-[9%] top-[8%] h-[82%] w-[82%] rounded-full bg-[radial-gradient(circle,rgba(49,87,255,0.15)_0,rgba(15,23,42,0.5)_42%,rgba(255,255,255,0)_72%)] blur-xl" />
          <div className="absolute left-[13%] top-[12%] h-[70%] w-[74%] rounded-full border border-dashed border-[#3157ff]/25" />
          <div className="absolute left-[21%] top-[21%] h-[50%] w-[56%] rounded-full border border-dashed border-[#3157ff]/20" />

          <div className="absolute left-[7%] top-[14%] z-20 md:left-[10%] md:top-[16%]">
            <div className={`${labelCard} -left-10 -top-8`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3157ff]/20 text-[#5b8aff]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M6 19V8l6-4 6 4v11" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 19v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <div className="text-xs font-black leading-none text-[#5b8aff]">Freelancer</div>
                <div className="mt-1 text-[9px] font-semibold leading-none text-gray-500">Builds & Collaborates</div>
              </div>
            </div>
            <div className={`${photoFrame} h-28 w-28 md:h-[136px] md:w-[136px]`}>
              <div className={glowPad} />
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=360&h=360&fit=crop&crop=faces"
                alt="Freelancer"
                className="h-full w-full object-cover object-[50%_25%]"
              />
            </div>
          </div>

          <div className="absolute right-[8%] top-[3%] z-20 md:right-[11%] md:top-[4%]">
            <div className={`${labelCard} -right-12 top-2`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3157ff]/20 text-[#5b8aff]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="text-right">
                <div className="text-xs font-black leading-none text-[#5b8aff]">Investor</div>
                <div className="mt-1 text-[9px] font-semibold leading-none text-gray-500">Funds & Mentors</div>
              </div>
            </div>
            <div className={`${photoFrame} ml-auto h-32 w-32 md:h-[152px] md:w-[152px]`}>
              <div className={glowPad} />
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=420&h=420&fit=crop&crop=faces"
                alt="Investor"
                className="h-full w-full object-cover object-[50%_18%]"
              />
            </div>
          </div>

          <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 md:bottom-2">
            <div className={`${photoFrame} h-48 w-48 rounded-[36%] md:h-56 md:w-56`}>
              <div className={glowPad} />
              <img
                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=520&h=520&fit=crop&crop=faces"
                alt="Entrepreneur"
                className="h-full w-full object-cover object-[50%_18%]"
              />
            </div>
            <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-2xl bg-[#111827] px-5 py-3 shadow-2xl shadow-blue-900/20 ring-1 ring-white/10">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3157ff]/20 text-[#5b8aff]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <div className="text-base font-black leading-none text-[#5b8aff]">Entrepreneur</div>
                <div className="mt-1 text-[11px] font-semibold text-gray-500">Builds the Idea</div>
              </div>
            </div>
          </div>

          <div className="absolute left-[50%] top-[13%] z-30 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3157ff]/20 text-[#5b8aff] shadow-lg md:h-14 md:w-14">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
              <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute bottom-[25%] right-[5%] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-[#5b8aff] shadow-xl ring-1 ring-white/10 md:right-[2%]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute bottom-[24%] left-[12%] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-[#5b8aff] shadow-xl ring-1 ring-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
