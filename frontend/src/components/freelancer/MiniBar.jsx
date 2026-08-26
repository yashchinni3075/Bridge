import { clamp } from "../../utils/matchEngine";

export default function MiniBar({ value, label, suffix = "%" }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
        <span>{label}</span>
        <span>
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-founda-purple via-founda-blue to-founda-teal"
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
    </div>
  );
}
