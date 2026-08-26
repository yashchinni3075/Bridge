import { useState } from 'react'
import { Bell, ChevronDown, Menu, User, LogOut } from 'lucide-react'
import { investorProfile, notifications } from '../../data/investorDashboardData.js'

function TopHeader({ onMenuClick }) {
  const [showProfile, setShowProfile] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0f1e]/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
            Investor Dashboard
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            className="relative rounded-xl p-2.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white ring-2 ring-[#0a0f1e]">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-white/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3157ff] text-sm font-semibold text-white">
              {investorProfile.initials}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-semibold text-white">{investorProfile.name}</span>
              <span className="block text-xs text-gray-500">{investorProfile.role}</span>
            </span>
            <ChevronDown className={`hidden h-4 w-4 text-gray-500 transition-transform md:block ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-white/10 bg-[#111827] p-1.5 shadow-lg">
                <div className="border-b border-white/10 px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-white">{investorProfile.name}</p>
                  <p className="truncate text-xs text-gray-500">{investorProfile.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  Profile
                </button>
                <div className="mt-1 border-t border-white/10 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopHeader
