import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button, inputCls } from "../components/ui";
import { useAppState } from "../context/AppStateContext";
import { API_URL } from "../lib/api";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const { notify, login } = useAppState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailValid = validateEmail(email);
  const canSubmit = emailValid && password.length >= 6 && !submitting;

  async function handleLogin() {
    if (!emailValid || password.length < 6) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Login failed.");
        setSubmitting(false);
        return;
      }

      login(result.user || { email }, result.access_token);
      notify({
        type: "success",
        icon: "welcome",
        title: "Signed in",
        message: "Welcome back to Bridge!",
      });
      navigate("/");
    } catch (err) {
      console.error("Error logging in:", err);
      setError(err.message || "Login failed. Please try again.");
      setSubmitting(false);
    }
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
              Welcome back to{" "}
              <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                Bridge.
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Sign in to access your startup dashboard, matches, and milestones.
            </p>
          </div>
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

          <h1 className="font-display text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Enter your email and password to access your account.
          </p>
          {error && (
            <p className="mt-3 rounded-lg bg-rose-soft px-3 py-2 text-xs font-medium text-rose">{error}</p>
          )}
          <div className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Email</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Password</label>
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="Your password"
              />
            </div>
            <Button className="w-full" disabled={!canSubmit} onClick={handleLogin}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-brand hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
