import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export default function ConnectionsPage() {
  const [tab, setTab] = useState('recommendations'); // 'recommendations' | 'received' | 'sent'
  const [recommendations, setRecommendations] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [recRes, recvdRes, sentRes] = await Promise.all([
        api.get('/matches/recommendations').catch(() => ({ data: { recommendations: [] } })),
        api.get('/connections/received').catch(() => ({ data: { connections: [] } })),
        api.get('/connections/sent').catch(() => ({ data: { connections: [] } })),
      ]);

      setRecommendations(recRes.data?.recommendations || []);
      setReceived(recvdRes.data?.connections || []);
      setSent(sentRes.data?.connections || []);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleSendConnection = async (targetId) => {
    try {
      await api.post('/connections', {
        receiverId: targetId,
        message: customMsg.trim() || 'Hello, I would like to connect on Bridge.',
      });
      showFeedback('Connection request sent!');
      setConnectingId(null);
      setCustomMsg('');
      loadData(false);
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to send request.');
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.patch(`/connections/${id}/accept`);
      setReceived((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: 'accepted' } : c))
      );
      showFeedback('Connection accepted!');
      loadData(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept connection');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/connections/${id}/reject`);
      setReceived((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: 'rejected' } : c))
      );
      showFeedback('Connection rejected.');
      loadData(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject connection');
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setConnectingId(null);
    setCustomMsg('');
    loadData(false); // Refreshes received and sent lists when toggling tabs
  };

  const pendingReceivedCount = received.filter((r) => r?.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto my-10 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Connections & Network</h1>
            <button
              onClick={() => loadData(true)}
              title="Refresh Data"
              className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              ↻ Refresh
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Discover compatible partners and manage direct invitations.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg text-sm">
          <button
            onClick={() => handleTabChange('recommendations')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              tab === 'recommendations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Recommended Matches
          </button>
          <button
            onClick={() => handleTabChange('received')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              tab === 'received' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Received {pendingReceivedCount > 0 && `(${pendingReceivedCount})`}
          </button>
          <button
            onClick={() => handleTabChange('sent')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              tab === 'sent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            Sent Requests ({sent.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 text-sm rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium">
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500">Loading connections ecosystem...</div>
      ) : (
        <>
          {/* TAB 1: RECOMMENDATIONS */}
          {tab === 'recommendations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-400 text-sm">
                  No new recommendations found. Ensure your profile fields (industries, stages, skills) are filled out.
                </div>
              ) : (
                recommendations.map((rec, idx) => (
                  <div
                    key={rec.targetId || `rec-${idx}`}
                    className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {rec.targetRole || 'Partner'}
                          </span>
                          <h3 className="text-base font-semibold text-gray-900 mt-1">{rec.name || 'Anonymous User'}</h3>
                          <p className="text-xs text-gray-500">{rec.secondaryInfo || 'Bridge Member'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-600">
                            {rec.compatibility || 0}% Match
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        {(rec.breakdown || []).map((item, bIdx) => (
                          <div key={bIdx} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      {connectingId === rec.targetId ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Add an optional note..."
                            value={customMsg}
                            onChange={(e) => setCustomMsg(e.target.value)}
                            maxLength={500}
                            className="w-full text-xs p-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendConnection(rec.targetId)}
                              className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition"
                            >
                              Send Request
                            </button>
                            <button
                              onClick={() => {
                                setConnectingId(null);
                                setCustomMsg('');
                              }}
                              className="text-xs px-2 py-1.5 text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConnectingId(rec.targetId)}
                          className="w-full py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: RECEIVED REQUESTS */}
          {tab === 'received' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {received.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No received invitations.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {received.map((c) => (
                    <div key={c._id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-800">
                            {c.senderId?.name || 'Deactivated User'}
                          </span>
                          <span className="text-xs capitalize px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {c.senderRole}
                          </span>
                        </div>
                        {c.message && <p className="text-xs text-gray-500 mt-1">"{c.message}"</p>}
                        <div className="text-[11px] text-gray-400 mt-1">
                          Sent: {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {c.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleAccept(c._id)}
                              className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(c._id)}
                              className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`text-xs px-2.5 py-1 rounded font-medium capitalize ${
                              c.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SENT REQUESTS */}
          {tab === 'sent' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {sent.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No sent requests.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sent.map((c) => (
                    <div key={c._id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-800">
                            {c.receiverId?.name || 'Deactivated User'}
                          </span>
                          <span className="text-xs capitalize px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {c.receiverRole}
                          </span>
                        </div>
                        {c.message && <p className="text-xs text-gray-500 mt-1">"{c.message}"</p>}
                        <div className="text-[11px] text-gray-400 mt-1">
                          Sent: {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded font-medium capitalize ${
                            c.status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-700'
                              : c.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}