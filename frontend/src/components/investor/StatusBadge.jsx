const TONES = {
  emerald: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  indigo: 'bg-[#3157ff]/15 text-[#5b8aff] ring-[#3157ff]/20',
  blue: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  red: 'bg-red-500/15 text-red-400 ring-red-500/20',
  slate: 'bg-white/5 text-gray-400 ring-white/10',
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
