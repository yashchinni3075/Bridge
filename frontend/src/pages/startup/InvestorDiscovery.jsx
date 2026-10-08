import React, { useState, useEffect, useMemo } from 'react';
import UserInfoCard from '../../components/UserInfoCard';
import { fetchStartupFeed, getCachedFeed } from './startupMatchCache';

const ENDPOINT = '/matching/startup/investors/discovery';

const getScoreColor = (score) => {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
  if (score >= 60) return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
  if (score >= 40) return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
  return 'bg-rose-500/15 text-rose-400 border-rose-500/40';
};

const Chip = ({ label }) => (
  <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-950/80 border border-slate-800/80 text-slate-300 rounded-lg shadow-sm">
    {label}
  </span>
);

export default function InvestorDiscovery() {
  // Seeded from the shared cache so a remount (switching nav options) paints the
  // previous ranking straight away rather than showing the computing placeholder.
  const [matches, setMatches] = useState(() => getCachedFeed(ENDPOINT)?.matches || []);
  const [loading, setLoading] = useState(() => !getCachedFeed(ENDPOINT));
  const [error, setError] = useState('');
  const [emptyMessage, setEmptyMessage] = useState(() => {
    const cached = getCachedFeed(ENDPOINT);
    return cached && !cached.matches.length ? cached.message || 'No eligible investors found.' : '';
  });
  const [expandedId, setExpandedId] = useState(null);
  const [minScore, setMinScore] = useState(40);
  const [showStrongOnly, setShowStrongOnly] = useState(false);
  const [infoCardUser, setInfoCardUser] = useState(null);

  // `force` bypasses the cache (the Refresh button).
  const fetchMatches = async (force = false) => {
    try {
      setLoading(true);
      setError('');
      setEmptyMessage('');
      const feed = await fetchStartupFeed(ENDPOINT, { force });
      setMatches(feed.matches);
      if (!feed.matches.length) {
        setEmptyMessage(feed.message || 'No eligible investors found.');
      }
    } catch (err) {
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;
      if (status === 403) {
        setError(apiMessage || 'Verification required to discover investors.');
      } else {
        setError(apiMessage || 'Failed to load investor recommendations.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const score = m.matchScore || 0;
      if (score < minScore) return false;
      if (showStrongOnly && score < 60) return false;
      return true;
    });
  }, [matches, minScore, showStrongOnly]);

  const toggleBreakdown = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getProfileRoute = (investor) => {
    const userId = investor.userId?._id || investor.userId;
    return userId ? `/investor-dashboard/profile?user=${userId}` : '#';
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Undisclosed';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
        Computing cosine similarity against verified investor profiles...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-800/40 rounded-3xl p-10 text-center space-y-4 shadow-xl">
        <div className="text-3xl">🧪</div>
        <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">{error}</p>
      </div>
    );
  }

  if (emptyMessage) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Discover Investors</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked by cosine similarity (sector, stage, funding preferences). Minimum 40% match.
          </p>
        </div>
        <button
          onClick={() => fetchMatches(true)}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-2xl transition disabled:opacity-50 shadow-sm"
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs font-semibold text-slate-400">Min Match Score:</label>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="text-xs p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
          >
            <option value={0}>0% (All)</option>
            <option value={40}>40%</option>
            <option value={50}>50%</option>
            <option value={60}>60%</option>
            <option value={70}>70%</option>
            <option value={80}>80%</option>
          </select>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <input
              type="checkbox"
              checked={showStrongOnly}
              onChange={(e) => setShowStrongOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            Strong Matches Only (≥60%)
          </label>
        </div>
        <div className="text-xs text-slate-500">
          {filteredMatches.length} of {matches.length} profiles
        </div>
      </div>

      {filteredMatches.length === 0 && matches.length > 0 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
          No profiles match the current filters.
        </div>
      )}

      {filteredMatches.length > 0 && (
        <div className="space-y-5">
          {filteredMatches.map((m) => {
            const isExpanded = expandedId === m.id;
            const investor = m.investor || m.quantity;
            const userId = investor?.userId?._id || investor?.userId;
            return (
              <div
                key={m.id}
                className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition duration-200"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3
                        className="text-sm font-bold text-white tracking-tight cursor-pointer hover:text-indigo-300 transition"
                        onClick={() => setInfoCardUser({ user: { name: investor?.investorName || investor?.name }, role: 'investor', profile: investor })}
                      >
                        {investor?.investorName || investor?.name || 'Investor'}
                      </h3>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm ${getScoreColor(m.matchScore)}`}>
                        {m.matchScore}% Match
                      </span>
                      {m.isStrongMatch && (
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm bg-indigo-950/60 border-indigo-800/70 text-indigo-300">
                          Strong Match
                        </span>
                      )}
                      {m.multiFactor && (
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm bg-purple-950/60 border-purple-800/70 text-purple-300">
                          Multi-Factor
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      {investor?.firmName || 'Independent Investor'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Stage: {investor?.investmentPreferences?.stages?.join(', ') || 'Not specified'} · Check: {formatCurrency(investor?.investmentPreferences?.minCheckSize)} - {formatCurrency(investor?.investmentPreferences?.maxCheckSize)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {userId && (
                      <a
                        href={getProfileRoute(investor)}
                        className="px-4 py-2 text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-xl text-xs font-semibold transition shadow-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Profile
                      </a>
                    )}
                    <button
                      onClick={() => toggleBreakdown(m.id)}
                      className="px-4 py-2 text-[11px] font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-2xl transition shadow-sm"
                    >
                      {isExpanded ? 'Hide breakdown' : 'View breakdown'}
                    </button>
                  </div>
                </div>

                {(investor?.investmentFocus || []).length > 0 && (
                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Investment Focus</div>
                    <div className="flex flex-wrap gap-1.5">
                      {investor.investmentFocus.slice(0, 8).map((s, i) => <Chip key={i} label={s} />)}
                    </div>
                  </div>
                )}

                {(investor?.preferredDomains || []).length > 0 && (
                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Preferred Domains</div>
                    <div className="flex flex-wrap gap-1.5">
                      {investor.preferredDomains.slice(0, 8).map((s, i) => <Chip key={i} label={s} />)}
                    </div>
                  </div>
                )}

                {(m.reasons || []).length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match Reasons</div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.reasons.map((r, i) => (
                        <span key={i} className="px-2.5 py-1 text-[10px] font-medium bg-indigo-950/40 border border-indigo-900/60 text-indigo-300 rounded-lg">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-inner">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Match Breakdown</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Investor Tag Vector</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.investorTags || m.queryTags || []).length > 0 ? (
                            (m.investorTags || m.queryTags || []).map((t, i) => <Chip key={i} label={t} />)
                          ) : (
                            <span className="text-slate-500">No tags on profile yet</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Startup Tag Vector</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.startupTags || m.candidateTags || []).length > 0 ? (
                            (m.startupTags || m.candidateTags || []).map((t, i) => <Chip key={i} label={t} />)
                          ) : (
                            <span className="text-slate-500">No tags on this startup</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Matched Tags</div>
                      {(m.matchedTags || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {m.matchedTags.map((t, i) => (
                            <span key={i} className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 rounded-lg shadow-sm">
                              ✓ {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">0 overlapping tags between the two vectors.</span>
                      )}
                    </div>

                    {m.dimensions && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Domain Fit</div>
                          <div className="text-white font-bold mt-1 text-sm">{m.dimensions.domainFit || 0}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Stage Alignment</div>
                          <div className="text-white font-bold mt-1 text-sm">{m.dimensions.stageAlignment || 0}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Capital Fit</div>
                          <div className="text-white font-bold mt-1 text-sm">{m.dimensions.capitalFit || 0}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Pitch Viability</div>
                          <div className="text-white font-bold mt-1 text-sm">{m.dimensions.pitchViability || 0}%</div>
                        </div>
                      </div>
                    )}

                    {m.multiFactorExplanation && (
                      <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
                        {m.multiFactorExplanation}
                      </p>
                    )}

                    {m.aiInsight?.aiExplanation && (
                      <p className="text-[10px] text-indigo-300/80 leading-relaxed pt-2 border-t border-slate-800/80">
                        {m.aiInsight.aiExplanation}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Dot Product</div>
                        <div className="text-white font-bold mt-1 text-sm">{Number(m.dotProduct || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Investor Norm</div>
                        <div className="text-white font-bold mt-1 text-sm">{Number(m.investorMagnitude || m.queryMagnitude || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Startup Norm</div>
                        <div className="text-white font-bold mt-1 text-sm">{Number(m.startupMagnitude || m.candidateMagnitude || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Cosine Similarity</div>
                        <div className="text-white font-bold mt-1 text-sm">{Number(m.similarity || 0).toFixed(4)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Match Score</div>
                        <div className="text-indigo-300 font-bold mt-1 text-sm">{m.matchScore}%</div>
                      </div>
                      <div className="flex items-end justify-end">
                        <span className="text-[9px] text-slate-500 font-mono">cos·100 = {Number(m.similarity || 0).toFixed(4)} × 100 = {m.matchScore}%</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800/80">
                      Vector-based similarity: both profiles are encoded as weighted vectors over a shared vocabulary
                      of normalized tags. Curated fields (preferred domains, stages, check sizes) weigh more than free-text tokens,
                      then cosine similarity is computed as (A·B)/(||A||×||B||).
                      Match Score = similarity × 100 (rounded).
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {infoCardUser && (
        <UserInfoCard
          user={infoCardUser.user}
          role={infoCardUser.role}
          profile={infoCardUser.profile}
          onClose={() => setInfoCardUser(null)}
        />
      )}
    </div>
  );
}