import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const STAGE_OPTIONS = [
  { value: 'Idea', label: 'Idea Stage' },
  { value: 'MVP', label: 'MVP' },
  { value: 'Early Stage', label: 'Early Stage' },
  { value: 'Growth', label: 'Growth Stage' },
  { value: 'Scaling', label: 'Scaling' },
];

const EMPTY_FORM = {
  startupName: '',
  founderName: '',
  email: '',
  phone: '',
  pitch: '',
  description: '',
  domain: 'Technology',
  stage: 'Early Stage',
  fundingRequirement: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  traction: '',
  team: [],
  teamSkills: [],
  requiredSkills: [],
  openRoles: [],
  socialLinks: [],
};

const inputClass =
  'w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner placeholder:text-slate-600';
const labelClass = 'block text-xs font-semibold text-slate-300 mb-1.5';
const cardClass = 'bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl';
const chipClass = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-800/80 border border-slate-700 text-slate-200';

const stageLabel = (value) => STAGE_OPTIONS.find((s) => s.value === value)?.label || value || '';

const looksLikeUrl = (value) => {
  const t = String(value || '').trim();
  if (!t) return false;
  const candidate = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(candidate);
    return u.hostname.includes('.');
  } catch (err) {
    return false;
  }
};

export default function StartupProfileForm({ onProfileSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(0);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [skillDraft, setSkillDraft] = useState({ teamSkills: '', requiredSkills: '', openRoles: '' });
  const [teamDraft, setTeamDraft] = useState({ name: '', role: '', experience: '' });
  const [socialDraft, setSocialDraft] = useState({ label: '', url: '' });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/startups/profile/me');
      const p = res.data.profile || {};
      const user = res.data.user || {};
      setCompletion(Number(res.data.profileCompletion) || 0);
      setForm({
        startupName: p.startupName || '',
        founderName: p.founderName || '',
        email: user.email || '',
        phone: p.phone || '',
        pitch: p.pitch || '',
        description: p.description || '',
        domain: p.domain || 'Technology',
        stage: STAGE_OPTIONS.some((s) => s.value === p.stage) ? p.stage : 'Early Stage',
        fundingRequirement: p.fundingRequirement === 0 || p.fundingRequirement == null ? '' : String(p.fundingRequirement),
        location: p.location || '',
        website: p.website || '',
        linkedin: p.linkedin || '',
        github: p.github || '',
        traction: p.traction || '',
        team: Array.isArray(p.team) ? p.team.map((m) => ({ name: m.name || '', role: m.role || '', experience: m.experience || '' })) : [],
        teamSkills: Array.isArray(p.teamSkills) ? p.teamSkills : [],
        requiredSkills: Array.isArray(p.requiredSkills) ? p.requiredSkills : [],
        openRoles: Array.isArray(p.openRoles) ? p.openRoles : [],
        socialLinks: Array.isArray(p.socialLinks) ? p.socialLinks.map((s) => ({ label: s.label || '', url: s.url || '' })) : [],
      });
      setFeedback({ type: '', text: '' });
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to load saved profile.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const addSkill = (key) => {
    const raw = skillDraft[key];
    const entries = String(raw || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (entries.length === 0) return;
    setForm((prev) => {
      const existing = new Set((prev[key] || []).map((s) => s.toLowerCase()));
      const next = [...(prev[key] || [])];
      entries.forEach((entry) => {
        if (!existing.has(entry.toLowerCase())) {
          existing.add(entry.toLowerCase());
          next.push(entry);
        }
      });
      return { ...prev, [key]: next };
    });
    setSkillDraft((prev) => ({ ...prev, [key]: '' }));
  };

  const removeSkill = (key, index) => {
    setForm((prev) => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== index) }));
  };

  const addTeamMember = () => {
    const name = teamDraft.name.trim();
    if (!name) return;
    setForm((prev) => ({
      ...prev,
      team: [...(prev.team || []), { name, role: teamDraft.role.trim(), experience: teamDraft.experience.trim() }],
    }));
    setTeamDraft({ name: '', role: '', experience: '' });
  };

  const removeTeamMember = (index) => {
    setForm((prev) => ({ ...prev, team: (prev.team || []).filter((_, i) => i !== index) }));
  };

  const addSocialLink = () => {
    if (!socialDraft.url.trim()) return;
    if (!looksLikeUrl(socialDraft.url)) {
      setFeedback({ type: 'error', text: 'Social link must be a valid URL.' });
      return;
    }
    setForm((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { label: socialDraft.label.trim() || 'Link', url: socialDraft.url.trim() }],
    }));
    setSocialDraft({ label: '', url: '' });
    setFeedback({ type: '', text: '' });
  };

  const removeSocialLink = (index) => {
    setForm((prev) => ({ ...prev, socialLinks: (prev.socialLinks || []).filter((_, i) => i !== index) }));
  };

  const handleReset = () => {
    loadProfile();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    if (!form.startupName.trim()) {
      setFeedback({ type: 'error', text: 'Startup name is required.' });
      return;
    }
    const fundingNum = form.fundingRequirement === '' ? 0 : Number(form.fundingRequirement);
    if (Number.isNaN(fundingNum) || fundingNum < 0) {
      setFeedback({ type: 'error', text: 'Funding requirement must be a non-negative number.' });
      return;
    }
    const urlFields = [
      { name: 'Website URL', value: form.website },
      { name: 'LinkedIn URL', value: form.linkedin },
      { name: 'GitHub URL', value: form.github },
    ];
    const badUrl = urlFields.find((f) => f.value && !looksLikeUrl(f.value));
    if (badUrl) {
      setFeedback({ type: 'error', text: `${badUrl.name} is invalid.` });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        startupName: form.startupName,
        founderName: form.founderName,
        phone: form.phone,
        pitch: form.pitch,
        description: form.description,
        domain: form.domain,
        stage: form.stage,
        fundingRequirement: fundingNum,
        location: form.location,
        website: form.website,
        linkedin: form.linkedin,
        github: form.github,
        traction: form.traction,
        team: form.team,
        teamSkills: form.teamSkills,
        requiredSkills: form.requiredSkills,
        openRoles: form.openRoles,
        socialLinks: form.socialLinks,
      };
      const res = await api.put('/startups/profile', payload);
      const savedProfile = res.data.profile || {};
      setCompletion(Number(res.data.profileCompletion) || 0);
      setFeedback({ type: 'success', text: 'Startup profile saved successfully.' });
      if (onProfileSaved) onProfileSaved(savedProfile);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to save startup profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-10 text-center shadow-xl">
        <p className="text-xs text-slate-400">Loading startup profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Completion summary */}
      <div className={cardClass}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Profile Completion</h3>
            <p className="text-xs text-slate-400 mt-0.5">Based on the data saved in your profile.</p>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">{completion}<span className="text-slate-500 text-base">%</span></div>
        </div>
        <div className="mt-4 h-2.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
          />
        </div>
      </div>

      {feedback.text && (
        <div className={`p-4 text-xs rounded-2xl font-medium shadow-inner ${
          feedback.type === 'success'
            ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
            : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Basic Information */}
      <div className={cardClass}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Startup Name <span className="text-rose-400">*</span></label>
            <input type="text" name="startupName" value={form.startupName} onChange={(e) => setField('startupName', e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Founder Name</label>
            <input type="text" name="founderName" value={form.founderName} onChange={(e) => setField('founderName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email (from account)</label>
            <input type="email" value={form.email} readOnly disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
            <p className="text-[10px] text-slate-500 mt-1">Email is linked to your login account and cannot be changed here.</p>
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="text" name="phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+1 555 000 1234" className={inputClass} />
          </div>
        </div>
        <div className="mt-5">
          <label className={labelClass}>Tagline / One-Line Pitch</label>
          <input type="text" name="pitch" value={form.pitch} onChange={(e) => setField('pitch', e.target.value)} placeholder="e.g. AI-powered enterprise software platform" className={inputClass} />
        </div>
        <div className="mt-5">
          <label className={labelClass}>Full Description</label>
          <textarea name="description" rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Describe your platform, target market, and technical advantage..." className={inputClass} />
        </div>
      </div>

      {/* Startup Details */}
      <div className={cardClass}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Startup Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Industry / Domain</label>
            <input type="text" name="domain" value={form.domain} onChange={(e) => setField('domain', e.target.value)} placeholder="e.g. Fintech, AI, SaaS" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Startup Stage</label>
            <select name="stage" value={form.stage} onChange={(e) => setField('stage', e.target.value)} className={inputClass}>
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Funding Requirement (USD)</label>
            <input type="number" name="fundingRequirement" min="0" step="1" value={form.fundingRequirement} onChange={(e) => setField('fundingRequirement', e.target.value)} placeholder="50000" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
          <div>
            <label className={labelClass}>City / Location</label>
            <input type="text" name="location" value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="Bengaluru, India" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Website URL</label>
            <input type="text" name="website" value={form.website} onChange={(e) => setField('website', e.target.value)} placeholder="https://yourstartup.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>LinkedIn URL</label>
            <input type="text" name="linkedin" value={form.linkedin} onChange={(e) => setField('linkedin', e.target.value)} placeholder="https://linkedin.com/company/xyz" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>GitHub URL</label>
            <input type="text" name="github" value={form.github} onChange={(e) => setField('github', e.target.value)} placeholder="https://github.com/xyz" className={inputClass} />
          </div>
        </div>
        <div className="mt-5">
          <label className={labelClass}>Key Metrics / Traction</label>
          <textarea name="traction" rows={3} value={form.traction} onChange={(e) => setField('traction', e.target.value)} placeholder="e.g. $10k MRR, 500 active pilots, 3 enterprise contracts" className={inputClass} />
        </div>

        {/* Social links */}
        <div className="mt-5 pt-5 border-t border-slate-800/80">
          <label className={labelClass}>Other Social Links</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={socialDraft.label} onChange={(e) => setSocialDraft((prev) => ({ ...prev, label: e.target.value }))} placeholder="Label (e.g. X / Twitter)" className={inputClass} />
            <input type="text" value={socialDraft.url} onChange={(e) => setSocialDraft((prev) => ({ ...prev, url: e.target.value }))} placeholder="https://..." className={inputClass} />
            <button type="button" onClick={addSocialLink} className="px-4 py-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-2xl transition shrink-0">
              Add Link
            </button>
          </div>
          {form.socialLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.socialLinks.map((link, index) => (
                <span key={index} className={chipClass}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">{link.label}</a>
                  <button type="button" onClick={() => removeSocialLink(index)} className="text-slate-500 hover:text-rose-400" aria-label={`Remove ${link.label}`}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team & Skills */}
      <div className={cardClass}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Team & Skills</h3>

        <div className="pt-1">
          <label className={labelClass}>Team Members</label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="text" value={teamDraft.name} onChange={(e) => setTeamDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" className={inputClass} />
            <input type="text" value={teamDraft.role} onChange={(e) => setTeamDraft((prev) => ({ ...prev, role: e.target.value }))} placeholder="Role" className={inputClass} />
            <input type="text" value={teamDraft.experience} onChange={(e) => setTeamDraft((prev) => ({ ...prev, experience: e.target.value }))} placeholder="Experience" className={inputClass} />
            <button type="button" onClick={addTeamMember} className="px-4 py-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-2xl transition">
              Add Member
            </button>
          </div>
          {form.team.length > 0 && (
            <div className="mt-3 space-y-2">
              {form.team.map((member, index) => (
                <div key={index} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-950/60">
                  <div className="text-xs text-slate-200">
                    <span className="font-semibold">{member.name}</span>
                    {member.role && (<span className="text-slate-400"> • {member.role}</span>)}
                    {member.experience && (<span className="text-slate-500"> • {member.experience}</span>)}
                  </div>
                  <button type="button" onClick={() => removeTeamMember(index)} className="text-rose-400 hover:text-rose-300 text-sm font-bold px-2" aria-label={`Remove ${member.name}`}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {[
          { key: 'teamSkills', label: 'Skills Already In The Team', placeholder: 'e.g. React, Node.js, Go' },
          { key: 'requiredSkills', label: 'Required Skills', placeholder: 'e.g. Machine Learning, DevOps' },
          { key: 'openRoles', label: 'Open Roles', placeholder: 'e.g. Backend Engineer, Product Designer' },
        ].map((section) => (
          <div key={section.key} className="mt-5 pt-5 border-t border-slate-800/80">
            <label className={labelClass}>{section.label}</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={skillDraft[section.key]}
                onChange={(e) => setSkillDraft((prev) => ({ ...prev, [section.key]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(section.key); } }}
                placeholder={section.placeholder}
                className={inputClass}
              />
              <button type="button" onClick={() => addSkill(section.key)} className="px-4 py-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-2xl transition shrink-0">
                Add
              </button>
            </div>
            {form[section.key].length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form[section.key].map((item, index) => (
                  <span key={index} className={chipClass}>
                    {item}
                    <button type="button" onClick={() => removeSkill(section.key, index)} className="text-slate-500 hover:text-rose-400" aria-label={`Remove ${item}`}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={handleReset} disabled={saving} className="px-6 py-3 text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-800 rounded-2xl transition disabled:opacity-50">
          Reset
        </button>
        <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Startup Profile'}
        </button>
      </div>

      <div className="text-right text-[10px] text-slate-600">Stage values mapped to “{stageLabel(form.stage)}”.</div>
    </form>
  );
}