import { investorProfile } from '../../data/investorDashboardData.js'

function WelcomeSection() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">
        Welcome back, {investorProfile.firstName}
      </h1>
      <p className="mt-1 text-sm text-gray-400">
        Discover startups that match your investment interests.
      </p>
    </div>
  )
}

export default WelcomeSection
