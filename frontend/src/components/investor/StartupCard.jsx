import { Sparkles, Bookmark } from 'lucide-react'
import ProgressBar from './ProgressBar.jsx'
import { formatLakhs } from '../../utils/format.js'

// Individual recommended startup card.
// `saved` and `onToggleSave` drive the bookmark toggle state.
function StartupCard({ startup, saved, onToggleSave }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Identity + stage + bookmark */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-base font-bold text-indigo-700">
            {startup.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">{startup.name}</h3>
            <p className="truncate text-xs text-slate-500">
              {startup.industry} · {startup.location}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {startup.stage} Stage
          </span>
          <button
            type="button"
            onClick={onToggleSave}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${startup.name} from saved` : `Save ${startup.name}`}
            className={`rounded-lg p-1.5 transition-colors ${
              saved
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Short description */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
        {startup.description}
      </p>

      {/* Funding + pitch score */}
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-xs text-slate-500">Funding Required</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {formatLakhs(startup.fundingRequired)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Pitch Score</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {startup.pitchScore}
            <span className="font-normal text-slate-400">/100</span>
          </p>
        </div>
      </div>

      {/* AI match + progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            {startup.aiMatch}% AI Match
          </span>
          <span className="text-slate-500">Progress {startup.progress}%</span>
        </div>
        <ProgressBar value={startup.progress} className="mt-2" />
      </div>

      {/* View action */}
      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        View Startup
      </button>
    </article>
  )
}

export default StartupCard
