import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import ReportModal from '../../../components/ReportModal';

const getScoreColor = (score) => {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
  if (score >= 60) return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
  return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
};

const Chip = ({ label }) => (
  <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-950/80 border border-slate-800/80 text-slate-300 rounded-lg shadow-sm">
    {label}
  </span>
);

export default function MatchFreelancers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [hiring, setHiring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [contactingId, setContactingId] = useState(null);
  const [contactFeedback, setContactFeedback] = useState({ type: '', text: '' });
  const [reportTarget, setReportTarget] = useState(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const res = await api.get(`/matching/startup/hiring/${id}/freelancers`);
      const data = res.data.matches || [];
      const sorted = [...data].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setMatches(sorted);
      setHiring(res.data.hiring || null);
      if (!sorted.length) {
        setMessage(res.data.message || 'No matching freelancers found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load matched freelancers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [id]);

  const toggleBreakdown = (freelancerId) => {
    setExpandedId((prev) => (prev === freelancerId ? null : freelancerId));
  };

  const handleViewProfile = async (freelancerId) => {
    try {
      setProfileLoading(true);
      const res = await api.get(`/matching/freelancer/${freelancerId}/profile`);
      setViewingProfile(res.data.profile);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load freelancer profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleContact = async (freelancerId, freelancerName) => {
    try {
      setContactingId(freelancerId);
      setContactFeedback({ type: '', text: '' });
      await api.post(`/connections/request/${freelancerId}`);
      setContactFeedback({ type: 'success', text: `Contact request sent to ${freelancerName}.` });
    } catch (err) {
      setContactFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to send contact request.' });
    } finally {
      setContactingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Match Freelancers</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {hiring ? `Best freelancer matches for "${hiring.jobTitle}"` : 'Top freelancer matches for this hiring opening.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/startup-dashboard/hiring"
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl transition shadow-sm"
          >
            ← Back to Hiring
          </Link>
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-2xl transition disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Refreshing...' : '↻ Refresh Matches'}
          </button>
        </div>
      </div>

      {contactFeedback.text && (
        <div
          className={`p-4 text-xs rounded-2xl font-medium shadow-inner ${
            contactFeedback.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
          }`}
        >
          {contactFeedback.text}
        </div>
      )}

      {loading && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
          Computing cosine similarity against real freelancer profiles...
        </div>
      )}

      {!loading && error && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-800/40 rounded-3xl p-10 text-center space-y-4 shadow-xl">
          <div className="text-3xl">🧪</div>
          <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">{error}</p>
        </div>
      )}

      {!loading && !error && message && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
          {message}
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="space-y-5">
          {matches.map((m) => {
            const isExpanded = expandedId === m.freelancerId;
            return (
              <div
                key={m.freelancerId}
                className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition duration-200"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-bold text-white tracking-tight">{m.name || 'Freelancer'}</h3>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm ${getScoreColor(m.matchScore)}`}>
                        {m.matchScore}% Match
                      </span>
                      {m.eligibility && (
                        m.eligibility.eligible ? (
                          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm bg-emerald-950/60 border-emerald-800/70 text-emerald-300">
                            Eligible
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm bg-amber-950/60 border-amber-800/70 text-amber-300">
                            Check Eligibility
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{m.domain || 'General Freelancer'}</p>
                    {m.bio && <p className="text-[11px] text-slate-500 leading-relaxed">{m.bio}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewProfile(m.freelancerId)}
                      className="px-4 py-2 text-[11px] font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-2xl transition shadow-sm"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleContact(m.freelancerId, m.name)}
                      disabled={contactingId === m.freelancerId}
                      className="px-4 py-2 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-2xl transition shadow-sm disabled:opacity-50"
                    >
                      {contactingId === m.freelancerId ? 'Sending...' : 'Contact'}
                    </button>
                    <button
                      onClick={() => setReportTarget({ reportedUserId: m.freelancerId, reportedRole: "freelancer", jobId: id })}
                      className="px-4 py-2 text-[11px] font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-2xl transition shadow-sm"
                    >
                      Report
                    </button>
                    <button
                      onClick={() => toggleBreakdown(m.freelancerId)}
                      className="px-4 py-2 text-[11px] font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl transition shadow-sm"
                    >
                      {isExpanded ? 'Hide breakdown' : 'View Breakdown'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(m.skills || []).length > 0 ? (
                        m.skills.map((s, i) => <Chip key={i} label={s} />)
                      ) : (
                        <span className="text-xs text-slate-500">Not specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Interests</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(m.interests || []).length > 0 ? (
                        m.interests.map((s, i) => <Chip key={i} label={s} />)
                      ) : (
                        <span className="text-xs text-slate-500">Not specified</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Domain</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{m.domain || 'General'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Experience</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{m.experience || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Engagement</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{m.availability || 'Full Time'} </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-inner">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Match Breakdown</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Freelancer Tag Vector</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.freelancerTags || []).length > 0 ? (
                            m.freelancerTags.map((t, i) => <Chip key={i} label={t} />)
                          ) : (
                            <span className="text-slate-500">No tags on profile yet</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Hiring Tag Vector</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.hiringTags || []).length > 0 ? (
                            m.hiringTags.map((t, i) => <Chip key={i} label={t} />)
                          ) : (
                            <span className="text-slate-500">No tags on this hiring record</span>
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

                    {m.eligibility && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                          Eligibility
                          {m.eligibility.eligible && (
                            <span className="ml-2 text-emerald-400 normal-case tracking-normal font-semibold">Eligible</span>
                          )}
                        </div>
                        {m.eligibility.issues && m.eligibility.issues.length > 0 ? (
                          <ul className="space-y-1">
                            {m.eligibility.issues.map((issue, i) => (
                              <li key={i} className="text-[10px] text-amber-300/90 flex items-start gap-1.5">
                                <span>•</span>{issue}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Meets the explicit eligibility criteria checked against this hiring record.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Dot Product</div>
                        <div className="text-white font-bold mt-1 text-sm">{Number(m.dotProduct || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Freelancer Norm</div>
                        <div className="text-white font-bold mt-1 text-sm">{Number(m.freelancerMagnitude || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Hiring Norm</div>
                        <div className="text-white font-bold mt-1 text-sm">{Number(m.hiringMagnitude || 0).toFixed(2)}</div>
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight">Freelancer Profile</h3>
              <button
                onClick={() => setViewingProfile(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition text-sm"
              >
                ✕
              </button>
            </div>

            {profileLoading ? (
              <p className="text-xs text-slate-400 text-center py-8">Loading profile...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {viewingProfile.profileImage ? (
                    <img
                      src={viewingProfile.profileImage}
                      alt={viewingProfile.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-lg font-extrabold text-white shadow-lg">
                      {(viewingProfile.name || 'F')[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">{viewingProfile.name}</div>
                    <div className="text-[11px] text-indigo-400 font-medium">{viewingProfile.domain}</div>
                    <div className="text-[11px] text-slate-400">{viewingProfile.experience} experience</div>
                  </div>
                </div>

                {viewingProfile.bio && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">About</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{viewingProfile.bio}</p>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewingProfile.skills || []).map((s, i) => <Chip key={i} label={s} />)}
                    {(viewingProfile.skills || []).length === 0 && <span className="text-xs text-slate-500">Not specified</span>}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Interests</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewingProfile.interests || []).map((s, i) => <Chip key={i} label={s} />)}
                    {(viewingProfile.interests || []).length === 0 && <span className="text-xs text-slate-500">Not specified</span>}
                  </div>
                </div>

                {viewingProfile.portfolio && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Portfolio</div>
                    <a
                      href={viewingProfile.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                    >
                      {viewingProfile.portfolio}
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleContact(viewingProfile.userId, viewingProfile.name);
                    }}
                    disabled={contactingId === viewingProfile.userId}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
                  >
                    {contactingId === viewingProfile.userId ? 'Sending...' : 'Contact'}
                  </button>
                  <button
                    onClick={() => {
                      setReportTarget({ reportedUserId: viewingProfile.userId, reportedRole: "freelancer", jobId: id });
                    }}
                    className="flex-1 px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold transition"
                  >
                    Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {reportTarget && (
        <ReportModal
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reportedUserId={reportTarget.reportedUserId}
          reportedRole={reportTarget.reportedRole}
          jobId={reportTarget.jobId}
        />
      )}
    </div>
  );
}