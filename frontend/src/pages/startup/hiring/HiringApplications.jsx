import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';
import UserInfoCard from '../../../components/UserInfoCard';
import Pagination from '../../../components/Pagination';

const STATUS_META = {
  submitted: { label: 'Submitted', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  under_review: { label: 'Under Review', color: 'bg-sky-950/60 text-sky-400 border-sky-900/80' },
  shortlisted: { label: 'Shortlisted', color: 'bg-amber-950/60 text-amber-400 border-amber-900/80' },
  interview: { label: 'Interview', color: 'bg-violet-950/60 text-violet-400 border-violet-900/80' },
  skill_test: { label: 'Skill Test', color: 'bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-900/80' },
  selected: { label: 'Selected', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80' },
  rejected: { label: 'Rejected', color: 'bg-rose-950/60 text-rose-400 border-rose-900/80' },
  withdrawn: { label: 'Withdrawn', color: 'bg-slate-800 text-slate-500 border-slate-700' },
};

const ENGAGEMENT_STAGE_META = {
  accepted: { label: 'Accepted', color: 'bg-indigo-950/60 text-indigo-400 border-indigo-900/80' },
  onboarding: { label: 'Onboarding', color: 'bg-amber-950/60 text-amber-400 border-amber-900/80' },
  active: { label: 'Active', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80' },
  completed: { label: 'Completed', color: 'bg-slate-950/60 text-slate-400 border-slate-900/80' },
};

const ENGAGEMENT_STAGE_TRANSITIONS = {
  accepted: ['onboarding'],
  onboarding: ['active', 'accepted'],
  active: ['completed', 'onboarding'],
  completed: ['active'],
};

const NEXT_TRANSITIONS = {
  submitted: ['under_review', 'shortlisted', 'interview', 'skill_test', 'selected', 'rejected'],
  under_review: ['shortlisted', 'interview', 'skill_test', 'selected', 'rejected'],
  shortlisted: ['interview', 'skill_test', 'selected', 'rejected'],
  interview: ['skill_test', 'selected', 'rejected'],
  skill_test: ['selected', 'rejected'],
  // Rejected applications can only be moved when the freelancer re-applies
  // (status changes back to 'submitted'). While rejected, no transitions allowed.
  rejected: [],
  withdrawn: [],
};

const FILTER_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'skill_test', label: 'Skill Test' },
  { value: 'selected', label: 'Selected' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const initials = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function HiringApplications() {
  const [hirings, setHirings] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [hiringFilter, setHiringFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [applicantPage, setApplicantPage] = useState(1);
  const [applicantLimit, setApplicantLimit] = useState(10);
  const [applicantPagination, setApplicantPagination] = useState(null);
  // Guards against out-of-order responses when the user pages or filters fast.
  const applicantsRequestId = useRef(0);

  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [applyingStatus, setApplyingStatus] = useState('');
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeBlobUrl, setResumeBlobUrl] = useState(null);
  const [resumeBlob, setResumeBlob] = useState(null);
  const [resumeApplicationId, setResumeApplicationId] = useState(null);
  const [infoCardUser, setInfoCardUser] = useState(null);

  const fetchHirings = async () => {
    try {
      // This list feeds a filter dropdown, so every option has to be present:
      // a paginated page here would silently hide job postings from the filter.
      // The endpoint clamps to MAX_PAGE_SIZE, so this is a bounded read.
      const res = await api.get('/startup-hiring', { params: { limit: 100 } });
      setHirings(res.data.hirings || []);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load hiring posts.' });
    }
  };

  const fetchApplicants = useCallback(
    async (hiringValue, statusValue, searchValue, pageValue, limitValue) => {
      const requestId = ++applicantsRequestId.current;
      // A stale response is dropped rather than rendered, so quickly changing
      // filters or clicking through pages can't show the wrong applicants.
      const isCurrent = () => requestId === applicantsRequestId.current;

      try {
        setLoadingApplicants(true);
        const params = { page: pageValue, limit: limitValue };
        if (hiringValue && hiringValue !== 'all') params.hiringId = hiringValue;
        if (statusValue && statusValue !== 'all') params.status = statusValue;
        if (searchValue && String(searchValue).trim()) params.search = String(searchValue).trim();
        const res = await api.get('/startups/applicants', { params });
        if (!isCurrent()) return;

        setApplicants(res.data.applicants || []);

        const meta = res.data.pagination || null;
        setApplicantPagination(meta);
        // Changing a status (e.g. rejecting the last row on the final page)
        // removes it from this result set, which can leave us past the end.
        if (meta && meta.totalPages >= 1 && pageValue > meta.totalPages) {
          setApplicantPage(meta.totalPages);
        }
      } catch (err) {
        if (!isCurrent()) return;
        setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load applicants.' });
      } finally {
        if (isCurrent()) setLoadingApplicants(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchHirings();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplicants(hiringFilter, statusFilter, search, applicantPage, applicantLimit);
    }, 300);
    return () => clearTimeout(timer);
  }, [hiringFilter, statusFilter, search, applicantPage, applicantLimit, fetchApplicants]);

  const handleToggleDetail = async (applicationId) => {
    if (expandedId === applicationId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(applicationId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/startups/applicants/${applicationId}`);
      setDetail(res.data.applicant || null);
      setNoteDraft(res.data.applicant?.note || '');
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load applicant details.' });
      setExpandedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveNote = async (applicationId) => {
    try {
      const res = await api.patch(`/startups/applicants/${applicationId}/status`, { note: noteDraft });
      if (res.data.applicant) {
        setDetail(res.data.applicant);
        setNoteDraft(res.data.applicant.note || '');
      }
      setFeedback({ type: 'success', text: 'Note saved.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to save note.' });
    }
  };

  const handleSetStatus = async (applicationId, status) => {
    setApplyingStatus(`${applicationId}-${status}`);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.patch(`/startups/applicants/${applicationId}/status`, {
        status,
        note: noteDraft || undefined,
      });
      setFeedback({ type: 'success', text: `Application moved to "${STATUS_META[status].label}".` });
      if (res.data.applicant) {
        setDetail(res.data.applicant);
        setNoteDraft(res.data.applicant.note || '');
      }
      await fetchApplicants(hiringFilter, statusFilter, search, applicantPage, applicantLimit);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update status.' });
    } finally {
      setApplyingStatus('');
    }
  };

  const openResumeModal = (applicationId) => {
    const token = localStorage.getItem('bridge_token');
    console.log('[HiringApplications] openResumeModal called, token:', token ? 'present' : 'MISSING');
    if (!token) {
      setResumeError('Authentication token not found. Please log in again.');
      return;
    }
    setResumeError('');
    setResumeLoading(true);
    setResumeModalOpen(true);
    setResumeApplicationId(applicationId);
    fetchResumeBlobForDownload(applicationId);
  };

  // Debug: log when modal opens/closes
  React.useEffect(() => {
    console.log('[HiringApplications] resumeModalOpen changed:', resumeModalOpen, 'resumeApplicationId:', resumeApplicationId);
  }, [resumeModalOpen, resumeApplicationId]);

  const fetchResumeBlobForDownload = async (applicationId) => {
    try {
      console.log('[HiringApplications] Fetching resume blob for download:', applicationId);
      const response = await api.get(`/startups/applicants/${applicationId}/resume/view`, {
        responseType: 'blob',
      });
      console.log('[HiringApplications] Resume fetch response:', response.status, response.headers['content-type'], '| Data size:', response.data?.size);
      
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        const text = await response.data.text();
        console.error('[HiringApplications] Unexpected response:', text);
        throw new Error('Server returned an error instead of PDF');
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      console.log('[HiringApplications] Blob created:', blob.size, blob.type);
      setResumeBlob(blob);
      setResumeLoading(false);
    } catch (err) {
      console.error('[HiringApplications] Resume fetch error:', err);
      if (err.response) {
        console.error('[HiringApplications] Error response:', err.response.status, err.response.data);
      }
      setResumeLoading(false);
    }
  };

  const getResumeIframeUrl = () => {
    if (!resumeApplicationId) return '';
    const token = localStorage.getItem('bridge_token');
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const backendOrigin = apiBaseUrl.replace('/api', '');
    const url = `${backendOrigin}/api/startups/applicants/${resumeApplicationId}/resume/view?token=${token}`;
    console.log('[HiringApplications] iframe token:', token ? 'present' : 'MISSING');
    console.log('[HiringApplications] iframe URL:', url);
    return url;
  };

  // Debug: test if URL works by fetching it
  React.useEffect(() => {
    if (resumeApplicationId) {
      const url = getResumeIframeUrl();
      console.log('[HiringApplications] Testing iframe URL:', url);
      fetch(url)
        .then(r => {
          console.log('[HiringApplications] Test fetch status:', r.status, r.headers.get('content-type'));
        })
        .catch(e => console.error('[HiringApplications] Test fetch failed:', e));
    }
  }, [resumeApplicationId]);

  const closeResumeModal = () => {
    setResumeModalOpen(false);
    setResumeLoading(false);
    setResumeError('');
    if (resumeBlobUrl) {
      URL.revokeObjectURL(resumeBlobUrl);
      setResumeBlobUrl(null);
    }
    setResumeBlob(null);
    setResumeApplicationId(null);
  };

  const handleSetEngagementStage = async (applicationId, stage) => {
    setApplyingStatus(`${applicationId}-engage-${stage}`);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.patch(`/startups/applicants/${applicationId}/engagement`, {
        engagementStage: stage,
      });
      setFeedback({ type: 'success', text: `Engagement stage updated to "${ENGAGEMENT_STAGE_META[stage]?.label || stage}".` });
      if (res.data.applicant) {
        setDetail(res.data.applicant);
      }
      await fetchApplicants(hiringFilter, statusFilter, search, applicantPage, applicantLimit);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update engagement stage.' });
    } finally {
      setApplyingStatus('');
    }
  };

  const nextActions = detail ? NEXT_TRANSITIONS[detail.status] || [] : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Applications</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Review freelancer applications, view resumes, and manage candidate statuses.
        </p>
      </div>

      {feedback.text && (
        <div className={`p-4 text-xs rounded-2xl font-medium shadow-inner ${
          feedback.type === 'success'
            ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
            : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
        }`}>
          {feedback.text}
          <button onClick={() => setFeedback({ type: '', text: '' })} className="ml-3 underline text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3">
        <select
          value={hiringFilter}
          onChange={(e) => {
            setHiringFilter(e.target.value);
            // The result set itself changed, so page 1 is the only valid page.
            setApplicantPage(1);
          }}
          className="text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
        >
          <option value="all">All Job Postings</option>
          {hirings.map((h) => (
            <option key={h._id} value={h._id}>
              {h.jobTitle} ({h.applicationsCount || 0})
            </option>
          ))}
        </select>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchApplicants(hiringFilter, statusFilter, search, applicantPage, applicantLimit);
          }}
          className="flex-1 flex gap-2"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setApplicantPage(1);
            }}
            placeholder="Search by freelancer name, email, skills, or job title..."
            className="flex-1 text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex gap-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-1 flex-wrap">
        {FILTER_CHIPS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatusFilter(f.value);
              setApplicantPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              statusFilter === f.value
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loadingApplicants ? (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-400">Loading applicants...</p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center font-bold text-xl mb-4">
            📥
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {search || hiringFilter !== 'all' || statusFilter !== 'all'
              ? 'No applicants match the current filters.'
              : 'No applications yet. Share your job postings to start receiving freelancer applications.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((a) => (
            <div
              key={a._id}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-xl hover:border-slate-700 transition"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {a.profileImage ? (
                      <img
                        src={a.profileImage}
                        alt={a.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-indigo-600/20">
                        {initials(a.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="text-sm font-bold text-white tracking-tight truncate cursor-pointer hover:text-indigo-300 transition"
                          onClick={() => setInfoCardUser({ user: { name: a.name, email: a.email }, role: 'freelancer', profile: a.freelancerProfile })}
                        >
                          {a.name}
                        </h3>
                        {a.hiring?.jobTitle && (
                          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/40 border border-indigo-900/70 rounded-lg px-2 py-0.5">
                            {a.hiring.jobTitle}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate">{a.email}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {a.freelancerProfile?.domain ? `${a.freelancerProfile.domain} · ` : ''}
                        {a.freelancerProfile?.experience ? `${a.freelancerProfile.experience} · ` : ''}
                        Applied: {formatDate(a.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start lg:self-auto flex-shrink-0">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_META[a.status]?.color || STATUS_META.submitted.color}`}>
                      {STATUS_META[a.status]?.label || a.status}
                    </span>
                    {a.resume?.url && (
                      <button
                        onClick={() => openResumeModal(a._id)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition shadow-sm"
                      >
                        View Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleDetail(a._id)}
                      className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-900/80 rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                      {expandedId === a._id ? 'Close' : 'Details'}
                    </button>
                  </div>
                </div>

                {(a.freelancerProfile?.skills || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {a.freelancerProfile.skills.slice(0, 8).map((s, i) => (
                      <span key={i} className="text-[10px] text-indigo-300 bg-indigo-950/40 border border-indigo-900/60 rounded-lg px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {a.message && (
                  <p className="text-[11px] text-slate-400 mt-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3">
                    {a.message}
                  </p>
                )}
              </div>

              {expandedId === a._id && (
                <div className="border-t border-slate-800/80 p-6 space-y-6">
                  {detailLoading && (
                    <div className="py-8 text-center">
                      <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-xs text-slate-400">Loading applicant details...</p>
                    </div>
                  )}
                  {!detailLoading && detail && detail._id === a._id && (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Candidate Profile</h4>
                          <div className="text-[11px] text-slate-300 space-y-1.5">
                            <p><span className="text-slate-500">Domain:</span> {detail.freelancerProfile?.domain || 'Not set'}</p>
                            <p><span className="text-slate-500">Experience:</span> {detail.freelancerProfile?.experience || 'Not set'}</p>
                            <p><span className="text-slate-500">Hourly Charge:</span> {detail.freelancerProfile?.hourlyCharge ? `₹${detail.freelancerProfile.hourlyCharge}/hr` : 'Not set'}</p>
                            <p><span className="text-slate-500">Education:</span> {detail.freelancerProfile?.degree ? `${detail.freelancerProfile.degree}${detail.freelancerProfile.collegeUniversity ? ` · ${detail.freelancerProfile.collegeUniversity}` : ''}` : 'Not set'}</p>
                          </div>
                          {detail.freelancerProfile?.bio && (
                            <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">{detail.freelancerProfile.bio}</p>
                          )}
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Job Posting</h4>
                          <div className="text-[11px] text-slate-300 space-y-1.5">
                            <p><span className="text-slate-500">Title:</span> {detail.hiring?.jobTitle || 'General application'}</p>
                            {detail.hiring?.salary?.min || detail.hiring?.salary?.max ? (
                              <p>
                                <span className="text-slate-500">Salary:</span>{' '}
                                {detail.hiring.salary.currency === 'INR' ? '₹' : '$'}
                                {detail.hiring.salary.min || 0} - {detail.hiring.salary.max || 0}
                              </p>
                            ) : null}
                            {detail.hiring?.employmentType && <p><span className="text-slate-500">Employment:</span> {detail.hiring.employmentType}</p>}
                            {detail.hiring?.workMode && <p><span className="text-slate-500">Work Mode:</span> {detail.hiring.workMode}</p>}
                          </div>
                          {detail.hiring?.jobDescription && (
                            <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">{detail.hiring.jobDescription}</p>
                          )}
                        </div>
                      </div>

                      {(detail.freelancerProfile?.certifications || []).length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Certifications</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.freelancerProfile.certifications.map((c, i) => (
                              <span key={i} className="text-[10px] text-slate-300 bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-0.5">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Internal Note</h4>
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          rows={3}
                          placeholder="Add private notes about this candidate (visible only to your team)..."
                          className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        />
                        <button
                          onClick={() => handleSaveNote(a._id)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition shadow-sm"
                        >
                          Save Note
                        </button>
                      </div>

<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Move To
                        </h4>
                        {detail?.status === 'rejected' && nextActions.length === 0 ? (
                          <div className="flex items-center gap-3">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Move To
                            </h4>
                            <span className="px-4 py-2 rounded-xl text-xs font-semibold border bg-amber-950/40 text-amber-300 border-amber-900/80">
                              Awaiting Reapply
                            </span>
                            <p className="text-[11px] text-slate-500">
                              This application was rejected. The freelancer must re-apply before you can change the status.
                            </p>
                          </div>
                        ) : nextActions.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {nextActions.map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleSetStatus(a._id, st)}
                                  disabled={applyingStatus === `${a._id}-${st}`}
                                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-sm disabled:opacity-50 ${
                                    st === 'rejected'
                                      ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-rose-900/80'
                                      : st === 'selected'
                                      ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-900/80'
                                      : 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border-indigo-900/80'
                                  }`}
                                >
                                  {applyingStatus === `${a._id}-${st}` ? 'Updating...' : STATUS_META[st].label}
                                </button>
                              ))}
                            </div>
                            {detail?.status === 'rejected' && (
                              <p className="text-[11px] text-amber-400/80 mt-2">
                                This application was rejected. The freelancer must re-apply before you can accept them again.
                              </p>
                            )}
                            {/* Engagement Stage for Selected Applications */}
                            {detail?.status === 'selected' && detail?.engagementStage !== undefined && (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-800/80">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  Engagement Stage
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {ENGAGEMENT_STAGE_TRANSITIONS[detail.engagementStage || 'accepted']?.map((stage) => (
                                    <button
                                      key={stage}
                                      onClick={() => handleSetEngagementStage(a._id, stage)}
                                      disabled={applyingStatus === `${a._id}-engage-${stage}`}
                                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-sm disabled:opacity-50 ${
                                        ENGAGEMENT_STAGE_META[stage]?.color || 'bg-slate-800 text-slate-300 border-slate-700'
                                      }`}
                                    >
                                      {applyingStatus === `${a._id}-engage-${stage}` ? 'Updating...' : ENGAGEMENT_STAGE_META[stage]?.label || stage}
                                    </button>
                                  ))}
                                  <span className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center ${ENGAGEMENT_STAGE_META[detail.engagementStage]?.color || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                    Current: {ENGAGEMENT_STAGE_META[detail.engagementStage]?.label || detail.engagementStage}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-[11px] text-slate-500">This application is in a final state and cannot be moved further.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination footer - hidden on the first load so the totals never flash
          "0 applicants" before the response lands. */}
      {applicantPagination && applicantPagination.total > 0 && (
        <Pagination
          pagination={applicantPagination}
          onPageChange={setApplicantPage}
          onLimitChange={(n) => {
            setApplicantLimit(n);
            setApplicantPage(1);
          }}
          disabled={loadingApplicants}
          label="applicants"
        />
      )}

      {/* User Info Card Modal */}
      {infoCardUser && (
        <UserInfoCard
          user={infoCardUser.user}
          role={infoCardUser.role}
          profile={infoCardUser.profile}
          onClose={() => setInfoCardUser(null)}
        />
      )}

      {/* Resume PDF Viewer Modal */}
      {resumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeResumeModal} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white truncate">
                {(applicants.find(a => a._id === resumeApplicationId)?.name || detail?.name || 'Applicant')} — Resume
              </h3>
              <div className="flex items-center gap-2">
                {resumeBlob && (
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(resumeBlob);
                      const a = document.createElement('a');
                      const applicant = applicants.find(a => a._id === resumeApplicationId);
                      a.href = url;
                      a.download = applicant?.resume?.fileName || `${applicant?.name || 'applicant'}_resume.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold border border-emerald-500 transition"
                  >
                    Download
                  </button>
                )}
                <button
                  onClick={closeResumeModal}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {resumeLoading && !resumeError && (
                <div className="flex items-center justify-center h-full">
                  <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {resumeError && (
                <div className="flex items-center justify-center h-full p-4 text-center">
                  <div className="space-y-2">
                    <p className="text-sm text-rose-400">{resumeError}</p>
                    <p className="text-xs text-slate-500">The PDF preview couldn't load. Use the Download button above to save and view the file.</p>
                  </div>
                </div>
              )}
              {!resumeError && (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <iframe
                    src={getResumeIframeUrl()}
                    title="Applicant Resume"
                    className="w-full h-full border-0"
                    onLoad={() => {
                      console.log('[HiringApplications] iframe loaded successfully');
                      setResumeLoading(false);
                    }}
                    onError={() => {
                      console.error('[HiringApplications] iframe load error');
                      setResumeLoading(false);
                      setResumeError('Failed to load resume. Use Download button to save and view the file.');
                    }}
                  />
                  <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, fontSize: '10px', color: '#64748b', background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>
                    iframe active
                  </div>
                </div>
              )}
              {!resumeError && !resumeBlobUrl && !resumeLoading && (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Loading resume...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}