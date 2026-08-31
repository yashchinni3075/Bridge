import { Check, Clock, AlertTriangle, X } from "lucide-react";

export function VerifyBadge({ status }) {
  const map = {
    verified: { label: "Verified", icon: Check, cls: "bg-emerald-soft text-emerald" },
    pending: { label: "Pending", icon: Clock, cls: "bg-amber-soft text-amber" },
    pending_review: { label: "Pending Review", icon: Clock, cls: "bg-amber-soft text-amber" },
    draft: { label: "Draft", icon: Clock, cls: "bg-app text-muted" },
    not_started: { label: "Not started", icon: AlertTriangle, cls: "bg-rose-soft text-rose" },
    unverified: { label: "Unverified", icon: AlertTriangle, cls: "bg-rose-soft text-rose" },
  };
  const item = map[status] || map.unverified;
  const Icon = item.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.cls}`}
    >
      <Icon size={10} strokeWidth={3} />
      {item.label}
    </span>
  );
}

export function Tag({ children, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-soft text-brand",
    emerald: "bg-emerald-soft text-emerald",
    amber: "bg-amber-soft text-amber",
    rose: "bg-rose-soft text-rose",
    neutral: "bg-app text-muted border border-line",
  };
  return (
    <span className={`mb-1 mr-1.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98]";
  const variants = {
    primary:
      "bg-brand text-white shadow-[0_8px_20px_-8px_rgb(79_70_229/0.6)] hover:bg-brand-strong hover:shadow-[0_10px_24px_-8px_rgb(79_70_229/0.7)]",
    dark: "bg-ink text-white hover:bg-slate-800",
    soft: "bg-brand-soft text-brand hover:bg-brand-line/60",
    ghost: "border border-line bg-raised text-ink hover:border-slate-300 hover:bg-app",
    danger: "bg-rose text-white hover:bg-rose/85",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-card border border-line bg-raised p-5 shadow-card ${className}`}>{children}</div>;
}

export function PageHead({ title, subtitle, actions }) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </header>
  );
}

export function SectionHead({ title, hint }) {
  return (
    <div className="mb-3 mt-9 flex items-baseline justify-between first:mt-0">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {hint && <span className="text-xs font-medium text-muted">{hint}</span>}
    </div>
  );
}

export function Avatar({ name, size = 44, ring = false }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-brand to-violet-500 font-display font-semibold text-white ${
        ring ? "ring-4 ring-raised" : ""
      }`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export function ScorePill({ value, size = "md" }) {
  const dims = size === "lg" ? "h-14 w-14 text-xl" : "h-11 w-11 text-base";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-2 border-brand-line bg-brand-soft font-mono font-medium text-brand ${dims}`}
    >
      {value}
    </span>
  );
}

export function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-pop rounded-card border border-line bg-raised p-6 shadow-pop">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-app hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-card border border-dashed border-line bg-raised/60 px-6 py-12 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon size={20} />
        </span>
      )}
      <p className="font-display text-sm font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-xs leading-relaxed text-muted">{hint}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-shadow focus:border-brand-line focus:outline-none focus:ring-4 focus:ring-brand/10";
