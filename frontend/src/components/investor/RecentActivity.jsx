import { CheckCircle2, ArrowRight } from 'lucide-react'
import { recentConnections, notifications } from '../../data/investorDashboardData.js'

const items = [
  ...recentConnections.map((c) => ({
    id: c.id,
    text: `${c.startup} — ${c.status}`,
    sub: `${c.industry} · ${c.date}`,
    type: 'connection',
  })),
  ...notifications.slice(0, 2).map((n) => ({
    id: n.id,
    text: n.text,
    sub: n.time,
    type: 'notification',
  })),
]

function RecentActivity() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Recent Activity</h2>
        <button className="text-sm font-medium text-[#5b8aff] transition hover:text-[#3157ff]">
          View All
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#111827] divide-y divide-white/5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3157ff]/15 text-[#5b8aff]">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">{item.text}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-600" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default RecentActivity
