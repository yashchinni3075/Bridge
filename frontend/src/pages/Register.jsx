import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/ui";
import { useAppState } from "../context/AppStateContext";

const inputCls =
  "w-full border border-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-coral/30";

export default function Register() {
  const { register } = useAppState();
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
    register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
    navigate("/profile");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="w-8 h-8 bg-coral rounded-lg flex items-center justify-center text-white font-display font-bold text-base">
            B
          </span>
          <span className="font-display font-semibold text-2xl">Bridge</span>
        </div>

        <div className="bg-paper-raised border border-line rounded-card p-7">
          <h1 className="font-display font-semibold text-xl mb-1">Create your Startup account</h1>
          <p className="text-sm text-ink-soft mb-6">
            Just the basics for now — you'll complete your full startup profile next.
          </p>

          {!otpSent ? (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Full name</label>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Srushti Vijapure"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Email</label>
                <input
                  type="email"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Phone number</label>
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <input
                  type="password"
                  className={inputCls}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <Button className="w-full mt-1" disabled={!canSendOtp} onClick={handleSendOtp}>
                <span className="flex items-center justify-center gap-1.5">
                  Send OTP <ArrowRight size={14} />
                </span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <p className="text-sm text-ink-soft">
                We sent a 4-digit code to <b className="text-ink">{form.phone}</b> (simulated for demo — enter any 4 digits).
              </p>
              <input
                className={`${inputCls} text-center tracking-[0.5em] font-mono text-lg`}
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="0000"
              />
              <Button className="w-full" disabled={otp.length < 4} onClick={handleVerifyAndRegister}>
                Verify & Continue
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-soft mt-5">
          After this, you'll land on your dashboard — a banner will guide you to
          complete your full startup profile before you're eligible for admin verification.
        </p>
      </div>
    </div>
  );
}
