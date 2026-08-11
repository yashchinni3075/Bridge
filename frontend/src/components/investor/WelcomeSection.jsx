import { ArrowRight } from 'lucide-react'
import { investorProfile } from '../../data/investorDashboardData.js'

// Welcome banner with a single primary call-to-action.
function WelcomeSection() {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1
          id="welcome-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          Welcome back, {investorProfile.firstName} 👋
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          Here are the startups and opportunities that match your investment interests.
        </p>
      </div>

      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        Explore Startups
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  )
}

export default WelcomeSection
