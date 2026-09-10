import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import VerificationPanel from '../../components/VerificationPanel';
import HiringDashboard from './hiring/HiringDashboard';
import CreateHiringPage from './hiring/CreateHiringPage';
import EditHiringPage from './hiring/EditHiringPage';
import HiringDetails from './hiring/HiringDetails';
import MatchFreelancers from './hiring/MatchFreelancers';
import MatchFreelancersSelector from './hiring/MatchFreelancersSelector';

export default function StartupDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [team, setTeam] = useState([]);
  const [applications, setApplications] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('not_submitted');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    startupName: '',
    founderName: '',
    pitch: '',
    description: '',
    domain: 'Technology',
    stage: 'Early Stage',
    fundingRequired: '',
    website: '',
    pitchDeckUrl: '',
    metrics: '',
    teamMembers: '',
  });

  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', state: 'planned', targetDate: '' });
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, teamRes, appsRes, verificationRes] = await Promise.all([
        api.get('/startups/profile/me').catch(() => ({ data: { profile: null } })),
        api.get('/startups/team').catch(() => ({ data: { team: [] } })),
        api.get('/startups/applications/received').catch(() => ({ data: { applications: [] } })),
        api.get('/verification/status').catch(() => ({ data: { status: 'not_submitted' } })),
      ]);

      const p = profileRes.data.profile || profileRes.data;
      if (p) {
        setProfile(p);
        setFormData({
          startupName: p.startupName || p.name || '',
          founderName: p.founderName || '',
          pitch: p.pitch || '',
          description: p.description || '',
          domain: p.domain || p.industry || 'Technology',
          stage: p.stage || 'Early Stage',
          fundingRequired: p.fundingRequired || p.fundingGoal || '',
          website: p.website || '',
          pitchDeckUrl: p.pitchDeck || p.pitchDeckUrl || '',
          metrics: p.metrics || '',
          teamMembers: Array.isArray(p.team) ? p.team.map((t) => t.name || t).join(', ') : '',
        });
        if (p.aiEvaluation) setEvaluation(p.aiEvaluation);
        if (p.progress?.milestones) setMilestones(p.progress.milestones);
      }

      setTeam(teamRes.data.team || teamRes.data || []);
      setApplications(appsRes.data.applications || appsRes.data || []);

      const vStatus = verificationRes.data.status || verificationRes.data.verificationStatus;
      if (vStatus) {
        setVerificationStatus(vStatus);
      } else if (p?.verificationStatus) {
        setVerificationStatus(p.verificationStatus);
      }
    } catch (err) {
      console.error('Error loading startup portal data:', err);
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
        team: formData.teamMembers
          ? formData.teamMembers.split(',').map((t) => ({ name: t.trim() })).filter((t) => t.name)
          : [],
      };

      const res = await api.post('/startups/profile', payload);
      if (res.data.profile) setProfile(res.data.profile);
      setFeedback({ type: 'success', text: 'Startup profile updated successfully with all fields!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update startup profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleMilestoneSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/startups/milestones', milestoneForm);
      if (res.data.milestones) {
        setMilestones(res.data.milestones);
      } else if (res.data.milestone) {
        setMilestones((prev) => [...prev, res.data.milestone]);
      }
      setMilestoneForm({ title: '', description: '', state: 'planned', targetDate: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create milestone.');
    }
  };

  const handleToggleMilestoneState = async (milestoneId, currentState) => {
    const nextState = currentState === 'completed' ? 'planned' : 'completed';
    try {
      const res = await api.patch(`/startups/milestones/${milestoneId}`, { state: nextState });
      if (res.data.milestones) {
        setMilestones(res.data.milestones);
      }
    } catch (err) {
      alert('Failed to update milestone status.');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    try {
      const res = await api.delete(`/startups/milestones/${milestoneId}`);
      if (res.data.milestones) {
        setMilestones(res.data.milestones);
      }
    } catch (err) {
      alert('Failed to delete milestone.');
    }
  };

  const handlePitchUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('pitchDeck', file);

    try {
      setSaving(true);
      const res = await api.post('/startups/pitch-deck', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, pitchDeckUrl: res.data.pitchDeckUrl || res.data.url }));
      setFeedback({ type: 'success', text: 'Pitch deck uploaded successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to upload pitch deck.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluatePitch = async () => {
    try {
      setEvaluating(true);
      const res = await api.post('/startups/evaluate-pitch');
      setEvaluation(res.data.evaluation || res.data);
    } catch (err) {
      alert('Failed to run AI pitch evaluation.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleRemoveTeamMember = async (memberIndex) => {
    try {
      await api.delete(`/startups/team/${memberIndex}`);
      setTeam((prev) => prev.filter((_, idx) => idx !== memberIndex));
    } catch (err) {
      alert('Failed to remove team member.');
    }
  };

  const handleApplicationAction = async (applicationId, status) => {
    try {
      setActionLoadingId(applicationId);
      await api.patch(`/startups/applications/${applicationId}`, { status });
      setApplications((prev) => prev.map((app) => (app._id === applicationId ? { ...app, status } : app)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
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

  const displayName = profile?.founderName || profile?.name || 'Startup Founder';
  const displayStartup = profile?.startupName || 'Startup Portal';

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
            Your account is currently pending admin approval. Access to applications and investor collaboration channels is locked until verification is completed.
          </p>
        </div>
        <div>
          <Link
            to="/startup-dashboard/verification"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Go to Verification Center &rarr;
          </Link>
        </div>
      </div>
    </div>
  );

  const navLinks = [
    { path: '/startup-dashboard', label: 'Dashboard' },
    { path: '/startup-dashboard/hiring', label: 'Hiring', protected: true },
    { path: '/startup-dashboard/applications', label: 'Applications & Outreach', protected: true },
    { path: '/startup-dashboard/milestones', label: 'Milestone Tracker', protected: true },
    { path: '/startup-dashboard/team', label: 'Team Roster', protected: true },
    { path: '/startup-dashboard/pitch', label: 'Pitch & AI Review', protected: true },
    { path: '/startup-dashboard/profile', label: 'Profile' },
    { path: '/startup-dashboard/verification', label: 'Verification Center' },
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
                to={isLocked ? '/startup-dashboard/verification' : link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                  isActive(link.path) && (link.path !== '/startup-dashboard' || location.pathname === '/startup-dashboard')
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
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Startup Portal</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const isLocked = link.protected && !isVerified;
              return (
                <Link
                  key={link.path}
                  to={isLocked ? '/startup-dashboard/verification' : link.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive(link.path) && (link.path !== '/startup-dashboard' || location.pathname === '/startup-dashboard')
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

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-20 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/80 px-8 items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">Startup Portal</h1>
            <p className="text-[11px] text-slate-400">Manage venture metrics and investor collaboration</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-2xl shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white shadow-md shadow-indigo-600/30">
              {displayName[0]}
            </div>
            <div className="text-xs">
              <div className="font-bold text-white tracking-tight">{displayName}</div>
              <div className="text-[11px] text-slate-400">{displayStartup}</div>
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
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Venture Stage</div>
                        <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">{formData.stage || 'Early Stage'}</div>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Funding Target</div>
                        <div className="text-sm font-bold text-indigo-400 mt-2 truncate tracking-tight">${formData.fundingRequired || '0'}</div>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Milestones Tracked</div>
                        <div className="text-3xl font-extrabold text-emerald-400 mt-2 tracking-tight">{milestones.length}</div>
                      </div>
                    </div>
                  ) : (
                    <VerificationRequiredCard />
                  )}
                </div>
              }
            />

            <Route
              path="/applications"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Applications & Outreach</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Manage inbound collaboration requests and investor discussions.</p>
                    </div>

                    <div className="space-y-4">
                      {applications.map((app) => {
                        const isLoading = actionLoadingId === app._id;
                        return (
                          <div key={app._id} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="text-sm font-bold text-white tracking-tight">{app.name}</h3>
                                <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${
                                  app.type === 'investor_connection' ? 'bg-indigo-950/60 text-indigo-400 border-indigo-900/80' : 'bg-purple-950/60 text-purple-400 border-purple-900/80'
                                }`}>
                                  {app.type === 'investor_connection' ? 'Investor Outreach' : 'Freelancer App'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-medium">
                                {app.role} • Contact: <span className="text-slate-300">{app.email}</span> • Status: <span className="uppercase text-indigo-400 font-semibold">{app.status}</span>
                              </p>
                              {app.type === 'freelancer_application' && (
                                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                  {app.resume?.url && (
                                    <a
                                      href={app.resume.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 text-indigo-300 text-[10px] font-semibold transition"
                                    >
                                      View Resume (PDF)
                                    </a>
                                  )}
                                  {app.hiring?.jobTitle && (
                                    <span className="px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-300 text-[10px] font-semibold">
                                      Hiring for: {app.hiring.jobTitle}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {app.status !== 'accepted' && (
                                <button
                                  onClick={() => handleApplicationAction(app._id, 'accepted')}
                                  disabled={isLoading}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                                >
                                  {isLoading ? 'Updating...' : 'Accept'}
                                </button>
                              )}
                              {app.status !== 'rejected' && (
                                <button
                                  onClick={() => handleApplicationAction(app._id, 'rejected')}
                                  disabled={isLoading}
                                  className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                                >
                                  {isLoading ? 'Updating...' : 'Reject'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {applications.length === 0 && (
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
                          No incoming applications or connection requests at the moment.
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            />

            <Route
              path="/milestones"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Milestone Tracker</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Define and monitor key project and product milestones.</p>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add New Milestone</h3>
                      <form onSubmit={handleMilestoneSubmit} className="space-y-4">
                        <input
                          type="text"
                          placeholder="Milestone Title (e.g. Launch Beta MVP)"
                          value={milestoneForm.title}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                          required
                          className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        />
                        <textarea
                          placeholder="Short description or deliverables..."
                          value={milestoneForm.description}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                          rows={2}
                          className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        />
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 transition">
                          + Create Milestone
                        </button>
                      </form>
                    </div>

                    <div className="space-y-4">
                      {milestones.map((m) => (
                        <div key={m._id} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-white tracking-tight">{m.title}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{m.description || 'No description provided.'}</p>
                          </div>
                          <div className="flex items-center gap-2.5 self-start sm:self-auto">
                            <button
                              onClick={() => handleToggleMilestoneState(m._id, m.state)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${
                                m.state === 'completed'
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {m.state === 'completed' ? 'Completed ✓' : 'Mark Completed'}
                            </button>
                            <button
                              onClick={() => handleDeleteMilestone(m._id)}
                              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-xs font-semibold transition shadow-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {milestones.length === 0 && (
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
                          No milestones recorded yet. Add your first venture milestone above.
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            />

            <Route
              path="/team"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Team Roster</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Manage team members and key contributors.</p>
                    </div>

                    <div className="space-y-4">
                      {team.map((member, idx) => (
                        <div key={idx} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 flex items-center justify-between shadow-xl">
                          <div>
                            <h3 className="text-sm font-bold text-white tracking-tight">{member.name}</h3>
                            <p className="text-xs text-slate-400 font-medium">{member.role || 'Member'}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveTeamMember(idx)}
                            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-xs font-semibold transition shadow-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {team.length === 0 && (
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
                          No additional team members listed.
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            />

            <Route
              path="/pitch"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Pitch Deck & AI Evaluation</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Upload presentation files and receive instant venture feedback.</p>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upload Pitch Presentation</h3>
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx"
                        onChange={handlePitchUpload}
                        className="text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                      />

                      <div className="pt-4 border-t border-slate-800/80">
                        <button
                          onClick={handleEvaluatePitch}
                          disabled={evaluating}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                        >
                          {evaluating ? 'Analyzing Presentation...' : '✨ Run AI Diligence Analysis'}
                        </button>
                      </div>

                      {evaluation && (
                        <div className="mt-6 p-6 rounded-3xl bg-slate-950/80 border border-slate-800/80 space-y-6 shadow-inner">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                              <h4 className="text-sm font-bold text-white uppercase tracking-wider">AI Venture Diligence Report</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Automated investor readiness assessment</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-extrabold text-indigo-400 tracking-tight">
                                {typeof evaluation === 'object' ? evaluation.overallScore ?? 'N/A' : '—'}/100
                              </div>
                              <div className="text-[10px] uppercase font-bold text-slate-500">Overall Score</div>
                            </div>
                          </div>

                          {typeof evaluation === 'object' ? (
                            <div className="space-y-6">
                              {evaluation.dimensions && (
                                <div className="space-y-3">
                                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Metric Breakdown</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(evaluation.dimensions).map(([key, val]) => (
                                      <div key={key} className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-2xl space-y-2 shadow-inner">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-slate-300 capitalize font-medium">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                          </span>
                                          <span className="font-bold text-indigo-400">{val}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden shadow-inner">
                                          <div
                                            className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(Math.max(val, 0), 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Array.isArray(evaluation.strengths) && evaluation.strengths.length > 0 && (
                                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-2xl space-y-2 shadow-inner">
                                    <h6 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Key Strengths</h6>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                                      {evaluation.strengths.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {Array.isArray(evaluation.weaknesses) && evaluation.weaknesses.length > 0 && (
                                  <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl space-y-2 shadow-inner">
                                    <h6 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Areas for Improvement</h6>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                                      {evaluation.weaknesses.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {Array.isArray(evaluation.suggestions) && evaluation.suggestions.length > 0 && (
                                <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-2xl space-y-2 shadow-inner">
                                  <h6 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Actionable Recommendations</h6>
                                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                                    {evaluation.suggestions.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-300">{String(evaluation)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            />

            <Route
              path="/hiring"
              element={!isVerified ? <VerificationRequiredCard /> : <HiringDashboard />}
            />
            <Route
              path="/hiring/create"
              element={!isVerified ? <VerificationRequiredCard /> : <CreateHiringPage />}
            />
            <Route
              path="/hiring/:id"
              element={!isVerified ? <VerificationRequiredCard /> : <HiringDetails />}
            />
            <Route
              path="/hiring/match"
              element={!isVerified ? <VerificationRequiredCard /> : <MatchFreelancersSelector />}
            />
            <Route
              path="/hiring/:id/match"
              element={!isVerified ? <VerificationRequiredCard /> : <MatchFreelancers />}
            />
            <Route
              path="/hiring/:id/edit"
              element={!isVerified ? <VerificationRequiredCard /> : <EditHiringPage />}
            />

            <Route
              path="/profile"
              element={
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Startup Profile Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Manage business profile details, pitch, metrics, and team data.</p>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Startup Profile Information</h3>

                    {feedback.text && (
                      <div className={`p-4 text-xs rounded-2xl font-medium shadow-inner ${
                        feedback.type === 'success' ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300' : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
                      }`}>
                        {feedback.text}
                      </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Startup Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="startupName"
                            value={formData.startupName}
                            onChange={handleChange}
                            required
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Founder Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="founderName"
                            value={formData.founderName}
                            onChange={handleChange}
                            required
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          One-Line Pitch / Tagline <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="pitch"
                          value={formData.pitch}
                          onChange={handleChange}
                          required
                          placeholder="e.g. AI-powered enterprise software platform"
                          className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Description <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={handleChange}
                          required
                          placeholder="Describe your platform, target market, and technical advantage..."
                          className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Domain / Industry <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="domain"
                            value={formData.domain}
                            onChange={handleChange}
                            required
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Stage <span className="text-rose-400">*</span>
                          </label>
                          <select
                            name="stage"
                            value={formData.stage}
                            onChange={handleChange}
                            required
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          >
                            <option value="Idea Stage">Idea Stage</option>
                            <option value="Early Stage">Early Stage</option>
                            <option value="Growth Stage">Growth Stage</option>
                            <option value="Scaling">Scaling</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Funding Required ($) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="number"
                            name="fundingRequired"
                            value={formData.fundingRequired}
                            onChange={handleChange}
                            required
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Website URL</label>
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://yourstartup.com"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pitch Deck URL</label>
                          <input
                            type="url"
                            name="pitchDeckUrl"
                            value={formData.pitchDeckUrl}
                            onChange={handleChange}
                            placeholder="https://cloudinary.com/pitch.pdf"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Key Metrics / Traction</label>
                          <input
                            type="text"
                            name="metrics"
                            value={formData.metrics}
                            onChange={handleChange}
                            placeholder="e.g. $10k MRR, 500 active pilots"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Team Members (comma separated)</label>
                          <input
                            type="text"
                            name="teamMembers"
                            value={formData.teamMembers}
                            onChange={handleChange}
                            placeholder="Jane Doe, John Smith"
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
                          {saving ? 'Saving...' : 'Save Startup Profile'}
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
                    <p className="text-xs text-slate-400 mt-0.5">Submit identification and company compliance documentation.</p>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <VerificationPanel />
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}