import { Sparkles, Bookmark, UserPlus, Users } from 'lucide-react'
import { overviewStats } from '../../data/investorDashboardData.js'

// Icon + accent colour per overview card, keyed by stat id.
const statStyles = {
  recommended: { icon: Sparkles, classes: 'bg-indigo-50 text-indigo-600' },
  saved: { icon: Bookmark, classes: 'bg-blue-50 text-blue-600' },
  pending: { icon: UserPlus, classes: 'bg-amber-50 text-amber-600' },
  active: { icon: Users, classes: 'bg-emerald-50 text-emerald-600' },
}

// Compact summary cards showing discovery and connection activity.
function OverviewCards() {
  return (
    <section
      aria-label="Dashboard overview"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {overviewStats.map((stat) => {
        const { icon: Icon, classes } = statStyles[stat.id]
        return (
          <div
            key={stat.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:shadow-md"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${classes}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              <p className="truncate text-sm font-medium text-slate-700">{stat.label}</p>
              <p className="truncate text-xs text-slate-500">{stat.hint}</p>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default OverviewCards
