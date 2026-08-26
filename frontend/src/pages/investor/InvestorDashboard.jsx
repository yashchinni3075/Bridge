import { useState } from 'react'
import Sidebar from '../../components/investor/Sidebar.jsx'
import TopHeader from '../../components/investor/TopHeader.jsx'
import DashboardHome from '../../components/investor/DashboardHome.jsx'
import DiscoverStartups from '../../components/investor/DiscoverStartups.jsx'
import SavedStartups from '../../components/investor/SavedStartups.jsx'
import Connections from '../../components/investor/Connections.jsx'
import InvestorProfile from '../../components/investor/InvestorProfile.jsx'

function InvestorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('dashboard')

  const renderPage = () => {
    switch (activeNav) {
      case 'discover':
        return <DiscoverStartups />
      case 'saved':
        return <SavedStartups />
      case 'connections':
        return <Connections />
      case 'profile':
        return <InvestorProfile />
      default:
        return <DashboardHome />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-100">
      <Sidebar
        open={sidebarOpen}
        activeItem={activeNav}
        onNavigate={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {renderPage()}
        </main>

        <footer className="border-t border-white/10 bg-[#060b18] py-5">
          <p className="px-4 text-center text-xs text-gray-500">
            Bridge · Investor Dashboard
          </p>
        </footer>
      </div>
    </div>
  )
}

export default InvestorDashboard
