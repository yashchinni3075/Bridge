import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import Pagination from '../../../components/Pagination';

const FUNDING_TYPE_LABELS = {
  equity: 'Equity',
  debt: 'Debt',
  convertible_note: 'Convertible Note',
  safe: 'SAFE',
  grant: 'Grant',
  other: 'Other',
};

const STATUS_LABELS = {
  open: 'Open',
  closed: 'Closed',
  draft: 'Draft',
  funded: 'Funded',
};

const STATUS_COLORS = {
  open: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80',
  closed: 'bg-slate-950/60 text-slate-400 border-slate-900/80',
  draft: 'bg-amber-950/60 text-amber-400 border-amber-900/80',
  funded: 'bg-blue-950/60 text-blue-400 border-blue-900/80',
};

export default function FundRaiseDashboard() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState({ totalOpportunities: 0, openOpportunities: 0, totalInterests: 0, committedAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // The opportunity list is paginated server-side. The headline stats come from
  // /funding/stats, which counts every row regardless of the current page.
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState(null);

  const fetchData = async (targetPage = page, targetLimit = limit) => {
    try {
      setLoading(true);
      const [oppsRes, statsRes] = await Promise.all([
        api.get('/funding', { params: { page: targetPage, limit: targetLimit } }),
        api.get('/funding/stats'),
      ]);
      setOpportunities(oppsRes.data.opportunities || []);
      setPagination(oppsRes.data.pagination || null);
      setPage(targetPage);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      console.error('Error loading funding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this funding opportunity? This action cannot be undone.')) return;
    try {
      setActionLoadingId(id);
      await api.delete(`/funding/${id}`);
      // Refetch rather than splicing locally: deleting the last row of the final
      // page would otherwise leave the user on an empty page.
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete opportunity');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (opportunity) => {
    const closing = opportunity.status === 'open';
    if (closing && !window.confirm('Close this round? Investors will no longer be able to express interest.')) return;

    const nextStatus = closing ? 'closed' : 'open';
    try {
      setActionLoadingId(opportunity._id);
      await api.put(`/funding/${opportunity._id}`, { status: nextStatus });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${closing ? 'close' : 'reopen'} opportunity`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (opportunity) => {
    try {
      const { _id, createdAt, updatedAt, interestsCount, committedAmount, ...rest } = opportunity;
      await api.post('/funding', { ...rest, title: `${rest.title} (Copy)`, status: 'draft' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to duplicate opportunity');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Raise Funds</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Raise Funds</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage your funding rounds and track investor interest.</p>
        </div>
        <Link
          to="/startup-dashboard/funding/create"
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 transition self-start"
        >
          + Create Funding Opportunity
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Opportunities</div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">{stats.totalOpportunities || 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Rounds</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 tracking-tight">{stats.openOpportunities || 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Investor Interest</div>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2 tracking-tight">{stats.totalInterests || 0}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Committed Capital</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 tracking-tight">{formatCurrency(stats.committedAmount)}</div>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Funding Opportunities</h3>
        {opportunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-xs text-slate-400 mb-4">No funding opportunities created yet.</p>
            <Link
              to="/startup-dashboard/funding/create"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
            >
              Create Your First Round
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div key={opp._id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link to={`/startup-dashboard/funding/${opp._id}`} className="text-sm font-bold text-white tracking-tight hover:text-indigo-400 transition">
                      {opp.title}
                    </Link>
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[opp.status] || STATUS_COLORS.open}`}>
                      {STATUS_LABELS[opp.status] || opp.status}
                    </span>
                    <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-slate-950/60 text-slate-400 border-slate-900/80">
                      {FUNDING_TYPE_LABELS[opp.fundingType] || opp.fundingType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{opp.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">💰 Raising: <span className="text-slate-300 font-medium">{formatCurrency(opp.amountRaising?.min)}</span></span>
                    {opp.equityOffered > 0 && (
                      <span className="flex items-center gap-1">📊 Equity: <span className="text-slate-300 font-medium">{opp.equityOffered}%</span></span>
                    )}
                    <span className="flex items-center gap-1">👥 Interest: <span className="text-indigo-400 font-medium">{opp.interestsCount || 0}</span></span>
                    <span className="flex items-center gap-1">✅ Committed: <span className="text-emerald-400 font-medium">{formatCurrency(opp.committedAmount)}</span></span>
                    {opp.closingDate && (
                      <span className="flex items-center gap-1">📅 Closes: <span className="text-slate-300 font-medium">{new Date(opp.closingDate).toLocaleDateString()}</span></span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    to={`/startup-dashboard/funding/${opp._id}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-semibold transition"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/startup-dashboard/funding/${opp._id}/edit`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-semibold transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(opp)}
                    disabled={actionLoadingId === opp._id}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition disabled:opacity-50 ${
                      opp.status === 'open'
                        ? 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-900/80'
                        : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-900/80'
                    }`}
                  >
                    {opp.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                  <button
                    onClick={() => handleDuplicate(opp)}
                    disabled={actionLoadingId === opp._id}
                    className="px-3 py-1.5 bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 border border-violet-800/60 rounded-xl text-[10px] font-semibold transition disabled:opacity-50"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(opp._id)}
                    disabled={actionLoadingId === opp._id}
                    className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[10px] font-semibold transition disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination footer - hidden on the first load so the totals never
            flash "0 opportunities" before the response lands. */}
        {pagination && pagination.total > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={(n) => {
              setLimit(n);
              setPage(1);
            }}
            disabled={loading}
            label="opportunities"
          />
        )}
      </div>
    </div>
  );
}