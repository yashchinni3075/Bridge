import { Sparkles, Bookmark } from 'lucide-react'
import ProgressBar from './ProgressBar.jsx'
import { formatLakhs } from '../../utils/format.js'

function StartupCard({ startup, saved, onToggleSave }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-900/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3157ff]/15 text-base font-bold text-[#5b8aff]">
            {startup.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">{startup.name}</h3>
            <p className="truncate text-xs text-gray-500">
              {startup.industry} · {startup.location}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
            {startup.stage} Stage
          </span>
          <button
            type="button"
            onClick={onToggleSave}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${startup.name} from saved` : `Save ${startup.name}`}
            className={`rounded-lg p-1.5 transition-colors ${
              saved
                ? 'bg-[#3157ff]/15 text-[#5b8aff]'
                : 'text-gray-500 hover:bg-white/5 hover:text-[#5b8aff]'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-400">
        {startup.description}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-white/5 p-3">
        <div>
          <p className="text-xs text-gray-500">Funding Required</p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {formatLakhs(startup.fundingRequired)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Pitch Score</p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {startup.pitchScore}
            <span className="font-normal text-gray-500">/100</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-[#5b8aff]">
            <Sparkles className="h-3.5 w-3.5" />
            {startup.aiMatch}% AI Match
          </span>
          <span className="text-gray-500">Progress {startup.progress}%</span>
        </div>
        <ProgressBar value={startup.progress} className="mt-2" />
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-[#3157ff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2447e8]"
      >
        View Startup
      </button>
    </article>
  )
}

export default StartupCard
