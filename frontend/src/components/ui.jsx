import { Check, Clock, AlertTriangle, X } from "lucide-react";

export function VerifyBadge({ status }) {
  const map = {
    verified: { label: "Verified", icon: Check, cls: "bg-emerald-500/15 text-emerald-400" },
    pending: { label: "Pending", icon: Clock, cls: "bg-amber-500/15 text-amber-400" },
    pending_review: { label: "Pending Review", icon: Clock, cls: "bg-amber-500/15 text-amber-400" },
    draft: { label: "Draft", icon: Clock, cls: "bg-white/10 text-gray-400" },
    not_started: { label: "Not started", icon: AlertTriangle, cls: "bg-red-500/15 text-red-400" },
    unverified: { label: "Unverified", icon: AlertTriangle, cls: "bg-red-500/15 text-red-400" },
  };
  const item = map[status] || map.unverified;
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${item.cls}`}>
      <Icon size={10} strokeWidth={3} />
      {item.label}
    </span>
  );
}

export function Tag({ children, tone = "coral" }) {
  const tones = {
    coral: "bg-[#FF6B4A]/15 text-[#FF6B4A]",
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    rose: "bg-red-500/15 text-red-400",
    ink: "bg-white/10 text-gray-400",
  };
  return (
    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full mr-1.5 mb-1 inline-block ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#3157ff] text-white hover:bg-[#2447e8]",
    dark: "bg-[#111827] text-white hover:bg-[#0a0f1e] border border-white/10",
    ghost: "bg-transparent border border-white/10 text-gray-300 hover:bg-white/5",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-[#111827] border border-white/10 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHead({ title, hint }) {
  return (
    <div className="flex items-baseline justify-between mt-9 mb-3">
      <h2 className="font-bold text-[19px] text-white">{title}</h2>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
  );
}

export function Avatar({ name, size = 44 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="rounded-full bg-[#3157ff] text-white flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#111827] rounded-xl border border-white/10 w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
