import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminStartups() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStartups = async () => {
    try {
      const res = await api.get('/admin/startups');
      setStartups(res.data.startups || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/startups/${id}/approve`);
      setStartups((prev) =>
        prev.map((s) => (s._id === id ? { ...s, verificationStatus: 'verified' } : s))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/admin/startups/${id}/reject`);
      setStartups((prev) =>
        prev.map((s) => (s._id === id ? { ...s, verificationStatus: 'rejected' } : s))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Startups Directory</h2>
        <p className="text-xs text-slate-400 mt-0.5">Review registered startups, funding goals, and verification statuses.</p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading startups...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-4 font-semibold">Startup</th>
                  <th className="pb-3 px-4 font-semibold">Founder</th>
                  <th className="pb-3 px-4 font-semibold">Industry / Stage</th>
                  <th className="pb-3 px-4 font-semibold">Funding Goal</th>
                  <th className="pb-3 px-4 font-semibold">Status</th>
                  <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {startups.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{s.startupName}</div>
                      {s.website && (
                        <a href={s.website} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline">
                          {s.website}
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white">{s.founderName}</div>
                      <div className="text-[10px] text-slate-400">{s.userId?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{s.industry || s.domain || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500">{s.startupStage || s.stage || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-400">
                      ${Number(s.fundingRequired || s.fundingGoal || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border shadow-sm ${
                          s.verificationStatus === 'verified'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80'
                            : s.verificationStatus === 'rejected'
                            ? 'bg-rose-950/60 text-rose-400 border-rose-900/80'
                            : 'bg-amber-950/60 text-amber-400 border-amber-900/80'
                        }`}
                      >
                        {s.verificationStatus || 'pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {s.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => handleApprove(s._id)}
                          className="px-3.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm"
                        >
                          Approve
                        </button>
                      )}
                      {s.verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => handleReject(s._id)}
                          className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {startups.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      No startups registered in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}