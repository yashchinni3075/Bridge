/**
 * Shown in place of VerificationRequiredCard while the dashboard is still
 * fetching profile + verification status.
 *
 * `verificationStatus` starts at `'not_submitted'`, so before that request
 * settles `isVerified` is false for everyone. Every `isVerified ? … :
 * <VerificationRequiredCard />` in the dashboards therefore told verified
 * users, on every refresh and every login, that their "account is currently
 * pending admin approval" - then quietly took it back a second later. We do
 * not know the answer yet, so say that instead.
 */
const AccessLoadingCard = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    <div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-2xl relative overflow-hidden"
      role="status"
      aria-busy="true"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full"></div>
      <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mx-auto flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white tracking-tight">Loading your dashboard</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Fetching your profile and verification status&hellip;
        </p>
      </div>
      <div className="flex justify-center gap-2" aria-hidden="true">
        <span className="h-2 w-12 rounded-full bg-slate-800 animate-pulse" />
        <span className="h-2 w-12 rounded-full bg-slate-800 animate-pulse" />
        <span className="h-2 w-12 rounded-full bg-slate-800 animate-pulse" />
      </div>
    </div>
  </div>
);

export default AccessLoadingCard;
