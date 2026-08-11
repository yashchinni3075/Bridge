// Reusable status badge with a small set of predefined tones.
// Used for connection status and credibility/match labels.

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function StatusBadge({ label, tone = 'slate' }) {
  const classes = TONES[tone] ?? TONES.slate

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}

export default StatusBadge
