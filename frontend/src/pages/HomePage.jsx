import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* ── Ambient backdrop: glows, blueprint grid, film grain ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-16rem] h-[38rem] w-[75rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),transparent)] blur-2xl" />
        <div className="absolute left-1/2 top-[-8rem] h-[26rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.16),transparent)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 75% 55% at 50% 25%, #000 25%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 55% at 50% 25%, #000 25%, transparent 78%)',
          }}
        />
        <div className="bri-float absolute left-[6%] top-[38%] h-72 w-72 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div
          className="bri-float absolute right-[6%] top-[55%] h-80 w-80 rounded-full bg-purple-600/15 blur-[130px]"
          style={{ animationDelay: '-5s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-14 px-6 pb-24 pt-16 lg:flex-row lg:px-12 lg:pb-32 lg:pt-28">
        <div className="flex-1 space-y-7 text-center lg:text-left">
          <h1
            className="bri-rise text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-5xl xl:text-6xl"
            style={{ animationDelay: '90ms' }}
          >
            Ideas deserve the right
            <span
              className="mt-1 block bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-200 bg-clip-text font-display italic text-transparent"
            >
              People &amp; Funding.
            </span>
          </h1>

          <p
            className="bri-rise mx-auto max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg lg:mx-0"
            style={{ animationDelay: '180ms' }}
          >
            Bridge connects entrepreneurs, specialized talent, and investors on one unified platform with instant AI pitch evaluation and secure role-based access.
          </p>

          <div
            className="bri-rise flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row lg:justify-start"
            style={{ animationDelay: '270ms' }}
          >
            <Link
              to="/register"
              className="w-full rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-8 py-3.5 text-center text-sm font-semibold text-white shadow-[0_18px_40px_-16px_rgba(99,102,241,0.9)] ring-1 ring-inset ring-white/15 transition duration-300 hover:-translate-y-0.5 hover:from-indigo-400 hover:to-indigo-500 hover:shadow-[0_24px_50px_-16px_rgba(129,140,248,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80 sm:w-auto"
            >
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-center text-sm font-semibold text-slate-200 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 sm:w-auto"
            >
              Sign In to Account
            </Link>
          </div>
        </div>

        <div className="bri-rise relative z-10 w-full max-w-lg flex-1 lg:max-w-none" style={{ animationDelay: '360ms' }}>
          <div className="absolute -inset-8 rounded-[2.5rem] bg-indigo-600/10 blur-3xl" />
          <div className="relative rounded-2xl bg-gradient-to-b from-white/15 via-white/[0.06] to-white/[0.03] p-px shadow-2xl shadow-black/60">
            <div className="rounded-[15px] bg-slate-950/70 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Platform Core Features</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live System
                </span>
              </div>
              <div className="space-y-3 pt-4">
                <div className="group flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition duration-300 hover:translate-x-1 hover:border-indigo-500/30 hover:bg-indigo-500/[0.06]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-indigo-500/25 to-indigo-600/10 text-[11px] font-bold tracking-wide text-indigo-300 ring-1 ring-inset ring-indigo-400/20 transition group-hover:ring-indigo-400/40">
                    AI
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Instant AI Pitch Deck Evaluation</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-400">Upload PPT, PPTX, or PDF decks — Gemini scores them across problem, market, team, and traction, then returns strengths, weaknesses, and recommendations.</div>
                  </div>
                </div>
                <div className="group flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition duration-300 hover:translate-x-1 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-emerald-500/25 to-emerald-600/10 text-[11px] font-bold tracking-wide text-emerald-300 ring-1 ring-inset ring-emerald-400/20 transition group-hover:ring-emerald-400/40">
                    ID
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Identity &amp; Domain Verification</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-400">Email OTP sign-up, admin-reviewed ID documents, and DNS TXT domain verification with per-user trust scores.</div>
                  </div>
                </div>
                <div className="group flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition duration-300 hover:translate-x-1 hover:border-purple-500/30 hover:bg-purple-500/[0.06]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-purple-500/25 to-purple-600/10 text-[11px] font-bold tracking-wide text-purple-300 ring-1 ring-inset ring-purple-400/20 transition group-hover:ring-purple-400/40">
                    RB
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Multi-Role Dashboards</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-slate-400">Tailored workspaces for Startup Founders, Investors, Freelancer Talent, and Administrators.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Features Grid */}
      <section id="features" className="relative z-10 border-t border-white/5 bg-slate-900/30 px-6 py-24 backdrop-blur-sm lg:px-12">
        <div className="mx-auto max-w-7xl space-y-14">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">Implemented Platform Capabilities</h2>
            <p className="text-sm leading-relaxed text-slate-400 sm:text-base">Everything built into your current infrastructure stack to ensure smooth venture operations.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                num: '01',
                title: 'AI Match Engines',
                desc: 'Multi-factor and cosine-similarity scoring pairs founders, talent, and investors — each match ships with an AI-written explanation.',
              },
              {
                num: '02',
                title: 'Smart Hiring Pipeline',
                desc: 'Publish roles with PDF job descriptions, review applicants and resumes, and move candidates through engagement stages.',
              },
              {
                num: '03',
                title: 'Funding Marketplace',
                desc: 'Post raise opportunities with deck uploads, let investors express interest, and respond to them — all with live funding stats.',
              },
              {
                num: '04',
                title: 'Realtime Chat & Alerts',
                desc: 'Socket.io messaging with file sharing, read receipts, unread counts, and a live notification bell across the app.',
              },
              {
                num: '05',
                title: 'Meetings & Tasks',
                desc: 'Calendar events with RSVPs and upcoming reminders, plus a personal task board for everything on your plate.',
              },
              {
                num: '06',
                title: 'Verified Connections',
                desc: 'Verified-only connection requests and cross-role discovery search for startups, freelancers, and investors.',
              },
              {
                num: '07',
                title: 'Admin & Safety',
                desc: 'Platform dashboard stats, verification approvals, user blocking, and community report handling for moderation.',
              },
              {
                num: '08',
                title: 'Cloud-Powered Storage',
                desc: 'Cloudinary-hosted pitch decks, resumes, startup logos, and verification documents with secure view and download.',
              },
            ].map((card, i) => (
              <div
                key={card.num}
                className="bri-rise group relative rounded-2xl bg-gradient-to-b from-white/10 via-white/[0.04] to-white/[0.02] p-px transition duration-300 hover:from-indigo-500/50 hover:via-purple-400/25 hover:to-transparent"
                style={{ animationDelay: `${120 + i * 80}ms` }}
              >
                <div className="relative h-full overflow-hidden rounded-[15px] bg-slate-950/80 p-6 backdrop-blur-xl transition duration-300 group-hover:bg-slate-950/60">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(129,140,248,0.14),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-indigo-500/20 to-indigo-600/5 text-xs font-bold tracking-wider text-indigo-300 ring-1 ring-inset ring-indigo-400/20 transition duration-300 group-hover:ring-indigo-400/40">
                    {card.num}
                  </div>
                  <h3 className="relative mt-5 text-base font-semibold tracking-[-0.01em] text-white">{card.title}</h3>
                  <p className="relative mt-2 text-xs leading-relaxed text-slate-400">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 px-6 py-24 text-center lg:px-12">
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-r from-indigo-600/20 via-purple-600/10 to-indigo-600/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-10 shadow-2xl shadow-black/60 sm:p-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%)]" />
            <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
              <div
                className="bri-sheen h-px w-full bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent"
                style={{ animationDuration: '4.5s' }}
              />
            </div>

            <div className="relative space-y-6">
              <h2 className="text-3xl font-semibold tracking-[-0.025em] text-white sm:text-4xl">Ready to access the ecosystem?</h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
                Join Bridge today, verify your work email with instant OTP dispatch, and start leveraging AI pitch reviews.
              </p>
              <div className="flex justify-center pt-2">
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-9 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-16px_rgba(99,102,241,0.9)] ring-1 ring-inset ring-white/15 transition duration-300 hover:-translate-y-0.5 hover:from-indigo-400 hover:to-indigo-500 hover:shadow-[0_24px_50px_-16px_rgba(129,140,248,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950/80 px-6 py-10 backdrop-blur lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 text-[10px] font-black text-white shadow-sm shadow-indigo-600/40">
              B
            </span>
            <span>© {new Date().getFullYear()} Bridge Systems Inc. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="font-medium text-slate-400 transition hover:text-white">
              Sign In
            </Link>
            <Link to="/register" className="font-medium text-slate-400 transition hover:text-white">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
