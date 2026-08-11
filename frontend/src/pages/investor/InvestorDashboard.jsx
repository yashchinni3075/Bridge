import { useState } from 'react'
import Sidebar from '../../components/investor/Sidebar.jsx'
import TopHeader from '../../components/investor/TopHeader.jsx'
import WelcomeSection from '../../components/investor/WelcomeSection.jsx'
import OverviewCards from '../../components/investor/OverviewCards.jsx'
import RecommendedStartups from '../../components/investor/RecommendedStartups.jsx'
import StartupCredibility from '../../components/investor/StartupCredibility.jsx'
import RecentConnections from '../../components/investor/RecentConnections.jsx'
import Notifications from '../../components/investor/Notifications.jsx'
import QuickActions from '../../components/investor/QuickActions.jsx'

// --------------------------------------------------
// Investor Dashboard page (frontend-only).
// Composes the dashboard from small modular components and
// holds only the pieces of shared UI state:
//   - mobile sidebar drawer
//   - currently active sidebar item
// Everything else is driven by mock data in src/data.
// --------------------------------------------------
function InvestorDashboard() {
  // Controls the mobile slide-in sidebar.
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Currently highlighted sidebar item (defaults to Dashboard).
  const [activeNav, setActiveNav] = useState('dashboard')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Accessibility skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>

      <Sidebar
        open={sidebarOpen}
        activeItem={activeNav}
        onNavigate={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content, offset by the fixed sidebar on large screens */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />

        <main
          id="main-content"
          className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <WelcomeSection />
          <OverviewCards />
          <RecommendedStartups />
          <StartupCredibility />

          {/* Connections + notifications side by side on large screens */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-8">
            <RecentConnections />
            <Notifications />
          </div>

          <QuickActions />
        </main>

        <footer className="border-t border-slate-200 bg-white py-5">
          <p className="px-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
            Bridge · Investor Dashboard · Demo data for MVP preview
          </p>
        </footer>
      </div>
    </div>
  )
}

export default InvestorDashboard
