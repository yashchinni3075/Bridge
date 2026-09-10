import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || localStorage.getItem('pendingVerificationEmail') || '';

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-email', {
        email,
        otp,
      });

      if (response.data.success) {
        setMessage('Email verified successfully! Redirecting...');
        localStorage.removeItem('pendingVerificationEmail');
        
        if (response.data.token) {
          localStorage.setItem('bridge_token', response.data.token);
          localStorage.setItem('bridge_user', JSON.stringify(response.data.user));
        }

        setTimeout(() => {
          navigate('/startup/profile');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Left Branding Showcase Column */}
      <div className="relative flex-1 hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border-r border-slate-800/80 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/25">
            B
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Bridge</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Secure Verification Infrastructure
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Confirm your identity. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              Secure your venture.
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Protecting your startup ecosystem access with institutional-grade cryptographic email confirmation.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-600">
          © {new Date().getFullYear()} Bridge Systems Inc. All rights reserved.
        </div>
      </div>

      {/* Right Interactive Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-900/60 backdrop-blur-xl">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-base">
                B
              </div>
              <span className="text-lg font-bold text-white">Bridge</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Verify Your Email</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              We’ve dispatched a 6-digit verification OTP to <br />
              <span className="font-semibold text-indigo-300">{email || 'your email'}</span>.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="------"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center tracking-[0.5em] text-2xl font-extrabold text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Verify Email & Proceed</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}