import { Compass, Bookmark, Users, ArrowUpRight } from 'lucide-react'

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

function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <div className="mb-5">
        <h2 id="quick-actions-heading" className="text-xl font-bold tracking-tight text-white">
          Quick Actions
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111827] p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#3157ff]/30 hover:shadow-md hover:shadow-blue-900/20"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3157ff]/15 text-[#5b8aff] transition-colors group-hover:bg-[#3157ff] group-hover:text-white">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">{label}</span>
              <span className="block text-xs text-gray-500">{description}</span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-600 transition-colors group-hover:text-[#5b8aff]" />
          </button>
        ))}
      </div>
    </section>
  )
}

export default QuickActions
