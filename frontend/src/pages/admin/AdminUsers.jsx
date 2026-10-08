import React, { useState } from 'react';
import api from '../../services/api';
import usePagedList from '../../hooks/usePagedList';
import Pagination from '../../components/Pagination';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  // The search term actually sent to the server. Kept separate from the input so
  // that typing doesn't fire a request on every keystroke.
  const [appliedSearch, setAppliedSearch] = useState('');
  const [role, setRole] = useState('all');

  const { items: users, pagination, loading, setPage, setLimit, reload, resetPage } = usePagedList(
    async (page, limit) => {
      const params = new URLSearchParams();
      if (appliedSearch) params.set('search', appliedSearch);
      if (role !== 'all') params.set('role', role);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await api.get(`/admin/users?${params.toString()}`);
      const data = res.data || {};
      const list = Array.isArray(data) ? data : data.users || [];
      return { items: list, pagination: data.pagination };
    },
    [appliedSearch, role]
  );

  // Reset to page 1 whenever the result set itself changes, otherwise you land
  // on an out-of-range page and see an empty table.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    resetPage();
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    resetPage();
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setRole('all');
    resetPage();
  };

  const handleToggleBlock = async (user) => {
    const action = user.isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    try {
      await api.patch(`/admin/users/${user._id}/${action}`);
      // Refetch rather than patch local state: the row may move to another page
      // once re-sorted, and the server owns the real totals.
      reload();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently? This will remove all their profiles.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      // Refetch instead of splicing locally: the server owns the real total, and
      // this page may now be past the end.
      reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Users Management</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage platform accounts, roles, and user access status.
        </p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 w-full sm:w-80 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          <button type="submit" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-3 rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition">
            Search
          </button>
        </form>

        <select
          value={role}
          onChange={handleRoleChange}
          className="w-full sm:w-48 bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
        >
          <option value="all">All Roles</option>
          <option value="startup">Startup</option>
          <option value="investor">Investor</option>
          <option value="freelancer">Freelancer</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No users found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Joined</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border shadow-sm ${
                        u.role === 'startup' ? 'bg-indigo-950/60 text-indigo-400 border-indigo-900/80' :
                        u.role === 'investor' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80' :
                        u.role === 'freelancer' ? 'bg-purple-950/60 text-purple-400 border-purple-900/80' :
                        'bg-amber-950/60 text-amber-400 border-amber-900/80'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isBlocked ? (
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-rose-950/60 text-rose-400 border border-rose-900/80 shadow-sm">Blocked</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-900/80 shadow-sm">Active</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {u.role !== 'admin' && (
                        <>
                          <button
                            onClick={() => handleToggleBlock(u)}
                            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold border transition shadow-sm ${
                              u.isBlocked 
                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/80 hover:bg-emerald-900/50' 
                                : 'bg-amber-950/40 text-amber-300 border-amber-900/80 hover:bg-amber-900/50'
                            }`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={setLimit}
          disabled={loading}
          label="users"
        />
      )}
    </div>
  );
}
