import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { evaluatePitchDeck, uploadPitchDeck, getPitchEvaluations } from '../../services/pitchApi';

const CATEGORY_MAX = {
  problemClarity: 15,
  solutionValueProposition: 15,
  marketOpportunity: 15,
  businessModel: 15,
  traction: 15,
  team: 10,
  competitiveAdvantage: 5,
  fundingAsk: 10,
};

const SOURCE_LABEL = { MANUAL_TEXT: 'Manual Text', PITCH_DECK: 'Uploaded Pitch Deck' };

const scoreTone = (score) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-indigo-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-rose-400';
};

const scoreBarColor = (score) => {
  if (score >= 80) return 'from-emerald-600 to-teal-500';
  if (score >= 60) return 'from-indigo-600 to-violet-600';
  if (score >= 40) return 'from-amber-600 to-orange-600';
  return 'from-rose-600 to-red-600';
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export default function PitchEvaluationCenter() {
  const [profile, setProfile] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [historyLatest, setHistoryLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMark, setUploadMark] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get('/startups/profile/me').catch(() => ({ data: { profile: null } })),
          getPitchEvaluations({ page: 1, limit: 20 }),
        ]);
        if (!active) return;
        const p = profileRes.data.profile || profileRes.data;
        setProfile(p || null);
        const evals = historyRes.evaluations || [];
        setHistory(evals);
        setHistoryTotal(historyRes.total || evals.length);
        // Latest saved evaluation is shown AFTER refresh, clearly labelled as
        // historical data — it is never presented as a fresh result.
        setHistoryLatest(evals[0] || null);
        setError('');
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Could not load pitch evaluation data.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const refreshHistory = async () => {
    try {
      const historyRes = await getPitchEvaluations({ page: 1, limit: 20 });
      setHistory(historyRes.evaluations || []);
      setHistoryTotal(historyRes.total || 0);
      // Never clobber currentResult: history display stays separate.
      setHistoryLatest((historyRes.evaluations || [])[0] || null);
    } catch {
      // keep existing history; non-fatal
    }
  };

  const refreshProfile = async () => {
    try {
      const profileRes = await api.get('/startups/profile/me');
      if (profileRes?.data?.profile) setProfile(profileRes.data.profile);
    } catch {
      // non-fatal
    }
  };

  const handleDeckUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setUploadMark(null);
    try {
      const res = await uploadPitchDeck(file);
      const extractable = Boolean(res.evaluationAvailable);
      setUploadedFile({ name: res.pitchDeckOriginalName || file.name, extractable });
      setUploadMark({ type: extractable ? 'success' : 'warn', text: res.message });
      await refreshProfile();
      if (res.evaluation) {
        // Auto-evaluation from the PDF upload becomes the current result.
        setCurrentResult(res.evaluation);
        await refreshHistory();
      }
    } catch (err) {
      setUploadedFile(null);
      setUploadMark({ type: 'error', text: err.response?.data?.message || 'Failed to upload pitch deck.' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleEvaluateDeck = async () => {
    if (!uploadedFile?.extractable) {
      setError('This pitch deck does not contain extractable text, so it cannot be AI-evaluated.');
      return;
    }
    setEvaluating(true);
    setError('');
    // Clear current result before the request so an old result is never shown
    // as the new evaluation (a loading state is shown instead).
    setCurrentResult(null);
    try {
      const res = await evaluatePitchDeck();
      setCurrentResult(res.evaluation);
      await refreshHistory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'AI pitch evaluation is temporarily unavailable. Please try again later.'
      );
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-10 text-center text-xs text-slate-400 shadow-xl">
        Loading pitch evaluation center...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Pitch Deck & AI Evaluation</h2>
        <p className="text-xs text-slate-400 mt-0.5">Get an investor-readiness review of your uploaded pitch deck.</p>
      </div>

      {error && (
        <div className="p-4 text-xs rounded-2xl font-medium bg-rose-950/50 border border-rose-800/80 text-rose-300 shadow-inner">
          {error}
        </div>
      )}
      {uploadMark && (
        <div className={`p-4 text-xs rounded-2xl font-medium shadow-inner ${
          uploadMark.type === 'success'
            ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
            : uploadMark.type === 'warn'
              ? 'bg-amber-950/50 border border-amber-800/80 text-amber-300'
              : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
        }`}>
          {uploadMark.text}
        </div>
      )}

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upload Pitch Presentation</h3>
        <p className="text-[11px] text-slate-400">
          Text-based PDF decks are supported for automatic text extraction and AI evaluation. PPT/PPTX files are
          stored but cannot be text-extracted, so they will not be AI-evaluated.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="file"
            accept=".pdf,.ppt,.pptx"
            onChange={handleDeckUpload}
            disabled={uploading || evaluating}
            className="text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-2xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer disabled:opacity-50"
          />
          {uploadedFile && (
            <button
              onClick={handleEvaluateDeck}
              disabled={!uploadedFile.extractable || evaluating || uploading}
              title={
                uploadedFile.extractable
                  ? 'Run AI diligence analysis on the uploaded deck'
                  : 'No extractable text found; AI evaluation is not possible for this file'
              }
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-semibold border border-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {evaluating ? 'Analyzing Deck...' : 'Evaluate Uploaded Deck'}
            </button>
          )}
        </div>
        {uploadedFile && (
          <div className="text-[11px] text-slate-400 space-y-1">
            <p>
              Selected file: <span className="text-slate-300 font-medium">{uploadedFile.name}</span>
            </p>
            <p className={uploadedFile.extractable ? 'text-emerald-400' : 'text-amber-400'}>
              {uploadedFile.extractable
                ? 'Text extracted — this deck can be AI-evaluated.'
                : 'No extractable text found — PPT/PPTX and image-only PDFs cannot be AI-evaluated.'}
            </p>
          </div>
        )}
        {!uploadedFile && profile?.pitchDeckOriginalName && (
          <p className="text-[11px] text-slate-500">
            Current deck on file: {profile.pitchDeckOriginalName} — select and upload it again to run a new evaluation.
          </p>
        )}
      </div>

      {evaluating && (
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Analyzing uploaded pitch deck...</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Scoring against the venture diligence rubric. This replaces any previous result.</p>
            </div>
          </div>
        </div>
      )}
      {!evaluating && currentResult && (
        <ResultCard evaluation={currentResult} fromHistory={false} />
      )}
      {!evaluating && !currentResult && historyLatest && (
        <ResultCard evaluation={historyLatest} fromHistory={true} />
      )}
      {!evaluating && !currentResult && !historyLatest && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center text-xs text-slate-400 shadow-xl">
          No AI evaluation yet. Upload a PDF pitch deck above to get started.
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Evaluation History</h3>
            <span className="text-[11px] text-slate-500">{historyTotal} recorded</span>
          </div>
          <div className="space-y-3">
            {history.map((evaluation) => (
              <HistoryRow
                key={evaluation._id}
                evaluation={evaluation}
                expanded={expandedId === evaluation._id}
                onToggle={() => setExpandedId(expandedId === evaluation._id ? null : evaluation._id)}
              />
            ))}
          </div>
          {historyTotal > history.length && (
            <p className="text-[11px] text-slate-500">Showing the {history.length} most recent evaluations.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ evaluation, fromHistory }) {
  const scores = evaluation.scores || evaluation.dimensions || {};
  const overall = evaluation.overallScore ?? '—';
  const source = SOURCE_LABEL[evaluation.inputSource] || 'Evaluation';
  const title =
    evaluation.inputSource === 'PITCH_DECK'
      ? 'AI Evaluation Report — Uploaded Pitch Deck'
      : evaluation.inputSource === 'MANUAL_TEXT'
        ? 'AI Evaluation Report — Manual Pitch Text'
        : 'AI Evaluation Report';
  return (
    <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/80 space-y-6 shadow-inner">
      {fromHistory && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-amber-300">
          <span className="text-sm">🕘</span>
          <p className="text-[11px] font-semibold uppercase tracking-wider">Latest Saved Evaluation</p>
          <span className="text-[10px] text-slate-500">loaded from your saved history — run a new evaluation above to refresh</span>
        </div>
      )}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              {source}
            </span>
            <span className="ml-2">
              Evaluated {formatDate(evaluation.createdAt)}
              {evaluation.inputSource === 'PITCH_DECK' && evaluation.pitchDeckFileName
                ? ` · ${evaluation.pitchDeckFileName}`
                : ''}
            </span>
          </p>
          {evaluation.geminiModel && (
            <p className="text-[10px] text-slate-600 mt-1">{evaluation.geminiModel}</p>
          )}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-extrabold tracking-tight ${scoreTone(Number(overall) || 0)}`}>
            {overall}/100
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-500">Overall Score</div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(scores).length > 0 && (
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Metric Breakdown</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(CATEGORY_MAX).map(([key, max]) => {
                const value = Number(scores[key]) || 0;
                const pct = max > 0 ? (value / max) * 100 : 0;
                return (
                  <div key={key} className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-2xl space-y-2 shadow-inner">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 capitalize font-medium">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className={`font-bold ${scoreTone(value)}`}>{value}/{max}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`bg-gradient-to-r ${scoreBarColor(value)} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {evaluation.summary && (
          <p className="text-xs text-slate-300 leading-relaxed">{evaluation.summary}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.isArray(evaluation.strengths) && evaluation.strengths.length > 0 && (
            <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-2xl space-y-2 shadow-inner">
              <h6 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Key Strengths</h6>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                {evaluation.strengths.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
          {Array.isArray(evaluation.weaknesses) && evaluation.weaknesses.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-2xl space-y-2 shadow-inner">
              <h6 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Areas for Improvement</h6>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                {evaluation.weaknesses.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        {Array.isArray(evaluation.missingSections) && evaluation.missingSections.length > 0 && (
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl space-y-2 shadow-inner">
            <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Missing Sections</h6>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
              {evaluation.missingSections.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}

        {Array.isArray(evaluation.recommendations) && evaluation.recommendations.length > 0 && (
          <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-2xl space-y-2 shadow-inner">
            <h6 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Actionable Recommendations</h6>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
              {evaluation.recommendations.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ evaluation, expanded, onToggle }) {
  const overall = evaluation.overallScore ?? '—';
  return (
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-900/60 transition">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-lg font-extrabold tracking-tight ${scoreTone(Number(overall) || 0)}`}>{overall}</span>
          <span className="text-[10px] uppercase font-bold text-slate-500">/100</span>
          <span className="text-[11px] text-slate-300 truncate">{SOURCE_LABEL[evaluation.inputSource] || 'Evaluation'}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-slate-500">{formatDate(evaluation.createdAt)}</span>
          <span className="text-slate-500 text-xs">{expanded ? '▾' : '▸'}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/80 pt-3 space-y-3">
          {evaluation.summary && <p className="text-xs text-slate-300 leading-relaxed">{evaluation.summary}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.isArray(evaluation.strengths) && evaluation.strengths.length > 0 && (
              <ul className="list-disc list-inside text-[11px] text-emerald-300 space-y-1">
                {evaluation.strengths.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            )}
            {Array.isArray(evaluation.weaknesses) && evaluation.weaknesses.length > 0 && (
              <ul className="list-disc list-inside text-[11px] text-rose-300 space-y-1">
                {evaluation.weaknesses.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            )}
          </div>
          {Array.isArray(evaluation.recommendations) && evaluation.recommendations.length > 0 && (
            <ul className="list-disc list-inside text-[11px] text-indigo-300 space-y-1">
              {evaluation.recommendations.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}