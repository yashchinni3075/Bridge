import React from 'react';

export default function AdminConnections() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h2 className="text-base font-semibold text-slate-800">Ecosystem Connections</h2>
      <p className="text-sm text-slate-500">
        Monitor engagement pipelines between Startups, Investors, and Freelancers.
      </p>
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-700">Live Telemetry:</div>
        <div>* Profile-to-profile discovery is operational.</div>
        <div>* Direct messaging and formal deal invitations will connect here in the next milestone.</div>
      </div>
    </div>
  );
}