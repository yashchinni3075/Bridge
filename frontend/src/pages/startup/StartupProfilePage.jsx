import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import VerificationPanel from '../../components/VerificationPanel';

export default function StartupProfilePage() {
  const [formData, setFormData] = useState({
    startupName: '',
    founderName: '',
    description: '',
    domain: '',
    stage: 'Early Stage',
    fundingRequired: '',
    website: '',
    pitchDeckUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/startups/profile/me');
      if (res.data.profile) {
        const p = res.data.profile;
        setFormData({
          startupName: p.startupName || '',
          founderName: p.founderName || '',
          description: p.description || '',
          domain: p.domain || '',
          stage: p.stage || 'Early Stage',
          fundingRequired: p.fundingRequired || '',
          website: p.website || '',
          pitchDeckUrl: p.pitchDeckUrl || '',
        });
      }
    } catch (err) {
      console.error('Error fetching startup profile:', err);
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
      const res = await api.put('/startups/profile', formData);
      if (res.data.profile) {
        const p = res.data.profile;
        setFormData({
          startupName: p.startupName || '',
          founderName: p.founderName || '',
          description: p.description || '',
          domain: p.domain || '',
          stage: p.stage || 'Early Stage',
          fundingRequired: p.fundingRequired || '',
          website: p.website || '',
          pitchDeckUrl: p.pitchDeckUrl || '',
        });
      }
      setFeedback({ type: 'success', text: 'Startup profile updated successfully!' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update startup profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    setEvaluationResult(null);
    try {
      const res = await api.post('/startups/evaluate', {
        description: formData.description,
        pitchDeckUrl: formData.pitchDeckUrl,
      });
      setEvaluationResult(res.data);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'AI evaluation failed.',
      });
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading startup profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Startup Profile & Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">
          Fill in your venture details to attract investors and talent.
        </p>
      </div>

      {/* Verification Lifecycle Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Domain & Compliance Verification
        </h2>
        <VerificationPanel />
      </div>

      {/* Profile Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Startup Profile
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Startup Name</label>
              <input
                type="text"
                name="startupName"
                value={formData.startupName}
                onChange={handleChange}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Founder Name</label>
              <input
                type="text"
                name="founderName"
                value={formData.founderName}
                onChange={handleChange}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your venture, product market fit, and core technology..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Domain / Industry</label>
              <input
                type="text"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="e.g. Fintech, AI, SaaS"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stage</label>
              <select
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Idea Stage">Idea Stage</option>
                <option value="Early Stage">Early Stage</option>
                <option value="Growth Stage">Growth Stage</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Funding Required ($)</label>
              <input
                type="number"
                name="fundingRequired"
                value={formData.fundingRequired}
                onChange={handleChange}
                placeholder="50000"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourstartup.com"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pitch Deck URL</label>
              <input
                type="url"
                name="pitchDeckUrl"
                value={formData.pitchDeckUrl}
                onChange={handleChange}
                placeholder="https://cloudinary.com/pitchdeck.pdf"
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
              {saving ? 'Saving...' : 'Save Startup Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* AI Pitch Evaluation Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              AI Pitch Evaluation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated institutional VC feedback on your venture metrics and pitch narrative.
            </p>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={evaluating || !formData.description}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
          >
            {evaluating ? 'Evaluating...' : 'Evaluate Pitch Deck'}
          </button>
        </div>

        {!formData.description && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl">
            Provide a description or pitch deck URL in your profile above to run an AI assessment.
          </div>
        )}

        {evaluationResult && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-900">Evaluation Score: {evaluationResult.score || 'N/A'} / 100</div>
            <p className="text-slate-700">{evaluationResult.feedback || JSON.stringify(evaluationResult)}</p>
          </div>
        )}
      </div>
    </div>
  );
}