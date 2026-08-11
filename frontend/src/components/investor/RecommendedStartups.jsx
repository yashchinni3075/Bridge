import { useState } from 'react'
import StartupCard from './StartupCard.jsx'
import { recommendedStartups } from '../../data/investorDashboardData.js'

// --------------------------------------------------
// AI Recommended Startups — the main section.
// Bookmarks are tracked locally with a Set of saved ids.
// Match/pitch scores are mock values that will later come
// from the AI matchmaking and pitch-evaluation services.
// --------------------------------------------------
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
    <section aria-labelledby="ai-recommendations-heading">
      <div className="mb-5">
        <h2
          id="ai-recommendations-heading"
          className="text-xl font-bold tracking-tight text-slate-900"
        >
          AI Recommended Startups
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Startups matched to your investment interests
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {recommendedStartups.map((startup) => (
          <StartupCard
            key={startup.id}
            startup={startup}
            saved={savedIds.has(startup.id)}
            onToggleSave={() => toggleSave(startup.id)}
          />
        ))}
      </div>
    </section>
  )
}

export default RecommendedStartups
