import { useFreelancer } from "../../context/FreelancerContext";

export default function Header() {
  const { role, setRole, activeProfile, activeStartup } = useFreelancer();
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
          <div className="text-xl font-black tracking-tight">
            Founda<span className="text-founda-teal">.</span>
          </div>
          <div className="hidden text-[9px] font-bold uppercase tracking-[.2em] text-slate-400 sm:block">
            Build · Connect · Grow
          </div>
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
