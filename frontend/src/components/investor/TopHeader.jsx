import { useState } from 'react'
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  FileText,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { investorProfile, notifications } from '../../data/investorDashboardData.js'

// Icon + accent colour per notification type.
const notificationMeta = {
  connection: { icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-600' },
  match: { icon: Sparkles, classes: 'bg-indigo-50 text-indigo-600' },
  milestone: { icon: TrendingUp, classes: 'bg-blue-50 text-blue-600' },
  update: { icon: FileText, classes: 'bg-amber-50 text-amber-600' },
}

// Profile dropdown options.
const profileOptions = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// Sticky top header: page title, search, notifications and investor profile.
function TopHeader({ onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Unread count drives the bell indicator.
  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title + subtitle */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Investor Dashboard
          </p>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            Discover promising startups and track investment opportunities
          </p>
        </div>

        {/* Desktop search */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search startups..."
            aria-label="Search startups"
            className="w-52 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 lg:w-64"
          />
        </div>

        {/* Mobile search toggle */}
        <button
          type="button"
          onClick={() => setSearchOpen((open) => !open)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
          aria-label="Toggle search"
          aria-expanded={searchOpen}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>

        {/* Notification bell + dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications((open) => !open)
              setShowProfile(false)
            }}
            className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={showNotifications}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotifications(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {unreadCount} new
                  </span>
                </div>
                <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto p-1.5">
                  {notifications.map((notification) => {
                    const meta = notificationMeta[notification.type]
                    return (
                      <li
                        key={notification.id}
                        className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 hover:bg-slate-50"
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
                        {!notification.isRead && (
                          <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                        )}
                      </li>
                    )
                  })}
                </ul>
                <div className="border-t border-slate-100 p-2">
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-center text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                  >
                    View All
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Investor profile + dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfile((open) => !open)
              setShowNotifications(false)
            }}
            className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-50"
            aria-label="Open profile menu"
            aria-expanded={showProfile}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white">
              {investorProfile.initials}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-semibold leading-tight text-slate-900">
                {investorProfile.name}
              </span>
              <span className="block text-xs leading-tight text-slate-500">
                {investorProfile.role}
              </span>
            </span>
            <ChevronDown
              className={`hidden h-4 w-4 text-slate-400 transition-transform md:block ${
                showProfile ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showProfile && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowProfile(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {investorProfile.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{investorProfile.email}</p>
                </div>
                {profileOptions.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                    {label}
                  </button>
                ))}
                <div className="mt-1 border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
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

      {/* Mobile search bar (revealed by the mobile search toggle) */}
      {searchOpen && (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search startups..."
              aria-label="Search startups"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      )}
    </header>
  )
}

export default TopHeader
