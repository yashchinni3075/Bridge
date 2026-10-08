import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ROLE_HOME = {
  admin: '/admin',
  startup: '/startup-dashboard',
  investor: '/investor-dashboard',
  freelancer: '/freelancer-dashboard',
};

// `inline` renders the same panel inside an existing page shell (the dashboard
// layouts) without claiming a full viewport height, which would fight the
// parent's own scroll container.
export default function NotFound({ inline = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem('bridge_token');
  const user = JSON.parse(localStorage.getItem('bridge_user') || 'null');

  const attemptedPath = location.state?.from || location.pathname;
  const dashboardHref = token && user ? ROLE_HOME[user.role] : null;

  // React Router gives every in-app navigation a generated key. A key of
  // 'default' means this was the first entry of the session (the user typed
  // the URL or followed an external link), so there is nothing to go back to.
  const canGoBack = location.key !== 'default';

  const buttonBase =
    'w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm transition text-center';

  return (
    <div
      className={`${inline ? 'py-12' : 'min-h-screen'} bg-slate-950 text-slate-100 flex items-center justify-center px-6 selection:bg-indigo-500 selection:text-white`}
    >
      <div className="w-full max-w-xl text-center">
        <p className="text-7xl sm:text-8xl font-black tracking-tighter text-slate-800">
          404
        </p>

        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-white">Page not found</h1>

        <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
          We couldn&rsquo;t find anything at{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs sm:text-sm break-all">
            {attemptedPath}
          </code>
          . The link may be broken, or the page may have been moved or removed.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          {dashboardHref ? (
            <Link
              to={dashboardHref}
              className={`${buttonBase} bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20`}
            >
              Go to my dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className={`${buttonBase} bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20`}
            >
              Sign in
            </Link>
          )}

          <Link
            to="/"
            className={`${buttonBase} bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200`}
          >
            Back to home
          </Link>

          {canGoBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`${buttonBase} text-slate-400 hover:text-slate-200 hover:bg-slate-900/50`}
            >
              Go back
            </button>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Popular pages
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {dashboardHref && (
              <Link
                to={dashboardHref}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition"
              >
                My dashboard
              </Link>
            )}
            <Link
              to="/connections"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition"
            >
              Connections
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition"
            >
              Create an account
            </Link>
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}