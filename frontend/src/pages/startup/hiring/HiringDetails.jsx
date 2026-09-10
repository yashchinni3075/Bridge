import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const DetailSection = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">{title}</h3>
    {children}
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
    <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">{label}</span>
    <span className="text-xs text-white font-semibold">{value || '-'}</span>
  </div>
);

const SkillBadges = ({ skills, color = 'indigo' }) => {
  if (!skills || skills.length === 0) return <span className="text-xs text-slate-500">None</span>;
  const colorMap = {
    indigo: 'bg-indigo-950/60 text-indigo-300 border-indigo-900/80',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-900/80',
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

export default function HiringDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hiring, setHiring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHiring = async () => {
      try {
        const res = await api.get(`/startup-hiring/${id}`);
        setHiring(res.data.hiring);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load hiring details.');
      } finally {
        setLoading(false);
      }
    };
    fetchHiring();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatSalary = (salary) => {
    if (!salary) return '-';
    const { min, max, currency } = salary;
    const symbol = currency === 'INR' ? '₹' : '$';
    if (min && max) return `${symbol}${min.toLocaleString('en-IN')} - ${symbol}${max.toLocaleString('en-IN')}`;
    if (min) return `From ${symbol}${min.toLocaleString('en-IN')}`;
    if (max) return `Up to ${symbol}${max.toLocaleString('en-IN')}`;
    return '-';
  };

  const statusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80';
      case 'closed': return 'bg-rose-950/60 text-rose-400 border-rose-900/80';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-400">Loading hiring details...</p>
        </div>
      </div>
    );
  }

  if (error || !hiring) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl">
          <p className="text-xs text-rose-400 mb-4">{error || 'Hiring record not found.'}</p>
          <button
            onClick={() => navigate('/startup-dashboard/hiring')}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
          >
            &larr; Back to Hiring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight">{hiring.jobTitle}</h2>
            <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg border ${statusColor(hiring.status)}`}>
              {hiring.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Created: {formatDate(hiring.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/startup-dashboard/hiring/${id}/edit`)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/startup-dashboard/hiring')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm"
          >
            &larr; Back
          </button>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
        <DetailSection title="Job Information">
          <DetailRow label="Job Title" value={hiring.jobTitle} />
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">Description</span>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{hiring.jobDescription || '-'}</p>
          </div>
          <DetailRow label="Vacancies" value={hiring.vacancies} />
          <DetailRow label="Salary / CTC" value={formatSalary(hiring.salary)} />
          <DetailRow label="Employment Type" value={hiring.employmentType} />
          <DetailRow label="Work Mode" value={hiring.workMode} />
          <DetailRow label="Location" value={hiring.location} />
          <DetailRow label="Experience Required" value={hiring.experienceRequired} />
          <DetailRow label="Domain / Category" value={hiring.domain} />
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">Required Skills</span>
            <SkillBadges skills={hiring.requiredSkills} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">Preferred Skills</span>
            <SkillBadges skills={hiring.preferredSkills} color="violet" />
          </div>
        </DetailSection>

        {hiring.jobDescriptionPdf?.fileUrl && (
          <DetailSection title="Job Description PDF">
            <DetailRow label="File Name" value={hiring.jobDescriptionPdf.fileName} />
            <DetailRow label="Uploaded" value={formatDate(hiring.jobDescriptionPdf.uploadedAt)} />
            <div className="flex gap-3 pt-1">
              <a
                href={hiring.jobDescriptionPdf.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-900/80 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                View PDF
              </a>
              <a
                href={hiring.jobDescriptionPdf.fileUrl}
                download={hiring.jobDescriptionPdf.fileName || 'job_description.pdf'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition shadow-sm"
              >
                Download
              </a>
            </div>
          </DetailSection>
        )}

        <DetailSection title="Startup Information">
          <DetailRow label="Startup Name" value={hiring.startupInfo?.startupName} />
          <DetailRow label="Description" value={hiring.startupInfo?.description} />
          <DetailRow label="Industry" value={hiring.startupInfo?.industry} />
          <DetailRow label="Stage" value={hiring.startupInfo?.stage} />
          <DetailRow label="Employee Count" value={hiring.startupInfo?.employeeCount} />
          <DetailRow label="Location" value={hiring.startupInfo?.location} />
          <DetailRow label="Website" value={hiring.startupInfo?.website} />
          <DetailRow label="Founded Year" value={hiring.startupInfo?.foundedYear} />
        </DetailSection>

        <DetailSection title="Candidate Eligibility / Criteria">
          <DetailRow label="Minimum Qualification" value={hiring.criteria?.minimumQualification} />
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">Eligible Degrees</span>
            <SkillBadges skills={hiring.criteria?.eligibleDegrees} color="emerald" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">Eligible Branches</span>
            <SkillBadges skills={hiring.criteria?.eligibleBranches} color="emerald" />
          </div>
          <DetailRow label="Minimum Experience" value={hiring.criteria?.minimumExperience} />
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">Required Skills</span>
            <SkillBadges skills={hiring.criteria?.requiredSkills} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">Preferred Skills</span>
            <SkillBadges skills={hiring.criteria?.preferredSkills} color="violet" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-[11px] text-slate-400 font-medium w-40 flex-shrink-0">Certifications</span>
            <SkillBadges skills={hiring.criteria?.certifications} color="emerald" />
          </div>
          <DetailRow label="Additional Criteria" value={hiring.criteria?.additionalCriteria} />
        </DetailSection>

        <DetailSection title="Hiring Information">
          <DetailRow label="Status" value={hiring.status?.toUpperCase()} />
          <DetailRow label="Applications" value={hiring.applicationsCount || 0} />
          <DetailRow label="Created" value={formatDate(hiring.createdAt)} />
          <DetailRow label="Closing Date" value={formatDate(hiring.closingDate)} />
          <DetailRow label="Last Updated" value={formatDate(hiring.updatedAt)} />
        </DetailSection>
      </div>
    </div>
  );
}
