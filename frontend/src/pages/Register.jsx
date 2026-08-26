import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext";

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

export default function Register() {
  const { register } = useAppState();
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const canSendOtp = role && form.name && form.email && form.phone && form.password;

  function handleSendOtp() {
    if (!canSendOtp) return;
    setOtpSent(true);
  }

  function handleVerifyAndRegister() {
    if (otp.trim().length < 4) return;
    register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role });
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
            Join Bridge Today
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-normal text-white md:text-6xl">
            Start your innovation journey.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-8 text-gray-400 lg:mx-0">
            Create your account, verify with OTP and get access to founders, freelancers and investors.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {["Free to join", "AI-powered matching", "Real-time dashboard"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-gray-300 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111827] p-7 shadow-2xl shadow-blue-950/20 md:p-9">
          <h2 className="text-3xl font-black text-white">Create account</h2>
          <p className="mt-2 text-sm font-medium text-gray-400">
            {!role ? "Pick your role to get started." : !otpSent ? "Just the basics — you'll complete your profile next." : "Enter the code sent to your phone."}
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
          ) : !otpSent ? (
            <div className="space-y-5 mt-8">
              <button onClick={() => setRole("")} className="flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-gray-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to role selection
              </button>

              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                <svg viewBox="0 0 24 24" fill="none" stroke={roles.find((r) => r.id === role).color} strokeWidth="2" className="h-4 w-4">
                  {roles.find((r) => r.id === role).icon}
                </svg>
                <span className="text-xs font-black" style={{ color: roles.find((r) => r.id === role).color }}>
                  Registering as {roles.find((r) => r.id === role).title}
                </span>
              </div>

              <label className="block">
                <span className="text-sm font-extrabold text-gray-300">Full name</span>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#3157ff] focus:bg-white/5 focus:ring-4 focus:ring-[#3157ff]/20"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Srushti Vijapure"
                />
              </label>

              <label className="block">
                <span className="text-sm font-extrabold text-gray-300">Email address</span>
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#3157ff] focus:bg-white/5 focus:ring-4 focus:ring-[#3157ff]/20"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-extrabold text-gray-300">Phone number</span>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#3157ff] focus:bg-white/5 focus:ring-4 focus:ring-[#3157ff]/20"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </label>

              <label className="block">
                <span className="text-sm font-extrabold text-gray-300">Password</span>
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#3157ff] focus:bg-white/5 focus:ring-4 focus:ring-[#3157ff]/20"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </label>

              <button
                disabled={!canSendOtp}
                onClick={handleSendOtp}
                className="w-full rounded-xl bg-[#3157ff] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 transition hover:bg-[#2447e8] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send OTP
              </button>
            </div>
          ) : (
            <div className="space-y-5 mt-8">
              <button onClick={() => setOtpSent(false)} className="flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-gray-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to details
              </button>

              <p className="text-sm text-gray-400">
                We sent a 4-digit code to <b className="text-white">{form.phone}</b> (simulated — enter any 4 digits).
              </p>

              <label className="block">
                <span className="text-sm font-extrabold text-gray-300">Verification code</span>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center tracking-[0.5em] font-mono text-lg text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#3157ff] focus:bg-white/5 focus:ring-4 focus:ring-[#3157ff]/20"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="0000"
                />
              </label>

              <button
                disabled={otp.length < 4}
                onClick={handleVerifyAndRegister}
                className="w-full rounded-xl bg-[#3157ff] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 transition hover:bg-[#2447e8] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Verify & Continue
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-black uppercase text-gray-500">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button onClick={() => navigate("/login")} className="mt-6 w-full text-center text-sm font-medium text-gray-400">
            Already have an account?{" "}
            <span className="font-extrabold text-[#5b8aff]">Log in</span>
          </button>
        </div>
      </section>
    </main>
  );
}
