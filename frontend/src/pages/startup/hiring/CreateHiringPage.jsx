import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift',
  'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
  'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
  'Machine Learning', 'Deep Learning', 'NLP', 'Data Science', 'TensorFlow', 'PyTorch',
  'HTML', 'CSS', 'Tailwind CSS', 'Figma', 'Adobe XD',
  'Product Management', 'Agile', 'Scrum', 'Marketing', 'SEO', 'Content Writing',
  'Communication', 'Leadership', 'Team Management', 'Problem Solving',
];

const DOMAIN_OPTIONS = [
  'Software Development', 'Data Science', 'AI/ML', 'Data Engineering',
  'Web Development', 'Mobile Development', 'DevOps', 'Cloud Computing',
  'Cybersecurity', 'Blockchain', 'IoT', 'Marketing', 'Finance',
  'Operations', 'Human Resources', 'Sales', 'Design', 'Product',
  'Business Development', 'Legal', 'Healthcare', 'Education', 'Other',
];

const DEGREE_OPTIONS = [
  'B.E.', 'B.Tech', 'B.Sc', 'BCA', 'BBA', 'B.Com', 'BA',
  'M.E.', 'M.Tech', 'M.Sc', 'MCA', 'MBA', 'M.Com', 'MA',
  'Ph.D.', 'Diploma', 'Other',
];

const BRANCH_OPTIONS = [
  'Computer Science', 'Information Technology', 'Electronics',
  'Electrical', 'Mechanical', 'Civil', 'Chemical',
  'Biotechnology', 'Data Science', 'AI/ML', 'Mathematics',
  'Physics', 'Commerce', 'Business Administration', 'Other',
];

