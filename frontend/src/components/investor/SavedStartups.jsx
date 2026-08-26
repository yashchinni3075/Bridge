import { useState } from 'react'
import { Search, Sparkles, Bookmark, Trash2 } from 'lucide-react'
import { recommendedStartups } from '../../data/investorDashboardData.js'
import ProgressBar from './ProgressBar.jsx'
import { formatLakhs } from '../../utils/format.js'

function SavedStartups() {
  const [query, setQuery] = useState('')
  const [savedIds, setSavedIds] = useState(() => new Set(['finova', 'healthsync']))
  const [startups] = useState(recommendedStartups)

  const saved = startups.filter((s) => {
    if (!savedIds.has(s.id)) return false
    const q = query.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.industry.toLowerCase().includes(q)
  })

  const removeSaved = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Saved Startups</h1>
        <p className="mt-1 text-sm text-gray-400">Startups you've bookmarked for later review.</p>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search saved startups..."
          className="w-full rounded-xl border border-white/10 bg-[#111827] py-3 pl-12 pr-4 text-sm text-gray-200 placeholder:text-gray-500 focus:border-[#3157ff] focus:outline-none focus:ring-2 focus:ring-[#3157ff]/20"
        />
      </div>

      {saved.length === 0 && (
        <div className="text-center py-16">
          <Bookmark className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">
            {savedIds.size === 0 ? "You haven't saved any startups yet." : "No saved startups match your search."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {saved.map((startup) => (
          <article
            key={startup.id}
            className="flex flex-col rounded-2xl border border-white/10 bg-[#111827] p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-900/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3157ff]/15 text-sm font-bold text-[#5b8aff]">
                  {startup.name.charAt(0)}
                </span>
                <div>
                  <h3 className="font-semibold text-white text-sm">{startup.name}</h3>
                  <p className="text-xs text-gray-500">{startup.industry} · {startup.stage}</p>
                </div>
              </div>
              <button
                onClick={() => removeSaved(startup.id)}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-500/15 hover:text-red-400"
                title="Remove from saved"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-400 line-clamp-2">{startup.description}</p>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-500">Funding: {formatLakhs(startup.fundingRequired)}</span>
              <span className="flex items-center gap-1 font-semibold text-[#5b8aff]">
                <Sparkles className="h-3 w-3" />
                {startup.aiMatch}%
              </span>
            </div>

            <ProgressBar value={startup.progress} className="mt-2" />

            <button className="mt-4 w-full rounded-xl bg-[#3157ff] py-2.5 text-sm font-semibold text-white transition hover:bg-[#2447e8]">
              View Details
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

export default SavedStartups
