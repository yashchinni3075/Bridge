import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function StartupDetail() {
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyMessage, setApplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [userVerificationStatus, setUserVerificationStatus] = useState('not_submitted');

  const fetchStartupAndStatus = async () => {
    try {
      setLoading(true);
      const [startupRes, statusRes] = await Promise.all([
        api.get(`/startups/${id}`),
        api.get('/verification/status'),
      ]);
      setStartup(startupRes.data.startup);
      setUserVerificationStatus(statusRes.data.status);
    } catch (err) {
      console.error('Error loading startup details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartupAndStatus();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', text: '' });

    try {
      await api.post(`/applications/${id}`, { message: applyMessage });
      setFeedback({
        type: 'success',
        text: 'Your application has been submitted successfully to the startup founder!',
      });
      setApplyMessage('');
      // Reload details to update applicant counter
      fetchStartupAndStatus();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit application.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading startup details...</div>;
  }

  if (!startup) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-xs text-slate-500">Startup not found.</p>
        <Link to="/freelancer/startups" className="text-xs text-indigo-600 underline mt-2 inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  const isVerified = userVerificationStatus === 'approved';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link
        to="/freelancer/startups"
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        ← Back to Startups
      </Link>

      {/* Startup Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{startup.startupName}</h1>
            <p className="text-xs text-slate-500 mt-1">Founder: {startup.founderName || 'Confidential'}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100">
              {startup.domain || 'Tech'}
            </span>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
              {startup.stage || 'Early Stage'}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mission & Pitch</h3>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{startup.pitch || 'No pitch provided.'}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Description</h3>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line">
              {startup.description || 'No additional details provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] text-slate-400">Funding Requirement</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {startup.fundingRequirement
                  ? `$${Number(startup.fundingRequirement).toLocaleString()}`
                  : 'Undisclosed'}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[10px] text-slate-400">Applicants</div>
              <div className="text-sm font-bold text-indigo-600 mt-0.5">
                {startup.applicantCount} total applied
              </div>
            </div>
            {startup.website && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-[10px] text-slate-400">Website</div>
                <a
                  href={startup.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:underline mt-1 block truncate"
                >
                  {startup.website} ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Form & Gating */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-2">Apply for Opportunities</h2>

        {!isVerified ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <div className="font-semibold">Verification Required to Apply</div>
            <p className="mt-1">
              Your account is currently <strong>{userVerificationStatus}</strong>. You must have an approved
              verification document on file before submitting proposals to startups.
            </p>
            <Link
              to="/freelancer/profile"
              className="inline-block mt-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
            >
              Go to Profile & Verification →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            {feedback.text && (
              <div
                className={`p-3 text-xs rounded-xl font-medium ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pitch / Proposal Note
              </label>
              <textarea
                rows={4}
                required
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder="Introduce yourself, explain how your skill set fits their vision, and link relevant portfolio items..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
              >
                {submitting ? 'Submitting Application...' : 'Send Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}