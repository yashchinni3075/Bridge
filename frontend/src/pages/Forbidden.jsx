import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ROLE_HOME = {
  admin: '/admin',
  startup: '/startup-dashboard',
  investor: '/investor-dashboard',
  freelancer: '/freelancer-dashboard',
};

const ROLE_LABEL = {
  admin: 'Administrator',
  startup: 'Startup',
  investor: 'Investor',
  freelancer: 'Freelancer',
};

// Explicit plurals: "Startup" -> "Startups" (not "Startups" via a naive +s).
const ROLE_LABEL_PLURAL = {
  admin: 'Administrators',
  startup: 'Startups',
  investor: 'Investors',
  freelancer: 'Freelancers',
};

export default function Forbidden() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('bridge_token');
  const user = JSON.parse(localStorage.getItem('bridge_user') || 'null');

  // Role-mismatch details are passed through navigate() state by the guards.
  const { allowedRoles, actualRole, blocked, from: attemptedPath } = location.state || {};
  const dashboardHref = token && user ? ROLE_HOME[user.role] : null;
  // A suspended user's only dashboard is the very page that refused them, so
  // don't offer a link straight back into a 403 loop.
  const showDashboard = Boolean(dashboardHref) && !blocked;

  const canGoBack = location.key !== 'default';

  const requiredLabel = Array.isArray(allowedRoles)
    ? allowedRoles.map((r) => ROLE_LABEL_PLURAL[r] || ROLE_LABEL[r] || r).join(' or ')
    : null;
  const actualLabel = actualRole ? ROLE_LABEL[actualRole] || actualRole : null;
  // "an Administrator" vs "a Startup" - vowel article depends on the word.
  const article = (word) => (/^[aeiou]/i.test(word || '') ? 'an' : 'a');

  const handleSwitchAccount = () => {
    localStorage.removeItem('bridge_token');
    localStorage.removeItem('bridge_user');
    navigate('/login');
  };

  const buttonBase =
    'w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm transition text-center';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 selection:bg-red-500 selection:text-white">
      <div className="w-full max-w-xl text-center">
        <p className="text-7xl sm:text-8xl font-black tracking-tighter text-slate-800">
          403
        </p>

        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-white">Access denied</h1>

        <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
          {blocked ? (
            <>
              Your account has been suspended, so this area is currently unavailable to you.
              If you believe this is a mistake, please contact support.
            </>
          ) : requiredLabel && actualLabel ? (
            <>
              You&rsquo;re signed in as {article(actualLabel)}{' '}
              <span className="font-semibold text-slate-200">{actualLabel}</span>. This page is
              limited to{' '}
              <span className="font-semibold text-slate-200">{requiredLabel}</span> only.
            </>
          ) : (
            <>You don&rsquo;t have permission to view this page.</>
          )}
        </p>

        {attemptedPath && attemptedPath !== '/403' && (
          <p className="mt-4 text-xs text-slate-500">
            Requested:{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 break-all">
              {attemptedPath}
            </code>
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          {showDashboard && (
            <Link
              to={dashboardHref}
              className={`${buttonBase} bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20`}
            >
              Go to my dashboard
            </Link>
          )}

          <Link
            to="/"
            className={`${buttonBase} bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200`}
          >
            Back to home
          </Link>

          {token && (
            <button
              type="button"
              onClick={handleSwitchAccount}
              className={`${buttonBase} text-slate-400 hover:text-slate-200 hover:bg-slate-900/50`}
            >
              Switch account
            </button>
          )}

          {canGoBack && !token && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`${buttonBase} text-slate-400 hover:text-slate-200 hover:bg-slate-900/50`}
            >
              Go back
            </button>
          )}
        </div>

        {token && !blocked && actualLabel && (
          <p className="mt-10 pt-8 border-t border-slate-900 text-xs text-slate-500">
            Signed in as <span className="text-slate-400">{user?.email}</span> ({actualLabel})
          </p>
        )}
      </div>
    </div>
  );
}