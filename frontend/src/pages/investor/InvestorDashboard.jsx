import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import VerificationPanel from '../../components/VerificationPanel';

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [startups, setStartups] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('not_submitted');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile form state including missing fields (minCheckSize, maxCheckSize, geography)
  const [formData, setFormData] = useState({
    investorName: '',
    firmName: '',
    bio: '',
    investmentFocus: '',
    ticketSize: '',
    preferredStage: 'Early Stage',
    linkedin: '',
    portfolioWebsite: '',
    minCheckSize: '',
    maxCheckSize: '',
    geography: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Search & filter state for discovery
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [aiRecommendedOnly, setAiRecommendedOnly] = useState(false);

  // Connection state tracking
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [connectionStatuses, setConnectionStatuses] = useState({});

  // Modal state for viewing milestones of a specific startup
  const [viewingMilestonesStartup, setViewingMilestonesStartup] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, startupsRes, verificationRes, connectionsRes] = await Promise.all([
        api.get('/investors/profile').catch(() => ({ data: { profile: null } })),
        api.get('/investors/startups').catch(() => ({ data: { startups: [] } })),
        api.get('/verification/status').catch(() => ({ data: { status: 'not_submitted' } })),
        api.get('/investors/connections').catch(() => ({ data: { connections: [] } })),
      ]);

      const p = profileRes.data.profile;
      if (p) {
        setProfile(p);
        setFormData({
          investorName: p.investorName || p.name || '',
          firmName: p.firmName || '',
          bio: p.bio || '',
          investmentFocus: Array.isArray(p.investmentFocus) ? p.investmentFocus.join(', ') : p.investmentFocus || '',
          ticketSize: p.ticketSize || '',
          preferredStage: p.preferredStage || (Array.isArray(p.stages) && p.stages[0]) || 'Early Stage',
          linkedin: p.linkedin || '',
          portfolioWebsite: p.portfolioWebsite || p.portfolio || '',
          minCheckSize: p.minCheckSize || '',
          maxCheckSize: p.maxCheckSize || '',
          geography: p.geography || '',
        });
      }

      setStartups(startupsRes.data.startups || startupsRes.data || []);

      const activeConnections = connectionsRes.data.connections || connectionsRes.data || [];
      const statusMap = {};
      
      activeConnections.forEach((c) => {
        const recipientId = typeof c.recipient === 'object' ? c.recipient?._id?.toString() : c.recipient?.toString();
        const profileId = typeof c.startupProfileId === 'object' ? c.startupProfileId?._id?.toString() : c.startupProfileId?.toString();
        const status = c.status || 'pending';

        if (recipientId) statusMap[recipientId] = status;
        if (profileId) statusMap[profileId] = status;
      });
      
      setConnectionStatuses(statusMap);

      const vStatus = verificationRes.data.status || verificationRes.data.verificationStatus;
      if (vStatus) {
        setVerificationStatus(vStatus);
      } else if (p?.verificationStatus) {
        setVerificationStatus(p.verificationStatus);
      }
    } catch (err) {
      console.error('Error loading investor portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        investmentFocus: formData.investmentFocus.split(',').map((s) => s.trim()).filter(Boolean),
        stages: [formData.preferredStage],
      };

      const res = await api.put('/investors/profile', payload);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
      setFeedback({ type: 'success', text: 'Investor profile updated successfully with all fields!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update investor profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (startupId) => {
    try {
      setActionLoadingId(startupId);
      await api.post(`/investors/connect/${startupId}`);
      setConnectionStatuses((prev) => ({ ...prev, [startupId]: 'pending' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send connection request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelConnection = async (startupId) => {
    try {
      setActionLoadingId(startupId);
      await api.delete(`/investors/connect/${startupId}`);
      setConnectionStatuses((prev) => {
        const updated = { ...prev };
        delete updated[startupId];
        return updated;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel connection request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const isActive = (path) => location.pathname === path;

  const isVerified =
    verificationStatus === 'approved' ||
    profile?.verificationStatus === 'approved' ||
    profile?.verification?.status === 'approved' ||
    profile?.status === 'approved';

  const displayName = profile?.investorName || profile?.name || 'Investor User';
  const displayFirm = profile?.firmName || 'Investor';

  const investorFocusArray = Array.isArray(profile?.investmentFocus)
    ? profile.investmentFocus.map((f) => f.toLowerCase())
    : typeof profile?.investmentFocus === 'string'
    ? profile.investmentFocus.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const filteredStartups = startups.filter((s) => {
    const name = s.startupName || s.name || '';
    const desc = s.description || '';
    const domain = (s.domain || s.industry || '').toLowerCase();
    const stage = (s.stage || '').toLowerCase();

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain ? domain === selectedDomain.toLowerCase() : true;
    const matchesStage = selectedStage ? stage === selectedStage.toLowerCase() : true;

    const isAiMatch = investorFocusArray.length === 0 || investorFocusArray.some((focus) => domain.includes(focus));
    const matchesAiFilter = aiRecommendedOnly ? isAiMatch : true;

    return matchesSearch && matchesDomain && matchesStage && matchesAiFilter;
  });

  const VerificationRequiredCard = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full"></div>
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center font-bold text-xl shadow-inner">
          🛡️
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Profile Verification Required</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Your account is currently pending admin approval. Access to discovering startups and managing connections is locked until verification is completed.
          </p>
        </div>
        <div>
          <Link
            to="/investor-dashboard/verification"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Go to Verification Center &rarr;
          </Link>
        </div>
      </div>
    </div>
  );

  const navLinks = [
    { path: '/investor-dashboard', label: 'Dashboard' },
    { path: '/investor-dashboard/startups', label: 'Discover Startups', protected: true },
    { path: '/investor-dashboard/connections', label: 'Connections', protected: true },
    { path: '/investor-dashboard/profile', label: 'Profile' },
    { path: '/investor-dashboard/verification', label: 'Verification Center' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white relative">
      {/* Mobile Header Bar */}
      <div className="md:hidden h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-indigo-600/30">
            B
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">Bridge</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white focus:outline-none transition"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-4 space-y-2 z-30 shadow-2xl animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const isLocked = link.protected && !isVerified;
            return (
              <Link
                key={link.path}
                to={isLocked ? '/investor-dashboard/verification' : link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                  isActive(link.path) && (link.path !== '/investor-dashboard' || location.pathname === '/investor-dashboard')
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20'
                    : isLocked
                    ? 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {link.label}{isLocked ? ' 🔒' : ''}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-72 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 flex-col justify-between p-6 sticky top-0 h-screen">
        <div className="space-y-8">
          <div className="flex items-center gap-3.5 px-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-xl shadow-indigo-600/30">
              B
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block">Bridge</span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Investor Portal</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const isLocked = link.protected && !isVerified;
              return (
                <Link
                  key={link.path}
                  to={isLocked ? '/investor-dashboard/verification' : link.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive(link.path) && (link.path !== '/investor-dashboard' || location.pathname === '/investor-dashboard')
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                      : isLocked
                      ? 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-400'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  {link.label}{isLocked ? ' 🔒' : ''}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-20 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/80 px-8 items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">Investor Portal</h1>
            <p className="text-[11px] text-slate-400">Evaluate pipeline deals and manage fund strategy</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-2xl shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white shadow-md shadow-indigo-600/30">
              {displayName[0]}
            </div>
            <div className="text-xs">
              <div className="font-bold text-white tracking-tight">{displayName}</div>
              <div className="text-[11px] text-slate-400">{displayFirm}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                <div className="max-w-5xl mx-auto space-y-6">
                  {isVerified ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tracked Startups</div>
                        <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">{startups.length}</div>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fund Thesis Focus</div>
                        <div className="text-sm font-bold text-indigo-400 mt-2 truncate tracking-tight">
                          {Array.isArray(profile?.investmentFocus)
                            ? profile.investmentFocus.join(', ')
                            : profile?.investmentFocus || 'General'}
                        </div>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Verification Status</div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-900/80 text-emerald-400 text-xs font-bold uppercase tracking-wider mt-2 shadow-sm">
                          <span>✓</span> Verified Investor
                        </div>
                      </div>
                    </div>
                  ) : (
                    <VerificationRequiredCard />
                  )}
                </div>
              }
            />

            <Route
              path="/startups"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Discover Investment Deals</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Filter and review promising venture pipelines.</p>
                      </div>
                      <button
                        onClick={() => setAiRecommendedOnly(!aiRecommendedOnly)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition border flex items-center justify-center gap-2 shadow-sm ${
                          aiRecommendedOnly
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-indigo-600/25'
                            : 'bg-slate-900/80 text-indigo-400 border-indigo-900/50 hover:bg-slate-800'
                        }`}
                      >
                        ✨ AI Recommended Deals
                      </button>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 shadow-xl">
                      <input
                        type="text"
                        placeholder="Search startups by name or keyword..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                      />
                      <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="w-full md:w-48 bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                      >
                        <option value="">All Domains</option>
                        <option value="Fintech">Fintech</option>
                        <option value="AI">AI</option>
                        <option value="SaaS">SaaS</option>
                        <option value="Web3">Web3</option>
                        <option value="Technology">Technology</option>
                      </select>
                      <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-full md:w-48 bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                      >
                        <option value="">All Stages</option>
                        <option value="Idea Stage">Idea Stage</option>
                        <option value="Early Stage">Early Stage</option>
                        <option value="Growth Stage">Growth Stage</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredStartups.map((s) => {
                        const domain = (s.domain || s.industry || '').toLowerCase();
                        const isMatch = investorFocusArray.some((f) => domain.includes(f));
                        const targetId = s._id?.toString();
                        const userId = s.userId?._id?.toString() || s.userId?.toString();
                        const status = connectionStatuses[targetId] || connectionStatuses[userId];
                        const activeId = targetId || userId;
                        const isLoading = actionLoadingId === activeId;

                        return (
                          <div key={activeId} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-5 relative flex flex-col justify-between shadow-xl hover:border-slate-700 transition duration-200">
                            {isMatch && (
                              <span className="absolute top-5 right-5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-900/80 shadow-sm">
                                ⭐ AI Match
                              </span>
                            )}
                            <div className="space-y-3">
                              <div className="flex justify-between items-start pr-16">
                                <div>
                                  <h3 className="text-sm font-bold text-white tracking-tight">{s.startupName || s.name}</h3>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Founder: {s.founderName || 'Confidential'}</p>
                                </div>
                              </div>
                              <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-950/60 text-indigo-400 rounded-xl border border-indigo-900/80 shadow-sm">
                                {s.domain || s.industry || 'Tech'}
                              </span>
                              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{s.description}</p>
                            </div>

                            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-medium">Funding: <span className="text-slate-200">${s.fundingGoal || s.fundingRequired || 'Undisclosed'}</span></span>
                              <div className="flex items-center gap-2">
                                {status === 'accepted' ? (
                                  <span className="px-4 py-2 bg-emerald-950/60 text-emerald-400 border border-emerald-900/80 rounded-xl text-xs font-semibold shadow-sm">
                                    Connected ✓
                                  </span>
                                ) : status === 'rejected' ? (
                                  <span className="px-4 py-2 bg-rose-950/60 text-rose-400 border border-rose-900/80 rounded-xl text-xs font-semibold shadow-sm">
                                    Declined ✕
                                  </span>
                                ) : status === 'pending' ? (
                                  <>
                                    <span className="px-3.5 py-2 bg-amber-950/60 text-amber-400 border border-amber-900/80 rounded-xl font-semibold text-[11px] shadow-sm">
                                      Requested ✓
                                    </span>
                                    <button
                                      onClick={() => handleCancelConnection(activeId)}
                                      disabled={isLoading}
                                      className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm"
                                    >
                                      {isLoading ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleConnect(activeId)}
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                                  >
                                    {isLoading ? 'Sending...' : 'Connect →'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {filteredStartups.length === 0 && (
                        <div className="col-span-2 p-16 text-center text-xs text-slate-500 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-xl">
                          No startups found matching your filter criteria.
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            />

            <Route
              path="/connections"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Investor Connections & Roadmaps</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Track connected venture portfolios and review verified milestone roadmaps.</p>
                    </div>

                    <div className="space-y-4">
                      {startups
                        .filter((s) => {
                          const sId = s._id?.toString();
                          const uId = s.userId?._id?.toString() || s.userId?.toString();
                          return (
                            (sId && connectionStatuses[sId] !== undefined) ||
                            (uId && connectionStatuses[uId] !== undefined)
                          );
                        })
                        .map((s) => {
                          const sId = s._id?.toString();
                          const uId = s.userId?._id?.toString() || s.userId?.toString();
                          const status = connectionStatuses[sId] || connectionStatuses[uId] || 'pending';
                          const targetId = sId || uId;
                          const isLoading = actionLoadingId === targetId;

                          return (
                            <div key={targetId} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h3 className="text-sm font-bold text-white tracking-tight">{s.startupName || s.name}</h3>
                                  <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${
                                    status === 'accepted' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80' :
                                    status === 'rejected' ? 'bg-rose-950/60 text-rose-400 border-rose-900/80' :
                                    'bg-amber-950/60 text-amber-400 border-amber-900/80'
                                  }`}>
                                    {status.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">{s.description || 'No description provided.'}</p>
                              </div>

                              <div className="flex items-center gap-3 self-start sm:self-auto">
                                {status === 'accepted' && (
                                  <button
                                    onClick={() => setViewingMilestonesStartup(s)}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
                                  >
                                    View Milestones ↗
                                  </button>
                                )}
                                {status === 'pending' && (
                                  <button
                                    onClick={() => handleCancelConnection(targetId)}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-xs font-semibold transition shadow-sm"
                                  >
                                    {isLoading ? 'Cancelling...' : 'Cancel Request'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {startups.filter((s) => {
                        const sId = s._id?.toString();
                        const uId = s.userId?._id?.toString() || s.userId?.toString();
                        return (sId && connectionStatuses[sId] !== undefined) || (uId && connectionStatuses[uId] !== undefined);
                      }).length === 0 && (
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
                          No active connection threads established yet. Connect with verified startup founders from the discovery feed.
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            />

            <Route
              path="/profile"
              element={
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Investment Portfolio Profile</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Manage your fund portfolio details and investment preferences.</p>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Portfolio Details</h3>

                    {feedback.text && (
                      <div
                        className={`p-4 text-xs rounded-2xl font-medium shadow-inner ${
                          feedback.type === 'success'
                            ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
                            : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
                        }`}
                      >
                        {feedback.text}
                      </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Investor / Partner Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="investorName"
                            value={formData.investorName}
                            onChange={handleChange}
                            required
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Firm / Fund Name</label>
                          <input
                            type="text"
                            name="firmName"
                            value={formData.firmName}
                            onChange={handleChange}
                            placeholder="e.g. Apex Capital Ventures"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Bio / Investment Thesis <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          name="bio"
                          rows={3}
                          value={formData.bio}
                          onChange={handleChange}
                          required
                          placeholder="Describe your fund thesis, target metrics, and value-add strategy..."
                          className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Investment Focus (comma separated)</label>
                          <input
                            type="text"
                            name="investmentFocus"
                            value={formData.investmentFocus}
                            onChange={handleChange}
                            placeholder="Fintech, SaaS, AI, Web3"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ticket Size ($)</label>
                          <input
                            type="text"
                            name="ticketSize"
                            value={formData.ticketSize}
                            onChange={handleChange}
                            placeholder="e.g. $25k - $100k"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Stage</label>
                          <select
                            name="preferredStage"
                            value={formData.preferredStage}
                            onChange={handleChange}
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          >
                            <option value="Idea Stage">Idea Stage</option>
                            <option value="Early Stage">Early Stage</option>
                            <option value="Growth Stage">Growth Stage</option>
                            <option value="Scaling">Scaling</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Min Check Size ($)</label>
                          <input
                            type="number"
                            name="minCheckSize"
                            value={formData.minCheckSize}
                            onChange={handleChange}
                            placeholder="25000"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Check Size ($)</label>
                          <input
                            type="number"
                            name="maxCheckSize"
                            value={formData.maxCheckSize}
                            onChange={handleChange}
                            placeholder="250000"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Geography</label>
                          <input
                            type="text"
                            name="geography"
                            value={formData.geography}
                            onChange={handleChange}
                            placeholder="Global, North America, India"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">LinkedIn URL</label>
                          <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/investor"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Portfolio / Fund Website</label>
                          <input
                            type="url"
                            name="portfolioWebsite"
                            value={formData.portfolioWebsite}
                            onChange={handleChange}
                            placeholder="https://apexventures.com"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-6 py-3 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Investor Profile'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              }
            />

            <Route
              path="/verification"
              element={
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Verification Center</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Submit identity and fund credentials for compliance approval.</p>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <VerificationPanel role="investor" />
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Milestone Details Modal View */}
      {viewingMilestonesStartup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{viewingMilestonesStartup.startupName || viewingMilestonesStartup.name}</h3>
                <p className="text-xs text-slate-400">Venture Milestone & Execution Roadmap</p>
              </div>
              <button
                onClick={() => setViewingMilestonesStartup(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                <span className="text-xs text-slate-400 font-medium">Current Status</span>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-indigo-950/60 text-indigo-400 rounded-xl border border-indigo-900/80 shadow-sm">
                  {viewingMilestonesStartup.progress?.currentStatus || 'Building'}
                </span>
              </div>

              {Array.isArray(viewingMilestonesStartup.progress?.milestones) && viewingMilestonesStartup.progress.milestones.length > 0 ? (
                viewingMilestonesStartup.progress.milestones.map((m, idx) => (
                  <div key={m._id || idx} className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl space-y-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white tracking-tight">{m.title}</h4>
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${
                        m.state === 'completed'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {m.state === 'completed' ? 'Completed ✓' : 'Planned'}
                      </span>
                    </div>
                    {m.description && <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>}
                    {m.targetDate && (
                      <div className="text-[10px] text-slate-500 pt-1 font-medium">
                        Target Date: {new Date(m.targetDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-slate-950 border border-slate-800/80 p-8 text-center text-xs text-slate-500 rounded-2xl shadow-inner">
                  No execution milestones published by this startup yet.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingMilestonesStartup(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                Close Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}