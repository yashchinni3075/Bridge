import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';

const FUNDING_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'equity', label: 'Equity' },
  { value: 'debt', label: 'Debt' },
  { value: 'convertible_note', label: 'Convertible Note' },
  { value: 'safe', label: 'SAFE' },
  { value: 'grant', label: 'Grant' },
  { value: 'other', label: 'Other' },
];

const STAGES = [
  { value: '', label: 'All Stages' },
  { value: 'Idea', label: 'Idea Stage' },
  { value: 'MVP', label: 'MVP' },
  { value: 'Early Stage', label: 'Early Stage' },
  { value: 'Growth', label: 'Growth Stage' },
  { value: 'Scaling', label: 'Scaling' },
];

const INDUSTRIES = [
  { value: '', label: 'All Industries' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'AI', label: 'AI/ML' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Web3', label: 'Web3/Crypto' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'EdTech', label: 'EdTech' },
];

export default function FundingDiscovery() {
  const [opportunities, setOpportunities] = useState([]);
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
  const [myInterests, setMyInterests] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    fundingType: '',
    stage: '',
    industry: '',
    minAmount: '',
    maxAmount: '',
    status: 'open',
  });

  const fetchOpportunities = async (targetPage = 1, targetLimit = pagination.limit) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', targetPage);
      params.append('limit', targetLimit);

      const res = await api.get(`/funding/discover?${params.toString()}`);
      setOpportunities(res.data.opportunities || []);
      setPagination(prev => ({ ...prev, ...res.data.pagination, page: targetPage }));
    } catch (err) {
      console.error('Error fetching funding opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyInterests = async () => {
    try {
      // Used as a complete "have I already expressed interest?" lookup, so ask
      // for the full bounded set rather than one default page.
      const res = await api.get('/funding/my-interests', { params: { limit: 100 } });
      setMyInterests(res.data.interests || []);
    } catch (err) {
      console.error('Error fetching my interests:', err);
    }
  };

  useEffect(() => {
    fetchOpportunities(1);
    fetchMyInterests();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchOpportunities(1);
  };

  const handleExpressInterest = async (opportunity) => {
    const existingInterest = myInterests.find(i => i.fundingOpportunityId?._id === opportunity._id || i.fundingOpportunityId === opportunity._id);
    if (existingInterest) {
      alert('You have already expressed interest in this opportunity');
      return;
    }

    const checkSizeMin = prompt(`Enter minimum check size for ${opportunity.title} (USD):`, '');
    if (checkSizeMin === null) return;
    const checkSizeMax = prompt(`Enter maximum check size for ${opportunity.title} (USD):`, checkSizeMin);
    if (checkSizeMax === null) return;

    const equityRequested = prompt(`Enter equity requested (%) for ${opportunity.title}:`, '10');
    if (equityRequested === null) return;

    const message = prompt(`Enter a message for the startup (optional):`, '');
    const proposedTerms = prompt(`Enter proposed terms (optional):`, '');
    const timeline = prompt(`Enter timeline (optional):`, '');

    try {
      setActionLoadingId(opportunity._id);
      await api.post(`/funding/${opportunity._id}/interest`, {
        checkSize: { min: Number(checkSizeMin), max: Number(checkSizeMax), currency: 'USD' },
        equityRequested: Number(equityRequested),
        message: message || '',
        proposedTerms: proposedTerms || '',
        timeline: timeline || '',
      });
      alert('Interest expressed successfully!');
      fetchMyInterests();
      fetchOpportunities(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to express interest');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleWithdrawInterest = async (interestId) => {
    if (!window.confirm('Are you sure you want to withdraw your interest?')) return;
    try {
      setActionLoadingId(interestId);
      await api.patch(`/funding/interests/${interestId}`, { status: 'withdrawn' });
      alert('Interest withdrawn');
      fetchMyInterests();
      fetchOpportunities(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw interest');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

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

  const inputClass = "w-full md:w-48 bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner";
  const selectClass = "w-full md:w-48 bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition shadow-inner";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Discover Funding Opportunities</h2>
          <p className="text-xs text-slate-400 mt-0.5">Browse and express interest in startup funding rounds.</p>
        </div>
        <Link
          to="/investor-dashboard/my-interests"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl text-xs font-semibold transition self-start"
        >
          My Interests ({myInterests.length})
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 shadow-xl">
        <input
          type="text"
          placeholder="Search by title, description, or startup name..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
        />
        <select value={filters.fundingType} onChange={(e) => handleFilterChange('fundingType', e.target.value)} className={selectClass}>
          {FUNDING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filters.stage} onChange={(e) => handleFilterChange('stage', e.target.value)} className={selectClass}>
          {STAGES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filters.industry} onChange={(e) => handleFilterChange('industry', e.target.value)} className={selectClass}>
          {INDUSTRIES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          type="number"
          placeholder="Min Amount (USD)"
          value={filters.minAmount}
          onChange={(e) => handleFilterChange('minAmount', e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          placeholder="Max Amount (USD)"
          value={filters.maxAmount}
          onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
          className={inputClass}
        />
        <button
          onClick={handleSearch}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 transition self-start md:self-end"
        >
          Apply Filters
        </button>
      </div>

      {/* Results */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Funding Opportunities ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 h-40"></div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-xs text-slate-400">No funding opportunities match your filters.</p>
            <p className="text-[10px] text-slate-500 mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => {
              const myInterest = myInterests.find(i => i.fundingOpportunityId?._id === opp._id || i.fundingOpportunityId === opp._id);
              const isLoading = actionLoadingId === opp._id;
              return (
                <div key={opp._id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold text-white tracking-tight">
                        {opp.title}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_COLORS[opp.status] || STATUS_COLORS.open}`}>
                        {STATUS_LABELS[opp.status] || opp.status}
                      </span>
                      <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-slate-950/60 text-slate-400 border-slate-900/80">
                        {FUNDING_TYPE_LABELS[opp.fundingType] || opp.fundingType}
                      </span>
                    </div>

                    {opp.startupInfo?.startupName && (
                      <p className="text-[10px] text-indigo-400 font-medium mt-1">{opp.startupInfo.startupName}</p>
                    )}

                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{opp.description || 'No description'}</p>

                    <div className="flex flex-wrap gap-4 mt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        💰 Raising: <span className="text-slate-300 font-medium">{formatCurrency(opp.amountRaising?.min)}</span>
                      </span>
                      {opp.startupInfo?.industry && (
                        <span className="flex items-center gap-1">
                          🏢 <span className="text-slate-300 font-medium">{opp.startupInfo.industry}</span>
                        </span>
                      )}
                      {opp.startupInfo?.stage && (
                        <span className="flex items-center gap-1">
                          📈 <span className="text-slate-300 font-medium">{opp.startupInfo.stage}</span>
                        </span>
                      )}
                      {opp.closingDate && (
                        <span className="flex items-center gap-1">
                          📅 Closes: <span className="text-slate-300 font-medium">{new Date(opp.closingDate).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {myInterest ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border ${INTEREST_STATUS_COLORS[myInterest.status] || INTEREST_STATUS_COLORS.pending}`}>
                          {INTEREST_STATUS_LABELS[myInterest.status] || myInterest.status}
                        </span>
                        {myInterest.status === 'pending' && (
                          <button
                            onClick={() => handleWithdrawInterest(myInterest._id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[10px] font-semibold transition disabled:opacity-50"
                          >
                            Withdraw
                          </button>
                        )}
                        {myInterest.status === 'accepted' && (
                          <span className="px-3 py-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-900/80 rounded-xl text-[10px] font-semibold">
                            Committed: {formatCurrency(myInterest.committedAmount)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleExpressInterest(opp)}
                        disabled={isLoading || opp.status !== 'open'}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Express Interest'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination footer - hidden on the first load so the totals never flash
          "0 opportunities" before the response lands. */}
      {pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={(n) => fetchOpportunities(n)}
          onLimitChange={(n) => fetchOpportunities(1, n)}
          disabled={loading}
          label="opportunities"
        />
      )}
    </div>
  );
}