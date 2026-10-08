import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function ApplyModal({
  open,
  onClose,
  onApplied,
  startupId,
  startupName,
  hiringId,
  jobTitle,
  isReapply = false,
}) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setFile(null);
      setError('');
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Resume submission is compulsory. Please upload your resume to apply.');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF, DOC, or DOCX resume.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { url, publicId, fileName } = uploadRes.data;

      await api.post(`/applications/${startupId}`, {
        resumeUrl: url,
        resumePublicId: publicId,
        resumeFileName: fileName,
        hiringId: hiringId || null,
      });

      setSuccess(true);
      setTimeout(() => {
        if (onApplied) onApplied();
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to submit your application. Please make sure your resume is uploaded and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 my-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">
              {isReapply ? 'Reapply' : 'Submit Application'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {startupName || 'Startup'} {jobTitle ? `· ${jobTitle}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center text-sm transition disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="mt-6 bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 rounded-2xl p-6 text-center text-xs font-semibold">
            Application submitted successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Upload Resume <span className="text-rose-400">*</span>
              </label>
              <label
                className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-2xl px-4 py-7 cursor-pointer transition hover:border-indigo-400 ${
                  file ? 'border-indigo-500/70 bg-indigo-950/30' : 'border-slate-700 bg-slate-950/50 hover:bg-slate-900/50'
                }`}
              >
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                <span className="text-2xl mb-1">📄</span>
                {file ? (
                  <span className="text-xs font-semibold text-white max-w-full truncate">{file.name}</span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Click to upload resume <span className="text-slate-500">(PDF, DOC, DOCX)</span>
                  </span>
                )}
              </label>
              <p className="text-[10px] text-rose-300/80 mt-1.5">* Resume upload is mandatory to apply</p>
            </div>

            {error && (
              <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 rounded-xl p-3 text-[11px] font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : isReapply ? 'Submit Reapplication' : 'Submit Application'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}