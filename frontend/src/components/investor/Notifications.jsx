import { CheckCircle2, Sparkles, TrendingUp, FileText } from 'lucide-react'
import { notifications } from '../../data/investorDashboardData.js'

const notificationMeta = {
  connection: { icon: CheckCircle2, classes: 'bg-emerald-500/15 text-emerald-400' },
  match: { icon: Sparkles, classes: 'bg-[#3157ff]/15 text-[#5b8aff]' },
  milestone: { icon: TrendingUp, classes: 'bg-blue-500/15 text-blue-400' },
  update: { icon: FileText, classes: 'bg-amber-500/15 text-amber-400' },
}

function Notifications() {
  return (
    <section aria-labelledby="notifications-heading">
      <div className="flex items-center justify-between">
        <h2 id="notifications-heading" className="text-xl font-bold tracking-tight text-white">
          Recent Notifications
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
          {notifications.map((notification) => {
            const meta = notificationMeta[notification.type]
            return (
              <li
                key={notification.id}
                className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-white/5"
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.classes}`}
                >
                  <meta.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-gray-300">{notification.text}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{notification.time}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default Notifications
