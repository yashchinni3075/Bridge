import React, { useState, useEffect } from 'react';
import api from '../../services/api';

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

const formatMoney = (value) => {
  const n = Number(value) || 0;
  if (n <= 0) return 'Undisclosed';
  return `$${n.toLocaleString()}`;
};

/**
 * Matches are expensive to produce (every startup is scored) and do not change
 * within a session unless the investor edits their profile, so the last result
 * is cached at module scope. Without this, every remount caused by switching
 * nav items recomputed the whole ranking from scratch.
 *
 * Keyed by investor user id so logging in as someone else never reuses it.
 */
const matchCache = new Map();
const cacheKey = () => {
  try {
    return JSON.parse(localStorage.getItem('bridge_user') || 'null')?._id?.toString() || 'anon';
  } catch {
    return 'anon';
  }
};

/**
 * Drop cached matches for the signed-in investor. Called after the profile is
 * saved so new domains/interests are reflected on the next visit.
 */
export const clearInvestorMatchCache = () => {
  matchCache.delete(cacheKey());
};

/**
 * Investor Match Engine.
 *
 * Consumes GET /api/matching/investor/startups, which ranks every startup by
 * cosine similarity between the investor's weighted tag vector (built from
 * preferredDomains / interests / stages / check size / geo / bio) and each
 * startup's vector.
 */
