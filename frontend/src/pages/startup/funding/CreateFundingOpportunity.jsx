import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const FUNDING_TYPES = [
  { value: 'equity', label: 'Equity' },
  { value: 'safe', label: 'SAFE' },
  { value: 'convertible_note', label: 'Convertible Note' },
  { value: 'debt', label: 'Debt / Loan' },
  { value: 'grant', label: 'Grant' },
  { value: 'other', label: 'Other' },
];

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'];

export default function CreateFundingOpportunity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    fundingType: 'equity',
    amountRaising: '',
    currency: 'USD',
    closingDate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const amount = Number(form.amountRaising) || 0;
      const body = new FormData();
      body.append('title', form.title.trim());
      body.append('description', form.description.trim());
      body.append('fundingType', form.fundingType);
      body.append('amountRaising', JSON.stringify({ min: amount, max: amount, currency: form.currency }));
      if (form.closingDate) body.append('closingDate', form.closingDate);

      const res = await api.post('/funding', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFeedback({ type: 'success', text: 'Funding opportunity created successfully!' });
      setTimeout(() => navigate(`/startup-dashboard/funding/${res.data.opportunity._id}`), 1200);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to create funding opportunity' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner";
  const labelClass = "block text-xs font-semibold text-slate-300 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Raise Funds</h2>
        <p className="text-xs text-slate-400 mt-0.5">Name it, say how much, describe it. That's it.</p>
      </div>

      {feedback && (
        <div className={`px-4 py-3 rounded-2xl text-xs font-semibold ${
          feedback.type === 'success'
            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/80'
            : 'bg-rose-950/60 text-rose-400 border border-rose-900/80'
        }`}>
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div>
          <label className={labelClass}>Round name</label>
          <input
            type="text"
            name="title"
            placeholder="e.g. Seed round"
            value={form.title}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>How much?</label>
            <input
              type="number"
              name="amountRaising"
              min="1"
              step="any"
              placeholder="1000000"
              value={form.amountRaising}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select name="currency" value={form.currency} onChange={handleChange} className={inputClass}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>What is it for?</label>
          <textarea
            name="description"
            placeholder="One or two sentences investors will understand."
            value={form.description}
            onChange={handleChange}
            rows={3}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type</label>
            <select name="fundingType" value={form.fundingType} onChange={handleChange} className={inputClass}>
              {FUNDING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Deadline (optional)</label>
            <input
              type="date"
              name="closingDate"
              value={form.closingDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish Opportunity'}
          </button>
        </div>
      </form>
    </div>
  );
}
