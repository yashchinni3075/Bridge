export default function StatCard({ label, value, hint, icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-founda-ink">{value}</p>
          {hint && (
            <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
          )}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-50 to-cyan-50 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}
