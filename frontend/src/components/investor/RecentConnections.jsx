import { ArrowRight } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import { recentConnections } from '../../data/investorDashboardData.js'

const statusTone = {
  Accepted: 'emerald',
  Pending: 'amber',
}

function RecentConnections() {
  return (
    <section aria-labelledby="recent-connections-heading">
      <div className="flex items-center justify-between">
        <h2
          id="recent-connections-heading"
          className="text-xl font-bold tracking-tight text-white"
        >
          Recent Connections
        </h2>
        <button
          type="button"
          className="text-sm font-medium text-[#5b8aff] transition hover:text-[#3157ff]"
        >
          View All
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#111827] p-2 shadow-sm">
        <ul className="divide-y divide-white/5">
          {recentConnections.map((connection) => (
            <li
              key={connection.id}
              className="flex items-center gap-3 px-3 py-3.5 transition-colors hover:bg-white/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3157ff]/15 text-sm font-bold text-[#5b8aff]">
                {connection.startup.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {connection.startup}
                  </p>
                  <StatusBadge
                    label={connection.status}
                    tone={statusTone[connection.status]}
                  />
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {connection.industry} · {connection.date}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-[#3157ff]/10 hover:text-[#5b8aff]"
              >
                View
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default RecentConnections
