import { useState } from 'react'
import { Sparkles, Bookmark } from 'lucide-react'
import { recommendedStartups } from '../../data/investorDashboardData.js'
import ProgressBar from './ProgressBar.jsx'
import { formatLakhs } from '../../utils/format.js'

function RecommendedStartups() {
  const [savedIds, setSavedIds] = useState(() => new Set())

  const toggleSave = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Recommended Startups</h2>
        <button className="text-sm font-medium text-[#5b8aff] transition hover:text-[#3157ff]">
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {recommendedStartups.map((startup) => (
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
                onClick={() => toggleSave(startup.id)}
                className={`rounded-lg p-1.5 transition ${
                  savedIds.has(startup.id)
                    ? 'bg-[#3157ff]/15 text-[#5b8aff]'
                    : 'text-gray-500 hover:bg-white/5'
                }`}
              >
                <Bookmark className="h-4 w-4" fill={savedIds.has(startup.id) ? 'currentColor' : 'none'} />
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
    </section>
  )
}

export default RecommendedStartups
