import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerUser, verifyOTP } from "../../utils/api";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name, email, password });
      setStep("otp");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOTP({ email, otp });
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-founda-surface px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-founda-purple via-founda-blue to-founda-teal text-xl font-bold text-white shadow-glow-sm">
            F
          </div>
          <h1 className="text-2xl font-bold text-founda-ink">
            {step === "form" ? "Create your account" : "Verify your email"}
          </h1>
          <p className="mt-1 text-sm text-founda-muted">
            {step === "form"
              ? "Join Founda as a freelancer"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === "form" ? (
          <form onSubmit={handleRegister} className="card space-y-4 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                className="input"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Register"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="card space-y-4 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="label">Verification Code</label>
              <input
                className="input text-center text-2xl tracking-[0.4em]"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Complete"}
            </button>

            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() => { setStep("form"); setError(""); setOtp(""); }}
            >
              Back to registration
            </button>
          </form>
        )}

        <p className="text-center text-sm text-founda-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-founda-purple hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
