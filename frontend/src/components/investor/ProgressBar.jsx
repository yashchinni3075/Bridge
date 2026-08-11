// Reusable progress bar used for pitch scores and startup progress.
// Width is driven by the numeric value, so an inline style is required.

function ProgressBar({ value, className = '', barClassName = '' }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`Progress ${value}%`}
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
    >
      <div
        className={`h-full rounded-full bg-indigo-500 transition-all duration-300 ${barClassName}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}

export default ProgressBar
