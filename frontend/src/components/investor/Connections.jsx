import { useState } from 'react'
import { Search, CheckCircle2, Clock, XCircle } from 'lucide-react'

const connectionsData = [
  { id: 1, name: 'Finova', industry: 'FinTech', status: 'accepted', date: 'Aug 08, 2026', initials: 'F', color: '#3157ff' },
  { id: 2, name: 'HealthSync', industry: 'Healthcare', status: 'pending', date: 'Aug 05, 2026', initials: 'H', color: '#21b984' },
  { id: 3, name: 'AgroSense', industry: 'Agriculture', status: 'accepted', date: 'Jul 28, 2026', initials: 'A', color: '#ff7a2f' },
  { id: 4, name: 'NexGen Robotics', industry: 'Manufacturing', status: 'pending', date: 'Aug 10, 2026', initials: 'N', color: '#8b5cf6' },
  { id: 5, name: 'EduFlow', industry: 'EdTech', status: 'rejected', date: 'Jul 20, 2026', initials: 'E', color: '#d946ef' },
]

const statusConfig = {
  accepted: { label: 'Accepted', icon: CheckCircle2, classes: 'bg-emerald-500/15 text-emerald-400' },
  pending: { label: 'Pending', icon: Clock, classes: 'bg-amber-500/15 text-amber-400' },
  rejected: { label: 'Rejected', icon: XCircle, classes: 'bg-red-500/15 text-red-400' },
}

const tabs = ['All', 'Accepted', 'Pending', 'Rejected']

function Connections() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')

  const filtered = connectionsData.filter((c) => {
    const q = query.toLowerCase()
    const matchesSearch = c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)
    const matchesTab = activeTab === 'All' || c.status === activeTab.toLowerCase()
    return matchesSearch && matchesTab
  })

  const counts = {
    All: connectionsData.length,
    Accepted: connectionsData.filter((c) => c.status === 'accepted').length,
    Pending: connectionsData.filter((c) => c.status === 'pending').length,
    Rejected: connectionsData.filter((c) => c.status === 'rejected').length,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Connections</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your startup connection requests.</p>
      </div>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search connections..."
          className="w-full rounded-xl border border-white/10 bg-[#111827] py-3 pl-12 pr-4 text-sm text-gray-200 placeholder:text-gray-500 focus:border-[#3157ff] focus:outline-none focus:ring-2 focus:ring-[#3157ff]/20"
        />
      </div>

      <div className="flex gap-2 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-[#3157ff] text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab}
            <span className="ml-1.5 text-xs opacity-60">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-12">No connections found.</p>
      )}

      <div className="space-y-3">
        {filtered.map((conn) => {
          const { label, icon: StatusIcon, classes } = statusConfig[conn.status]
          return (
            <div
              key={conn.id}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111827] p-4 transition hover:bg-white/5"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: `${conn.color}33` }}
              >
                {conn.initials}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">{conn.name}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${classes}`}>
                    <StatusIcon className="h-3 w-3" />
                    {label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{conn.industry} · {conn.date}</p>
              </div>

              {conn.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="rounded-lg bg-[#3157ff] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2447e8]">
                    Accept
                  </button>
                  <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-white/10">
                    Decline
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Connections
