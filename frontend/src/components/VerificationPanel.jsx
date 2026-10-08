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

  if (loading) return null;

  const status = data?.status || 'not_submitted';

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

    </div>
  );
}
