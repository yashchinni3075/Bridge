import { Sparkles, Bookmark, Users } from 'lucide-react'
import { overviewStats } from '../../data/investorDashboardData.js'

const statStyles = {
  recommended: { icon: Sparkles, classes: 'bg-[#3157ff]/15 text-[#5b8aff]' },
  saved: { icon: Bookmark, classes: 'bg-blue-500/15 text-blue-400' },
  active: { icon: Users, classes: 'bg-emerald-500/15 text-emerald-400' },
}

function OverviewCards() {
  const displayStats = overviewStats.filter((s) => s.id !== 'pending')

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {displayStats.map((stat) => {
        const { icon: Icon, classes } = statStyles[stat.id]
        return (
          <div
            key={stat.id}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111827] p-4 transition hover:shadow-md hover:shadow-blue-900/20"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${classes}`}>
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OverviewCards
