export default function LoginPage({ onBackHome }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#dfe7ff_0,#f8fbff_32%,#ffffff_72%)] px-5 py-8 text-[#07142f] md:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button onClick={onBackHome} className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3157ff] text-white shadow-lg shadow-blue-500/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5">
              <path d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 18h5" strokeLinecap="round" />
            </svg>
          </span>
          Bridge
        </button>

        <button onClick={onBackHome} className="rounded-lg border border-blue-100 bg-white px-5 py-2.5 text-sm font-bold shadow-sm transition hover:border-[#3157ff] hover:text-[#3157ff]">
          Back Home
        </button>
      </div>

      <section className="mx-auto grid max-w-7xl items-center gap-12 py-14 lg:grid-cols-[1fr_0.92fr] lg:py-20">
        <div className="max-w-2xl text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#edf0ff] px-4 py-2 text-sm font-extrabold text-[#3157ff]">
            Secure Bridge Access
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-normal md:text-6xl">
            Welcome back to your innovation network.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600 lg:mx-0">
            Sign in to manage startup milestones, discover collaborators and keep investor conversations moving.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {["Founder updates", "Skill matches", "Funding pipeline"].map((item) => (
              <div key={item} className="rounded-xl border border-blue-100 bg-white/75 p-4 text-sm font-bold text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <form className="rounded-3xl border border-blue-100 bg-white p-7 shadow-2xl shadow-blue-950/10 md:p-9">
          <h2 className="text-3xl font-black">Log in</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Enter your details to continue to Bridge.
          </p>

          <label className="mt-8 block">
            <span className="text-sm font-extrabold text-slate-700">Email address</span>
            <input
              type="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#3157ff] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-extrabold text-slate-700">Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#3157ff] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="mt-5 flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 font-bold text-slate-600">
              <input type="checkbox" className="h-4 w-4 accent-[#3157ff]" />
              Remember me
            </label>
            <button type="button" className="font-extrabold text-[#3157ff] hover:text-[#2447e8]">
              Forgot password?
            </button>
          </div>

          <button type="button" className="mt-7 w-full rounded-xl bg-[#3157ff] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 transition hover:bg-[#2447e8]">
            Log in to Bridge
          </button>

          <div className="mt-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-black uppercase text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" className="mt-6 w-full rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-extrabold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
            Continue with Google
          </button>

          <p className="mt-7 text-center text-sm font-medium text-slate-500">
            New to Bridge?{" "}
            <button type="button" className="font-extrabold text-[#3157ff]">
              Create an account
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
