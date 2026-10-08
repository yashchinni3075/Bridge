import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../services/api';

export default function MatchFreelancersSelector() {
  const navigate = useNavigate();
  const [hirings, setHirings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHirings = async () => {
      try {
        setLoading(true);
        // Every hiring has to appear in this picker, so request the full bounded
        // set rather than a single default page.
        const res = await api.get('/startup-hiring', { params: { limit: 100 } });
        setHirings(res.data.hirings || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load hiring records.');
      } finally {
        setLoading(false);
      }
    };
    fetchHirings();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Match Freelancers</h2>
          <p className="text-xs text-slate-400 mt-0.5">Select a hiring opening to match freelancer profiles against.</p>
        </div>
        <Link
          to="/startup-dashboard/hiring"
          className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-2xl transition shadow-sm"
        >
          ← Back to Hiring
        </Link>
      </div>

      {loading && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
          Loading your hiring openings...
        </div>
      )}

      {!loading && error && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-rose-800/40 rounded-3xl p-10 text-center shadow-xl">
          <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">{error}</p>
        </div>
      )}

      {!loading && !error && hirings.length === 0 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-16 text-center text-xs text-slate-400 shadow-xl">
          No hiring openings yet. Create a hiring opening first to match freelancers.
        </div>
      )}

      {!loading && !error && hirings.length > 0 && (
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
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${
                      h.status === 'open'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium">
                    <span>{h.vacancies} {h.vacancies === 1 ? 'Vacancy' : 'Vacancies'}</span>
                    <span>{h.employmentType}</span>
                    {h.location && <span>{h.location}</span>}
                    {h.experienceRequired && <span>Exp: {h.experienceRequired}</span>}
                    {h.domain && <span className="text-indigo-400">{h.domain}</span>}
                  </div>
                  {(h.requiredSkills || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {h.requiredSkills.slice(0, 8).map((s, i) => (
                        <span key={i} className="px-2.5 py-1 text-[10px] font-semibold bg-slate-950/80 border border-slate-800/80 text-slate-300 rounded-lg shadow-sm">
                          {s}
                        </span>
                      ))}
                      {h.requiredSkills.length > 8 && (
                        <span className="px-2.5 py-1 text-[10px] font-semibold text-slate-500">+{h.requiredSkills.length - 8} more</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/startup-dashboard/hiring/${h._id}/match`)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all duration-200 transform hover:-translate-y-0.5 self-start lg:self-auto flex-shrink-0"
                >
                  ⚡ Match Freelancers
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}