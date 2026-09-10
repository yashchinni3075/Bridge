import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function VerificationPanel({ role }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('Government ID');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // GitHub verification
  const [githubInput, setGithubInput] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubMsg, setGithubMsg] = useState(null); // { type, text }

  // LinkedIn verification
  const [linkedinInput, setLinkedinInput] = useState('');
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinMsg, setLinkedinMsg] = useState(null); // { type, text }

  const loadStatus = async () => {
    try {
      const res = await api.get('/verification/status');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', docType);

    try {
      await api.post('/verification/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Document submitted for administrative review.');
      setFile(null);
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload verification document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGithubVerify = async (e) => {
    e.preventDefault();
    if (!githubInput.trim()) return;
    setGithubLoading(true);
    setGithubMsg(null);
    try {
      const res = await api.post('/verification/github', {
        profileUrl: githubInput.trim(),
      });
      setGithubMsg({ type: 'success', text: res.data.message });
      setGithubInput('');
      await loadStatus();
    } catch (err) {
      const status = err.response?.data?.status;
      const text = err.response?.data?.message || 'GitHub verification failed.';
      if (status === 'verified') {
        setGithubMsg({ type: 'success', text });
      } else if (status === 'not_verified') {
        setGithubMsg({ type: 'error', text });
      } else if (status === 'invalid') {
        setGithubMsg({ type: 'error', text });
      } else {
        setGithubMsg({ type: 'error', text });
      }
    } finally {
      setGithubLoading(false);
    }
  };

  const handleLinkedinVerify = async (e) => {
    e.preventDefault();
    if (!linkedinInput.trim()) return;
    setLinkedinLoading(true);
    setLinkedinMsg(null);
    try {
      const res = await api.post('/verification/linkedin', {
        profileUrl: linkedinInput.trim(),
      });
      setLinkedinMsg({ type: 'success', text: res.data.message });
      setLinkedinInput('');
      await loadStatus();
    } catch (err) {
      const text = err.response?.data?.message || 'LinkedIn validation failed.';
      setLinkedinMsg({ type: 'error', text });
    } finally {
      setLinkedinLoading(false);
    }
  };

  if (loading) return null;

  const status = data?.status || 'not_submitted';
  const github = data?.github || {};
  const linkedin = data?.linkedin || {};

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Identity & Business Verification</h3>
          <p className="text-xs text-slate-400 mt-0.5">Required to unlock matchmaking and direct outreach.</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
            status === 'approved'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : status === 'pending'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : status === 'rejected'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {status.replace('_', ' ')}
        </span>
      </div>

      {status === 'rejected' && data?.rejectionReason && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <div className="font-semibold mb-1">Reason for Rejection:</div>
          <div>{data.rejectionReason}</div>
          <div className="mt-2 text-rose-300">Please review the requirement and upload a compliant document below.</div>
        </div>
      )}

      {status === 'approved' ? (
        <div className="text-xs text-slate-400">
          Your account is fully verified. You have unrestricted access to connections and AI recommendations.
        </div>
      ) : (
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Document Category</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Government ID">Government ID</option>
                <option value="Company Registration">Company Registration / Incorporations</option>
                <option value="Accreditation Proof">Accreditation Proof</option>
                <option value="Passport">Passport</option>
                <option value="Other">Other Verified Document</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Upload File (PDF or Image)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {error && <div className="text-xs text-rose-400">{error}</div>}
          {message && <div className="text-xs text-emerald-400">{message}</div>}

          <button
            type="submit"
            disabled={!file || submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition"
          >
            {submitting ? 'Streaming to Cloudinary...' : status === 'rejected' ? 'Resubmit Document' : 'Submit Document'}
          </button>
        </form>
      )}

      {role !== 'investor' && (
        <>
          {/* ===== GitHub Verification ===== */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">GitHub Verification</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify your GitHub account using your username or profile URL.
                </p>
              </div>
              {github.isVerified ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ✅ Verified
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider bg-slate-800 text-slate-400">
                  Not verified
                </span>
              )}
            </div>

            {github.isVerified ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    GitHub account
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Locked
                  </span>
                </div>
                <div className="text-sm font-semibold text-white break-all">@{github.username}</div>
                <div className="text-xs text-emerald-300/70 break-all">{github.profileUrl}</div>
                {github.verifiedAt && (
                  <div className="text-xs text-emerald-400/70 mt-1">
                    Verified {new Date(github.verifiedAt).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300/80">
                  Your GitHub ID is saved and locked. It cannot be changed.
                </div>
              </div>
            ) : (
              <form onSubmit={handleGithubVerify} className="space-y-3">
                <input
                  type="text"
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  placeholder="GitHub username or https://github.com/username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {githubMsg && (
                  <div
                    className={`text-xs ${
                      githubMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {githubMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!githubInput.trim() || githubLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition"
                >
                  {githubLoading ? 'Checking GitHub...' : 'Verify GitHub'}
                </button>
              </form>
            )}
          </div>

          {/* ===== LinkedIn Verification ===== */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">LinkedIn Verification</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Validate your LinkedIn profile URL. Profile URL validation is not equivalent to
                  ownership verification.
                </p>
              </div>
              {linkedin.isVerified ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified
                </span>
              ) : linkedin.profileUrl ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ⚠️ URL validated
                </span>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider bg-slate-800 text-slate-400">
                  Not submitted
                </span>
              )}
            </div>

            {(linkedin.profileUrl || linkedin.note) && (
              <div className="mb-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300">
                {linkedin.profileUrl && (
                  <div className="mb-1">
                    <span className="text-slate-500">LinkedIn profile: </span>
                    <span className="font-semibold text-slate-200 break-all">{linkedin.profileUrl}</span>
                  </div>
                )}
                {linkedin.note && (
                  <div className={linkedin.isVerified ? 'text-emerald-400/90 mt-1' : 'text-amber-400/90 mt-1'}>
                    {linkedin.note}
                  </div>
                )}
                {!linkedin.isVerified && linkedin.profileUrl && (
                  <div className="text-amber-400/90 mt-1">Ownership not independently confirmed.</div>
                )}
                {linkedin.verifiedAt && (
                  <div className="text-slate-500 mt-1">
                    {linkedin.isVerified ? 'Verified' : 'Validated'}{' '}
                    {new Date(linkedin.verifiedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleLinkedinVerify} className="space-y-3">
              <input
                type="text"
                value={linkedinInput}
                onChange={(e) => setLinkedinInput(e.target.value)}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {linkedinMsg && (
                <div
                  className={`text-xs ${
                    linkedinMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {linkedinMsg.text}
                </div>
              )}
              <button
                type="submit"
                disabled={!linkedinInput.trim() || linkedinLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition"
              >
                {linkedinLoading ? 'Validating LinkedIn...' : 'Validate LinkedIn'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}