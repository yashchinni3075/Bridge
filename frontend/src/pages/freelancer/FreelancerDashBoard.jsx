import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import VerificationPanel from '../../components/VerificationPanel';
import FreelancerMatchEngine from './FreelancerMatchEngine';
import ApplyModal from '../../components/ApplyModal';

export default function FreelancerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [startups, setStartups] = useState([]);
  const [applications, setApplications] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('not_submitted');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    domain: 'General Software',
    bio: '',
    experience: '1-3 years',
    skills: '',
    interests: '',
    portfolioUrl: '',
    highestEducation: '',
    educationStatus: '',
    degree: '',
    branch: '',
    collegeUniversity: '',
    graduationYear: '',
    certifications: [],
    hourlyCharge: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Discovery search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [applyTarget, setApplyTarget] = useState(null);
  const [expandedStartupId, setExpandedStartupId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, startupsRes, appsRes, verificationRes] = await Promise.all([
        api.get('/freelancers/profile').catch(() => ({ data: { profile: null } })),
        api.get('/startups').catch(() => ({ data: { startups: [] } })),
        api.get('/freelancers/applications').catch(() => ({ data: { applications: [] } })),
        api.get('/verification/status').catch(() => ({ data: { status: 'not_submitted' } })),
      ]);

      const p = profileRes.data.profile || profileRes.data;
      if (p) {
        setProfile(p);
        setFormData({
          name: p.name || '',
          domain: p.domain || 'General Software',
          bio: p.bio || '',
          experience: p.experience || '1-3 years',
          skills: Array.isArray(p.skills) ? p.skills.join(', ') : p.skills || '',
          interests: Array.isArray(p.interests) ? p.interests.join(', ') : p.interests || '',
          portfolioUrl: p.portfolioUrl || p.portfolio || '',
          highestEducation: p.highestEducation || '',
          educationStatus: p.educationStatus || '',
          degree: p.degree || '',
          branch: p.branch || '',
          collegeUniversity: p.collegeUniversity || '',
          graduationYear: p.graduationYear ? String(p.graduationYear) : '',
          certifications: Array.isArray(p.certifications) ? p.certifications.filter(Boolean) : [],
          hourlyCharge: p.hourlyCharge != null ? String(p.hourlyCharge) : '',
        });
      }

      const fetchedStartups = startupsRes.data.startups || startupsRes.data.results || startupsRes.data || [];
      setStartups(fetchedStartups);

      const fetchedApps = appsRes.data.applications || appsRes.data.results || appsRes.data || [];
      setApplications(fetchedApps);

      const vStatus = verificationRes.data.status || verificationRes.data.verificationStatus;
      if (vStatus) {
        setVerificationStatus(vStatus);
      } else if (p?.verificationStatus) {
        setVerificationStatus(p.verificationStatus);
      }
    } catch (err) {
      console.error('Error loading freelancer dashboard:', err);
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

  const handleAddCertification = () => {
    setFormData((prev) => ({ ...prev, certifications: [...(prev.certifications || []), ''] }));
  };

  const handleRemoveCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index),
    }));
  };

  const handleCertificationChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).map((c, i) => (i === index ? value : c)),
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map((s) => s.trim()).filter(Boolean),
        certifications: Array.isArray(formData.certifications)
          ? formData.certifications.map((c) => c.trim()).filter(Boolean)
          : [],
        hourlyCharge: formData.hourlyCharge === '' ? null : Number(formData.hourlyCharge),
      };

      const res = await api.put('/freelancers/profile', payload);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
      setFeedback({ type: 'success', text: 'Freelancer profile updated successfully with all required fields!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update freelancer profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const openApplyModal = (startupId, startupName, hiringId, jobTitle) => {
    setApplyTarget({
      startupId: startupId?.toString(),
      startupName,
      hiringId: hiringId ? hiringId.toString() : null,
      jobTitle,
    });
  };

  const handleApplied = () => {
    setApplyTarget(null);
    fetchData();
  };

  const handleCancelApplication = async (applicationId) => {
    try {
      setActionLoadingId(applicationId);
      await api.delete(`/freelancers/applications/${applicationId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel application.');
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

  const canAccessMatchEngine = isVerified;

  const displayName = profile?.name || 'Freelancer Contributor';
  const displayDomain = profile?.domain || 'Engineering';

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

    return matchesSearch && matchesDomain && matchesStage;
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
            Your account is currently pending admin approval. Access to discovering startup deals and submitting applications is locked until verification is completed.
          </p>
        </div>
        <div>
          <Link
            to="/freelancer-dashboard/verification"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Go to Verification Center &rarr;
          </Link>
        </div>
      </div>
    </div>
  );

  const navLinks = [
    { path: '/freelancer-dashboard', label: 'Dashboard' },
    { path: '/freelancer-dashboard/startups', label: 'Discover Startups', protected: true },
    { path: '/freelancer-dashboard/matches', label: 'Match Engine', protected: true },
    { path: '/freelancer-dashboard/profile', label: 'Profile' },
    { path: '/freelancer-dashboard/verification', label: 'Verification Center' },
  ];

  const highestEducationOptions = ['Diploma', 'Undergraduate', 'Postgraduate', 'Ph.D.', 'Other'];
  const educationStatusOptions = ['Pursuing', 'Graduated'];
  const degreeOptions = [
    'B.E.', 'B.Tech', 'B.Sc', 'BCA', 'BBA', 'B.Com', 'BA',
    'M.E.', 'M.Tech', 'M.Sc', 'MCA', 'MBA', 'M.Com', 'MA',
    'Ph.D.', 'Diploma', 'Other',
  ];
  const branchOptions = [
    'Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical',
    'Civil', 'Chemical', 'Biotechnology', 'Data Science', 'AI/ML', 'Mathematics', 'Physics',
    'Commerce', 'Business Administration', 'Other',
  ];
  const currentYear = new Date().getFullYear();
  const graduationYearOptions = Array.from({ length: currentYear - 1969 }, (_, i) => String(currentYear - i));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white">
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
                to={isLocked ? '/freelancer-dashboard/verification' : link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                  isActive(link.path) && (link.path !== '/freelancer-dashboard' || location.pathname === '/freelancer-dashboard')
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
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Contributor Portal</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const isLocked = link.protected && !isVerified;
              return (
                <Link
                  key={link.path}
                  to={isLocked ? '/freelancer-dashboard/verification' : link.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive(link.path) && (link.path !== '/freelancer-dashboard' || location.pathname === '/freelancer-dashboard')
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

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-20 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/80 px-8 items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">Freelancer Portal</h1>
            <p className="text-[11px] text-slate-400">Collaborate with high-growth venture teams</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-2xl shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white shadow-md shadow-indigo-600/30">
              {displayName[0]}
            </div>
            <div className="text-xs">
              <div className="font-bold text-white tracking-tight">{displayName}</div>
              <div className="text-[11px] text-slate-400">{displayDomain}</div>
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
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available Projects</div>
                        <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">{startups.length}</div>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Submitted Applications</div>
                        <div className="text-3xl font-extrabold text-indigo-400 mt-2 tracking-tight">{applications.length}</div>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Verification Status</div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-900/80 text-emerald-400 text-xs font-bold uppercase tracking-wider mt-2 shadow-sm">
                          <span>✓</span> Verified Contributor
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
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Discover Venture Projects</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Explore startups looking for technical contributors and developers.</p>
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
                        const targetId = s._id?.toString();
                        const isLoading = actionLoadingId === targetId;

                        const existingApp = applications.find(
                          (app) => (app.startupId?._id || app.startupId)?.toString() === targetId
                        );
                        const appStatus = existingApp ? existingApp.status : null;

                        const hirings = Array.isArray(s.hirings) ? s.hirings : [];
                        const hasHirings = hirings.length > 0;
                        const detailsOpen = expandedStartupId === targetId;

                        const formatHiringSalary = (salary) => {
                          const min = Number(salary?.min) || 0;
                          const max = Number(salary?.max) || 0;
                          const cur = salary?.currency || '₹';
                          if (min > 0 && max > 0) return `${cur}${min} LPA - ${cur}${max} LPA`;
                          if (min > 0) return `${cur}${min} LPA`;
                          if (max > 0) return `${cur}${max} LPA`;
                          return 'Not specified';
                        };

                        return (
                          <div key={targetId} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 space-y-5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition duration-200">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <h3 className="text-sm font-bold text-white tracking-tight">{s.startupName || s.name}</h3>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Founder: {s.founderName || 'Confidential'}</p>
                                </div>
                                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-950/60 text-indigo-400 rounded-xl border border-indigo-900/80 shadow-sm">
                                  {s.domain || s.industry || 'Tech'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{s.description}</p>

                              {hasHirings && (
                                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                                      Hiring For ({hirings.length})
                                    </span>
                                    <button
                                      onClick={() => setExpandedStartupId(detailsOpen ? null : targetId)}
                                      className="text-[10px] font-semibold text-indigo-300 hover:text-indigo-200 transition"
                                    >
                                      {detailsOpen ? 'Hide details' : 'View details'}
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {hirings.map((h) => (
                                      <div key={h._id?.toString()} className="border-b border-slate-800/60 last:border-0 pb-2 last:pb-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <div className="min-w-0">
                                            <div className="text-xs font-semibold text-white tracking-tight truncate">{h.jobTitle || 'Untitled Role'}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                              {h.employmentType || 'Full Time'}{h.workMode ? ` · ${h.workMode}` : ''} · {formatHiringSalary(h.salary)}
                                            </div>
                                          </div>
                                          {appStatus === 'accepted' ? (
                                            <span className="px-3 py-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-900/80 rounded-xl text-[10px] font-semibold shadow-sm">Accepted</span>
                                          ) : appStatus === 'rejected' ? (
                                            <span className="px-3 py-1.5 bg-rose-950/60 text-rose-400 border border-rose-900/80 rounded-xl text-[10px] font-semibold shadow-sm">Declined</span>
                                          ) : appStatus === 'pending' ? (
                                            <span className="px-3 py-1.5 bg-amber-950/60 text-amber-400 border border-amber-900/80 rounded-xl text-[10px] font-semibold shadow-sm">Applied ✓</span>
                                          ) : (
                                            <button
                                              onClick={() => openApplyModal(targetId, s.startupName || s.name, h._id, h.jobTitle)}
                                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-[11px] font-semibold shadow-lg shadow-indigo-600/25 transition"
                                            >
                                              Apply Now →
                                            </button>
                                          )}
                                        </div>
                                        {detailsOpen && (
                                          <div className="mt-2 space-y-2 text-[10px]">
                                            {h.jobDescription && (
                                              <p className="text-slate-400 leading-relaxed">{h.jobDescription}</p>
                                            )}
                                            <div className="flex flex-wrap gap-1.5">
                                              {(h.requiredSkills || []).slice(0, 8).map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-950/80 border border-slate-800/80 text-slate-300 rounded-lg font-semibold">
                                                  {skill}
                                                </span>
                                              ))}
                                            </div>
                                            {(h.experienceRequired || h.vacancies > 0) && (
                                              <div className="text-slate-500">
                                                {h.experienceRequired ? `Exp: ${h.experienceRequired}` : ''}
                                                {h.experienceRequired && h.vacancies > 0 ? ' · ' : ''}
                                                {h.vacancies > 0 ? `${h.vacancies} vacancy${h.vacancies > 1 ? 'ies' : 'y'}` : ''}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-medium">Stage: <span className="text-slate-200">{s.stage || 'Early Stage'}</span></span>
                              <div className="flex items-center gap-2">
                                {appStatus === 'accepted' ? (
                                  <span className="px-4 py-2 bg-emerald-950/60 text-emerald-400 border border-emerald-900/80 rounded-xl text-xs font-semibold shadow-sm">
                                    Accepted ✓
                                  </span>
                                ) : appStatus === 'rejected' ? (
                                  <span className="px-4 py-2 bg-rose-950/60 text-rose-400 border border-rose-900/80 rounded-xl text-xs font-semibold shadow-sm">
                                    Declined ✕
                                  </span>
                                ) : appStatus === 'pending' ? (
                                  <>
                                    <span className="px-3.5 py-2 bg-amber-950/60 text-amber-400 border border-amber-900/80 rounded-xl font-semibold text-[11px] shadow-sm">
                                      Applied ✓
                                    </span>
                                    <button
                                      onClick={() => handleCancelApplication(existingApp._id)}
                                      disabled={actionLoadingId === existingApp._id}
                                      className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm"
                                    >
                                      {actionLoadingId === existingApp._id ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => openApplyModal(targetId, s.startupName || s.name, hasHirings ? hirings[0]._id : null, hasHirings ? hirings[0].jobTitle : null)}
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                                  >
                                    {isLoading ? 'Applying...' : 'Apply Now →'}
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
              path="/matches"
              element={
                !canAccessMatchEngine ? (
                  <VerificationRequiredCard />
                ) : (
                  <FreelancerMatchEngine applications={applications} onApplied={fetchData} />
                )
              }
            />

            <Route
              path="/profile"
              element={
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Professional Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Keep your professional portfolio up to date.</p>
                  </div>

                  <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Profile Information</h3>

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
                            Full Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Domain <span className="text-rose-400">*</span>
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
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Bio / Summary <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                          name="bio"
                          rows={3}
                          value={formData.bio}
                          onChange={handleChange}
                          required
                          placeholder="Tell founders about your engineering philosophy and core strengths..."
                          className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Experience Level <span className="text-rose-400">*</span>
                          </label>
                          <select
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            required
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          >
                            <option value="1-3 years">1-3 years</option>
                            <option value="3-5 years">3-5 years</option>
                            <option value="5+ years">5+ years</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Skills (comma separated) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            required
                            placeholder="React, Node.js, TypeScript, PostgreSQL"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interests (comma separated)</label>
                          <input
                            type="text"
                            name="interests"
                            value={formData.interests}
                            onChange={handleChange}
                            placeholder="Cloud system, Web3, AI"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Portfolio URL</label>
                          <input
                            type="url"
                            name="portfolioUrl"
                            value={formData.portfolioUrl}
                            onChange={handleChange}
                            placeholder="https://portfolio.dev"
                            className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="pt-5 border-t border-slate-800/80 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Education</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Highest Education</label>
                            <select
                              name="highestEducation"
                              value={formData.highestEducation}
                              onChange={handleChange}
                              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                            >
                              <option value="">Select highest education</option>
                              {highestEducationOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Education Status</label>
                            <select
                              name="educationStatus"
                              value={formData.educationStatus}
                              onChange={handleChange}
                              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                            >
                              <option value="">Select status</option>
                              {educationStatusOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Degree</label>
                            <select
                              name="degree"
                              value={formData.degree}
                              onChange={handleChange}
                              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                            >
                              <option value="">Select degree</option>
                              {degreeOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Branch / Specialization</label>
                            <select
                              name="branch"
                              value={formData.branch}
                              onChange={handleChange}
                              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                            >
                              <option value="">Select branch</option>
                              {branchOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">College / University</label>
                            <input
                              type="text"
                              name="collegeUniversity"
                              value={formData.collegeUniversity}
                              onChange={handleChange}
                              placeholder="e.g., Indian Institute of Technology, Delhi"
                              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Graduation Year</label>
                            <select
                              name="graduationYear"
                              value={formData.graduationYear}
                              onChange={handleChange}
                              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
                            >
                              <option value="">Select year</option>
                              {graduationYearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-slate-800/80 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Certifications</h3>
                        <div className="space-y-2.5">
                          {(formData.certifications || []).map((cert, index) => (
                            <div key={index} className="flex items-center gap-2.5">
                              <input
                                type="text"
                                value={cert}
                                onChange={(e) => handleCertificationChange(index, e.target.value)}
                                placeholder="Enter certification name e.g., Python Certification"
                                className="flex-1 text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCertification(index)}
                                className="px-3.5 py-3 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm whitespace-nowrap"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleAddCertification}
                          className="px-4 py-2.5 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-dashed border-indigo-800/70 rounded-2xl transition shadow-sm"
                        >
                          + Add Certification
                        </button>
                      </div>

                      <div className="pt-5 border-t border-slate-800/80 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hourly Charges</h3>
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Hourly Charge (₹/hour)
                          </label>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="number"
                              name="hourlyCharge"
                              value={formData.hourlyCharge}
                              onChange={handleChange}
                              min="0"
                              placeholder="e.g., 500"
                              className="w-full sm:w-64 text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                            />
                            <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                              ₹ / hour
                            </span>
                          </div>
                          {formData.hourlyCharge !== '' && (
                            <p className="text-[11px] text-indigo-300 mt-1.5 font-medium">
                              ₹{formData.hourlyCharge} / hour
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-6 py-3 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Freelancer Profile'}
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
                    <p className="text-xs text-slate-400 mt-0.5">Submit identity credentials for compliance approval.</p>
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