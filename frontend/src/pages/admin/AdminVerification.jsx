import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminVerification() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    startups: 0,
    investors: 0,
    freelancers: 0,
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'

  // Modal & Action states
  const [actionUser, setActionUser] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject' | 'delete'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadVerificationData = async () => {
    try {
      setLoading(true);
      setActionError('');
      const [statsRes, requestsRes] = await Promise.all([
        api.get('/admin/verification/stats'),
        api.get(`/admin/verification/requests?status=${activeTab}`),
      ]);

      setStats(statsRes.data.stats || statsRes.data.data);
      setRequests(requestsRes.data.requests || []);
    } catch (err) {
      console.error('Failed to load admin verification data:', err);
      setActionError(err.response?.data?.message || 'Failed to load verification queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationData();
  }, [activeTab]);

  const handleOpenActionModal = (user, type) => {
    setActionUser(user);
    setActionType(type);
    setRejectionReason('');
    setActionError('');
  };

  const handleCloseActionModal = () => {
    setActionUser(null);
    setActionType(null);
    setRejectionReason('');
    setActionError('');
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionUser || !actionType) return;
    setActionError('');

    if (actionType === 'reject' && !rejectionReason.trim()) {
      setActionError('A meaningful rejection reason is required.');
      return;
    }

    try {
      setActionLoading(true);

      if (actionType === 'delete') {
        await api.delete(`/admin/verification/${actionUser._id}/document`);
      } else {
        await api.patch(`/admin/verification/${actionUser._id}/review`, {
          action: actionType,
          rejectionReason: actionType === 'reject' ? rejectionReason.trim() : undefined,
        });
      }

      handleCloseActionModal();
      await loadVerificationData();
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${actionType} verification.`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Admin Verification Center</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Review legal identification, company registrations, and credentials across all ecosystem roles.
        </p>
      </div>

      {/* Real-Time Statistics Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-xl space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Users</div>
          <div className="text-xl font-bold text-white tracking-tight">{stats.totalUsers}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-xl space-y-1">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Pending</div>
          <div className="text-xl font-bold text-amber-400 tracking-tight">{stats.pending}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-xl space-y-1">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Approved</div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">{stats.approved}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-xl space-y-1">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Rejected</div>
          <div className="text-xl font-bold text-rose-400 tracking-tight">{stats.rejected}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-xl space-y-1">
          <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Startups</div>
          <div className="text-xl font-bold text-indigo-400 tracking-tight">{stats.startups}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-xl space-y-1">
          <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">Investors</div>
          <div className="text-xl font-bold text-sky-400 tracking-tight">{stats.investors}</div>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-xl space-y-1">
          <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Freelancers</div>
          <div className="text-xl font-bold text-purple-400 tracking-tight">{stats.freelancers}</div>
        </div>
      </div>

      {/* Global Error Banner */}
      {actionError && !actionUser && (
        <div className="p-4 bg-rose-950/50 border border-rose-900/80 text-rose-300 text-xs rounded-2xl shadow-inner">
          {actionError}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
        {['pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-2xl capitalize transition-all duration-200 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab} Queue
          </button>
        ))}
      </div>

      {/* Verification Applications Table */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No {activeTab} applications found in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-4 font-semibold">Applicant</th>
                  <th className="pb-3 px-4 font-semibold">Role</th>
                  <th className="pb-3 px-4 font-semibold">Document</th>
                  <th className="pb-3 px-4 font-semibold">Submitted At</th>
                  <th className="pb-3 px-4 font-semibold">Review Details</th>
                  <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((user) => {
                  const doc = user.verification || {};
                  return (
                    <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Applicant details */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-slate-400 text-[10px]">{user.email}</div>
                      </td>

                      {/* Role badge */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider bg-indigo-950/60 text-indigo-400 border border-indigo-900/80 shadow-sm">
                          {user.role}
                        </span>
                      </td>

                      {/* Document Viewer */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{doc.documentType || 'Not specified'}</div>
                        {doc.documentUrl ? (
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 mt-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                          >
                            <span>View Cloudinary Document</span>
                            <span className="text-[9px] text-slate-400">↗</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[11px]">No file attached</span>
                        )}
                      </td>

                      {/* Submitted Timestamp */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}
                      </td>

                      {/* Audit Review Details */}
                      <td className="py-3.5 px-4">
                        {doc.reviewedAt ? (
                          <div className="text-[11px] space-y-0.5">
                            <div className="text-slate-300">
                              By: <span className="font-medium text-white">{doc.reviewedBy?.name || 'Admin'}</span>
                            </div>
                            <div className="text-slate-500 text-[10px]">
                              {new Date(doc.reviewedAt).toLocaleString()}
                            </div>
                            {doc.rejectionReason && (
                              <div
                                className="mt-1 text-rose-400 bg-rose-950/40 border border-rose-900/80 rounded-xl px-3 py-1.5 max-w-xs truncate shadow-inner"
                                title={doc.rejectionReason}
                              >
                                Reason: {doc.rejectionReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-900/80 shadow-sm">
                            Awaiting Review
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOpenActionModal(user, 'approve')}
                              className="px-3.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(user, 'reject')}
                              className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {doc.documentUrl && (
                          <button
                            onClick={() => handleOpenActionModal(user, 'delete')}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-900/80 rounded-xl text-[11px] font-semibold transition shadow-sm"
                            title="Purge Cloudinary Document"
                          >
                            Purge
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Review Modal */}
      {actionUser && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div>
              <h3 className="text-base font-bold text-white capitalize tracking-tight">
                {actionType} Verification
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Applicant: <span className="font-semibold text-slate-200">{actionUser.name}</span> ({actionUser.email})
              </p>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              {actionType === 'reject' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Rejection Reason <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide specific feedback (e.g., ID photo is blurry, name mismatch, document expired)..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    This reason will be visible directly on the applicant's profile dashboard.
                  </p>
                </div>
              )}

              {actionType === 'approve' && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 rounded-2xl text-xs leading-relaxed shadow-inner">
                  Approving will grant <strong>{actionUser.name}</strong> immediate access to network matchmaking, AI recommendations, and outbound connection requests.
                </div>
              )}

              {actionType === 'delete' && (
                <div className="p-4 bg-rose-950/30 border border-rose-900/50 text-rose-300 rounded-2xl text-xs leading-relaxed shadow-inner">
                  This action will permanently delete the uploaded asset from Cloudinary and reset the applicant's verification status to <code>not_submitted</code>.
                </div>
              )}

              {actionError && (
                <div className="text-xs font-medium text-rose-300 bg-rose-950/50 border border-rose-900/80 p-3.5 rounded-2xl shadow-inner">
                  {actionError}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2.5 text-white text-xs font-semibold rounded-xl shadow-lg transition disabled:opacity-50 ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                  }`}
                >
                  {actionLoading ? 'Processing...' : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}