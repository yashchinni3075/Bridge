import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Sparkles, Handshake, Users } from "lucide-react";
import { Button, inputCls } from "../components/ui";
import { useAppState } from "../context/AppStateContext";

const PERKS = [
  { icon: Handshake, title: "Matched with investors", text: "AI-ranked by sector, stage and check size." },
  { icon: Users, title: "Find missing teammates", text: "Close skill gaps with vetted collaborators." },
  { icon: Sparkles, title: "Pitch readiness score", text: "Know what investors will critique — before they do." },
];

export default function Register() {
  const { register, notify } = useAppState();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const canSendOtp = form.name && form.email && form.phone && form.password;

  function handleSendOtp() {
    if (!canSendOtp) return;
    setOtpSent(true);
  }

  function handleVerifyAndRegister() {
    if (otp.trim().length < 4) return;
    register({ name: form.name, email: form.email, phone: form.phone });
    notify({
      type: "success",
      icon: "welcome",
      title: "Welcome to Bridge 🎉",
      message: "Account created. Next up: complete your startup profile to unlock matches.",
    });
    navigate("/profile");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand/40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 translate-y-1/3 rounded-full bg-violet-500/30 blur-[120px]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-brand to-violet-500 font-display text-base font-bold text-white">
              B
            </span>
            <div>
              <span className="block font-display text-lg font-bold leading-none text-white">Bridge</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">Startup module</span>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
              Where startups meet{" "}
              <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                capital &amp; cofounders.
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              One profile. Verified. Matched. Everything an early-stage founder needs to raise and build — in a single workspace.
            </p>

            <ul className="mt-8 space-y-5">
              {PERKS.map((p) => (
                <li key={p.title} className="flex items-start gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                    <p.icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/50">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">Demo build — dummy data only</p>
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-brand to-violet-500 font-display text-sm font-bold text-white">
              B
            </span>
            <span className="font-display text-lg font-bold">Bridge</span>
          </div>

          {!otpSent ? (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Just the basics for now — you'll complete your full startup profile next.
              </p>
              <div className="mt-7 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Full name</label>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Srushti Vijapure"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Phone number</label>
                  <input
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">Password</label>
                  <input
                    type="password"
                    className={inputCls}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <Button className="w-full" disabled={!canSendOtp} onClick={handleSendOtp}>
                  Send OTP <ArrowRight size={15} />
                </Button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setOtpSent(false)}
                className="-ml-1 mb-4 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
              >
                <ArrowLeft size={13} /> Back
              </button>
              <h1 className="font-display text-2xl font-bold tracking-tight">Verify your phone</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                We sent a 4-digit code to <b className="text-ink">{form.phone}</b> — simulated for the demo, any 4 digits work.
              </p>
              <div className="mt-7 space-y-4">
                <input
                  className={`${inputCls} py-3 text-center font-mono text-xl tracking-[0.55em]`}
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="0000"
                />
                <Button className="w-full" disabled={otp.length < 4} onClick={handleVerifyAndRegister}>
                  <Check size={15} /> Verify &amp; continue
                </Button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
            After signup you'll land on your dashboard — a banner guides you through completing your profile before Admin verification.
          </p>
        </div>
      </div>
    </div>
  );
}
