import { useFreelancer } from "../../context/FreelancerContext";

export default function Header() {
  const { role, setRole } = useFreelancer();

  return (
    <header className="sticky top-0 z-40 flex h-[64px] items-center justify-between border-b border-founda-line bg-white/80 px-5 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-founda-purple via-founda-blue to-founda-teal text-sm font-bold text-white shadow-glow-sm">
          F
        </div>
        <span className="text-lg font-bold tracking-tight text-founda-ink">
          Founda
        </span>
        <span className="hidden text-[10px] font-medium uppercase tracking-widest text-founda-muted sm:inline">
          AI Matching
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-founda-line bg-founda-surface p-1">
        {["Freelancer", "Startup"].map((option) => (
          <button
            key={option}
            onClick={() => setRole(option)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              role === option
                ? "bg-founda-ink text-white shadow-sm"
                : "text-founda-muted hover:text-founda-ink"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </header>
  );
}
