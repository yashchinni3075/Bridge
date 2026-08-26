import { useFreelancer } from "../../context/FreelancerContext";

const ITEMS = [
  ["dashboard", "\u25C8", "Dashboard"],
  ["match", "\u25CE", "01 \u2014 Match Engine"],
  ["pipeline", "\u25A3", "02 \u2014 Pipeline"],
  ["verification", "\u2713", "03 \u2014 Verification"],
  ["profile", "\u25CF", "04 \u2014 Profile"],
];

export default function Sidebar({ page, setPage }) {
  const { role } = useFreelancer();

  return (
    <aside className="w-full shrink-0 border-b border-founda-line bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="sticky top-[68px] p-4 md:min-h-[calc(100vh-68px)]">
        <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">
          Workspace
        </p>
        <div className="space-y-1">
          {ITEMS.slice(0, 3).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                page === id
                  ? "bg-gradient-to-r from-founda-purple to-founda-blue text-white shadow-glow"
                  : "text-slate-600 hover:bg-violet-50 hover:text-founda-purple"
              }`}
            >
              <span className="w-5 text-center">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <p className="mb-3 mt-7 px-3 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">
          Trust & Profile
        </p>
        <div className="space-y-1">
          {ITEMS.slice(3).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                page === id
                  ? "bg-gradient-to-r from-founda-purple to-founda-blue text-white shadow-glow"
                  : "text-slate-600 hover:bg-violet-50 hover:text-founda-purple"
              }`}
            >
              <span className="w-5 text-center">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-founda-navy p-4 text-white">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-founda-teal" />
            <span className="text-xs font-black uppercase tracking-wider">
              Live profile
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-300">
            {role === "Freelancer"
              ? "Your selected freelancer profile controls matching, availability and trust data."
              : "Your selected startup profile controls candidate ranking and hiring context."}
          </p>
        </div>
      </div>
    </aside>
  );
}
