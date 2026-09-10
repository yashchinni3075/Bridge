import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/startups', label: 'Startups' },
    { path: '/admin/investors', label: 'Investors' },
    { path: '/admin/freelancers', label: 'Freelancers' },
    { path: '/admin/verification', label: 'Verification' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white relative">
      {/* Mobile Header Bar */}
      <div className="md:hidden h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-indigo-600/30">
            B
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">Bridge</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white focus:outline-none transition"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-4 space-y-2 z-30 shadow-2xl animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                isActive(link.path) && (link.path !== '/admin' || location.pathname === '/admin')
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-72 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 flex-col justify-between p-6 sticky top-0 h-screen">
        <div className="space-y-8">
          <div className="flex items-center gap-3.5 px-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-xl shadow-indigo-600/30">
              B
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block">Bridge</span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Admin Control Panel</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive(link.path) && (link.path !== '/admin' || location.pathname === '/admin')
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-20 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/80 px-8 items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">Admin Control Panel</h1>
            <p className="text-[11px] text-slate-400">Platform management and security compliance</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-900/50 px-4 py-2 rounded-2xl shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Admin Session Active
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-950 text-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}