import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';

export default function HiringDashboard() {
  const navigate = useNavigate();
  const [hirings, setHirings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);

  const fetchHirings = async (targetPage = page, targetLimit = limit) => {
    try {
      setLoading(true);
      const params = { page: targetPage, limit: targetLimit };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/startup-hiring', { params });
      setHirings(res.data.hirings || []);

      const meta = res.data.pagination || null;
      setPagination(meta);
      // Deleting or closing can remove the last row on the final page, which
      // would otherwise leave an empty table on a now out-of-range page.
      if (meta && meta.totalPages >= 1 && targetPage > meta.totalPages) {
        setPage(meta.totalPages);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load hiring records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHirings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, limit]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hiring opening? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      await api.delete(`/startup-hiring/${id}`);
      // Refetch rather than splicing locally: the server owns the real total, and
      // this page may now be past the end.
      await fetchHirings();
      setFeedback({ type: 'success', text: 'Hiring opening deleted.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to delete.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseHiring = async (id) => {
    if (!window.confirm('Are you sure you want to close this hiring opening?')) return;
    try {
      setClosingId(id);
      await api.put(`/startup-hiring/${id}`, { status: 'closed' });
      setHirings((prev) => prev.map((h) => (h._id === id ? { ...h, status: 'closed' } : h)));
      setFeedback({ type: 'success', text: 'Hiring opening closed.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to close.' });
    } finally {
      setClosingId(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The result set itself changed, so page 1 is the only valid page.
    setPage(1);
    fetchHirings(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80';
      case 'closed':
        return 'bg-rose-950/60 text-rose-400 border-rose-900/80';
      case 'draft':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'draft', label: 'Draft' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Hiring</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage your startup's hiring openings and job postings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/startup-dashboard/hiring/create"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 transform hover:-translate-y-0.5 self-start"
          >
            + Create Hiring
          </Link>
          <Link
            to="/startup-dashboard/hiring/match"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-800/60 rounded-2xl text-xs font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 self-start"
          >
            ⚡ Match Freelancers
          </Link>
          <Link
            to="/startup-dashboard/applications"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-800/60 rounded-2xl text-xs font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 self-start"
          >
            📥 Applications
          </Link>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`p-4 text-xs rounded-2xl font-medium shadow-inner ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
          }`}
        >
          {feedback.text}
          <button onClick={() => setFeedback({ type: '', text: '' })} className="ml-3 underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                // The filter changes which rows match, so return to page 1.
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                filter === f.value
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job title, domain, location..."
            className="flex-1 text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-400">Loading hiring records...</p>
        </div>
      ) : hirings.length === 0 ? (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center font-bold text-xl mb-4">
            📋
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {filter !== 'all'
              ? 'No hiring records found with this status.'
              : 'No hiring openings yet. Click "+ Create Hiring" to post your first opening.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {hirings.map((h) => (
            <div
              key={h._id}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-bold text-white tracking-tight">{h.jobTitle}</h3>
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${statusColor(h.status)}`}>
                      {h.status}
                    </span>
                    {h.jobDescriptionPdf?.fileUrl && (
                      <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-indigo-950/60 text-indigo-400 border-indigo-900/80">
                        PDF Attached
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium">
                    <span>{h.vacancies} {h.vacancies === 1 ? 'Vacancy' : 'Vacancies'}</span>
                    {h.salary?.min || h.salary?.max ? (
                      <span>
                        {h.salary.currency === 'INR' ? '₹' : '$'}
                        {h.salary.min?.toLocaleString('en-IN')} - {h.salary.max?.toLocaleString('en-IN')}
                      </span>
                    ) : null}
                    <span>{h.employmentType}</span>
                    {h.location && <span>{h.location}</span>}
                    {h.experienceRequired && <span>Exp: {h.experienceRequired}</span>}
                    {h.domain && <span className="text-indigo-400">{h.domain}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Created: {formatDate(h.createdAt)}
                    {h.closingDate && <span className="ml-3">Closing: {formatDate(h.closingDate)}</span>}
                    <span className="ml-3">Applications: {h.applicationsCount || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start lg:self-auto flex-shrink-0">
                  <button
                    onClick={() => navigate(`/startup-dashboard/hiring/${h._id}`)}
                    className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-900/80 rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/startup-dashboard/hiring/${h._id}/edit`)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/startup-dashboard/hiring/${h._id}/match`)}
                    className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-900/80 rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    ⚡ Match Freelancers
                  </button>
                  {h.status !== 'closed' && (
                    <button
                      onClick={() => handleCloseHiring(h._id)}
                      disabled={closingId === h._id}
                      className="px-4 py-2 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-900/80 rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50"
                    >
                      {closingId === h._id ? 'Closing...' : 'Close'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(h._id)}
                    disabled={deletingId === h._id}
                    className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50"
                  >
                    {deletingId === h._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination footer - hidden on the first load so the totals never flash
          "0 openings" before the response lands. */}
      {pagination && pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setLimit(n);
            setPage(1);
          }}
          disabled={loading}
          label="openings"
        />
      )}
    </div>
  );
}