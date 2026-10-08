import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const token = localStorage.getItem('bridge_token');
  const user = JSON.parse(localStorage.getItem('bridge_user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('bridge_token');
    localStorage.removeItem('bridge_user');
    navigate('/login');
  };

  const getProfileRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'startup') return '/startup/profile';
    if (user.role === 'investor') return '/investor/profile';
    if (user.role === 'freelancer') return '/freelancer/profile';
    return '/connections';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950 border-b border-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-sm group-hover:bg-indigo-500 transition">
                B
              </div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-slate-200 transition">
                Bridge
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/')
                    ? 'text-white bg-slate-900 border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                Home
              </Link>
              {token && user && (
                <Link
                  to={getProfileRoute()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    location.pathname.includes('/profile') || location.pathname.startsWith('/admin')
                      ? 'text-white bg-slate-900 border border-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin Portal' : 'My Workspace'}
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            {token && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <div className="w-6 h-6 rounded bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[11px] font-bold text-indigo-300 uppercase">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
              aria-label="Toggle Navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-slate-950 border-b border-slate-900 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-900"
          >
            Home
          </Link>
          {token && user && (
            <Link
              to={getProfileRoute()}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-900"
            >
              {user.role === 'admin' ? 'Admin Portal' : 'My Workspace'}
            </Link>
          )}

          <div className="pt-2 border-t border-slate-900 flex flex-col gap-2">
            {token && user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 font-medium hover:bg-slate-900 rounded-lg"
              >
                Sign Out ({user.name})
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center py-2 text-xs font-medium text-slate-300 bg-slate-900 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
