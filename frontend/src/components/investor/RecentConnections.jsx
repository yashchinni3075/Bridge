import { ArrowRight } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import { recentConnections } from '../../data/investorDashboardData.js'

// Connection status -> badge tone.
const statusTone = {
  Accepted: 'emerald',
  Pending: 'amber',
}

// List of the most recent startup connections.
function RecentConnections() {
  return (
    <section aria-labelledby="recent-connections-heading">
      <div className="flex items-center justify-between">
        <h2
          id="recent-connections-heading"
          className="text-xl font-bold tracking-tight text-slate-900"
        >
          Recent Connections
        </h2>
        <button
          type="button"
          className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
        >
          View All
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <ul className="divide-y divide-slate-100">
          {recentConnections.map((connection) => (
            <li
              key={connection.id}
              className="flex items-center gap-3 px-3 py-3.5 transition-colors hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                {connection.startup.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {connection.startup}
                  </p>
                  <StatusBadge
                    label={connection.status}
                    tone={statusTone[connection.status]}
                  />
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {connection.industry} · {connection.date}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
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
