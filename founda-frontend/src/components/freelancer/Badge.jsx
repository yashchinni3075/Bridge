const TONES = {
  gray: "bg-slate-100 text-slate-600",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-amber-50 text-amber-700",
  purple: "bg-violet-50 text-founda-purple",
  blue: "bg-sky-50 text-founda-blue",
  teal: "bg-teal-50 text-founda-teal",
  red: "bg-red-50 text-red-600",
};

export default function Badge({ tone = "gray", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONES[tone] || TONES.gray} ${className}`}
    >
      {children}
    </span>
  );
}
