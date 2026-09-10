import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ConnectionsHub() {
  const [activeTab, setActiveTab] = useState('received');
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [rRes, sRes, cRes] = await Promise.all([
        api.get('/connections/received'),
        api.get('/connections/sent'),
        api.get('/connections/accepted'),
      ]);
      setReceived(rRes.data.requests || []);
      setSent(sRes.data.requests || []);
      setConnections(cRes.data.connections || []);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRespond = async (connectionId, action) => {
    try {
      setActionLoading(connectionId);
      await api.patch(`/connections/${connectionId}/respond`, { action });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Connections Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your network, review incoming invitations, and track sent requests.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'received'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Received Requests
          {received.length > 0 && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              {received.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('connections')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'connections'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Connections
          {connections.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {connections.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'sent'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sent Requests
          {sent.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {sent.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading network state...</div>
      ) : (
        <div>
          {/* RECEIVED TAB */}
          {activeTab === 'received' && (
            <div className="space-y-3">
              {received.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                  No incoming connection requests.
                </div>
              ) : (
                received.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{req.requester?.name}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {req.requesterRole}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{req.requester?.email}</div>
                      {req.note && (
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          "{req.note}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRespond(req._id, 'reject')}
                        disabled={actionLoading === req._id}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(req._id, 'accept')}
                        disabled={actionLoading === req._id}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CONNECTIONS TAB */}
          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.length === 0 ? (
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                  No active connections yet. Explore startups, investors, or freelancers to connect!
                </div>
              ) : (
                connections.map((c) => (
                  <div
                    key={c._id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{c.connectedUser?.name}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                          Connected
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.connectedUser?.email}</div>
                      <div className="text-[11px] text-slate-400 mt-2">
                        Type: {c.connectionType === 'startup_investor' ? 'Startup ↔ Investor' : 'Startup ↔ Freelancer'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SENT TAB */}
          {activeTab === 'sent' && (
            <div className="space-y-3">
              {sent.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                  You haven't sent any pending connection requests.
                </div>
              ) : (
                sent.map((s) => (
                  <div
                    key={s._id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{s.recipient?.name}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {s.recipientRole}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.recipient?.email}</div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        s.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {s.status === 'pending' ? 'Pending Review' : 'Declined'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}