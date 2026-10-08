import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

export default function FundingOpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showRespondModal, setShowRespondModal] = useState(null);
  const [respondForm, setRespondForm] = useState({ status: '', startupResponse: '', committedAmount: '', equityAgreed: '' });
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  const [interestsPage, setInterestsPage] = useState(1);
  const [interestsLimit, setInterestsLimit] = useState(10);
  const [interestsPagination, setInterestsPagination] = useState(null);

  const fetchData = async (targetPage = interestsPage, targetLimit = interestsLimit) => {
    try {
      setLoading(true);
      const [oppRes, interestsRes] = await Promise.all([
        api.get(`/funding/${id}`),
        api.get(`/funding/${id}/interests`, { params: { page: targetPage, limit: targetLimit } }),
      ]);
      setOpportunity(oppRes.data.opportunity);
      setInterests(interestsRes.data.interests || []);
      setInterestsPagination(interestsRes.data.pagination || null);
    } catch (err) {
      console.error('Error loading opportunity:', err);
      navigate('/startup-dashboard/funding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, interestsPage, interestsLimit]);

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const handleRespondOpen = (interest, initialStatus = 'accepted') => {
    setShowRespondModal(interest);
    setRespondForm({
      status: initialStatus,
      startupResponse: '',
      committedAmount: interest.checkSize?.max || interest.checkSize?.min || '',
      equityAgreed: interest.equityRequested || '',
    });
  };

  const handleRespondClose = () => {
    setShowRespondModal(null);
    setRespondForm({ status: '', startupResponse: '', committedAmount: '', equityAgreed: '' });
  };

  const handleRespondSubmit = async (e) => {
    e.preventDefault();
    if (!showRespondModal) return;

    const interestId = showRespondModal._id;
    setActionLoadingId(interestId);

    try {
      await api.patch(`/funding/interests/${interestId}/respond`, respondForm);
      setFeedback({ type: 'success', text: `Interest ${respondForm.status} successfully!` });
      
      // Update local state
      setInterests(prev => prev.map(i => 
        i._id === interestId ? { ...i, status: respondForm.status, startupResponse: respondForm.startupResponse, respondedAt: new Date().toISOString(), committedAmount: respondForm.committedAmount ? Number(respondForm.committedAmount) : 0, equityAgreed: respondForm.equityAgreed ? Number(respondForm.equityAgreed) : 0 } : i
      ));
      
      if (opportunity) {
        setOpportunity(prev => prev ? { ...prev, interestsCount: prev.interestsCount - 1 } : null);
      }
      
      handleRespondClose();
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to respond' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateOpportunity = async (updates) => {
    try {
      await api.put(`/funding/${id}`, updates);
      setOpportunity(prev => prev ? { ...prev, ...updates } : null);
      setFeedback({ type: 'success', text: 'Opportunity updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update' });
    }
  };

  const handleCloseOpportunity = () => {
    if (!window.confirm('Close this funding opportunity? Investors will no longer be able to express interest.')) return;
    handleUpdateOpportunity({ status: 'closed' });
  };

  const handleReopenOpportunity = () => {
    handleUpdateOpportunity({ status: 'open' });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this funding opportunity? This action cannot be undone and will also remove all investor interests.')) return;
    try {
      await api.delete(`/funding/${id}`);
      navigate('/startup-dashboard/funding');
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to delete' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="h-64 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center py-12">
          <p className="text-slate-400">Funding opportunity not found</p>
          <Link to="/startup-dashboard/funding" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold mt-4 inline-block">← Back to Funding</Link>
        </div>
      </div>
    );
  }

  const currentUserId = JSON.parse(localStorage.getItem('bridge_user') || 'null')?._id?.toString();
  const isOwner = opportunity.userId?.toString() === currentUserId;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/startup-dashboard/funding"
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition"
          >
            ←
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{opportunity.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {opportunity.closingDate
                ? `Open until ${new Date(opportunity.closingDate).toLocaleDateString()}`
                : 'Open round'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[opportunity.status] || STATUS_COLORS.open}`}>
            {STATUS_LABELS[opportunity.status] || opportunity.status}
          </span>
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border bg-slate-950/60 text-slate-400 border-slate-900/80">
            {FUNDING_TYPE_LABELS[opportunity.fundingType] || opportunity.fundingType}
          </span>
          {isOwner && (
            <>
              <Link
                to={`/startup-dashboard/funding/${id}/edit`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-semibold transition"
              >
                Edit
              </Link>
              <button
                onClick={opportunity.status === 'open' ? handleCloseOpportunity : handleReopenOpportunity}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold transition ${
                  opportunity.status === 'open'
                    ? 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-900/80'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-900/80'
                }`}
              >
                {opportunity.status === 'open' ? 'Close' : 'Reopen'}
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[10px] font-semibold transition"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/80'
            : 'bg-rose-950/60 text-rose-400 border border-rose-900/80'
        }`}>
          {feedback.text}
        </div>
      )}

      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 text-xs font-semibold ${
            activeTab === 'details'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('interests')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 text-xs font-semibold ${
            activeTab === 'interests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Investor Interest
          {(interestsPagination?.total ?? interests.length) > 0 && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              {interestsPagination?.total ?? interests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Raising</div>
              <div className="text-2xl font-extrabold text-white mt-2 tracking-tight">
                {formatCurrency(opportunity.amountRaising?.min)}
              </div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Investor Interest</div>
              <div className="text-2xl font-extrabold text-indigo-400 mt-2 tracking-tight">{opportunity.interestsCount || 0}</div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Committed</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-2 tracking-tight">{formatCurrency(opportunity.committedAmount)}</div>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 mb-4">About This Round</h3>
            <p className="text-xs text-slate-300 whitespace-pre-wrap">{opportunity.description || 'No description provided.'}</p>
            {opportunity.closingDate && (
              <p className="text-[10px] text-slate-500 mt-4">
                Open until {new Date(opportunity.closingDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {(opportunity.useOfFunds || opportunity.milestones?.length) && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 mb-4">Use of Funds</h3>
              {opportunity.useOfFunds && (
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{opportunity.useOfFunds}</p>
              )}
              {opportunity.milestones?.length > 0 && (
                <ul className="space-y-2 mt-4">
                  {opportunity.milestones.map((m, i) => (
                    <li key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{m.title}</span>
                      <span className="text-slate-500">
                        {m.targetDate ? new Date(m.targetDate).toLocaleDateString() : ''}
                        {m.targetDate && m.amount ? ' · ' : ''}
                        {m.amount ? formatCurrency(m.amount) : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {opportunity.startupInfo && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3 mb-4">Startup</h3>
              <div className="space-y-2 text-xs">
                <div><span className="text-slate-400">Name:</span> <span className="text-slate-300 ml-2">{opportunity.startupInfo.startupName || '-'}</span></div>
                <div><span className="text-slate-400">Industry:</span> <span className="text-slate-300 ml-2">{opportunity.startupInfo.industry || '-'}</span></div>
                <div><span className="text-slate-400">Stage:</span> <span className="text-slate-300 ml-2">{opportunity.startupInfo.stage || '-'}</span></div>
                <div><span className="text-slate-400">Location:</span> <span className="text-slate-300 ml-2">{opportunity.startupInfo.location || '-'}</span></div>
                {opportunity.startupInfo.website && (
                  <div>
                    <span className="text-slate-400">Website:</span>
                    <a href={opportunity.startupInfo.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 ml-2">
                      {opportunity.startupInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'interests' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Investor Interest ({interestsPagination?.total ?? interests.length})</h3>
            {interests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🤝</div>
                <p className="text-xs text-slate-400">No investor interest received yet.</p>
                <p className="text-[10px] text-slate-500 mt-1">Share your funding opportunity with investors to start receiving interest.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interests.map((interest) => (
                  <div key={interest._id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white">
                          {interest.investorUserId?.name?.[0] || interest.investorUserId?.email?.[0] || 'I'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{interest.investorUserId?.name || 'Investor'}</h4>
                          <p className="text-[10px] text-slate-400">{interest.investorUserId?.email || ''}</p>
                          {interest.investorProfileId?.firmName && (
                            <p className="text-[10px] text-slate-500">{interest.investorProfileId.firmName}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border self-start ${INTEREST_STATUS_COLORS[interest.status] || INTEREST_STATUS_COLORS.pending}`}>
                        {INTEREST_STATUS_LABELS[interest.status] || interest.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[10px] mb-3">
                      <div className="bg-slate-950/60 rounded-xl p-3">
                        <span className="text-slate-500">Check Size</span>
                        <p className="text-slate-300 font-medium mt-0.5">
                          {formatCurrency(interest.checkSize?.min)} - {formatCurrency(interest.checkSize?.max)}
                        </p>
                      </div>
                      <div className="bg-slate-950/60 rounded-xl p-3">
                        <span className="text-slate-500">Equity Requested</span>
                        <p className="text-slate-300 font-medium mt-0.5">{interest.equityRequested || 0}%</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-xl p-3">
                        <span className="text-slate-500">Timeline</span>
                        <p className="text-slate-300 font-medium mt-0.5">{interest.timeline || 'Not specified'}</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-xl p-3">
                        <span className="text-slate-500">Submitted</span>
                        <p className="text-slate-300 font-medium mt-0.5">{new Date(interest.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {interest.message && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-3">
                        <p className="text-[10px] text-slate-400 mb-1">Message:</p>
                        <p className="text-xs text-slate-300">{interest.message}</p>
                      </div>
                    )}

                    {interest.proposedTerms && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-3">
                        <p className="text-[10px] text-slate-400 mb-1">Proposed Terms:</p>
                        <p className="text-xs text-slate-300">{interest.proposedTerms}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {interest.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleRespondOpen(interest, 'accepted')}
                            disabled={actionLoadingId === interest._id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-semibold transition disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondOpen(interest, 'negotiating')}
                            disabled={actionLoadingId === interest._id}
                            className="px-3 py-1.5 bg-violet-950/40 hover:bg-violet-900/50 text-violet-300 border border-violet-800/60 rounded-xl text-[10px] font-semibold transition disabled:opacity-50"
                          >
                            Negotiate
                          </button>
                          <button
                            onClick={() => handleRespondOpen(interest, 'rejected')}
                            disabled={actionLoadingId === interest._id}
                            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[10px] font-semibold transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {interest.status === 'negotiating' && (
                        <>
                          <button
                            onClick={() => handleRespondOpen(interest, 'accepted')}
                            disabled={actionLoadingId === interest._id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-semibold transition disabled:opacity-50"
                          >
                            Accept Terms
                          </button>
                          <button
                            onClick={() => handleRespondOpen(interest, 'rejected')}
                            disabled={actionLoadingId === interest._id}
                            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[10px] font-semibold transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {interest.status === 'accepted' && (
                        <span className="px-3 py-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-900/80 rounded-xl text-[10px] font-semibold">
                          Accepted - {formatCurrency(interest.committedAmount)} committed
                        </span>
                      )}

                      {interest.status === 'rejected' && (
                        <span className="px-3 py-1.5 bg-rose-950/60 text-rose-400 border border-rose-900/80 rounded-xl text-[10px] font-semibold">
                          Rejected
                        </span>
                      )}

                      {interest.status === 'withdrawn' && (
                        <span className="px-3 py-1.5 bg-slate-950/60 text-slate-400 border border-slate-900/80 rounded-xl text-[10px] font-semibold">
                          Withdrawn by Investor
                        </span>
                      )}

                      {interest.startupResponse && (
                        <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mt-2">
                          <p className="text-[10px] text-slate-400 mb-1">Your Response:</p>
                          <p className="text-xs text-slate-300">{interest.startupResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination footer - hidden on the first load so the totals never
                flash "0" before the response lands. */}
            {interestsPagination && interestsPagination.total > 0 && (
              <div className="mt-4">
                <Pagination
                  pagination={interestsPagination}
                  onPageChange={setInterestsPage}
                  onLimitChange={(n) => {
                    setInterestsLimit(n);
                    setInterestsPage(1);
                  }}
                  disabled={loading}
                  label="interests"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {showRespondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-200">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Respond to Investor Interest</h3>
            <p className="text-xs text-slate-400 mb-4">Investor: <span className="text-slate-300 font-medium">{showRespondModal.investorUserId?.name || 'Investor'}</span></p>
            
            <form onSubmit={handleRespondSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Response</label>
                <select
                  value={respondForm.status}
                  onChange={(e) => setRespondForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="accepted">Accept</option>
                  <option value="negotiating">Negotiate</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Response Message</label>
                <textarea
                  value={respondForm.startupResponse}
                  onChange={(e) => setRespondForm(prev => ({ ...prev, startupResponse: e.target.value }))}
                  rows={3}
                  placeholder="Explain your decision or outline next steps..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {(respondForm.status === 'accepted' || respondForm.status === 'negotiating') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Committed Amount (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={respondForm.committedAmount}
                      onChange={(e) => setRespondForm(prev => ({ ...prev, committedAmount: e.target.value }))}
                      placeholder="500000"
                      className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Equity Agreed (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={respondForm.equityAgreed}
                      onChange={(e) => setRespondForm(prev => ({ ...prev, equityAgreed: e.target.value }))}
                      placeholder="10"
                      className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRespondClose}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  disabled={actionLoadingId === showRespondModal._id}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                  disabled={actionLoadingId === showRespondModal._id}
                >
                  {actionLoadingId === showRespondModal._id ? 'Processing...' : 'Submit Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}