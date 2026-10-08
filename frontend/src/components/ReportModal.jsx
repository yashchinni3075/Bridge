import React, { useState } from 'react';
import api from '../services/api';

const FREELANCER_REASONS = [
  'Fake job',
  'Misleading job description',
  'Scam/Fraud',
  'Asking for money',
  'Harassment',
  'Spam/Duplicate',
  'Inappropriate communication',
  'Other',
];

const STARTUP_REASONS = [
  'Fake profile',
  'Misrepresentation of skills',
  'Scam/Fraud',
  'Spam',
  'Harassment',
  'Inappropriate communication',
  'Other',
];

export default function ReportModal({ open, onClose, reportedUserId, reportedRole, jobId }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  if (!open) return null;

  const reasons = reportedRole === 'startup' ? FREELANCER_REASONS : STARTUP_REASONS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setFeedback({ type: 'error', text: 'Please select a reason.' });
      return;
    }
    setSubmitting(true);
    setFeedback({ type: '', text: '' });
    try {
      await api.post('/reports', {
        reportedUserId,
        reason,
        description,
        jobId: jobId || null,
      });
      setFeedback({ type: 'success', text: 'Report submitted successfully.' });
      setTimeout(() => {
        setReason('');
        setDescription('');
        setFeedback({ type: '', text: '' });
        onClose();
      }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to submit report.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Report User</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {reportedRole === 'startup' ? 'Reporting this startup opportunity' : 'Reporting this freelancer profile'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Reason</div>
            <div className="grid grid-cols-1 gap-1.5">
              {reasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    reason === r
                      ? 'bg-indigo-950/60 border-indigo-700/70 text-indigo-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-indigo-500"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Description (optional)</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell us more about the issue..."
              className="w-full text-xs p-3 rounded-xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>

          {feedback.text && (
            <div
              className={`p-3 text-xs rounded-xl font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/25 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}