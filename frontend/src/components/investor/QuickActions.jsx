import { Compass, Bookmark, Users, ArrowUpRight } from 'lucide-react'

// Quick action shortcuts.
const quickActions = [
  {
    id: 'discover',
    label: 'Discover Startups',
    description: 'Browse new startups across industries',
    icon: Compass,
  },
  {
    id: 'saved',
    label: 'View Saved Startups',
    description: 'Open startups you bookmarked',
    icon: Bookmark,
  },
  {
    id: 'connections',
    label: 'Manage Connections',
    description: 'Review and manage your connections',
    icon: Users,
  },
]

// Shortcut cards for frequently used flows.
function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <div className="mb-5">
        <h2 id="quick-actions-heading" className="text-xl font-bold tracking-tight text-slate-900">
          Quick Actions
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">{label}</span>
              <span className="block text-xs text-slate-500">{description}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-600" />
          </button>
        ))}
      </div>
    </section>
  )
}

export default QuickActions
