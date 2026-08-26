const TONES = {
  purple: "bg-violet-50 text-violet-700",
  blue: "bg-blue-50 text-blue-700",
  teal: "bg-teal-50 text-teal-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  gray: "bg-slate-100 text-slate-600",
};

export default function Badge({ children, tone = "purple" }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.gray}`}>{children}</span>
  );
}
