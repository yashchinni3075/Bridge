import { Check, Clock, AlertTriangle, X } from "lucide-react";

export function VerifyBadge({ status }) {
  const map = {
    verified: { label: "Verified", icon: Check, cls: "bg-emerald-soft text-emerald" },
    pending: { label: "Pending", icon: Clock, cls: "bg-amber-soft text-[#8A611E]" },
    pending_review: { label: "Pending Review", icon: Clock, cls: "bg-amber-soft text-[#8A611E]" },
    draft: { label: "Draft", icon: Clock, cls: "bg-line text-ink-soft" },
    not_started: { label: "Not started", icon: AlertTriangle, cls: "bg-rose-soft text-rose" },
    unverified: { label: "Unverified", icon: AlertTriangle, cls: "bg-rose-soft text-rose" },
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
    coral: "bg-coral-soft text-coral",
    emerald: "bg-emerald-soft text-emerald",
    amber: "bg-amber-soft text-[#8A611E]",
    rose: "bg-rose-soft text-rose",
    ink: "bg-line text-ink-soft",
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
    primary: "bg-coral text-white hover:bg-[#E85A3A]",
    dark: "bg-ink text-white hover:bg-[#0F1420]",
    ghost: "bg-transparent border border-line text-ink hover:bg-paper",
    danger: "bg-rose text-white hover:bg-[#c73f3f]",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-paper-raised border border-line rounded-card p-5 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHead({ title, hint }) {
  return (
    <div className="flex items-baseline justify-between mt-9 mb-3">
      <h2 className="font-display font-semibold text-[19px]">{title}</h2>
      {hint && <span className="text-xs text-ink-soft">{hint}</span>}
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
      className="rounded-full bg-ink text-white flex items-center justify-center font-display font-semibold shrink-0"
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
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-paper-raised rounded-card border border-line w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
