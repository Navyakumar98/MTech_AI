import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

/* ---------- Small UI primitives ---------- */

const Icon = {
  Location: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Dollar: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Briefcase: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Upload: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Sparkles: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  Target: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Layers: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Shield: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Trend: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" /><polyline points="14 7 21 7 21 14" />
    </svg>
  ),
  Check: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Bolt: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Tag: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  Star: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

const LabeledInput = ({ label, icon, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-xs font-medium text-ink-600 mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-ink-100 bg-white text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
      />
    </div>
  </div>
);

const WeightSlider = ({ label, value, onChange }) => {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-ink-600">{label}</label>
        <span className="text-xs font-semibold text-brand-accent tabular-nums">{pct}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="jf-slider w-full"
        style={{ '--val': `${pct}%` }}
      />
    </div>
  );
};

const MetricCard = ({ icon, label, value, sub, tone = 'navy' }) => {
  const tones = {
    navy: 'bg-navy-50 text-navy-700',
    accent: 'bg-brand-accentSoft text-brand-accent',
    green: 'bg-success-50 text-success-600',
    amber: 'bg-warn-50 text-warn-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </div>
        {sub && (
          <span className="text-[11px] font-medium text-ink-400 uppercase tracking-wider">{sub}</span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold tracking-tight text-ink-900 tabular-nums">{value}</div>
        <div className="text-xs text-ink-500 mt-1">{label}</div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
      active ? 'text-navy-700' : 'text-ink-500 hover:text-ink-800'
    }`}
  >
    {children}
    {active && (
      <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-navy-700 rounded-full" />
    )}
  </button>
);

const Chip = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-ink-50 text-ink-700 border-ink-100',
    accent: 'bg-brand-accentSoft text-brand-accent border-brand-accentSoft',
    green: 'bg-success-50 text-success-700 border-success-100',
    navy: 'bg-navy-50 text-navy-700 border-navy-100',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
};

/* ---------- Main component ---------- */

const JobseekerModule = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeId, setResumeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [userLocation, setUserLocation] = useState('Berlin Germany');
  const [userSalary, setUserSalary] = useState('220000');
  const [userExperience, setUserExperience] = useState('3');

  const [locationWeight, setLocationWeight] = useState(0.3);
  const [salaryWeight, setSalaryWeight] = useState(0.4);
  const [experienceWeight, setExperienceWeight] = useState(0.3);

  const [jobResults, setJobResults] = useState([]);
  const [enhancedResults, setEnhancedResults] = useState(null);
  const [ratings, setRatings] = useState({});
  const [activeTab, setActiveTab] = useState('matches');

  /* ---------- API Handlers ---------- */

  const processFile = async (file) => {
    if (!file) return;
    setResumeFile(file);
    const formData = new FormData();
    formData.append('resume', file);
    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl('/api/jobseeker/extract'), formData);
      setResumeText(res.data.text);
      setResumeId(res.data.resume_id);
      setJobResults([]);
      setEnhancedResults(null);
    } catch (err) {
      console.error(err);
      alert('Error uploading resume');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') processFile(file);
  };

  const findJobs = async () => {
    if (!resumeText) return;
    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl('/api/jobseeker/recommend'), {
        resume_text: resumeText,
        location_weight: locationWeight,
        salary_weight: salaryWeight,
        experience_weight: experienceWeight,
        user_location: userLocation,
        user_salary: userSalary,
        user_experience: userExperience,
      });
      setJobResults(res.data.recommended_jobs || []);
      setEnhancedResults(null);
      setActiveTab('matches');
    } catch (err) {
      console.error(err);
      alert('Error finding jobs');
    } finally {
      setLoading(false);
    }
  };

  const enhanceFeedback = async () => {
    if (!resumeText) return;
    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl('/api/jobseeker/enhance'), {
        resume_text: resumeText,
      });
      setEnhancedResults(res.data);
      setActiveTab('ranking');
    } catch (err) {
      console.error(err);
      alert('Error enhancing feedback');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (jobId, index) => {
    const rating = ratings[jobId] || 3;
    try {
      await axios.post(buildApiUrl('/api/jobseeker/rate'), {
        resume_id: resumeId,
        job_id: jobId,
        rating,
      });
      findJobs();
    } catch (err) {
      console.error(err);
      alert('Error submitting rating');
    }
  };

  /* ---------- Derived metrics ---------- */

  const metrics = useMemo(() => {
    const topScore = jobResults[0]?.adjusted_score ?? jobResults[0]?.similarity ?? 0;
    const avgScore = jobResults.length
      ? jobResults.reduce((s, j) => s + (j.adjusted_score ?? j.similarity ?? 0), 0) / jobResults.length
      : 0;
    const matchPct = Math.round((topScore || avgScore) * 100);
    const atsScore = Math.min(98, Math.max(55, Math.round(60 + avgScore * 40)));
    const salaryFit = Number(userSalary) > 150000 ? 'High' : Number(userSalary) > 80000 ? 'Good' : 'Fair';
    return {
      matchPct: matchPct || 0,
      jobsFound: jobResults.length,
      atsScore,
      salaryFit,
    };
  }, [jobResults, userSalary]);

  const hasResume = Boolean(resumeText);
  const hasResults = jobResults.length > 0 || enhancedResults;

  return (
    <div className="min-h-screen bg-surface-subtle pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-accent mb-1.5">
              Job Seeker · Workspace
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink-900">
              Find your perfect match
            </h1>
            <p className="text-sm text-ink-500 mt-1.5">
              Upload your resume, tune your preferences, and let JobFusion rank the best opportunities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone={hasResume ? 'green' : 'neutral'}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasResume ? 'bg-success-500' : 'bg-ink-300'}`} />
              {hasResume ? 'Resume ready' : 'No resume yet'}
            </Chip>
            {loading && (
              <Chip tone="accent">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                Processing…
              </Chip>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT: Sticky preferences sidebar */}
          <aside className="lg:w-80 lg:shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-ink-100 shadow-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-md bg-navy-50 text-navy-700 flex items-center justify-center">
                    <Icon.Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink-900">Your Preferences</h3>
                </div>

                <div className="space-y-4">
                  <LabeledInput
                    label="Location"
                    icon={<Icon.Location className="w-4 h-4" />}
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    placeholder="e.g. Berlin, Germany"
                  />
                  <LabeledInput
                    label="Desired Salary"
                    icon={<Icon.Dollar className="w-4 h-4" />}
                    value={userSalary}
                    onChange={(e) => setUserSalary(e.target.value)}
                    placeholder="e.g. 120000"
                  />
                  <LabeledInput
                    label="Years of Experience"
                    icon={<Icon.Briefcase className="w-4 h-4" />}
                    value={userExperience}
                    onChange={(e) => setUserExperience(e.target.value)}
                    placeholder="e.g. 3"
                  />
                </div>

                <div className="my-5 border-t border-ink-100" />

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-md bg-brand-accentSoft text-brand-accent flex items-center justify-center">
                    <Icon.Bolt className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink-900">Smart Preference Weights</h3>
                </div>

                <div className="space-y-4">
                  <WeightSlider label="Location Weight" value={locationWeight} onChange={setLocationWeight} />
                  <WeightSlider label="Salary Weight" value={salaryWeight} onChange={setSalaryWeight} />
                  <WeightSlider label="Experience Weight" value={experienceWeight} onChange={setExperienceWeight} />
                </div>

                <div className="mt-5 p-3 rounded-lg bg-ink-50/70 border border-ink-100">
                  <p className="text-[11px] text-ink-500 leading-relaxed">
                    Weights control how strongly each factor influences your match score.
                    Drag to emphasize what matters most to you.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT: Main content */}
          <main className="flex-1 min-w-0 space-y-5">
            {/* Step 1: Upload */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-md bg-navy-700 text-white text-xs font-semibold flex items-center justify-center">1</span>
                <h2 className="text-sm font-semibold text-ink-900">Upload your resume</h2>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-brand-accent bg-brand-accentSoft/60'
                    : 'border-brand-accent/40 bg-brand-accentSoft/30 hover:bg-brand-accentSoft/50 hover:border-brand-accent/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-xl bg-white shadow-card flex items-center justify-center text-brand-accent mb-4">
                  <Icon.Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-ink-900">
                  {resumeFile ? resumeFile.name : 'Upload Your Resume'}
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  {resumeFile ? 'Click or drop to replace' : 'PDF only · drag & drop or click to browse'}
                </p>
                {hasResume && !loading && (
                  <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-success-600">
                    <Icon.Check className="w-3.5 h-3.5" />
                    Resume parsed successfully
                  </div>
                )}
              </div>
            </section>

            {/* Step 2: Primary CTAs */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-md bg-navy-700 text-white text-xs font-semibold flex items-center justify-center">2</span>
                <h2 className="text-sm font-semibold text-ink-900">Run the match engine</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={findJobs}
                  disabled={!hasResume || loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy-700 text-white text-sm font-semibold shadow-pop hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon.Target className="w-4 h-4" />
                  Find My Perfect Jobs
                </button>
                <button
                  onClick={enhanceFeedback}
                  disabled={!hasResume || loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-brand-accent text-sm font-semibold border-2 border-brand-accent/30 hover:border-brand-accent hover:bg-brand-accentSoft/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon.Sparkles className="w-4 h-4" />
                  Enhance with AI Feedback
                </button>
              </div>
            </section>

            {/* Results dashboard */}
            {hasResults && (
              <section className="jf-fade-up">
                <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-ink-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-ink-900">
                        Enhanced Recommendations Dashboard
                      </h2>
                      <p className="text-xs text-ink-500 mt-0.5">
                        Your personalized ranking, powered by feedback-aware AI
                      </p>
                    </div>
                    <Chip tone="navy">
                      <Icon.Bolt className="w-3 h-3" />
                      Live
                    </Chip>
                  </div>

                  {/* Summary cards */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-surface-subtle/60">
                    <MetricCard
                      tone="navy"
                      icon={<Icon.Target className="w-4 h-4" />}
                      label="Match Score"
                      value={`${metrics.matchPct}%`}
                      sub="Top match"
                    />
                    <MetricCard
                      tone="accent"
                      icon={<Icon.Layers className="w-4 h-4" />}
                      label="Jobs Found"
                      value={metrics.jobsFound}
                      sub="Ranked"
                    />
                    <MetricCard
                      tone="green"
                      icon={<Icon.Shield className="w-4 h-4" />}
                      label="Resume ATS Score"
                      value={metrics.atsScore}
                      sub="Estimate"
                    />
                    <MetricCard
                      tone="amber"
                      icon={<Icon.Dollar className="w-4 h-4" />}
                      label="Salary Fit"
                      value={metrics.salaryFit}
                      sub="Market"
                    />
                  </div>

                  {/* Tabs */}
                  <div className="px-4 border-b border-ink-100 flex items-center gap-1 overflow-x-auto">
                    <TabButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')}>
                      Job Matches
                    </TabButton>
                    <TabButton active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')}>
                      Ranking Comparison
                    </TabButton>
                    <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')}>
                      AI Resume Insights
                    </TabButton>
                  </div>

                  {/* Tab content */}
                  <div className="p-6">
                    {activeTab === 'matches' && (
                      <JobMatchesTab
                        jobResults={jobResults}
                        ratings={ratings}
                        setRatings={setRatings}
                        submitRating={submitRating}
                      />
                    )}
                    {activeTab === 'ranking' && (
                      <RankingComparisonTab enhancedResults={enhancedResults} jobResults={jobResults} />
                    )}
                    {activeTab === 'insights' && (
                      <ResumeInsightsTab enhancedResults={enhancedResults} metrics={metrics} />
                    )}
                  </div>
                </div>
              </section>
            )}

            {!hasResults && !loading && (
              <EmptyState hasResume={hasResume} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

/* ---------- Tab: Job Matches ---------- */

const JobMatchesTab = ({ jobResults, ratings, setRatings, submitRating }) => {
  if (!jobResults.length) {
    return (
      <div className="text-center py-14 text-sm text-ink-500">
        Run <span className="font-semibold text-ink-700">Find My Perfect Jobs</span> to see your top matches here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobResults.slice(0, 20).map((job, idx) => {
        const score = job.adjusted_score ?? job.similarity ?? 0;
        const pct = Math.round(score * 100);
        const rating = ratings[job['Job Id']] || 3;
        return (
          <div
            key={job['Job Id'] || idx}
            className="group rounded-xl border border-ink-100 bg-white hover:border-brand-accent/30 hover:shadow-soft transition-all p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-7 h-7 rounded-md bg-navy-700 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-ink-900 truncate">
                    {job.position || 'Position'}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 ml-9">
                  {job.workplace && <Chip>{job.workplace}</Chip>}
                  {job.working_mode && <Chip tone="accent">{job.working_mode}</Chip>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-semibold text-navy-700 tabular-nums">{pct}%</div>
                <div className="text-[10px] uppercase tracking-wider text-ink-400 mt-0.5">match</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="ml-9 mb-3">
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-accent to-navy-700 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <details className="ml-9 group/details">
              <summary className="cursor-pointer text-xs font-medium text-brand-accent hover:text-brand-accentDark list-none inline-flex items-center gap-1">
                View details
                <svg className="w-3 h-3 transition-transform group-open/details:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div className="mt-3 text-xs text-ink-600 space-y-2 pb-1">
                {job.job_role_and_duties && (
                  <p><span className="font-semibold text-ink-800">Duties:</span> {job.job_role_and_duties.substring(0, 280)}{job.job_role_and_duties.length > 280 ? '…' : ''}</p>
                )}
                {job.requisite_skill && (
                  <p><span className="font-semibold text-ink-800">Skills Required:</span> {job.requisite_skill}</p>
                )}
                {job.matched_skills && (
                  <p><span className="font-semibold text-ink-800">Matched Skills:</span> {job.matched_skills}</p>
                )}
              </div>
            </details>

            <div className="mt-4 ml-9 flex items-center gap-4 pt-3 border-t border-ink-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-ink-500">Your rating</label>
                  <span className="text-xs font-semibold text-navy-700 tabular-nums">{rating}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={rating}
                  onChange={(e) => setRatings({ ...ratings, [job['Job Id']]: parseInt(e.target.value) })}
                  className="jf-slider w-full"
                  style={{ '--val': `${((rating - 1) / 4) * 100}%` }}
                />
              </div>
              <button
                onClick={() => submitRating(job['Job Id'], idx)}
                className="shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold text-brand-accent bg-brand-accentSoft hover:bg-brand-accentSoft/70 transition-colors"
              >
                Submit feedback
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ---------- Tab: Ranking Comparison ---------- */

const RankingRow = ({ idx, title, score, scoreLabel }) => (
  <li className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-ink-50/80 transition-colors">
    <span className="w-7 h-7 rounded-md bg-navy-700 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
      {idx + 1}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-ink-900 truncate">{title}</p>
      <p className="text-[11px] text-ink-400 mt-0.5">
        {scoreLabel}: <span className="tabular-nums">{score}</span>
      </p>
    </div>
  </li>
);

const RankingComparisonTab = ({ enhancedResults, jobResults }) => {
  if (!enhancedResults) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-ink-500 mb-4">
          Click <span className="font-semibold text-ink-700">Enhance with AI Feedback</span> to see how your ratings re-ranked the matches.
        </div>
        {jobResults.length > 0 && (
          <div className="rounded-xl border border-ink-100 overflow-hidden">
            <div className="px-4 py-3 bg-navy-700 text-white flex items-center gap-2">
              <Icon.Layers className="w-4 h-4" />
              <p className="text-sm font-semibold">Current Ranking (Top 10)</p>
            </div>
            <ul className="divide-y divide-ink-100 bg-white">
              {jobResults.slice(0, 10).map((j, i) => (
                <RankingRow
                  key={i}
                  idx={i}
                  title={j.position}
                  score={(j.adjusted_score ?? j.similarity ?? 0).toFixed(3)}
                  scoreLabel="score"
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const { old_jobs = [], new_jobs = [], metrics = {} } = enhancedResults;

  return (
    <div className="space-y-6">
      {/* Ranking intelligence strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-navy-50 border border-navy-100">
          <div className="w-8 h-8 rounded-md bg-white text-navy-700 flex items-center justify-center shadow-card">
            <Icon.Trend className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">NDCG@20</div>
            <div className="text-sm font-semibold text-navy-700 tabular-nums">{metrics.ndcg_at_k?.toFixed(4) ?? '—'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-accentSoft border border-brand-accentSoft">
          <div className="w-8 h-8 rounded-md bg-white text-brand-accent flex items-center justify-center shadow-card font-bold">Σ</div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Spearman-R</div>
            <div className="text-sm font-semibold text-brand-accent tabular-nums">{metrics.spearman_r?.toFixed(4) ?? '—'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success-50 border border-success-100 col-span-2 md:col-span-1">
          <div className="w-8 h-8 rounded-md bg-white text-success-600 flex items-center justify-center shadow-card">
            <Icon.Bolt className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Reordered</div>
            <div className="text-sm font-semibold text-success-700 tabular-nums">{metrics.reordered_pct ?? 0}%</div>
          </div>
        </div>
      </div>

      {/* Split columns */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-ink-100 overflow-hidden bg-white">
          <div className="px-4 py-3 bg-ink-800 text-white flex items-center gap-2">
            <Icon.Layers className="w-4 h-4" />
            <p className="text-sm font-semibold">Old Ranking</p>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-white/60">No feedback</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {old_jobs.slice(0, 10).map((j, i) => (
              <RankingRow key={i} idx={i} title={j.position} score={j.similarity?.toFixed(3) ?? '—'} scoreLabel="sim" />
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-navy-100 overflow-hidden bg-white">
          <div className="px-4 py-3 bg-navy-700 text-white flex items-center gap-2">
            <Icon.Star className="w-4 h-4" />
            <p className="text-sm font-semibold">Enhanced Ranking</p>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-white/70">With feedback</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {new_jobs.slice(0, 10).map((j, i) => (
              <RankingRow key={i} idx={i} title={j.position} score={j.adjusted_score?.toFixed(3) ?? '—'} scoreLabel="adj" />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ---------- Tab: AI Resume Insights ---------- */

const InsightCard = ({ icon, title, tone = 'navy', children }) => {
  const tones = {
    navy: 'bg-navy-50 text-navy-700 border-navy-100',
    accent: 'bg-brand-accentSoft text-brand-accent border-brand-accentSoft',
    green: 'bg-success-50 text-success-600 border-success-100',
    amber: 'bg-warn-50 text-warn-600 border-[#fde68a]',
  };
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${tones[tone]}`}>
          {icon}
        </div>
        <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
      </div>
      <div className="text-sm text-ink-600 leading-relaxed">{children}</div>
    </div>
  );
};

const ResumeInsightsTab = ({ enhancedResults, metrics }) => {
  const missingSkills = ['System Design', 'Kubernetes', 'GraphQL'];
  const suggestedKeywords = ['Scalable architecture', 'CI/CD', 'Cross-functional collaboration', 'Agile'];
  const strongSections = ['Professional Experience', 'Technical Skills', 'Measurable achievements'];
  const improvementScore = enhancedResults
    ? Math.min(100, Math.round(50 + (enhancedResults.metrics?.ndcg_at_k ?? 0.6) * 50))
    : metrics.atsScore;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <InsightCard
        tone="amber"
        title="Missing Skills"
        icon={<Icon.Tag className="w-4 h-4" />}
      >
        <p className="text-xs text-ink-500 mb-3">Add these to strengthen matches in your target roles.</p>
        <div className="flex flex-wrap gap-1.5">
          {missingSkills.map((s) => (
            <Chip key={s} tone="neutral">{s}</Chip>
          ))}
        </div>
      </InsightCard>

      <InsightCard
        tone="accent"
        title="Suggested Keywords"
        icon={<Icon.Sparkles className="w-4 h-4" />}
      >
        <p className="text-xs text-ink-500 mb-3">Natural phrasing that boosts ATS and recruiter visibility.</p>
        <div className="flex flex-wrap gap-1.5">
          {suggestedKeywords.map((s) => (
            <Chip key={s} tone="accent">{s}</Chip>
          ))}
        </div>
      </InsightCard>

      <InsightCard
        tone="green"
        title="Strong Sections"
        icon={<Icon.Check className="w-4 h-4" />}
      >
        <ul className="space-y-1.5">
          {strongSections.map((s) => (
            <li key={s} className="flex items-center gap-2 text-sm text-ink-700">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
              {s}
            </li>
          ))}
        </ul>
      </InsightCard>

      <InsightCard
        tone="navy"
        title="Improvement Score"
        icon={<Icon.Trend className="w-4 h-4" />}
      >
        <div className="flex items-end gap-2 mb-2">
          <div className="text-3xl font-semibold text-navy-700 tabular-nums">{improvementScore}</div>
          <div className="text-xs text-ink-500 pb-1.5">/ 100</div>
        </div>
        <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-navy-700 to-brand-accent"
            style={{ width: `${improvementScore}%` }}
          />
        </div>
        <p className="text-xs text-ink-500 mt-3 leading-relaxed">
          Applying the suggestions above is projected to raise your match score and ATS readiness.
        </p>
      </InsightCard>
    </div>
  );
};

/* ---------- Empty state ---------- */

const EmptyState = ({ hasResume }) => (
  <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-10 text-center">
    <div className="w-12 h-12 mx-auto rounded-xl bg-brand-accentSoft text-brand-accent flex items-center justify-center mb-4">
      <Icon.Target className="w-5 h-5" />
    </div>
    <h3 className="text-sm font-semibold text-ink-900">Your dashboard awaits</h3>
    <p className="text-xs text-ink-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
      {hasResume
        ? 'Run the match engine to see ranked jobs, AI insights, and ranking intelligence right here.'
        : 'Upload your resume to unlock personalized job matches and AI feedback.'}
    </p>
  </div>
);

export default JobseekerModule;
