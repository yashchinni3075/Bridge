import { Sparkles } from 'lucide-react'
import ProgressBar from './ProgressBar.jsx'
import StatusBadge from './StatusBadge.jsx'
import { startupCredibility } from '../../data/investorDashboardData.js'

const statusTone = {
  'Strong Match': 'emerald',
  'Good Match': 'indigo',
}

function StartupCredibility() {
  return (
    <section aria-labelledby="credibility-heading">
      <div className="mb-5">
        <h2 id="credibility-heading" className="text-xl font-bold tracking-tight text-white">
          Startup Credibility
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Evaluate startups using AI-generated pitch scores and progress signals.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111827] shadow-sm">
        <table className="min-w-full divide-y divide-white/5 text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Startup</th>
              <th scope="col" className="px-5 py-3 font-medium">Pitch Score</th>
              <th scope="col" className="px-5 py-3 font-medium">Startup Progress</th>
              <th scope="col" className="px-5 py-3 font-medium">Match Score</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {startupCredibility.map((startup) => (
              <tr key={startup.id} className="transition-colors hover:bg-white/5">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3157ff]/15 text-sm font-bold text-[#5b8aff]">
                      {startup.name.charAt(0)}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{startup.name}</p>
                      <p className="text-xs text-gray-500">{startup.industry}</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-white">
                    {startup.pitchScore}
                    <span className="font-normal text-gray-500">/100</span>
                  </p>
                  <ProgressBar
                    value={startup.pitchScore}
                    className="mt-1.5 w-28"
                    barClassName="bg-[#3157ff]"
                  />
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{startup.progress}%</p>
                  <ProgressBar
                    value={startup.progress}
                    className="mt-1.5 w-28"
                    barClassName="bg-emerald-500"
                  />
                </td>

                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#3157ff]/15 px-2.5 py-1 text-xs font-semibold text-[#5b8aff]">
                    <Sparkles className="h-3 w-3" />
                    {startup.aiMatch}%
                  </span>
                </td>

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
