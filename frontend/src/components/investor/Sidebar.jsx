import {
  LayoutDashboard,
  Compass,
  Bookmark,
  Users,
  Bell,
  User,
  Settings,
  LogOut,
  X,
} from 'lucide-react'

// Primary navigation items. `activeItem` decides which one is highlighted.
const mainNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'discover', label: 'Discover Startups', icon: Compass },
  { id: 'saved', label: 'Saved Startups', icon: Bookmark },
  { id: 'connections', label: 'Connections', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// Collapsible sidebar: a slide-in drawer on mobile, static column on desktop.
function Sidebar({ open, activeItem, onNavigate, onClose }) {
  // Selecting an item updates the active state and closes the mobile drawer.
  const handleNavigate = (id) => {
    onNavigate(id)
    onClose()
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Investor navigation sidebar"
    >
      {/* Logo row */}
      <div className="flex items-center justify-between px-5 py-5">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-bold text-white">
            B
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">Bridge</span>
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4" aria-label="Main navigation">
        {mainNav.map(({ id, label, icon: Icon }) => {
          const isActive = activeItem === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleNavigate(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                strokeWidth={1.8}
              />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Logout action */}
      <div className="border-t border-slate-100 px-4 py-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
