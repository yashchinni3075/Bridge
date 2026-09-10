import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import VerificationPanel from '../../components/VerificationPanel';

export default function InvestorProfilePage() {
  const [formData, setFormData] = useState({
    investorName: '',
    firmName: '',
    bio: '',
    investmentFocus: '',
    ticketSize: '',
    preferredStage: 'Early Stage',
    linkedin: '',
    portfolioWebsite: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/investors/profile/me');
      if (res.data.profile) {
        const p = res.data.profile;
        setFormData({
          investorName: p.investorName || res.data.user?.name || '',
          firmName: p.firmName || '',
          bio: p.bio || '',
          investmentFocus: Array.isArray(p.investmentFocus) ? p.investmentFocus.join(', ') : p.investmentFocus || '',
          ticketSize: p.ticketSize || '',
          preferredStage: p.preferredStage || 'Early Stage',
          linkedin: p.linkedin || '',
          portfolioWebsite: p.portfolioWebsite || '',
        });
      }
    } catch (err) {
      console.error('Error fetching investor profile:', err);
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
        investmentFocus: formData.investmentFocus.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const res = await api.put('/investors/profile', payload);
      if (res.data.profile) {
        const p = res.data.profile;
        setFormData({
          investorName: p.investorName || '',
          firmName: p.firmName || '',
          bio: p.bio || '',
          investmentFocus: Array.isArray(p.investmentFocus) ? p.investmentFocus.join(', ') : '',
          ticketSize: p.ticketSize || '',
          preferredStage: p.preferredStage || 'Early Stage',
          linkedin: p.linkedin || '',
          portfolioWebsite: p.portfolioWebsite || '',
        });
      }
      setFeedback({ type: 'success', text: 'Investor profile updated successfully!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update investor profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading investor profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investor Profile & Portfolio</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your investment criteria, fund details, and compliance credentials.
        </p>
      </div>

      {/* Verification Lifecycle Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Accreditation & Compliance
        </h2>
        <VerificationPanel role="investor" />
      </div>

      {/* Profile Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Investment Portfolio Details
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Investor / Partner Name</label>
              <input
                type="text"
                name="investorName"
                value={formData.investorName}
                onChange={handleChange}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Firm / Fund Name</label>
              <input
                type="text"
                name="firmName"
                value={formData.firmName}
                onChange={handleChange}
                placeholder="e.g. Apex Capital Ventures"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / Investment Thesis</label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe your fund thesis, target metrics, and value-add strategy..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Investment Focus (comma separated)</label>
              <input
                type="text"
                name="investmentFocus"
                value={formData.investmentFocus}
                onChange={handleChange}
                placeholder="Fintech, SaaS, AI, Web3"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Size ($)</label>
              <input
                type="text"
                name="ticketSize"
                value={formData.ticketSize}
                onChange={handleChange}
                placeholder="e.g. $25k - $100k"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Stage</label>
              <select
                name="preferredStage"
                value={formData.preferredStage}
                onChange={handleChange}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Idea Stage">Idea Stage</option>
                <option value="Early Stage">Early Stage</option>
                <option value="Growth Stage">Growth Stage</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/investor"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio / Fund Website</label>
              <input
                type="url"
                name="portfolioWebsite"
                value={formData.portfolioWebsite}
                onChange={handleChange}
                placeholder="https://apexventures.com"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Investor Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}