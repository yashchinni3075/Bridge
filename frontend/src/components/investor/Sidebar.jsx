import {
  LayoutDashboard,
  Compass,
  Bookmark,
  Users,
  User,
  LogOut,
  X,
} from 'lucide-react'

const mainNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'discover', label: 'Discover Startups', icon: Compass },
  { id: 'saved', label: 'Saved Startups', icon: Bookmark },
  { id: 'connections', label: 'Connections', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
]

function Sidebar({ open, activeItem, onNavigate, onClose }) {
  const handleNavigate = (id) => {
    onNavigate(id)
    onClose()
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#111827] transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3157ff] text-lg font-bold text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5">
              <path d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 18h5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-white">Bridge</span>
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 pb-4">
        {mainNav.map(({ id, label, icon: Icon }) => {
          const isActive = activeItem === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleNavigate(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-[#3157ff]/15 text-[#5b8aff]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-[#5b8aff]' : 'text-gray-500'}`} strokeWidth={1.8} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5 text-gray-500" strokeWidth={1.8} />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
