import WelcomeSection from './WelcomeSection.jsx'
import OverviewCards from './OverviewCards.jsx'
import RecommendedStartups from './RecommendedStartups.jsx'
import RecentActivity from './RecentActivity.jsx'

function DashboardHome() {
  return (
    <div className="space-y-8">
      <WelcomeSection />
      <OverviewCards />
      <RecommendedStartups />
      <RecentActivity />
    </div>
  )
}

export default DashboardHome
