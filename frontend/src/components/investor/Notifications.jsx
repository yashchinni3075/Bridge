import { CheckCircle2, Sparkles, TrendingUp, FileText } from 'lucide-react'
import { notifications } from '../../data/investorDashboardData.js'

// Icon + accent colour per notification type.
const notificationMeta = {
  connection: { icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-600' },
  match: { icon: Sparkles, classes: 'bg-indigo-50 text-indigo-600' },
  milestone: { icon: TrendingUp, classes: 'bg-blue-50 text-blue-600' },
  update: { icon: FileText, classes: 'bg-amber-50 text-amber-600' },
}

// Compact panel of the most recent notifications.
function Notifications() {
  return (
    <section aria-labelledby="notifications-heading">
      <div className="flex items-center justify-between">
        <h2 id="notifications-heading" className="text-xl font-bold tracking-tight text-slate-900">
          Recent Notifications
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
          {notifications.map((notification) => {
            const meta = notificationMeta[notification.type]
            return (
              <li
                key={notification.id}
                className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.classes}`}
                >
                  <meta.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700">{notification.text}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{notification.time}</p>
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
