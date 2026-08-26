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
    <aside className="w-full shrink-0 border-b border-white/10 bg-[#111827] md:w-64 md:border-b-0 md:border-r">
      <div className="sticky top-[68px] p-4 md:min-h-[calc(100vh-68px)]">
        <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[.18em] text-gray-500">
          Workspace
        </p>
        <div className="space-y-1">
          {ITEMS.slice(0, 3).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                page === id
                  ? "bg-[#3157ff] text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="w-5 text-center">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <p className="mb-3 mt-7 px-3 text-[10px] font-black uppercase tracking-[.18em] text-gray-500">
          Trust & Profile
        </p>
        <div className="space-y-1">
          {ITEMS.slice(3).map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                page === id
                  ? "bg-[#3157ff] text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="w-5 text-center">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-[#0a0f1e] border border-white/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-300">
              Live profile
            </span>
          </div>
          <p className="text-xs leading-5 text-gray-500">
            {role === "Freelancer"
              ? "Your selected freelancer profile controls matching, availability and trust data."
              : "Your selected startup profile controls candidate ranking and hiring context."}
          </p>
        </div>
      </div>
    </aside>
  );
}