export default function CreateHiringPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    jobTitle: '',
    jobDescription: '',
    vacancies: 1,
    salaryMin: '',
    salaryMax: '',
    employmentType: 'Full Time',
    workMode: 'On-site',
    location: '',
    experienceRequired: '',
    domain: '',
    requiredSkills: [],
    preferredSkills: [],
    closingDate: '',
    criteria: {
      minimumQualification: '',
      eligibleDegrees: [],
      eligibleBranches: [],
      minimumExperience: '',
      requiredSkills: [],
      preferredSkills: [],
      certifications: [],
      additionalCriteria: '',
    },
    employeeCount: '',
    startupStage: '',
    industryDomain: '',
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');

  useEffect(() => {
    const fetchStartupInfo = async () => {
      try {
        const res = await api.get('/startup-hiring/meta/startup-info');
        const info = res.data.startupInfo || {};
        setForm((prev) => ({
          ...prev,
          industryDomain: info.industry || '',
          startupStage: info.stage || '',
        }));
      } catch (err) {
        console.warn('Could not fetch startup info:', err.message);
      } finally {
        setFetchingInfo(false);
      }
    };
    fetchStartupInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCriteriaChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      criteria: { ...prev.criteria, [name]: value },
    }));
  };

  const addSkillToArray = (field, value, setter) => {
    const skill = value.trim();
    if (!skill) return;
    if (field.startsWith('criteria.')) {
      const criteriaField = field.split('.')[1];
      setForm((prev) => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criteriaField]: [...prev.criteria[criteriaField], skill],
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: [...prev[field], skill] }));
    }
    setter('');
  };

  const removeSkillFromArray = (field, index) => {
    if (field.startsWith('criteria.')) {
      const criteriaField = field.split('.')[1];
      setForm((prev) => ({
        ...prev,
        criteria: {
          ...prev.criteria,
          [criteriaField]: prev.criteria[criteriaField].filter((_, i) => i !== index),
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFeedback({ type: 'error', text: 'Only PDF files are accepted.' });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'PDF size must be under 15MB.' });
      return;
    }
    setPdfFile(file);
    setPdfFileName(file.name);
    setFeedback({ type: '', text: '' });
  };

  const SkillInput = ({ label, field, value, onChange, onAdd, onRemove, suggestions }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Type a skill and press Enter or Add"
          className="flex-1 text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm"
        >
          Add
        </button>
      </div>
      {value && suggestions && (
        <div className="mt-1 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
          {suggestions
            .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange('');
                  const skill = s;
                  if (field.startsWith('criteria.')) {
                    const criteriaField = field.split('.')[1];
                    setForm((prev) => ({
                      ...prev,
                      criteria: {
                        ...prev.criteria,
                        [criteriaField]: [...prev.criteria[criteriaField], skill],
                      },
                    }));
                  } else {
                    setForm((prev) => ({ ...prev, [field]: [...prev[field], skill] }));
                  }
                }}
                className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              >
                {s}
              </button>
            ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {(field.startsWith('criteria.') ? form.criteria[field.split('.')[1]] : form[field])?.map((skill, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-900/80 rounded-lg text-[10px] font-semibold"
          >
            {skill}
            <button type="button" onClick={() => onRemove(field, idx)} className="text-indigo-400 hover:text-rose-400 transition">
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobTitle.trim()) {
      setFeedback({ type: 'error', text: 'Job title is required.' });
      return;
    }

    setLoading(true);
    setFeedback({ type: '', text: '' });

    try {
      const payload = {
        jobTitle: form.jobTitle.trim(),
        jobDescription: form.jobDescription.trim(),
        vacancies: Number(form.vacancies) || 1,
        salary: {
          min: Number(form.salaryMin) || 0,
          max: Number(form.salaryMax) || 0,
          currency: 'INR',
        },
        employmentType: form.employmentType,
        workMode: form.workMode,
        location: form.location.trim(),
        experienceRequired: form.experienceRequired.trim(),
        domain: form.domain,
        requiredSkills: form.requiredSkills,
        preferredSkills: form.preferredSkills,
        closingDate: form.closingDate || null,
        criteria: form.criteria,
        employeeCount: form.employeeCount,
        startupStage: form.startupStage,
        industryDomain: form.industryDomain,
      };

      const res = await api.post('/startup-hiring', payload);
      const hiringId = res.data.hiring?._id;

      if (pdfFile && hiringId) {
        const formData = new FormData();
        formData.append('file', pdfFile);
        try {
          await api.post(`/startup-hiring/${hiringId}/upload-pdf`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (pdfErr) {
          console.warn('PDF upload failed:', pdfErr.message);
          setFeedback({ type: 'success', text: 'Hiring created, but PDF upload failed. You can upload it after editing.' });
          setTimeout(() => navigate('/startup-dashboard/hiring'), 1500);
          return;
        }
      }

      setFeedback({ type: 'success', text: 'Hiring opening created successfully!' });
      setTimeout(() => navigate('/startup-dashboard/hiring'), 1000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to create hiring opening.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingInfo) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl">
          <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-400">Loading startup info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Create Hiring</h2>
          <p className="text-xs text-slate-400 mt-0.5">Post a new job opening for your startup.</p>
        </div>
        <button
          onClick={() => navigate('/startup-dashboard/hiring')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm"
        >
          &larr; Back
        </button>
      </div>

      {feedback.text && (
        <div
          className={`p-4 text-xs rounded-2xl font-medium shadow-inner ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION A — JOB INFORMATION */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Job Information</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Job Role / Job Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleChange}
              required
              placeholder="e.g. Software Engineer"
              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Description</label>
            <textarea
              name="jobDescription"
              value={form.jobDescription}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the role, responsibilities, and expectations..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Number of Vacancies <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="vacancies"
                value={form.vacancies}
                onChange={handleChange}
                min="1"
                required
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Salary Min (₹)</label>
              <input
                type="number"
                name="salaryMin"
                value={form.salaryMin}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 400000"
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Salary Max (₹)</label>
              <input
                type="number"
                name="salaryMax"
                value={form.salaryMax}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 700000"
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employment Type</label>
              <select
                name="employmentType"
                value={form.employmentType}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Mode</label>
              <select
                name="workMode"
                value={form.workMode}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Bangalore, India"
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Domain / Category</label>
            <select
              name="domain"
              value={form.domain}
              onChange={handleChange}
              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
            >
              <option value="">Select domain...</option>
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SkillInput
              label="Required Skills"
              field="requiredSkills"
              value={skillInput}
              onChange={setSkillInput}
              onAdd={() => addSkillToArray('requiredSkills', skillInput, setSkillInput)}
              onRemove={removeSkillFromArray}
              suggestions={SKILL_SUGGESTIONS}
            />
            <SkillInput
              label="Preferred Skills"
              field="preferredSkills"
              value={prefSkillInput}
              onChange={setPrefSkillInput}
              onAdd={() => addSkillToArray('preferredSkills', prefSkillInput, setPrefSkillInput)}
              onRemove={removeSkillFromArray}
              suggestions={SKILL_SUGGESTIONS}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Closing Date (optional)</label>
            <input
              type="date"
              name="closingDate"
              value={form.closingDate}
              onChange={handleChange}
              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>
        </div>

        {/* JOB DESCRIPTION PDF */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Job Description PDF</h3>
          <p className="text-[11px] text-slate-400">Upload a detailed job description document. PDF only, max 15MB.</p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <label className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold border border-slate-700 transition cursor-pointer shadow-sm">
              Choose PDF
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
                className="hidden"
              />
            </label>
            {pdfFileName && (
              <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/60 rounded-xl px-3 py-2">
                <span className="text-xs text-indigo-300 font-medium">{pdfFileName}</span>
                <button
                  type="button"
                  onClick={() => { setPdfFile(null); setPdfFileName(''); }}
                  className="text-indigo-400 hover:text-rose-400 text-xs font-bold transition"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STARTUP INFORMATION */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Startup Information</h3>
          <p className="text-[11px] text-slate-400">Some fields are pre-filled from your profile. Update as needed.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Number of Employees</label>
              <input
                type="text"
                name="employeeCount"
                value={form.employeeCount}
                onChange={handleChange}
                placeholder="e.g. 10-50"
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Startup Stage</label>
              <select
                name="startupStage"
                value={form.startupStage}
                onChange={handleChange}
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white focus:outline-none focus:border-indigo-500 transition shadow-inner"
              >
                <option value="">Select stage...</option>
                <option value="Idea">Idea</option>
                <option value="MVP">MVP</option>
                <option value="Early Stage">Early Stage</option>
                <option value="Growth">Growth</option>
                <option value="Scaling">Scaling</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Industry / Domain</label>
            <input
              type="text"
              name="industryDomain"
              value={form.industryDomain}
              onChange={handleChange}
              placeholder="e.g. Technology, Healthcare"
              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>
        </div>

        {/* CANDIDATE CRITERIA */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Candidate Eligibility / Criteria</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Minimum Education / Qualification</label>
              <input
                type="text"
                name="minimumQualification"
                value={form.criteria.minimumQualification}
                onChange={handleCriteriaChange}
                placeholder="e.g. B.E./B.Tech"
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Minimum Experience</label>
              <input
                type="text"
                name="minimumExperience"
                value={form.criteria.minimumExperience}
                onChange={handleCriteriaChange}
                placeholder="e.g. 0-2 years"
                className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Eligible Degrees</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.criteria.eligibleDegrees.map((d, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-900/80 rounded-lg text-[10px] font-semibold"
                >
                  {d}
                  <button type="button" onClick={() => removeSkillFromArray('criteria.eligibleDegrees', idx)} className="text-indigo-400 hover:text-rose-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEGREE_OPTIONS.filter((d) => !form.criteria.eligibleDegrees.includes(d)).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => addSkillToArray('criteria.eligibleDegrees', d, () => {})}
                  className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                >
                  + {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Eligible Branches</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.criteria.eligibleBranches.map((b, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-900/80 rounded-lg text-[10px] font-semibold"
                >
                  {b}
                  <button type="button" onClick={() => removeSkillFromArray('criteria.eligibleBranches', idx)} className="text-indigo-400 hover:text-rose-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BRANCH_OPTIONS.filter((b) => !form.criteria.eligibleBranches.includes(b)).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => addSkillToArray('criteria.eligibleBranches', b, () => {})}
                  className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                >
                  + {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Certifications (if required)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (certInput.trim()) {
                      addSkillToArray('criteria.certifications', certInput, setCertInput);
                    }
                  }
                }}
                placeholder="e.g. AWS Certified"
                className="flex-1 text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => { if (certInput.trim()) addSkillToArray('criteria.certifications', certInput, setCertInput); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.criteria.certifications.map((c, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-900/80 rounded-lg text-[10px] font-semibold"
                >
                  {c}
                  <button type="button" onClick={() => removeSkillFromArray('criteria.certifications', idx)} className="text-indigo-400 hover:text-rose-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Additional Criteria</label>
            <textarea
              name="additionalCriteria"
              value={form.criteria.additionalCriteria}
              onChange={handleCriteriaChange}
              rows={3}
              placeholder="e.g. Good communication skills, portfolio required..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-800 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/startup-dashboard/hiring')}
            className="px-6 py-3 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Hiring'}
          </button>
        </div>
      </form>
    </div>
  );
}
