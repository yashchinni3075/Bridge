import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';

const INTEREST_STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  negotiating: 'Negotiating',
};

const INTEREST_STATUS_COLORS = {
  pending: 'bg-amber-950/60 text-amber-400 border-amber-900/80',
  accepted: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80',
  rejected: 'bg-rose-950/60 text-rose-400 border-rose-900/80',
  withdrawn: 'bg-slate-950/60 text-slate-400 border-slate-900/80',
  negotiating: 'bg-violet-950/60 text-violet-400 border-violet-900/80',
};

const FUNDING_TYPE_LABELS = {
  equity: 'Equity',
  debt: 'Debt',
  convertible_note: 'Convertible Note',
  safe: 'SAFE',
  grant: 'Grant',
  other: 'Other',
};

export default function MyFundingInterests() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    pages: 0,
    hasPrevPage: false,
    hasNextPage: false,
  });
  const [filterStatus, setFilterStatus] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(null);
  const [noteForm, setNoteForm] = useState({ investorNote: '' });

  const fetchInterests = async (targetPage = 1, targetLimit = pagination.limit) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      params.append('page', targetPage);
      params.append('limit', targetLimit);

      const res = await api.get(`/funding/my-interests?${params.toString()}`);
      setInterests(res.data.interests || []);
      setPagination(prev => ({ ...prev, ...res.data.pagination, page: targetPage }));
    } catch (err) {
      console.error('Error fetching my interests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests(1);
  }, [filterStatus]);

  const handleWithdraw = async (interestId) => {
    if (!window.confirm('Are you sure you want to withdraw your interest?')) return;
    try {
      setActionLoadingId(interestId);
      await api.patch(`/funding/interests/${interestId}`, { status: 'withdrawn' });
      setInterests(prev => prev.map(i => i._id === interestId ? { ...i, status: 'withdrawn' } : i));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw interest');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateNote = async (interestId) => {
    try {
      setActionLoadingId(interestId);
      await api.patch(`/funding/interests/${interestId}`, { investorNote: noteForm.investorNote });
      setInterests(prev => prev.map(i => i._id === interestId ? { ...i, investorNote: noteForm.investorNote } : i));
      setShowNoteModal(null);
      setNoteForm({ investorNote: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update note');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenNoteModal = (interest) => {
    setShowNoteModal(interest);
    setNoteForm({ investorNote: interest.investorNote || '' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">My Funding Interests</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track your expressed interest in funding opportunities.</p>
        </div>
        <Link
          to="/investor-dashboard/funding"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl text-xs font-semibold transition self-start"
        >
          ← Discover Funding
        </Link>
      </div>

      {/* Status Filter */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-xl">
        <div className="flex flex-wrap gap-2">
          {['', 'pending', 'accepted', 'rejected', 'withdrawn', 'negotiating'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Interests List */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Interests ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 h-32"></div>
            ))}
          </div>
        ) : interests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-xs text-slate-400">No funding interests found.</p>
            <p className="text-[10px] text-slate-500 mt-1">Start browsing funding opportunities to express interest.</p>
            <Link
              to="/investor-dashboard/funding"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition mt-4"
            >
              Browse Opportunities
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {interests.map((interest) => {
              const opp = interest.fundingOpportunityId;
              const startup = interest.startupProfileId || interest.startupUserId;
              const isLoading = actionLoadingId === interest._id;
              return (
                <div key={interest._id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <Link to={`/investor-dashboard/funding/${opp?._id}`} className="text-sm font-bold text-white tracking-tight hover:text-indigo-400 transition">
                        {opp?.title || 'Loading...'}
                      </Link>
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${INTEREST_STATUS_COLORS[interest.status] || INTEREST_STATUS_COLORS.pending}`}>
                        {INTEREST_STATUS_LABELS[interest.status] || interest.status}
                      </span>
                      {opp && (
                        <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-slate-950/60 text-slate-400 border-slate-900/80">
                          {FUNDING_TYPE_LABELS[opp.fundingType] || opp.fundingType}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-slate-500">
                      {opp && (
                        <>
                          <span className="flex items-center gap-1">💰 Raising: <span className="text-slate-300 font-medium">{formatCurrency(opp.amountRaising?.min)} - {formatCurrency(opp.amountRaising?.max)}</span></span>
                          <span className="flex items-center gap-1">📊 Equity: <span className="text-slate-300 font-medium">{opp.equityOffered || 0}%</span></span>
                          <span className="flex items-center gap-1">🏢 <span className="text-slate-300 font-medium">{opp.startupInfo?.industry || 'N/A'}</span></span>
                          <span className="flex items-center gap-1">📈 <span className="text-slate-300 font-medium">{opp.startupInfo?.stage || 'N/A'}</span></span>
                        </>
                      )}
                      <span className="flex items-center gap-1">💼 Your Check: <span className="text-indigo-400 font-medium">{formatCurrency(interest.checkSize?.min)} - {formatCurrency(interest.checkSize?.max)}</span></span>
                      <span className="flex items-center gap-1">📊 Your Equity: <span className="text-indigo-400 font-medium">{interest.equityRequested || 0}%</span></span>
                      {interest.timeline && <span className="flex items-center gap-1">📅 Timeline: <span className="text-slate-300 font-medium">{interest.timeline}</span></span>}
                      <span className="flex items-center gap-1">📝 Submitted: <span className="text-slate-300 font-medium">{new Date(interest.createdAt).toLocaleDateString()}</span></span>
                    </div>
                    {startup && startup.startupName && (
                      <p className="text-[10px] text-slate-500 mt-1">Startup: {startup.startupName}</p>
                    )}
                    {interest.message && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mt-3">
                        <p className="text-[10px] text-slate-400 mb-1">Your Message:</p>
                        <p className="text-xs text-slate-300">{interest.message}</p>
                      </div>
                    )}
                    {interest.proposedTerms && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mt-3">
                        <p className="text-[10px] text-slate-400 mb-1">Proposed Terms:</p>
                        <p className="text-xs text-slate-300">{interest.proposedTerms}</p>
                      </div>
                    )}
                    {interest.investorNote && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mt-3">
                        <p className="text-[10px] text-slate-400 mb-1">Your Notes:</p>
                        <p className="text-xs text-slate-300">{interest.investorNote}</p>
                      </div>
                    )}
                    {interest.startupResponse && (
                      <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 mt-3">
                        <p className="text-[10px] text-emerald-400 mb-1">Startup Response:</p>
                        <p className="text-xs text-emerald-300">{interest.startupResponse}</p>
                        {interest.committedAmount && (
                          <p className="text-[10px] text-emerald-400 mt-1">Committed: {formatCurrency(interest.committedAmount)}</p>
                        )}
                        {interest.equityAgreed && (
                          <p className="text-[10px] text-emerald-400 mt-1">Equity Agreed: {interest.equityAgreed}%</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 self-start sm:self-auto">
                    {interest.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleWithdraw(interest._id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[10px] font-semibold transition disabled:opacity-50 w-full"
                        >
                          Withdraw
                        </button>
                        <button
                          onClick={() => handleOpenNoteModal(interest)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-semibold transition w-full"
                        >
                          Add Note
                        </button>
                      </>
                    )}

                    {interest.status === 'negotiating' && (
                      <button
                        onClick={() => handleOpenNoteModal(interest)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-semibold transition w-full"
                      >
                        Update Note
                      </button>
                    )}

                    <Link
                      to={`/investor-dashboard/funding/${opp?._id}`}
                      className="px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/60 rounded-xl text-[10px] font-semibold transition text-center"
                    >
                      View Opportunity
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination footer - hidden on the first load so the totals never flash
          "0 interests" before the response lands. */}
      {pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={(n) => fetchInterests(n)}
          onLimitChange={(n) => fetchInterests(1, n)}
          disabled={loading}
          label="interests"
        />
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-200">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Add/Update Note</h3>
            <p className="text-xs text-slate-400 mb-4">Opportunity: <span className="text-slate-300 font-medium">{showNoteModal.fundingOpportunityId?.title || 'Loading...'}</span></p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateNote(showNoteModal._id); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Private Note</label>
                <textarea
                  value={noteForm.investorNote}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, investorNote: e.target.value }))}
                  rows={4}
                  placeholder="Add private notes about this opportunity..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowNoteModal(null); setNoteForm({ investorNote: '' }); }}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  disabled={actionLoadingId === showNoteModal._id}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                  disabled={actionLoadingId === showNoteModal._id}
                >
                  {actionLoadingId === showNoteModal._id ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}