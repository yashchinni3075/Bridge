import { useFreelancer } from "../../context/FreelancerContext";

export default function Header() {
  const { role, setRole, activeProfile, activeStartup } = useFreelancer();
  const isFreelancer = role === "Freelancer";
  const status = isFreelancer
    ? activeProfile?.availability || "Not Available"
    : `${activeStartup?.stage || "Startup"} · ${activeStartup?.engagement || "Hiring"}`;

  return (
    <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-white/10 bg-[#0a0f1e]/95 px-4 text-white shadow-lg backdrop-blur md:px-7">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#3157ff] text-sm font-black text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5">
            <path d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.5 18h5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-xl font-black tracking-tight">Bridge</div>
          <div className="hidden text-[9px] font-bold uppercase tracking-[.2em] text-gray-500 sm:block">
            Build · Connect · Grow
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-gray-300">{status}</span>
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
