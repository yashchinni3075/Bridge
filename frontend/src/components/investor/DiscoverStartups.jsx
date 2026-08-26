import { useState } from 'react'
import { Search, Sparkles, Bookmark } from 'lucide-react'
import { recommendedStartups } from '../../data/investorDashboardData.js'
import ProgressBar from './ProgressBar.jsx'
import { formatLakhs } from '../../utils/format.js'

const allStartups = [
  ...recommendedStartups,
  {
    id: 'nexgen',
    name: 'NexGen Robotics',
    industry: 'Manufacturing',
    stage: 'Series A',
    location: 'Hyderabad',
    description: 'Affordable automation robots for mid-size Indian factories.',
    fundingRequired: 120,
    pitchScore: 82,
    progress: 55,
    aiMatch: 78,
  },
  {
    id: 'eduflow',
    name: 'EduFlow',
    industry: 'EdTech',
    stage: 'Seed',
    location: 'Delhi',
    description: 'Personalized learning paths powered by AI for college students.',
    fundingRequired: 30,
    pitchScore: 79,
    progress: 48,
    aiMatch: 74,
  },
  {
    id: 'greenleaf',
    name: 'GreenLeaf',
    industry: 'CleanTech',
    stage: 'Pre-Seed',
    location: 'Chennai',
    description: 'Sustainable packaging solutions for D2C brands in India.',
    fundingRequired: 20,
    pitchScore: 85,
    progress: 60,
    aiMatch: 82,
  },
]

function DiscoverStartups() {
  const [query, setQuery] = useState('')
  const [savedIds, setSavedIds] = useState(() => new Set())

  const filtered = allStartups.filter((s) => {
    const q = query.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.industry.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.stage.toLowerCase().includes(q)
    )
  })

  const toggleSave = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Discover Startups</h1>
        <p className="mt-1 text-sm text-gray-400">Search and explore startups by name, industry or location.</p>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, industry, location or stage..."
          className="w-full rounded-xl border border-white/10 bg-[#111827] py-3 pl-12 pr-4 text-sm text-gray-200 placeholder:text-gray-500 focus:border-[#3157ff] focus:outline-none focus:ring-2 focus:ring-[#3157ff]/20"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-12">No startups found matching "{query}"</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((startup) => (
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

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-xl bg-[#3157ff] py-2.5 text-sm font-semibold text-white transition hover:bg-[#2447e8]">
                View Details
              </button>
              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10">
                Connect
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default DiscoverStartups
