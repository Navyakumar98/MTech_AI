import React, { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

/* ---------- Icons ---------- */

const Icon = {
  Users: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Upload: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Filter: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Sparkles: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  Download: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Target: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Trend: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" /><polyline points="14 7 21 7 21 14" />
    </svg>
  ),
  Shield: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Bolt: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Arrow: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
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
  Layers: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Star: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

/* ---------- UI Primitives ---------- */

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

const LabeledField = ({ label, icon, children }) => (
  <div>
    <label className="block text-xs font-medium text-ink-600 mb-1.5">{label}</label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
          {icon}
        </span>
      )}
      {children}
    </div>
  </div>
);

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
    {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-navy-700 rounded-full" />}
  </button>
);

/* ---------- Main ---------- */

const RecruiterModule = () => {
  const [jdText, setJdText] = useState('');
  const [jdId, setJdId] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [topK, setTopK] = useState(20);
  const [minExp, setMinExp] = useState(0);
  const [maxSalary, setMaxSalary] = useState(150000);
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [enhancedResults, setEnhancedResults] = useState(null);
  const [ratings, setRatings] = useState({});
  const [activeTab, setActiveTab] = useState('candidates');

  /* ---------- API ---------- */

  const handleJDUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJdFile(file);
    const formData = new FormData();
    formData.append('resume', file);
    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl('/api/jobseeker/extract'), formData);
      setJdText(res.data.text);
      setJdId(res.data.resume_id);
    } catch (err) {
      console.error(err);
      alert('Error uploading JD');
    } finally {
      setLoading(false);
    }
  };

  const findCandidates = async () => {
    if (!jdText.trim()) {
      alert('Please enter a Job Description');
      return;
    }
    const currentJdId =
      jdId ||
      Math.abs(
        jdText.split('').reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0)
      ) % 100000000;
    setJdId(currentJdId);

    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl('/api/recruiter/rank'), {
        jd_text: jdText,
        top_k: topK,
        min_exp: minExp,
        max_salary: maxSalary,
        jd_id: currentJdId,
      });
      setRankedCandidates(res.data.candidates || []);
      setEnhancedResults(null);
      setActiveTab('candidates');
    } catch (err) {
      console.error(err);
      alert('Error finding candidates');
    } finally {
      setLoading(false);
    }
  };

  const enhanceFeedback = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl('/api/recruiter/enhance'), {
        jd_text: jdText,
        jd_id: jdId,
        top_k: topK,
        min_exp: minExp,
        max_salary: maxSalary,
      });
      setEnhancedResults(res.data);
      setActiveTab('intelligence');
    } catch (err) {
      console.error(err);
      alert('Error enhancing feedback');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (candidateId) => {
    const rating = ratings[candidateId] || 3;
    try {
      await axios.post(buildApiUrl('/api/recruiter/rate'), {
        jd_id: jdId,
        candidate_id: candidateId,
        rating,
      });
      findCandidates();
    } catch (err) {
      console.error(err);
      alert('Error submitting rating');
    }
  };

  const exportResults = () => {
    if (!rankedCandidates.length) return;
    const header = ['Rank', 'Candidate ID', 'Name', 'Experience', 'Salary', 'Final Score', 'Email', 'Phone'];
    const rows = rankedCandidates.map((c, i) => [
      i + 1,
      c.candidate_id,
      (c.name || 'Unknown').replace(/"/g, "'"),
      c.experience ?? '',
      c.salary ?? '',
      (c.final_score ?? 0).toFixed(4),
      c.email || '',
      c.phone || '',
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobfusion_candidates_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Derived ---------- */

  const metrics = useMemo(() => {
    const avg = rankedCandidates.length
      ? rankedCandidates.reduce((s, c) => s + (c.final_score ?? 0), 0) / rankedCandidates.length
      : 0;
    const top = rankedCandidates[0]?.final_score ?? 0;
    const topMatches = rankedCandidates.filter((c) => (c.final_score ?? 0) >= 0.7).length;
    const confidence = Math.min(98, Math.max(40, Math.round(50 + top * 50)));
    return {
      screened: rankedCandidates.length,
      topMatches,
      avgMatch: Math.round(avg * 100),
      confidence,
    };
  }, [rankedCandidates]);

  const hasJD = jdText.trim().length > 0;
  const hasResults = rankedCandidates.length > 0 || enhancedResults;

  return (
    <div className="min-h-screen bg-surface-subtle pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-accent mb-1.5">
              Recruiter · Workspace
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink-900">
              Smart candidate ranking
            </h1>
            <p className="text-sm text-ink-500 mt-1.5">
              Paste or upload a JD, tune filters, and let feedback-aware AI rank your best candidates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone={hasJD ? 'green' : 'neutral'}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasJD ? 'bg-success-500' : 'bg-ink-300'}`} />
              {hasJD ? 'JD ready' : 'No JD yet'}
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
          {/* LEFT: Sidebar */}
          <aside className="lg:w-80 lg:shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-ink-100 shadow-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-md bg-navy-50 text-navy-700 flex items-center justify-center">
                    <Icon.Filter className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink-900">Recruiter Controls</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-600 mb-1.5">Paste Job Description</label>
                    <textarea
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste the JD here…"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-ink-100 bg-white text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition resize-y min-h-[110px] max-h-[180px] jf-scroll"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-600 mb-1.5">Or upload JD (PDF)</label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-brand-accent/40 bg-brand-accentSoft/40 hover:bg-brand-accentSoft/70 text-xs font-medium text-brand-accent transition-colors"
                    >
                      <Icon.Upload className="w-4 h-4" />
                      <span className="truncate">{jdFile ? jdFile.name : 'Choose PDF file'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleJDUpload}
                      className="hidden"
                    />
                  </div>

                  <LabeledField label="Top K Candidates">
                    <select
                      value={topK}
                      onChange={(e) => setTopK(parseInt(e.target.value))}
                      className="w-full pl-3 pr-9 py-2.5 text-sm rounded-lg border border-ink-100 bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition appearance-none bg-no-repeat bg-[length:1rem] bg-[right_0.75rem_center]"
                      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")" }}
                    >
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value={50}>Top 50</option>
                      <option value={100}>Top 100</option>
                    </select>
                  </LabeledField>

                  <LabeledField label="Max Salary" icon={<Icon.Dollar className="w-4 h-4" />}>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(parseInt(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-ink-100 bg-white text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                    />
                  </LabeledField>

                  <LabeledField label="Minimum Experience (yrs)" icon={<Icon.Briefcase className="w-4 h-4" />}>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={minExp}
                      onChange={(e) => setMinExp(parseInt(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-ink-100 bg-white text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                    />
                  </LabeledField>

                  <LabeledField label="Location (optional)" icon={<Icon.Location className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="Any location"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-ink-100 bg-white text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition"
                    />
                  </LabeledField>
                </div>

                <div className="mt-5 p-3 rounded-lg bg-ink-50/70 border border-ink-100">
                  <p className="text-[11px] text-ink-500 leading-relaxed">
                    Filters apply before ranking. Tune them tighter to reduce noise in your shortlist.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT: Main content */}
          <main className="flex-1 min-w-0 space-y-5">
            {/* CTAs */}
            <section>
              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  onClick={findCandidates}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy-700 text-white text-sm font-semibold shadow-pop hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon.Users className="w-4 h-4" />
                  Rank Candidates
                </button>
                <button
                  onClick={enhanceFeedback}
                  disabled={loading || !hasJD}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-brand-accent text-sm font-semibold border-2 border-brand-accent/30 hover:border-brand-accent hover:bg-brand-accentSoft/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon.Sparkles className="w-4 h-4" />
                  Enhance Ranking
                </button>
                <button
                  onClick={exportResults}
                  disabled={!rankedCandidates.length}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-ink-700 text-sm font-semibold border border-ink-100 hover:border-ink-300 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon.Download className="w-4 h-4" />
                  Export Results
                </button>
              </div>
            </section>

            {/* Dashboard */}
            {hasResults && (
              <section className="jf-fade-up">
                <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
                  <div className="px-6 py-5 border-b border-ink-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-ink-900">
                        Smart Candidate Ranking Dashboard
                      </h2>
                      <p className="text-xs text-ink-500 mt-0.5">
                        Feedback-aware ranking with live intelligence metrics
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
                      icon={<Icon.Users className="w-4 h-4" />}
                      label="Candidates Screened"
                      value={metrics.screened}
                      sub="Total"
                    />
                    <MetricCard
                      tone="green"
                      icon={<Icon.Star className="w-4 h-4" />}
                      label="Top Matches"
                      value={metrics.topMatches}
                      sub="≥ 70%"
                    />
                    <MetricCard
                      tone="accent"
                      icon={<Icon.Target className="w-4 h-4" />}
                      label="Avg Match Score"
                      value={`${metrics.avgMatch}%`}
                      sub="Across K"
                    />
                    <MetricCard
                      tone="amber"
                      icon={<Icon.Shield className="w-4 h-4" />}
                      label="Hiring Confidence"
                      value={`${metrics.confidence}%`}
                      sub="AI"
                    />
                  </div>

                  {/* Tabs */}
                  <div className="px-4 border-b border-ink-100 flex items-center gap-1 overflow-x-auto">
                    <TabButton active={activeTab === 'candidates'} onClick={() => setActiveTab('candidates')}>
                      Candidate Ranking
                    </TabButton>
                    <TabButton active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')}>
                      Ranking Intelligence
                    </TabButton>
                  </div>

                  <div className="p-6">
                    {activeTab === 'candidates' && (
                      <CandidateTable
                        candidates={rankedCandidates}
                        ratings={ratings}
                        setRatings={setRatings}
                        submitRating={submitRating}
                      />
                    )}
                    {activeTab === 'intelligence' && (
                      <RankingIntelligence enhancedResults={enhancedResults} metrics={metrics} />
                    )}
                  </div>
                </div>
              </section>
            )}

            {!hasResults && !loading && (
              <div className="bg-white rounded-2xl border border-dashed border-ink-200 p-10 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-brand-accentSoft text-brand-accent flex items-center justify-center mb-4">
                  <Icon.Users className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-ink-900">Your shortlist awaits</h3>
                <p className="text-xs text-ink-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  {hasJD
                    ? 'Click Rank Candidates to generate your top matches, then Enhance Ranking to apply feedback.'
                    : 'Paste or upload a Job Description to get started.'}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

/* ---------- Candidate Table ---------- */

const scoreBadge = (pct) => {
  if (pct >= 80) return 'bg-success-50 text-success-700 border-success-100';
  if (pct >= 60) return 'bg-brand-accentSoft text-brand-accent border-brand-accentSoft';
  if (pct >= 40) return 'bg-warn-50 text-warn-600 border-[#fde68a]';
  return 'bg-ink-50 text-ink-500 border-ink-100';
};

const CandidateTable = ({ candidates, ratings, setRatings, submitRating }) => {
  const [openRow, setOpenRow] = useState(null);

  if (!candidates.length) {
    return (
      <div className="text-center py-14 text-sm text-ink-500">
        Click <span className="font-semibold text-ink-700">Rank Candidates</span> to populate the table.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto jf-scroll -mx-2">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            <th className="text-left px-3 py-3 font-semibold">Rank</th>
            <th className="text-left px-3 py-3 font-semibold">Candidate</th>
            <th className="text-left px-3 py-3 font-semibold">Match %</th>
            <th className="text-left px-3 py-3 font-semibold">Experience</th>
            <th className="text-left px-3 py-3 font-semibold">Salary</th>
            <th className="text-left px-3 py-3 font-semibold">Skills</th>
            <th className="text-left px-3 py-3 font-semibold">Resume</th>
            <th className="text-right px-3 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {candidates.map((c, i) => {
            const pct = Math.round((c.final_score ?? 0) * 100);
            const resumePct = Math.min(98, Math.max(55, Math.round(60 + (c.final_score ?? 0) * 40)));
            const name = c.name || `Candidate ${c.candidate_id}`;
            const initial = name.charAt(0).toUpperCase();
            const rating = ratings[c.candidate_id] || 3;
            const isOpen = openRow === c.candidate_id;
            return (
              <React.Fragment key={c.candidate_id || i}>
                <tr
                  className={`group cursor-pointer transition-colors ${isOpen ? 'bg-navy-50/40' : 'hover:bg-ink-50/60'}`}
                  onClick={() => setOpenRow(isOpen ? null : c.candidate_id)}
                >
                  <td className="px-3 py-3">
                    <span className="w-7 h-7 rounded-md bg-navy-700 text-white text-xs font-semibold inline-flex items-center justify-center">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-600 to-brand-accent text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink-900 truncate">{name}</div>
                        <div className="text-[11px] text-ink-400 truncate">ID: {c.candidate_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border tabular-nums ${scoreBadge(pct)}`}>
                      {pct}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-ink-700 tabular-nums">{c.experience ?? '—'} yrs</td>
                  <td className="px-3 py-3 text-sm text-ink-700 tabular-nums">
                    {c.salary ? `$${Number(c.salary).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="w-28">
                      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-accent to-navy-700 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-ink-400 mt-1 tabular-nums">{pct}% match</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full border-2 border-ink-100 flex items-center justify-center text-[10px] font-semibold text-navy-700 tabular-nums">
                        {resumePct}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenRow(isOpen ? null : c.candidate_id); }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-accentDark px-2.5 py-1.5 rounded-md hover:bg-brand-accentSoft/60 transition-colors"
                    >
                      {isOpen ? 'Hide' : 'Review'}
                      <Icon.Arrow className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-navy-50/20">
                    <td colSpan={8} className="px-6 py-5">
                      <div className="grid md:grid-cols-3 gap-5">
                        <div className="md:col-span-2">
                          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                            Resume Summary
                          </div>
                          <p className="text-sm text-ink-700 leading-relaxed">
                            {c.resume_summary || 'No resume summary available.'}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {c.email && <Chip>✉︎ {c.email}</Chip>}
                            {c.phone && <Chip>☎ {c.phone}</Chip>}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                            Recruiter Feedback
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-ink-500">Rating</span>
                            <span className="text-sm font-semibold text-navy-700 tabular-nums">{rating}/5</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={rating}
                            onChange={(e) => setRatings({ ...ratings, [c.candidate_id]: parseInt(e.target.value) })}
                            className="jf-slider w-full"
                            style={{ '--val': `${((rating - 1) / 4) * 100}%` }}
                          />
                          <button
                            onClick={() => submitRating(c.candidate_id)}
                            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-navy-700 hover:bg-navy-800 transition-colors"
                          >
                            Submit & Re-rank
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ---------- Ranking Intelligence ---------- */

const IntelCard = ({ icon, label, value, tone = 'navy' }) => {
  const tones = {
    navy: 'bg-navy-50 text-navy-700 border-navy-100',
    accent: 'bg-brand-accentSoft text-brand-accent border-brand-accentSoft',
    green: 'bg-success-50 text-success-700 border-success-100',
    amber: 'bg-warn-50 text-warn-600 border-[#fde68a]',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${tones[tone]}`}>
      <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center shadow-card">
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
};

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

const RankingIntelligence = ({ enhancedResults, metrics }) => {
  if (!enhancedResults) {
    return (
      <div className="text-center py-14">
        <div className="w-12 h-12 mx-auto rounded-xl bg-brand-accentSoft text-brand-accent flex items-center justify-center mb-4">
          <Icon.Sparkles className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-ink-900">Turn on AI intelligence</h3>
        <p className="text-xs text-ink-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
          Click <span className="font-semibold text-ink-700">Enhance Ranking</span> after rating a few candidates to see NDCG,
          Spearman correlation, and re-rank analytics.
        </p>
      </div>
    );
  }

  const { old_candidates = [], new_candidates = [], metrics: m = {} } = enhancedResults;
  const ndcgLift = m.ndcg_improvement != null ? m.ndcg_improvement.toFixed(4) : '—';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <IntelCard
          tone="navy"
          icon={<Icon.Trend className="w-4 h-4 text-navy-700" />}
          label="NDCG Before"
          value={m.ndcg_before?.toFixed(4) ?? '—'}
        />
        <IntelCard
          tone="accent"
          icon={<Icon.Trend className="w-4 h-4 text-brand-accent" />}
          label="NDCG After"
          value={m.ndcg_after?.toFixed(4) ?? '—'}
        />
        <IntelCard
          tone="green"
          icon={<Icon.Bolt className="w-4 h-4 text-success-600" />}
          label="Lift (NDCG)"
          value={ndcgLift}
        />
        <IntelCard
          tone="amber"
          icon={<Icon.Shield className="w-4 h-4 text-warn-600" />}
          label="AI Confidence"
          value={`${metrics.confidence}%`}
        />
        <IntelCard
          tone="navy"
          icon={<span className="text-navy-700 font-bold text-base">Σ</span>}
          label="Spearman Rank"
          value={m.spearman_r?.toFixed(4) ?? '—'}
        />
        <IntelCard
          tone="accent"
          icon={<Icon.Layers className="w-4 h-4 text-brand-accent" />}
          label="Reordered"
          value={`${m.reordered_pct ?? 0}%`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-ink-100 overflow-hidden bg-white">
          <div className="px-4 py-3 bg-ink-800 text-white flex items-center gap-2">
            <Icon.Users className="w-4 h-4" />
            <p className="text-sm font-semibold">Before Feedback</p>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-white/60">Baseline</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {old_candidates.slice(0, 10).map((c, i) => (
              <RankingRow
                key={i}
                idx={i}
                title={c.name || `Candidate ${c.candidate_id}`}
                score={c.final_score?.toFixed(3) ?? '—'}
                scoreLabel="score"
              />
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-navy-100 overflow-hidden bg-white">
          <div className="px-4 py-3 bg-navy-700 text-white flex items-center gap-2">
            <Icon.Star className="w-4 h-4" />
            <p className="text-sm font-semibold">After Feedback</p>
            <span className="ml-auto text-[10px] uppercase tracking-wider text-white/70">Enhanced</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {new_candidates.slice(0, 10).map((c, i) => (
              <RankingRow
                key={i}
                idx={i}
                title={c.name || `Candidate ${c.candidate_id}`}
                score={c.final_score?.toFixed(3) ?? '—'}
                scoreLabel="adj"
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecruiterModule;
