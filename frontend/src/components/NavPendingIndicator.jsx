/**
 * Replaces the 🔒 marker on protected nav links while the dashboard is still
 * fetching the profile / verification status.
 *
 * `verificationStatus` is initialised to `'not_submitted'`, so until the first
 * request settles `isVerified` is false regardless of the account's real state.
 * Rendering the lock during that window told every verified user - on every
 * refresh and every login - that their access was restricted, then silently
 * took it back a second later. The lock state is unknowable here, so we show a
 * loading marker instead.
 */
const NavPendingIndicator = () => (
  <span
    role="status"
    aria-label="Checking access"
    className="inline-block w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin align-middle"
  />
);

export default NavPendingIndicator;
