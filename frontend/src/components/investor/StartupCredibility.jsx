import { Sparkles } from 'lucide-react'
import ProgressBar from './ProgressBar.jsx'
import StatusBadge from './StatusBadge.jsx'
import { startupCredibility } from '../../data/investorDashboardData.js'

// Status label -> badge tone.
const statusTone = {
  'Strong Match': 'emerald',
  'Good Match': 'indigo',
}

// Compact credibility table with score/progress bars and status badges.
// Scrolls horizontally on small screens instead of breaking the layout.
function StartupCredibility() {
  return (
    <section aria-labelledby="credibility-heading">
      <div className="mb-5">
        <h2 id="credibility-heading" className="text-xl font-bold tracking-tight text-slate-900">
          Startup Credibility
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Evaluate startups using AI-generated pitch scores and progress signals.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Startup</th>
              <th scope="col" className="px-5 py-3 font-medium">Pitch Score</th>
              <th scope="col" className="px-5 py-3 font-medium">Startup Progress</th>
              <th scope="col" className="px-5 py-3 font-medium">Match Score</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {startupCredibility.map((startup) => (
              <tr key={startup.id} className="transition-colors hover:bg-slate-50">
                {/* Startup */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                      {startup.name.charAt(0)}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{startup.name}</p>
                      <p className="text-xs text-slate-500">{startup.industry}</p>
                    </div>
                  </div>
                </td>

                {/* Pitch score */}
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">
                    {startup.pitchScore}
                    <span className="font-normal text-slate-400">/100</span>
                  </p>
                  <ProgressBar
                    value={startup.pitchScore}
                    className="mt-1.5 w-28"
                    barClassName="bg-indigo-500"
                  />
                </td>

                {/* Startup progress */}
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{startup.progress}%</p>
                  <ProgressBar
                    value={startup.progress}
                    className="mt-1.5 w-28"
                    barClassName="bg-emerald-500"
                  />
                </td>

                {/* Match score */}
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    <Sparkles className="h-3 w-3" />
                    {startup.aiMatch}%
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <StatusBadge label={startup.status} tone={statusTone[startup.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default StartupCredibility
