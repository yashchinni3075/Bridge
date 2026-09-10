import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import VerificationPanel from '../../components/VerificationPanel';

export default function FreelancerProfile() {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    domain: 'General Software',
    experience: '1-3 years',
    skills: '',
    interests: '',
    portfolio: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/freelancers/profile/me');
      if (res.data.profile) {
        const p = res.data.profile;
        setFormData({
          name: p.name || res.data.user?.name || '',
          bio: p.bio || '',
          domain: p.domain || 'General Software',
          experience: p.experience || '1-3 years',
          skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
          interests: Array.isArray(p.interests) ? p.interests.join(', ') : '',
          portfolio: p.portfolio || '',
        });
      }
    } catch (err) {
      console.error('Error fetching freelancer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map((i) => i.trim()).filter(Boolean),
      };

      const res = await api.post('/freelancers/profile', payload);
      if (res.data.profile) {
        const p = res.data.profile;
        setFormData({
          name: p.name || '',
          bio: p.bio || '',
          domain: p.domain || 'General Software',
          experience: p.experience || '1-3 years',
          skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
          interests: Array.isArray(p.interests) ? p.interests.join(', ') : '',
          portfolio: p.portfolio || '',
        });
      }
      setFeedback({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading your profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Freelancer Profile & Verification</h1>
        <p className="text-xs text-slate-500 mt-1">
          Keep your professional portfolio and identity credentials up to date to access projects.
        </p>
      </div>

      {/* Identity Verification Lifecycle Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Compliance & Verification
        </h2>
        <VerificationPanel />
      </div>

      {/* Profile Details Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Professional Details
        </h2>

        {feedback.text && (
          <div
            className={`p-3 text-xs rounded-xl mb-4 font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Domain</label>
              <input
                type="text"
                name="domain"
                placeholder="e.g. Fintech, Web3, Mobile Apps"
                value={formData.domain}
                onChange={handleChange}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / Summary</label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Tell founders about your engineering philosophy and core strengths..."
              value={formData.bio}
              onChange={handleChange}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Level</label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Entry (< 1 year)">Entry (&lt; 1 year)</option>
                <option value="1-3 years">1-3 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5+ years Senior">5+ years Senior</option>
                <option value="Lead / Architect">Lead / Architect</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skills (comma separated)
              </label>
              <input
                type="text"
                name="skills"
                placeholder="React, Node.js, TypeScript, PostgreSQL"
                value={formData.skills}
                onChange={handleChange}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Interests & Focus Areas (comma separated)
            </label>
            <input
              type="text"
              name="interests"
              placeholder="Distributed Systems, Cloud Native, LLM Fine-tuning"
              value={formData.interests}
              onChange={handleChange}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio Site</label>
            <input
              type="url"
              name="portfolio"
              placeholder="https://yourportfolio.dev"
              value={formData.portfolio}
              onChange={handleChange}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}