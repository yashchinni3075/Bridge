import React from 'react';

export default function MatchScoreCard({ matchData }) {
  if (!matchData) return null;

  const {
    overallScore,
    matchingFactors = [],
    unmatchedFactors = [],
    explanation,
    aiInsight,
  } = matchData;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compatibility Index</span>
            {aiInsight?.aiEnriched ? (
              <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
                AI Explained
              </span>
            ) : (
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                Rule-Based Fit
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 mt-1 leading-relaxed">
            {aiInsight?.aiExplanation || explanation}
          </div>
        </div>
        <div className={`px-3.5 py-1.5 rounded-xl border font-extrabold text-base whitespace-nowrap ${getScoreColor(overallScore)}`}>
          {overallScore}% Match
        </div>
      </div>

      {/* Strategic / AI Callouts */}
      {aiInsight?.dueDiligenceFocus && (
        <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700">
          <span className="font-semibold text-slate-900">Key Focus / Diligence: </span>
          {aiInsight.dueDiligenceFocus}
        </div>
      )}

      {/* Factor Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3">
          <div className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
            <span className="text-emerald-600">✓</span> Grounded Matching Factors
          </div>
          <ul className="space-y-1 text-emerald-950 list-disc pl-4">
            {matchingFactors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <div className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <span className="text-slate-400">!</span> Areas of Divergence
          </div>
          <ul className="space-y-1 text-slate-600 list-disc pl-4">
            {unmatchedFactors.length > 0 ? (
              unmatchedFactors.map((u, i) => <li key={i}>{u}</li>)
            ) : (
              <li>No significant parameter divergence detected in database profiles.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}