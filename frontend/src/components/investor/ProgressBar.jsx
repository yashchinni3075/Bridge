function ProgressBar({ value, className = '', barClassName = '' }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`Progress ${value}%`}
      className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${className}`}
    >
      <div
        className={`h-full rounded-full bg-[#3157ff] transition-all duration-300 ${barClassName}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}

export default ProgressBar
