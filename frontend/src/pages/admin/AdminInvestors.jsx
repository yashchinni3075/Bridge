import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminInvestors() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/investors').catch(() => ({ data: { investors: [] } }));
      setInvestors(res.data.investors || res.data || []);
    } catch (err) {
      console.error('Failed to load investors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const handleToggleStatus = async (id, currentIsActive) => {
    try {
      await api.patch(`/admin/investors/${id}/status`, { isActive: !currentIsActive });
      fetchInvestors();
    } catch (err) {
      alert('Failed to update investor status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Investors Directory</h2>
        <p className="text-xs text-slate-400 mt-0.5">Review registered investment firms, check sizes, and profiles.</p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading investors...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-4 font-semibold">Investor / Firm</th>
                  <th className="pb-3 px-4 font-semibold">Organization</th>
                  <th className="pb-3 px-4 font-semibold">Ticket Size</th>
                  <th className="pb-3 px-4 font-semibold">Status</th>
                  <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {investors.map((inv) => {
                  const isActive = inv.isActive !== false;
                  return (
                    <tr key={inv._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div>{inv.name || inv.userId?.name}</div>
                        <div className="text-[10px] text-slate-400">{inv.userId?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{inv.firmName || inv.organization || 'Independent'}</td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-400">
                        ${inv.minCheckSize || 0} - ${inv.maxCheckSize || 'Uncapped'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border shadow-sm ${
                          isActive ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80' : 'bg-rose-950/60 text-rose-400 border-rose-900/80'
                        }`}>
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(inv._id, isActive)}
                          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold border transition shadow-sm ${
                            isActive ? 'bg-rose-950/40 text-rose-300 border-rose-900/80 hover:bg-rose-900/50' : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/80 hover:bg-emerald-900/50'
                          }`}
                        >
                          {isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {investors.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      No investors registered in the system.
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