import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import calendarApi from '../../services/calendarApi';
import VerificationPanel from '../../components/VerificationPanel';
import HiringDashboard from './hiring/HiringDashboard';
import CreateHiringPage from './hiring/CreateHiringPage';
import EditHiringPage from './hiring/EditHiringPage';
import HiringDetails from './hiring/HiringDetails';
import MatchFreelancers from './hiring/MatchFreelancers';
import MatchFreelancersSelector from './hiring/MatchFreelancersSelector';
import HiringApplications from './hiring/HiringApplications';
import StartupProfileForm from '../../components/StartupProfileForm';
import PitchEvaluationCenter from '../../components/pitch/PitchEvaluationCenter';
import CalendarPage from './CalendarPage';
import CalendarEventModal from '../../components/calendar/CalendarEventModal';
import { EVENT_TYPE_META, formatLocalDate, formatLocalTime } from '../../components/calendar/calendarMeta';
import FreelancerDiscovery from './FreelancerDiscovery';
import InvestorDiscovery from './InvestorDiscovery';
import { clearStartupMatchCache, fetchStartupFeed } from './startupMatchCache';

// The investor feed is the same one Discover Investors reads, so the two share
// a cache entry. The freelancer feed is the dashboard's own (hiring-aware
// matching lives behind /freelancers/discovery).
const INVESTOR_MATCHES_ENDPOINT = '/matching/startup/investors/discovery';
const FREELANCER_MATCHES_ENDPOINT = '/matching/startup/freelancers';
import FundRaiseDashboard from './funding/FundRaiseDashboard';
import CreateFundingOpportunity from './funding/CreateFundingOpportunity';
import FundingOpportunityDetail from './funding/FundingOpportunityDetail';
import EditFundingOpportunity from './funding/EditFundingOpportunity';
import ChatWindow from '../../components/ChatWindow';
import Pagination from '../../components/Pagination';
import NotificationBell from '../../components/NotificationBell';
import NavPendingIndicator from '../../components/NavPendingIndicator';
import AccessLoadingCard from '../../components/AccessLoadingCard';
import NotFound from '../NotFound';

