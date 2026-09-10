import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function StartupDiscovery() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (domainFilter !== 'all') params.append('domain', domainFilter);
      if (stageFilter !== 'all') params.append('stage', stageFilter);

      const res = await api.get(`/startups?${params.toString()}`);
      setStartups(res.data.startups || []);
    } catch (err) {
      console.error('Error fetching startups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, [domainFilter, stageFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStartups();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Startup Discovery</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore innovative startups looking for engineering and technical talent.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
          <input
            type="text"
            placeholder="Search by startup name, pitch, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
          >
            Search
          </button>
        </form>

        <div className="flex w-full md:w-auto gap-2">
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="all">All Domains</option>
            <option value="Fintech">Fintech</option>
            <option value="Healthtech">Healthtech</option>
            <option value="AI">AI & Machine Learning</option>
            <option value="SaaS">Enterprise SaaS</option>
            <option value="E-Commerce">E-Commerce</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="Idea">Idea</option>
            <option value="MVP">MVP</option>
            <option value="Early Stage">Early Stage</option>
            <option value="Growth">Growth</option>
          </select>
        </div>
      </div>

      {/* Startups Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading startups...</div>
      ) : startups.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          No startups found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {startups.map((s) => (
            <div
              key={s._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{s.startupName}</h3>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {s.domain || 'Tech'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {s.stage || 'Early'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                  {s.pitch || s.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Funding Target</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {s.fundingRequirement ? `$${Number(s.fundingRequirement).toLocaleString()}` : 'Bootstrapped'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Applicants</div>
                    <div className="font-semibold text-indigo-600 mt-0.5">
                      {s.applicantCount} applied
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3">
                <Link
                  to={`/freelancer/startups/${s._id}`}
                  className="block w-full text-center text-xs font-semibold py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition"
                >
                  View Details & Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}