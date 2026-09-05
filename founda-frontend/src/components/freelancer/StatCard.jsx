export default function StatCard({ label, value, hint, icon }) {
  return (
    <div className="card flex items-center gap-4 p-5 animate-fade-in">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-founda-purple/10 via-founda-blue/10 to-founda-teal/10 text-xl">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-founda-muted">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-bold text-founda-ink">{value}</p>
        {hint && <p className="text-[11px] text-founda-muted">{hint}</p>}
      </div>
    </div>
  );
}
