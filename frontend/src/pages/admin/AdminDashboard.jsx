import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStartups: 0,
    totalInvestors: 0,
    totalFreelancers: 0,
    pendingVerifications: 0,
    blockedUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/dashboard').catch(() => ({
          data: { stats: {}, recentUsers: [] },
        }));
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.recentUsers) setRecentUsers(res.data.recentUsers);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Platform Overview</h2>
        <p className="text-xs text-slate-400 mt-0.5">Real-time metrics, user growth, and compliance queue.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition"></div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">{stats.totalUsers || 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition"></div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Startups</div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2 tracking-tight">{stats.totalStartups || 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Investors</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 tracking-tight">{stats.totalInvestors || 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition"></div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Freelancers</div>
          <div className="text-3xl font-extrabold text-purple-400 mt-2 tracking-tight">{stats.totalFreelancers || 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition"></div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Verifications</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2 tracking-tight">{stats.pendingVerifications || 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition"></div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blocked Users</div>
          <div className="text-3xl font-extrabold text-rose-400 mt-2 tracking-tight">{stats.blockedUsers || 0}</div>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent User Registrations</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentUsers.map((u, idx) => (
                <tr key={u._id || idx} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 font-medium text-white">{u.name}</td>
                  <td className="py-3.5 text-slate-400">{u.email}</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border shadow-sm ${
                      u.role === 'startup' ? 'bg-indigo-950/60 text-indigo-400 border-indigo-900/80' :
                      u.role === 'investor' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80' :
                      'bg-purple-950/60 text-purple-400 border-purple-900/80'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-400">{new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500">
                    No recent user registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}