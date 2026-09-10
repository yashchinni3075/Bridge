import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ReportModal from '../../components/ReportModal';
import ApplyModal from '../../components/ApplyModal';

const formatSalary = (salary) => {
  if (!salary) return 'Not specified';
  const min = Number(salary.min) || 0;
  const max = Number(salary.max) || 0;
  if (min > 0 && max > 0) {
    return `${salary.currency || '₹'}${min} LPA - ${salary.currency || '₹'}${max} LPA`;
  }
  if (min > 0) return `${salary.currency || '₹'}${min} LPA`;
  if (max > 0) return `${salary.currency || '₹'}${max} LPA`;
  return 'Not specified';
};

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

export default function FreelancerMatchEngine({ applications = [], onApplied }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emptyMessage, setEmptyMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [applyTarget, setApplyTarget] = useState(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError('');
      setEmptyMessage('');
      const res = await api.get('/matching/freelancer/hiring');
      const data = res.data.matches || [];
      const sorted = [...data].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setMatches(sorted);
      if (!sorted.length) {
        setEmptyMessage(res.data.message || 'No startup hiring opportunities available yet.');
      }
    } catch (err) {
      const status = err.response?.status;
      const apiMessage = err.response?.data?.message;
      if (status === 404) {
        setError(apiMessage || 'Freelancer profile not found. Please complete your profile first.');
      } else if (status === 403) {
        setError(apiMessage || 'Verification required to access the Match Engine.');
      } else {
        setError(apiMessage || 'Failed to load matching opportunities. Please try again.');
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

  const handleApplied = () => {
    setApplyTarget(null);
    if (onApplied) onApplied();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Match Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Find startup hiring opportunities that match your profile.
          </p>
        </div>
        <button
          onClick={fetchMatches}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-2xl transition disabled:opacity-50 shadow-sm"
        >
          {loading ? 'Refreshing...' : '↻ Refresh Matches'}
        </button>
      </div>

      {loading && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
          Computing cosine similarity against real startup hiring records...
        </div>
      )}

      {!loading && error && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-800/40 rounded-3xl p-10 text-center space-y-4 shadow-xl">
          <div className="text-3xl">🧪</div>
          <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">{error}</p>
        </div>
      )}

      {!loading && !error && emptyMessage && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
          {emptyMessage}
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="space-y-5">
          {matches.map((m) => {
            const isExpanded = expandedId === m.hiringId;
            const existingApp = applications.find(
              (app) => (app.startupId?._id || app.startupId)?.toString() === (m.startupId?.toString())
            );
            const appStatus = existingApp ? existingApp.status : null;
            return (
              <div
                key={m.hiringId}
                className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition duration-200"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-bold text-white tracking-tight">{m.jobTitle || 'Untitled Role'}</h3>
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
                    <p className="text-xs text-slate-300 font-medium">
                      {m.startupName || 'Startup Venture'}
                    </p>
                    <p className="text-[11px] text-slate-500">{m.location || 'Location on request'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {appStatus === 'accepted' ? (
                      <span className="px-4 py-2 bg-emerald-950/60 text-emerald-400 border border-emerald-900/80 rounded-xl text-[11px] font-semibold shadow-sm">
                        Accepted ✓
                      </span>
                    ) : appStatus === 'rejected' ? (
                      <span className="px-4 py-2 bg-rose-950/60 text-rose-400 border border-rose-900/80 rounded-xl text-[11px] font-semibold shadow-sm">
                        Declined ✕
                      </span>
                    ) : appStatus === 'pending' ? (
                      <span className="px-4 py-2 bg-amber-950/60 text-amber-400 border border-amber-900/80 rounded-xl text-[11px] font-semibold shadow-sm">
                        Applied ✓
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setApplyTarget({
                            startupId: m.startupId?.toString(),
                            startupName: m.startupName || 'Startup Venture',
                            hiringId: m.hiringId?.toString(),
                            jobTitle: m.jobTitle || 'This role',
                          })
                        }
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
                      >
                        Apply Now →
                      </button>
                    )}
                    <button
                      onClick={() => toggleBreakdown(m.hiringId)}
                      className="px-4 py-2 text-[11px] font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-2xl transition shadow-sm"
                    >
                      {isExpanded ? 'Hide breakdown' : 'View breakdown'}
                    </button>
                    <button
                      onClick={() => setReportTarget({ reportedUserId: m.startupUserId, reportedRole: "startup", jobId: m.hiringId })}
                      className="px-4 py-2 text-[11px] font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-2xl transition shadow-sm"
                    >
                      Report
                    </button>
                  </div>
                </div>

                {m.jobDescription && (
                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Job Description</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{m.jobDescription}</p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Required Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(m.requiredSkills || []).length > 0 ? (
                        m.requiredSkills.map((s, i) => <Chip key={i} label={s} />)
                      ) : (
                        <span className="text-xs text-slate-500">Not specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Preferred Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(m.preferredSkills || []).length > 0 ? (
                        m.preferredSkills.map((s, i) => <Chip key={i} label={s} />)
                      ) : (
                        <span className="text-xs text-slate-500">Not specified</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Domain</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{m.domain || 'General'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Experience</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{m.experienceRequired || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Vacancies</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{m.vacancies || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Employment</div>
                    <div className="text-slate-200 mt-0.5 font-medium">
                      {m.employmentType || 'Full Time'}
                      {m.workMode ? ` · ${m.workMode}` : ''}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Salary</div>
                    <div className="text-slate-200 mt-0.5 font-medium">{formatSalary(m.salary)}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Your Profile Domain</div>
                      <div className="text-slate-200 mt-0.5 font-medium">
                        {Array.isArray(m.freelancerDomain)
                          ? (m.freelancerDomain.length ? m.freelancerDomain.join(', ') : 'Not set')
                          : (m.freelancerDomain || 'Not set')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Hiring Domain</div>
                      <div className="text-slate-200 mt-0.5 font-medium">{m.domain || 'General'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Other Profile Skills</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(() => {
                        const other = (m.freelancerSkills || []).filter(
                          (s) => !(m.matchedTags || []).some((mt) => mt === String(s).toLowerCase().trim())
                        );
                        return other.length > 0 ? other.map((s, i) => <Chip key={i} label={s} />) : <span className="text-xs text-slate-500">All profile skills are matched above</span>;
                      })()}
                    </div>
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

                    {(m.hiringTags || []).length > (m.matchedTags || []).length && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Other Requirements</div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.hiringTags
                            .filter((t) => !(m.matchedTags || []).includes(t))
                            .map((t, i) => <Chip key={i} label={t} />)}
                        </div>
                      </div>
                    )}

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
                            Meets the explicit eligibility criteria (experience, qualification, certification) checked against this hiring record.
                          </p>
                        )}
                        {(m.criteria?.minimumExperience || m.criteria?.minimumQualification || (m.criteria?.eligibleDegrees || []).length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {m.criteria.minimumExperience && <Chip label={`Exp: ${m.criteria.minimumExperience}`} />}
                            {m.criteria.minimumQualification && <Chip label={`Qual: ${m.criteria.minimumQualification}`} />}
                            {(m.criteria.eligibleDegrees || []).map((d, i) => <Chip key={`d-${i}`} label={d} />)}
                            {(m.criteria.eligibleBranches || []).map((b, i) => <Chip key={`b-${i}`} label={b} />)}
                            {(m.criteria.certifications || []).map((c, i) => <Chip key={`c-${i}`} label={c} />)}
                          </div>
                        )}
                      </div>
                    )}

                    {m.sharedTags && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Shared Tags</div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sharedTags.map((t, i) => <Chip key={i} label={t} />)}
                        </div>
                        {m.freelancerVector && m.hiringVector && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                            <div>
                              <div className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Freelancer Vector</div>
                              <div className="text-slate-300 font-mono break-all">[{m.freelancerVector.join(',')}]</div>
                            </div>
                            <div>
                              <div className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Hiring Vector</div>
                              <div className="text-slate-300 font-mono break-all">[{m.hiringVector.join(',')}]</div>
                            </div>
                          </div>
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

                    <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800/80">
                      Vector-based similarity: both profiles are encoded as binary vectors over a shared vocabulary
                      of normalized tags, then cosine similarity is computed as (A·B)/(||A||×||B||).
                      Match Score = similarity × 100 (rounded). No weighted component scoring is used.
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
      {reportTarget && (
        <ReportModal
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reportedUserId={reportTarget.reportedUserId}
          reportedRole={reportTarget.reportedRole}
          jobId={reportTarget.jobId}
        />
      )}
      {applyTarget && (
        <ApplyModal
          open={!!applyTarget}
          onClose={() => setApplyTarget(null)}
          onApplied={handleApplied}
          startupId={applyTarget.startupId}
          startupName={applyTarget.startupName}
          hiringId={applyTarget.hiringId}
          jobTitle={applyTarget.jobTitle}
        />
      )}
    </div>
  );
}