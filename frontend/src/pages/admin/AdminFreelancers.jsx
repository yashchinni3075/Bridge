import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminFreelancers() {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/freelancers');
      setFreelancers(res.data.freelancers || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const handleToggleBlock = async (userId, currentlyBlocked) => {
    const action = currentlyBlocked ? 'unblock' : 'block';
    try {
      await api.patch(`/admin/users/${userId}/${action}`);
      setFreelancers((prev) =>
        prev.map((f) => {
          const targetId = f.userId?._id || f.userId;
          if (targetId === userId) {
            const updatedUser = typeof f.userId === 'object' 
              ? { ...f.userId, isBlocked: !currentlyBlocked }
              : { _id: f.userId, isBlocked: !currentlyBlocked };
            return { ...f, userId: updatedUser };
          }
          return f;
        })
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Freelancers Directory</h2>
        <p className="text-xs text-slate-400 mt-0.5">Review registered technical contributors, skill sets, and account status.</p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading freelancers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-4 font-semibold">Freelancer</th>
                  <th className="pb-3 px-4 font-semibold">Skills</th>
                  <th className="pb-3 px-4 font-semibold">Availability</th>
                  <th className="pb-3 px-4 font-semibold">Account Status</th>
                  <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {freelancers.map((f) => {
                  const isBlocked = f.userId?.isBlocked;
                  const userIdVal = f.userId?._id || f.userId;

                  return (
                    <tr key={f._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{f.name}</div>
                        <div className="text-[10px] text-slate-400">{f.userId?.email || 'No email linked'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {Array.isArray(f.skills) && f.skills.length > 0 ? f.skills.join(', ') : 'None listed'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{f.availability || 'Not Specified'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border shadow-sm ${
                          isBlocked ? 'bg-rose-950/60 text-rose-400 border-rose-900/80' : 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80'
                        }`}>
                          {isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleBlock(userIdVal, isBlocked)}
                          className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold border transition shadow-sm ${
                            isBlocked
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/80 hover:bg-emerald-900/50'
                              : 'bg-amber-950/40 text-amber-300 border-amber-900/80 hover:bg-amber-900/50'
                          }`}
                        >
                          {isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {freelancers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500">
                      No freelancers registered in the system.
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