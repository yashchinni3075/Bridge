import { useState } from "react";
import { useNavigate } from "react-router-dom";

const roles = [
  {
    id: "freelancer",
    title: "Freelancer",
    description: "Find startups, use your skills and build something meaningful.",
    color: "#3157ff",
    icon: (
      <path d="M4 6h16v12H4zM8 21h8M12 18v3" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    id: "investor",
    title: "Investor",
    description: "Discover vetted founders and invest in the next big thing.",
    color: "#21b984",
    icon: (
      <path d="M3 8h18v10H3zM7 8V6h10v2M8 13h.01M16 13h.01M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    id: "founder",
    title: "Startup Founder",
    description: "Showcase your startup, track milestones and pitch to investors.",
    color: "#ff7a2f",
    icon: (
      <path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8.8-2.2 0-3s-2.2-.8-3 0zM15 9l-3 3M9.5 6.5c1-1 2.5-2.5 4.5-3.5 3-1.5 6-1 6-1s.5 3-1 6c-1 2-2.5 3.5-3.5 4.5M14.5 14.5l-9-9" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  function handleLogin() {
    if (role === "freelancer") navigate("/freelancer-dashboard");
    else if (role === "investor") navigate("/investor-dashboard");
    else navigate("/startup-dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-5 py-8 text-gray-100 md:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3157ff] text-white shadow-lg shadow-blue-500/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5">
              <path d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 18h5" strokeLinecap="round" />
            </svg>
          </span>
          Bridge
        </button>

        <button onClick={() => navigate("/")} className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-gray-200 shadow-sm transition hover:border-[#3157ff] hover:text-[#5b8aff]">
          Back Home
        </button>
      </div>

      <section className="mx-auto grid max-w-7xl items-center gap-12 py-14 lg:grid-cols-[1fr_0.92fr] lg:py-20">
        <div className="max-w-2xl text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#3157ff]/15 px-4 py-2 text-sm font-extrabold text-[#5b8aff]">
            Secure Bridge Access
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-normal text-white md:text-6xl">
            Welcome back to your innovation network.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-8 text-gray-400 lg:mx-0">
            Sign in to manage startup milestones, discover collaborators and keep investor conversations moving.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {["Founder updates", "Skill matches", "Funding pipeline"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-gray-300 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111827] p-7 shadow-2xl shadow-blue-950/20 md:p-9">
          <h2 className="text-3xl font-black text-white">Log in</h2>
          <p className="mt-2 text-sm font-medium text-gray-400">
            {!role ? "Pick your role to continue." : "Enter your details to continue to Bridge."}
          </p>

          {!role ? (
            <div className="mt-8 grid gap-4">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/20 hover:bg-white/10"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${r.color}22` }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2" className="h-6 w-6">
                      {r.icon}
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{r.title}</div>
                    <div className="mt-1 text-xs font-medium text-gray-400">{r.description}</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto h-5 w-5 shrink-0 text-gray-500">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <button onClick={() => setRole("")} className="flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-gray-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to role selection
              </button>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                <svg viewBox="0 0 24 24" fill="none" stroke={roles.find((r) => r.id === role).color} strokeWidth="2" className="h-4 w-4">
                  {roles.find((r) => r.id === role).icon}
                </svg>
                <span className="text-xs font-black" style={{ color: roles.find((r) => r.id === role).color }}>
                  Logging in as {roles.find((r) => r.id === role).title}
                </span>
              </div>

              <label className="mt-6 block">
                <span className="text-sm font-extrabold text-gray-300">Email address</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#3157ff] focus:bg-white/5 focus:ring-4 focus:ring-[#3157ff]/20"
                />
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-extrabold text-gray-300">Password</span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#3157ff] focus:bg-white/5 focus:ring-4 focus:ring-[#3157ff]/20"
                />
              </label>

              <div className="mt-5 flex items-center justify-between gap-4 text-sm">
                <label className="flex items-center gap-2 font-bold text-gray-400">
                  <input type="checkbox" className="h-4 w-4 accent-[#3157ff]" />
                  Remember me
                </label>
                <button type="button" className="font-extrabold text-[#5b8aff] hover:text-[#3157ff]">
                  Forgot password?
                </button>
              </div>

              <button type="button" onClick={handleLogin} className="mt-7 w-full rounded-xl bg-[#3157ff] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 transition hover:bg-[#2447e8]">
                Log in to Bridge
              </button>

              <div className="mt-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-black uppercase text-gray-500">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <button type="button" className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-extrabold text-gray-200 transition hover:border-[#3157ff]/50 hover:bg-white/10">
                Continue with Google
              </button>
            </div>
          )}

          <p className="mt-7 text-center text-sm font-medium text-gray-400">
            New to Bridge?{" "}
            <button type="button" onClick={() => navigate("/register")} className="font-extrabold text-[#5b8aff]">
              Create an account
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
