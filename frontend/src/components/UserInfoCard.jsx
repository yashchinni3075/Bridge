import React, { useState } from 'react';

const CopyButton = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
      title={`Copy ${label}`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const InfoRow = ({ label, value, copyable }) => {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[11px] text-slate-500 font-medium flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-200 font-semibold text-right break-all flex items-center gap-2">
        <span>{value}</span>
        {copyable && <CopyButton label={label} value={value} />}
      </span>
    </div>
  );
};

export default function UserInfoCard({ user, role, profile, onClose }) {
  if (!user) return null;

  const name = user.name || profile?.name || 'Unknown';
  const email = user.email || profile?.email || '';
  const roleLabel = role || user.role || '';
  const domain = profile?.domain || '';
  const experience = profile?.experience || '';
  const skills = profile?.skills || [];
  const bio = profile?.bio || profile?.headline || '';
  const location = profile?.location || '';
  const portfolio = profile?.portfolio || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white text-sm">
                {name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{name}</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-1 max-h-[60vh] overflow-y-auto">
          <InfoRow label="Email" value={email} copyable />
          <InfoRow label="Domain" value={domain} />
          <InfoRow label="Experience" value={experience} />
          <InfoRow label="Location" value={location} />
          <InfoRow label="Portfolio" value={portfolio} copyable />

          {bio && (
            <div className="pt-2">
              <div className="text-[11px] text-slate-500 font-medium mb-1">Bio</div>
              <p className="text-xs text-slate-300 leading-relaxed">{bio}</p>
            </div>
          )}

          {skills.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] text-slate-500 font-medium mb-1.5">Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-[10px] font-semibold bg-slate-950/80 border border-slate-800/80 text-slate-300 rounded-lg"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
