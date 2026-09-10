import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 pt-20 pb-16 lg:pt-32 lg:pb-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex-1 space-y-6 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Secure Email Verified Platform
          </div>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Ideas deserve the right <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              People & Funding.
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Bridge connects entrepreneurs, specialized talent, and investors on one unified platform with instant AI pitch evaluation and secure role-based access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition text-center"
            >
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold rounded-xl transition text-center"
            >
              Sign In to Account
            </Link>
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg lg:max-w-none z-10">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Core Features</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">Live System</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/50">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold">AI</div>
                <div>
                  <div className="text-sm font-semibold text-white">Instant AI Pitch Deck Evaluation</div>
                  <div className="text-xs text-slate-400 mt-0.5">Upload presentations for automated scoring, strengths, weaknesses, and custom metrics.</div>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold">OTP</div>
                <div>
                  <div className="text-sm font-semibold text-white">Secure Email & OTP Verification</div>
                  <div className="text-xs text-slate-400 mt-0.5">Strict authentication protocols protecting registrations and password recovery flows.</div>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/50">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center flex-shrink-0 font-bold">RB</div>
                <div>
                  <div className="text-sm font-semibold text-white">Multi-Role Dashboards</div>
                  <div className="text-xs text-slate-400 mt-0.5">Tailored workspaces for Startup Founders, Investors, Freelancer Talent, and Administrators.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Features Grid */}
      <section id="features" className="px-6 lg:px-12 py-20 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white">Implemented Platform Capabilities</h2>
            <p className="text-slate-400 text-sm">Everything built into your current infrastructure stack to ensure smooth venture operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">01</div>
              <h3 className="text-lg font-semibold text-white">AI Pitch Due Diligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Automated document text extraction and evaluation scoring directly stored in MongoDB profiles.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">02</div>
              <h3 className="text-lg font-semibold text-white">OTP Email Security</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Integrated Nodemailer dispatching codes for registration verification and secure password resets.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">03</div>
              <h3 className="text-lg font-semibold text-white">Role Management</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Dedicated permissions and dashboard views for startups, investors, talent, and system admins.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">04</div>
              <h3 className="text-lg font-semibold text-white">Cloudinary Storage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Seamless handling and cloud hosting of pitch deck presentations and user profile avatars.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 lg:px-12 py-20 text-center">
        <div className="max-w-4xl mx-auto p-10 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/20 shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Ready to access the ecosystem?</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">Join Bridge today, verify your work email with instant OTP dispatch, and start leveraging AI pitch reviews.</p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition text-sm"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 lg:px-12 py-8 bg-slate-950 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>© {new Date().getFullYear()} Bridge Systems Inc. All rights reserved.</div>
        <div className="flex gap-6">
          <Link to="/login" className="hover:text-slate-400 transition">Sign In</Link>
          <Link to="/register" className="hover:text-slate-400 transition">Register</Link>
        </div>
      </footer>
    </div>
  );
}