export default function InvestorMatchEngine({
  connectionStatuses = {},
  onConnect,
  onCancel,
  actionLoadingId,
}) {
  const [matches, setMatches] = useState(() => matchCache.get(cacheKey()) || []);
  const [loading, setLoading] = useState(() => !matchCache.has(cacheKey()));
  const [error, setError] = useState('');
  const [emptyMessage, setEmptyMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // `force` bypasses the cache (the Refresh button).
  const fetchMatches = async (force = false) => {
    const key = cacheKey();
    if (!force && matchCache.has(key)) {
      setMatches(matchCache.get(key));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      setEmptyMessage('');
      // enrich=0 skips the AI explanation pass; this page does not render it.
      const res = await api.get('/matching/investor/startups', { params: { enrich: 0 } });
      const data = res.data.matches || [];
      const sorted = [...data].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      matchCache.set(key, sorted);
      setMatches(sorted);
      if (!sorted.length) {
        setEmptyMessage(
          res.data.message ||
            'No startups cleared the 40% match threshold. Add preferred domains or interests to your profile to widen the net.'
        );
      }
    } catch (err) {
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;
      if (status === 404) {
        setError(apiMessage || 'Investor profile not found. Please complete your profile first.');
      } else if (status === 403) {
        setError(apiMessage || 'Verification required to access the Match Engine.');
      } else {
        setError(apiMessage || 'Failed to compute matches. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const toggleBreakdown = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Match Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Startups ranked by cosine similarity against your investment profile.
          </p>
        </div>
        <button
          onClick={() => fetchMatches(true)}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-2xl transition disabled:opacity-50 shadow-sm"
        >
          {loading ? 'Refreshing...' : '↻ Refresh Matches'}
        </button>
      </div>

      {loading && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
          Computing cosine similarity across startup profiles...
        </div>
      )}

      {!loading && error && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-800/40 rounded-3xl p-10 text-center space-y-4 shadow-xl">
          <div className="text-3xl">🧪</div>
          <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">{error}</p>
        </div>
      )}

      {!loading && !error && emptyMessage && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl leading-relaxed">
          {emptyMessage}
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="space-y-5">
          {matches.map((m) => {
            const startup = m.startup || m.quantity || {};
            const profileId = (startup._id || m.id)?.toString();
            const userId = startup.userId?._id?.toString() || startup.userId?.toString();
            const status = connectionStatuses[profileId] || connectionStatuses[userId];
            const activeId = profileId || userId;
            const isLoading = actionLoadingId === activeId;
            const isExpanded = expandedId === activeId;
            const score = m.matchScore || 0;

            return (
              <div
                key={activeId}
                className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition duration-200"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {startup.startupName || startup.name || 'Startup Venture'}
                      </h3>
                      <span
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm ${getScoreColor(score)}`}
                      >
                        {score}% Match
                      </span>
                      {m.isStrongMatch && (
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm bg-emerald-950/60 border-emerald-800/70 text-emerald-300">
                          Strong Match
                        </span>
                      )}
                      {m.multiFactor && (
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm bg-slate-950/80 border-slate-800/80 text-slate-400">
                          Multi-factor
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      {startup.domain || startup.industry || 'General'}
                      {startup.stage ? ` · ${startup.stage}` : ''}
                      {startup.location ? ` · ${startup.location}` : ''}
                    </p>
                    {startup.founderName && (
                      <p className="text-[11px] text-slate-500">Founder: {startup.founderName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Once connected there is nothing left to do, so no
                        connect/withdraw action is rendered at all. */}
                    {status === 'accepted' ? null : status === 'rejected' ? (
                      <>
                        <span className="px-4 py-2 bg-rose-950/60 text-rose-400 border border-rose-900/80 rounded-xl text-[11px] font-semibold shadow-sm">
                          Declined ✕
                        </span>
                        <button
                          onClick={() => onConnect && onConnect(activeId)}
                          disabled={isLoading}
                          title="Send a fresh connection request"
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-[11px] font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                        >
                          {isLoading ? 'Sending...' : 'Reconnect ↻'}
                        </button>
                      </>
                    ) : status === 'pending' ? (
                      <>
                        <span className="px-3.5 py-2 bg-amber-950/60 text-amber-400 border border-amber-900/80 rounded-xl font-semibold text-[11px] shadow-sm">
                          Requested ✓
                        </span>
                        <button
                          onClick={() => onCancel && onCancel(activeId)}
                          disabled={isLoading}
                          className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm disabled:opacity-50"
                        >
                          {isLoading ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onConnect && onConnect(activeId)}
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                      >
                        {isLoading ? 'Sending...' : 'Connect →'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleBreakdown(activeId)}
                      className="px-4 py-2 text-[11px] font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-2xl transition shadow-sm"
                    >
                      {isExpanded ? 'Hide breakdown' : 'View breakdown'}
                    </button>
                  </div>
                </div>

                {(startup.description || startup.pitch) && (
                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      About
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {startup.description || startup.pitch}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Stage</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{startup.stage || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Domain</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{startup.domain || 'General'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Location</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{startup.location || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Raising</div>
                    <div className="text-slate-200 mt-0.5 font-medium">
                      {formatMoney(startup.fundingRequirement)}
                    </div>
                  </div>
                </div>

                {/* Why this matched */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Matched Tags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(m.matchedTags || []).length > 0 ? (
                        m.matchedTags.map((t, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 rounded-lg shadow-sm"
                          >
                            ✓ {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">
                          No overlapping tags — this scored on secondary factors.
                        </span>
                      )}
                    </div>
                  </div>

                  {(m.reasons || []).length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Why It Ranked Here
                      </div>
                      <ul className="space-y-1">
                        {m.reasons.map((r, i) => (
                          <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                            <span className="text-indigo-400">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-inner">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      Match Breakdown
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                          Your Tag Vector
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.queryTags || []).length > 0 ? (
                            m.queryTags.map((t, i) => <Chip key={i} label={t} />)
                          ) : (
                            <span className="text-slate-500">No tags on your profile yet</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                          Startup Tag Vector
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.candidateTags || []).length > 0 ? (
                            m.candidateTags.map((t, i) => <Chip key={i} label={t} />)
                          ) : (
                            <span className="text-slate-500">No tags on this startup</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {Array.isArray(m.queryVector) && Array.isArray(m.candidateVector) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <div className="text-slate-500 uppercase tracking-wider font-semibold mb-1">
                            Your Vector
                          </div>
                          <div className="text-slate-300 font-mono break-all">
                            [{m.queryVector.join(',')}]
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 uppercase tracking-wider font-semibold mb-1">
                            Startup Vector
                          </div>
                          <div className="text-slate-300 font-mono break-all">
                            [{m.candidateVector.join(',')}]
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Dot Product
                        </div>
                        <div className="text-white font-bold mt-1 text-sm">{Number(m.dotProduct || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Your Norm
                        </div>
                        <div className="text-white font-bold mt-1 text-sm">
                          {Number(m.queryMagnitude || 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Startup Norm
                        </div>
                        <div className="text-white font-bold mt-1 text-sm">
                          {Number(m.candidateMagnitude || 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Cosine Similarity
                        </div>
                        <div className="text-white font-bold mt-1 text-sm">
                          {Number(m.similarity || 0).toFixed(4)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Match Score
                        </div>
                        <div className="text-indigo-300 font-bold mt-1 text-sm">{score}%</div>
                      </div>
                      <div className="flex items-end justify-end">
                        <span className="text-[9px] text-slate-500 font-mono">
                          cos·100 = {Number(m.similarity || 0).toFixed(4)} × 100 = {score}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800/80">
                      Both sides are encoded as weighted vectors over a shared vocabulary of normalized
                      tags. Curated fields (preferred domains, stages, interests) weigh more than
                      free-text tokens, then cosine similarity is computed as (A·B)/(&#124;&#124;A&#124;&#124;×&#124;&#124;B&#124;&#124;).
                      Match Score = similarity × 100 (rounded).
                    </p>

                    {m.note && (
                      <p className="text-[10px] text-amber-400/90 leading-relaxed">{m.note}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}