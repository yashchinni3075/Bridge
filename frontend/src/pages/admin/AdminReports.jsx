import React from 'react';

export default function AdminReports() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h2 className="text-base font-semibold text-slate-800">Platform Reports & Flags</h2>
      <p className="text-sm text-slate-500">
        Review user reports, disputed gig listings, or flag suspicious pitch deck documents.
      </p>
      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
        No active flags reported by community members.
      </div>
    </div>
  );
}