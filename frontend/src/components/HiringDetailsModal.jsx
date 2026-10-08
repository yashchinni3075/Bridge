import React from 'react';

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
    <span className="text-xs text-white">{value || '-'}</span>
  </div>
);

const SkillBadges = ({ skills, color = 'indigo' }) => {
  if (!skills || skills.length === 0) return <span className="text-xs text-slate-500">None</span>;
  const colorMap = {
    indigo: 'bg-indigo-950/60 text-indigo-300 border-indigo-900/80',
    violet: 'bg-violet-950/60 text-violet-300 border-violet-900/80',
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s, idx) => (
        <span key={idx} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${colorMap[color] || colorMap.indigo}`}>
          {s}
        </span>
      ))}
    </div>
  );
};

const formatSalary = (salary) => {
  if (!salary) return '-';
  const min = Number(salary.min) || 0;
  const max = Number(salary.max) || 0;
  const cur = salary.currency === 'INR' ? '\u20B9' : '$';
  if (min > 0 && max > 0) return `${cur}${min.toLocaleString('en-IN')} - ${cur}${max.toLocaleString('en-IN')}`;
  if (min > 0) return `From ${cur}${min.toLocaleString('en-IN')}`;
  if (max > 0) return `Up to ${cur}${max.toLocaleString('en-IN')}`;
  return '-';
};

export default function HiringDetailsModal({ open, hiring, startupName, onClose, onApply }) {
  if (!open || !hiring) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-bold text-white tracking-tight truncate">{hiring.jobTitle || 'Untitled Role'}</h3>
            <p className="text-[11px] text-slate-400">{startupName || 'Startup'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center text-sm transition flex-shrink-0"
          >
            &#10005;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-5 space-y-5 overflow-y-auto">
          {/* Quick meta badges */}
          <div className="flex flex-wrap gap-2">
            {hiring.employmentType && (
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-semibold">
                {hiring.employmentType}
              </span>
            )}
            {hiring.workMode && (
              <span className="px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-900/80 rounded-xl text-[10px] font-semibold">
                {hiring.workMode}
              </span>
            )}
            {hiring.domain && (
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-semibold">
                {hiring.domain}
              </span>
            )}
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Location" value={hiring.location || 'Remote'} />
            <DetailRow label="Salary / CTC" value={formatSalary(hiring.salary)} />
            <DetailRow label="Vacancies" value={hiring.vacancies ? `${hiring.vacancies} seat${hiring.vacancies > 1 ? 's' : ''}` : '-'} />
            {hiring.experienceRequired && (
              <DetailRow label="Experience Required" value={hiring.experienceRequired} />
            )}
          </div>

          {/* Job Description */}
          {hiring.jobDescription && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Description</span>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{hiring.jobDescription}</p>
            </div>
          )}

          {/* Skills */}
          {hiring.requiredSkills && hiring.requiredSkills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Required Skills</span>
              <SkillBadges skills={hiring.requiredSkills} />
            </div>
          )}

          {hiring.preferredSkills && hiring.preferredSkills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Preferred Skills</span>
              <SkillBadges skills={hiring.preferredSkills} color="violet" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 pb-6 pt-2 flex items-center gap-3 border-t border-slate-800/60 mt-auto">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm"
          >
            Close
          </button>
          <button
            onClick={() => {
              if (onApply) onApply();
            }}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
