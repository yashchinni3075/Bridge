export default function MiniBar({ label, value = 0, color = "default" }) {
  const pct = Math.max(0, Math.min(100, value));

  const barColor =
    color === "green"
      ? "from-emerald-400 to-emerald-500"
      : color === "orange"
        ? "from-amber-400 to-amber-500"
        : color === "red"
          ? "from-red-400 to-red-500"
          : "from-founda-purple via-founda-blue to-founda-teal";

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-founda-purple">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