const StartupConnections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const [chatConnection, setChatConnection] = useState(null);

  const [connectionPage, setConnectionPage] = useState(1);
  const [connectionLimit, setConnectionLimit] = useState(10);
  const [connectionsPagination, setConnectionsPagination] = useState(null);

  const fetchConnections = async (targetPage = connectionPage, targetLimit = connectionLimit) => {
    try {
      setLoading(true);
      const res = await api.get('/connections/accepted', {
        params: { page: targetPage, limit: targetLimit },
      });
      const data = res.data.connections || [];

      // Enrich connections with startup/freelancer details
      const enriched = await Promise.all(data.map(async (conn) => {
        const partner = conn.connectedUser;
        if (!partner) return null;
        
        if (partner.role === 'freelancer') {
          // Fetch freelancer profile
          const profileRes = await api.get(`/freelancers/profile`).catch(() => ({ data: { profile: null } }));
          return {
            ...conn,
            connectedUser: { ...partner, profile: profileRes.data.profile },
            type: 'freelancer',
          };
        } else if (partner.role === 'investor') {
          return {
            ...conn,
            connectedUser: partner,
            type: 'investor',
          };
        }
        return { ...conn, type: 'unknown' };
      }));
      
      setConnections(enriched.filter(Boolean));

      const meta = res.data.pagination || null;
      setConnectionsPagination(meta);
      // Removing a connection can leave this page past the end.
      if (meta && meta.totalPages >= 1 && targetPage > meta.totalPages) {
        setConnectionPage(meta.totalPages);
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionPage, connectionLimit]);

  const filteredConnections = connections.filter(c => {
    if (activeTab === 'freelancers') return c.type === 'freelancer';
    if (activeTab === 'investors') return c.type === 'investor';
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
          Loading connections...
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">My Connections</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage your network of freelancers and investors.</p>
      </div>

      <div className="flex gap-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-1">
        {['all', 'freelancers', 'investors'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              // The visible subset changes, so page 1 is the only valid page.
              setConnectionPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === tab
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {filteredConnections.length === 0 ? (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
          {activeTab === 'freelancers' 
            ? 'No freelancer connections yet. Accept freelancer applications to connect.'
            : activeTab === 'investors'
              ? 'No investor connections yet. Accept investor interests to connect.'
              : 'No connections yet. Accept applications or investor interests to start building your network.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConnections.map((conn) => {
            const partner = conn.connectedUser;
            const profile = partner.profile;
            // Fall back to the role label only when the partner has no name.
            // (An inline `name || cond ? 'A' : 'B'` would parse as
            //  `(name || cond) ? 'A' : 'B'`, so every named partner rendered
            //  as "Freelancer" because `||` binds tighter than `?:`.)
            const partnerName = partner?.name || (conn.type === 'freelancer' ? 'Freelancer' : 'Investor');
            return (
              <div key={conn._id} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-indigo-600/30">
                      {partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-tight">{partnerName}</h3>
                        <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-emerald-950/60 text-emerald-400 border-emerald-900/80">
                          Connected
                        </span>
                        {conn.type === 'freelancer' && (
                          <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-purple-950/60 text-purple-400 border-purple-900/80">
                            Freelancer
                          </span>
                        )}
                        {conn.type === 'investor' && (
                          <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-indigo-950/60 text-indigo-400 border-indigo-900/80">
                            Investor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{partner?.email || ''}</p>
                      {conn.type === 'freelancer' && profile && (
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                          <span>Domain: <span className="text-slate-300">{profile.domain || 'General'}</span></span>
                          <span>Stage: <span className="text-slate-300">{profile.experience || 'Not specified'}</span></span>
                          {profile.skills?.length && (
                            <span>Skills: <span className="text-slate-300">{profile.skills.slice(0, 3).join(', ')}</span></span>
                          )}
                        </div>
                      )}
                      {conn.type === 'investor' && partner.firmName && (
                        <p className="text-xs text-slate-400">{partner.firmName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                    <button
                      onClick={() => {
                        console.log('[StartupDashboard] Chat clicked, partner:', partner, 'conn:', conn);
                        setChatPartner(partner);
                        setChatConnection(conn);
                        setChatOpen(true);
                        console.log('[StartupDashboard] chatOpen:', true, 'chatPartner:', partner, 'chatConnection:', conn);
                      }}
                      className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                      💬 Chat
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination footer - hidden on the first load so the totals never flash
          "0 connections" before the response lands. */}
      {connectionsPagination && connectionsPagination.total > 0 && (
        <div className="mt-4">
          <Pagination
            pagination={connectionsPagination}
            onPageChange={setConnectionPage}
            onLimitChange={(n) => {
              setConnectionLimit(n);
              setConnectionPage(1);
            }}
            disabled={loading}
            label="connections"
          />
        </div>
      )}
    </div>

    {chatOpen && chatPartner && chatConnection && (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg h-[75vh]">
          <ChatWindow
            connection={chatConnection}
            onClose={() => {
              setChatOpen(false);
              setChatPartner(null);
              setChatConnection(null);
            }}
          />
        </div>
      </div>
    )}
    </>
  );
};

const STAGE_OPTIONS = [
  { value: 'Idea', label: 'Idea Stage' },
  { value: 'MVP', label: 'MVP' },
  { value: 'Early Stage', label: 'Early Stage' },
  { value: 'Growth', label: 'Growth Stage' },
  { value: 'Scaling', label: 'Scaling' },
];

const stageLabel = (value) => STAGE_OPTIONS.find((s) => s.value === value)?.label || value || '';

export default function StartupDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('not_submitted');
  const [loading, setLoading] = useState(true);
  // Set once the FIRST profile/verification fetch has settled. Unlike `loading`
  // it never goes back to false, so a later refresh cannot put the nav back
  // into its pending state.
  const [accessResolved, setAccessResolved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    startupName: '',
    founderName: '',
    domain: 'Technology',
    stage: 'Early Stage',
    fundingRequirement: '',
  });

  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', state: 'planned', targetDate: '' });
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [schedulePrefill, setSchedulePrefill] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [upcomingPreview, setUpcomingPreview] = useState([]);
  const [appTab, setAppTab] = useState('freelancer'); // 'freelancer' | 'investor'
  // The applications feed is paginated server-side and filtered by `type` there,
  // so each tab keeps its own page/limit and the badge counts come from
  // pagination.total rather than the length of the current page.
  const [appPage, setAppPage] = useState(1);
  const [appLimit, setAppLimit] = useState(10);
  const [appPagination, setAppPagination] = useState(null);
  // The current tab's rows. Previously derived by filtering a merged page.
  const [visibleApps, setVisibleApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // AI recommendations shown on the dashboard home.
  const [matchedFreelancers, setMatchedFreelancers] = useState([]);
  const [matchedInvestors, setMatchedInvestors] = useState([]);
  const [matchEmptyReasons, setMatchEmptyReasons] = useState({});
  const [matchesLoading, setMatchesLoading] = useState(true);

  // Derived arrays for tabbed applications
  const fetchApplications = async (targetPage = appPage, targetLimit = appLimit) => {
    try {
      setAppsLoading(true);
      const type = appTab === 'investor' ? 'investor_connection' : 'freelancer_application';
      const res = await api.get('/startups/applications/received', {
        params: { type, page: targetPage, limit: targetLimit },
      }).catch(() => ({ data: { applications: [], pagination: null } }));

      setVisibleApps(res.data.applications || []);
      setAppPagination(res.data.pagination || null);
      setAppPage(targetPage);
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    // Clear first so the previous tab's rows and badge can't be shown under the
    // newly selected tab while the request is in flight.
    setVisibleApps([]);
    setAppPagination(null);
    fetchApplications(1, appLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appTab]);

  // Reload after any status change: a decision can remove the last row of the
  // final page, which would otherwise leave the user staring at an empty page.
  const refreshApplications = () => fetchApplications(appPage, appLimit);

  const fetchData = async () => {
    try {
      setLoading(true);
      // The applications feed is fetched separately (see fetchApplications) because
      // its page depends on the active tab.
      const [profileRes, verificationRes] = await Promise.all([
        api.get('/startups/profile/me').catch(() => ({ data: { profile: null } })),
        api.get('/verification/status').catch(() => ({ data: { status: 'not_submitted' } })),
      ]);

      const p = profileRes.data.profile || profileRes.data;
      if (p) {
        setProfile(p);
        setFormData({
          startupName: p.startupName || p.name || '',
          founderName: p.founderName || '',
          domain: p.domain || p.industry || 'Technology',
          stage: p.stage || 'Early Stage',
          fundingRequirement: p.fundingRequirement || '',
        });
        if (p.progress?.milestones) setMilestones(p.progress.milestones);
      }

      calendarApi.getUpcoming(5).then((res) => {
        setUpcomingPreview(res.data.events || res.data.upcoming || []);
      }).catch(() => setUpcomingPreview([]));

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
      setAccessResolved(true);
    }
  };

  // Recommendations are fetched separately from the core dashboard data so a
  // slow (or failing) match call can never block the profile, applications or
  // calendar from rendering.
  const fetchRecommendations = async () => {
    try {
      setMatchesLoading(true);
      // Shared with the Discover pages, so visiting Discover Investors and coming
      // back here does not re-rank the same investors a second time.
      const [freFeed, invFeed] = await Promise.all([
        fetchStartupFeed(FREELANCER_MATCHES_ENDPOINT).catch(() => ({
          matches: [],
          emptyReason: 'unavailable',
        })),
        fetchStartupFeed(INVESTOR_MATCHES_ENDPOINT).catch(() => ({
          matches: [],
          emptyReason: 'unavailable',
        })),
      ]);

      setMatchedFreelancers(freFeed.matches || []);
      setMatchedInvestors(invFeed.matches || []);
      setMatchEmptyReasons({
        freelancer: freFeed.emptyReason || null,
        investor: invFeed.emptyReason || null,
      });
    } finally {
      setMatchesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleProfileSaved = (savedProfile) => {
    if (!savedProfile) return;
    // Domain, stage and open roles all feed the match tag vector, so the cached
    // rankings are stale the moment the profile changes.
    clearStartupMatchCache();
    fetchRecommendations();
    setProfile(savedProfile);
    setFormData((prev) => ({
      ...prev,
      startupName: savedProfile.startupName || prev.startupName,
      founderName: savedProfile.founderName || prev.founderName,
      domain: savedProfile.domain || prev.domain,
      stage: savedProfile.stage || prev.stage,
      fundingRequirement: savedProfile.fundingRequirement || '',
    }));
    if (savedProfile.progress?.milestones) setMilestones(savedProfile.progress.milestones);
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

  const handleApplicationAction = async (applicationId, status) => {
    if (status === 'rejected') {
      const reason = window.prompt('Please provide a reason for rejecting this application:');
      if (!reason) return; // User cancelled
      
      try {
        setActionLoadingId(applicationId);
        await api.patch(`/startups/applications/${applicationId}`, { status, rejectionReason: reason });
        // Refetch rather than patching in place: a decision can drop the last row
        // of the current page, and the server total will have changed too.
        await refreshApplications();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update status.');
      } finally {
        setActionLoadingId(null);
      }
    } else {
      try {
        setActionLoadingId(applicationId);
        await api.patch(`/startups/applications/${applicationId}`, { status });
        await refreshApplications();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to update status.');
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const openSchedule = (prefill) => {
    setSchedulePrefill(prefill);
    setScheduleOpen(true);
  };

  const refreshUpcomingPreview = () => {
    calendarApi.getUpcoming(5).then((res) => {
      setUpcomingPreview(res.data.events || res.data.upcoming || []);
    }).catch(() => {});
  };

  const isActive = (path) => location.pathname === path;

  const isVerified =
    verificationStatus === 'approved' ||
    profile?.verificationStatus === 'approved' ||
    profile?.verification?.status === 'approved' ||
    profile?.status === 'approved';

  // Declared after isVerified because it reads it - a `const` referenced by an
  // earlier hook in the same component body would be in its temporal dead zone.
  useEffect(() => {
    if (isVerified) fetchRecommendations();
  }, [isVerified]);

  const displayName = profile?.founderName || profile?.name || 'Startup Founder';
  const displayStartup = profile?.startupName || 'Startup Portal';

  // The restricted state is only knowable once the profile fetch settles - see
  // AccessLoadingCard. Until then every route that gates on `!isVerified` would
  // flash this card at accounts that are perfectly well verified.
  const VerificationRequiredCard = () => (
    accessResolved ? <VerificationRequiredNotice /> : <AccessLoadingCard />
  );

  const VerificationRequiredNotice = () => (
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
    { path: '/startup-dashboard/connections', label: 'Connections', protected: true },
    { path: '/startup-dashboard/funding', label: 'Raise Funds', protected: true },
    { path: '/startup-dashboard/freelancers', label: 'Discover Freelancers', protected: true },
    { path: '/startup-dashboard/investors', label: 'Discover Investors', protected: true },
    { path: '/startup-dashboard/milestones', label: 'Milestone Tracker', protected: true },
    { path: '/startup-dashboard/pitch', label: 'Pitch & AI Review', protected: true },
    { path: '/startup-dashboard/calendar', label: 'Calendar', protected: true },
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
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white focus:outline-none transition"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-4 space-y-2 z-30 shadow-2xl animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            // Unknown until the profile fetch settles - see NavPendingIndicator.
            const isPending = link.protected && !accessResolved;
            const isLocked = link.protected && accessResolved && !isVerified;
            return (
              <Link
                key={link.path}
                // While pending it keeps its real target: the route is still
                // guarded by `!isVerified`, so nothing is exposed either way.
                to={isLocked ? '/startup-dashboard/verification' : link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                  isActive(link.path) && (link.path !== '/startup-dashboard' || location.pathname === '/startup-dashboard')
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20'
                    : isLocked || isPending
                    ? 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {link.label}
                {isPending ? <NavPendingIndicator /> : isLocked ? ' 🔒' : null}
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
              // Unknown until the profile fetch settles - see NavPendingIndicator.
              const isPending = link.protected && !accessResolved;
              const isLocked = link.protected && accessResolved && !isVerified;
              return (
                <Link
                  key={link.path}
                  // While pending it keeps its real target: the route is still
                  // guarded by `!isVerified`, so nothing is exposed either way.
                  to={isLocked ? '/startup-dashboard/verification' : link.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive(link.path) && (link.path !== '/startup-dashboard' || location.pathname === '/startup-dashboard')
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                      : isLocked || isPending
                      ? 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-400'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  {link.label}
                  {isPending ? <NavPendingIndicator /> : isLocked ? ' 🔒' : null}
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
          <div className="flex items-center gap-4">
            <NotificationBell />
            {accessResolved ? (
              <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-2xl shadow-inner">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white shadow-md shadow-indigo-600/30">
                  {displayName[0]}
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white tracking-tight">{displayName}</div>
                  <div className="text-[11px] text-slate-400">{displayStartup}</div>
                </div>
              </div>
            ) : (
              // Profile is still in flight - show the shape of what is coming
              // instead of the 'Startup Founder' fallback name.
              <div
                className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-2xl shadow-inner"
                aria-busy="true"
                aria-label="Loading profile"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse" />
                <div className="text-xs">
                  <div className="h-3 w-24 rounded-lg bg-slate-800 animate-pulse" />
                  <div className="h-2.5 w-16 rounded-lg bg-slate-800/70 animate-pulse mt-1.5" />
                </div>
              </div>
            )}
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
                        <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">{stageLabel(formData.stage) || 'Early Stage'}</div>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition"></div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Funding Target</div>
                        <div className="text-sm font-bold text-indigo-400 mt-2 truncate tracking-tight">${formData.fundingRequirement || '0'}</div>
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

                  {isVerified && (
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Schedule</h3>
                        <Link
                          to="/startup-dashboard/calendar"
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          Open Calendar &rarr;
                        </Link>
                      </div>

                      {upcomingPreview.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-2xl mb-1.5">📅</div>
                          <p className="text-xs text-slate-400">
                            Your schedule is clear. Head to the Calendar to plan your next pitch or interview.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {upcomingPreview.map((ev) => {
                            const meta = EVENT_TYPE_META[ev.eventType] || EVENT_TYPE_META.GENERAL_MEETING;
                            return (
                              <div
                                key={ev._id}
                                className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-4 py-3"
                              >
                                <span className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm border shadow-inner ${meta.chip}`}>
                                  {meta.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-white tracking-tight truncate">{ev.title}</div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {formatLocalDate(ev)} • {formatLocalTime(ev)}
                                  </div>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider rounded-lg border px-2 py-0.5 ${meta.chip}`}>
                                  {meta.short}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Recommendations */}
                  <div className="space-y-6">
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          AI Recommended Freelancers
                        </h3>
                        <Link
                          to="/startup-dashboard/freelancers"
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          View All &rarr;
                        </Link>
                      </div>

                      {matchesLoading ? (
                        <div className="text-center py-8">
                          <p className="text-xs text-slate-400">Finding the best talent for your venture...</p>
                        </div>
                      ) : matchedFreelancers.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-2xl mb-1.5">{matchEmptyReasons.freelancer === 'no_candidates' ? '👥' : '✨'}</div>
                          <p className="text-xs text-slate-400">
                            {matchEmptyReasons.freelancer === 'no_candidates'
                              ? 'No verified freelancers on the platform yet. Check back once talent joins.'
                              : matchEmptyReasons.freelancer === 'unavailable'
                              ? 'Recommendations are unavailable right now. Please try again shortly.'
                              : 'No freelancers clear the match threshold yet. Add required skills to your open roles to sharpen the ranking.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {matchedFreelancers.slice(0, 6).map((m) => {
                            const f = m.freelancer || m.quantity;
                            if (!f) return null;
                            return (
                              <div
                                key={m.id}
                                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col hover:border-slate-700 transition"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white tracking-tight truncate">
                                      {f.name || f.domain}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {f.domain} {f.experience ? `• ${f.experience}` : ''}
                                    </p>
                                  </div>
                                  <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-indigo-950/60 text-indigo-400 rounded-xl border border-indigo-900/80 shrink-0">
                                    Match: {m.matchScore || 0}%
                                  </span>
                                </div>

                                {m.matchedTags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {m.matchedTags.slice(0, 5).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-0.5 bg-slate-900/80 border border-slate-800/80 text-slate-300 rounded-lg text-[9px] font-semibold"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {m.aiInsight?.aiExplanation && (
                                  <p className="text-[10px] text-indigo-300/80 line-clamp-2 bg-indigo-950/30 p-2 rounded-lg border border-indigo-900/50">
                                    {m.aiInsight.aiExplanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          AI Recommended Investors
                        </h3>
                        <Link
                          to="/startup-dashboard/investors"
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          View All &rarr;
                        </Link>
                      </div>

                      {matchesLoading ? (
                        <div className="text-center py-8">
                          <p className="text-xs text-slate-400">Scanning investors for a fit with your raise...</p>
                        </div>
                      ) : matchedInvestors.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-2xl mb-1.5">{matchEmptyReasons.investor === 'no_candidates' ? '🏦' : '✨'}</div>
                          <p className="text-xs text-slate-400">
                            {matchEmptyReasons.investor === 'no_candidates'
                              ? 'No verified investors on the platform yet. Check back soon.'
                              : matchEmptyReasons.investor === 'unavailable'
                              ? 'Recommendations are unavailable right now. Please try again shortly.'
                              : 'No investors match your sector and stage yet. Refine your domain or stage to widen the net.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {matchedInvestors.slice(0, 6).map((m) => {
                            const inv = m.investor || m.quantity;
                            if (!inv) return null;
                            return (
                              <div
                                key={m.id}
                                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col hover:border-slate-700 transition"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white tracking-tight truncate">
                                      {inv.name || 'Investor'}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                      {inv.preferredDomains?.length
                                        ? inv.preferredDomains.join(', ')
                                        : 'Generalist investor'}
                                    </p>
                                  </div>
                                  <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-900/80 shrink-0">
                                    Match: {m.matchScore || 0}%
                                  </span>
                                </div>

                                {m.matchedTags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {m.matchedTags.slice(0, 5).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-0.5 bg-slate-900/80 border border-slate-800/80 text-slate-300 rounded-lg text-[9px] font-semibold"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {m.aiInsight?.aiExplanation && (
                                  <p className="text-[10px] text-indigo-300/80 line-clamp-2 bg-indigo-950/30 p-2 rounded-lg border border-indigo-900/50">
                                    {m.aiInsight.aiExplanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
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
                      <p className="text-xs text-slate-400 mt-0.5">Manage freelancer applications and investor connection requests.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-800 gap-6">
                      <button
                        onClick={() => setAppTab('freelancer')}
                        className={`pb-3 border-b-2 transition flex items-center gap-2 text-xs font-semibold ${
                          appTab === 'freelancer'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Freelancer Applications
                        {appPagination && appTab === 'freelancer' && appPagination.total > 0 && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {appPagination.total}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setAppTab('investor')}
                        className={`pb-3 border-b-2 transition flex items-center gap-2 text-xs font-semibold ${
                          appTab === 'investor'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Investor Connections
                        {appPagination && appTab === 'investor' && appPagination.total > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {appPagination.total}
                          </span>
                        )}
                      </button>
                    </div>

                    {appTab === 'freelancer' && (
                      <div className="space-y-4">
                        {visibleApps.length === 0 ? (
                          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
                            {appsLoading ? 'Loading applications…' : 'No freelancer applications received yet.'}
                          </div>
                        ) : (
                          visibleApps.map((app) => {
                            const isLoading = actionLoadingId === app._id;
                            return (
                              <div key={app._id} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <h3 className="text-sm font-bold text-white tracking-tight">{app.name}</h3>
<span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-purple-950/60 text-purple-400 border-purple-900/80">
                                        Freelancer Application
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">
                                      {app.role} • Contact: <span className="text-slate-300">{app.email}</span> • Status: <span className="uppercase text-indigo-400 font-semibold">{app.status}</span>
                                    </p>
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
                                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                      <button
                                        onClick={() =>
                                          openSchedule({
                                            eventType: 'FREELANCER_INTERVIEW',
                                            participantName: app.name,
                                            relatedEntityId: app._id,
                                            relatedEntityType: 'Application',
                                          })
                                        }
                                        className="px-3 py-1 rounded-lg bg-violet-950/40 hover:bg-violet-900/50 border border-violet-800/60 text-violet-300 text-[10px] font-semibold transition"
                                      >
                                        🗣️ Schedule Interview
                                      </button>
                                      <button
                                        onClick={() =>
                                          openSchedule({
                                            eventType: 'FREELANCER_SKILL_TEST',
                                            participantName: app.name,
                                            relatedEntityId: app._id,
                                            relatedEntityType: 'Application',
                                          })
                                        }
                                        className="px-3 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 text-cyan-300 text-[10px] font-semibold transition"
                                      >
                                        🧪 Schedule Skill Test
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {app.status !== 'selected' && app.status !== 'accepted' && (
                                      <button
                                        onClick={() => handleApplicationAction(app._id, 'selected')}
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
                          })
                        )}

                        {appPagination && appPagination.total > 0 && (
                          <Pagination
                            pagination={appPagination}
                            onPageChange={setAppPage}
                            onLimitChange={(n) => {
                              setAppLimit(n);
                              setAppPage(1);
                            }}
                            disabled={appsLoading}
                            label={appTab === 'freelancer' ? 'applications' : 'requests'}
                          />
                        )}
                      </div>
                    )}

                    {appTab === 'investor' && (
                      <div className="space-y-4">
                        {visibleApps.length === 0 ? (
                          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
                            {appsLoading ? 'Loading requests…' : 'No investor connection requests received yet.'}
                          </div>
                        ) : (
                          visibleApps.map((app) => {
                            const isLoading = actionLoadingId === app._id;
                            return (
                              <div key={app._id} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <h3 className="text-sm font-bold text-white tracking-tight">{app.name}</h3>
<span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-indigo-950/60 text-indigo-400 border-indigo-900/80">
                                        Investor Outreach
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">
                                      {app.role} • Contact: <span className="text-slate-300">{app.email}</span> • Status: <span className="uppercase text-indigo-400 font-semibold">{app.status}</span>
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                      <button
                                        onClick={() =>
                                          openSchedule({
                                            eventType: 'INVESTOR_PITCH',
                                            participantName: app.name,
                                            relatedEntityId: app._id,
                                            relatedEntityType: 'Connection',
                                          })
                                        }
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 text-indigo-300 text-[10px] font-semibold transition"
                                      >
                                        💰 Schedule Pitch Meeting
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {!['accepted', 'selected'].includes(app.status) && (
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
                          })
                        )}

                        {appPagination && appPagination.total > 0 && (
                          <Pagination
                            pagination={appPagination}
                            onPageChange={setAppPage}
                            onLimitChange={(n) => {
                              setAppLimit(n);
                              setAppPage(1);
                            }}
                            disabled={appsLoading}
                            label="requests"
                          />
                        )}
                      </div>
                    )}
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
              path="/freelancers"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <FreelancerDiscovery />
                )
              }
            />
            <Route
              path="/investors"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <InvestorDiscovery />
                )
              }
            />
            <Route
              path="/pitch"
              element={!isVerified ? <VerificationRequiredCard /> : <PitchEvaluationCenter />}
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
              path="/calendar"
              element={!isVerified ? <VerificationRequiredCard /> : <CalendarPage />}
            />

            <Route
              path="/funding"
              element={!isVerified ? <VerificationRequiredCard /> : <FundRaiseDashboard />}
            />
<Route
              path="/funding/create"
              element={!isVerified ? <VerificationRequiredCard /> : <CreateFundingOpportunity />}
            />
            <Route
              path="/funding/:id"
              element={!isVerified ? <VerificationRequiredCard /> : <FundingOpportunityDetail />}
            />
            <Route
              path="/funding/:id/edit"
              element={!isVerified ? <VerificationRequiredCard /> : <EditFundingOpportunity />}
            />
            <Route
              path="/connections"
              element={
                !isVerified ? (
                  <VerificationRequiredCard />
                ) : (
                  <StartupConnections />
                )
              }
            />
            <Route
              path="/profile"
              element={
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Startup Profile Details</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Manage business profile details, pitch, metrics, and team data.</p>
                  </div>

                  <StartupProfileForm onProfileSaved={handleProfileSaved} />
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

            {/* Unknown sub-path inside the dashboard, e.g. /startup-dashboard/typo.
                Without this the outer "*" route matches, this shell renders, and
                React Router finds no child -> blank page. */}
            <Route path="*" element={<NotFound inline />} />
          </Routes>

          <CalendarEventModal
            open={scheduleOpen}
            prefill={schedulePrefill}
            onClose={() => {
              setScheduleOpen(false);
              setSchedulePrefill(null);
            }}
            onSaved={refreshUpcomingPreview}
          />
        </main>
      </div>
    </div>
  );
}
