import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-card hover:shadow-soft transition-shadow">
    <div className="w-10 h-10 rounded-lg bg-brand-accentSoft text-brand-accent flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-ink-900 mb-1.5">{title}</h3>
    <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
  </div>
);

const Stat = ({ value, label }) => (
  <div>
    <div className="text-2xl font-semibold text-ink-900 tracking-tight">{value}</div>
    <div className="text-xs text-ink-400 uppercase tracking-wider mt-1">{label}</div>
  </div>
);

const Home = ({ user, role }) => {
  const getStartedLink = () => {
    if (!user) return '/auth';
    if (role === 'jobSeeker') return '/jobseeker';
    if (role === 'recruiter') return '/recruiter';
    if (role === 'admin') return '/select-role';
    return '/auth';
  };

  return (
    <div className="min-h-screen bg-surface-subtle pt-16">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 jf-grid-bg opacity-60 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-navy-700/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto jf-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-ink-100 shadow-card text-xs font-medium text-ink-600 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
              AI-powered hiring, reimagined for 2026
            </div>

            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-ink-900 leading-[1.05]">
              Hire smarter. <br />
              <span className="bg-gradient-to-r from-navy-700 to-brand-accent bg-clip-text text-transparent">
                Match faster.
              </span>
            </h1>

            <p className="mt-6 text-lg text-ink-500 max-w-xl leading-relaxed">
              JobFusion uses feedback-aware ranking to surface the best job matches
              for candidates and the best candidates for recruiters - in seconds.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <Link
                to={getStartedLink()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-navy-700 text-white text-sm font-semibold shadow-pop hover:bg-navy-800 transition-colors"
              >
                Get started
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-ink-800 text-sm font-semibold border border-ink-100 shadow-card hover:border-ink-200 transition-colors"
              >
                Learn more
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-10 md:gap-16">
              <Stat value="92%" label="Avg Match Score" />
              <Stat value="48K+" label="Jobs Indexed" />
              <Stat value="3.2×" label="Faster Shortlisting" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-accent mb-2">
            Platform
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">
            Everything you need to match talent with opportunity
          </h2>
          <p className="mt-3 text-ink-500 leading-relaxed">
            One intelligent workspace for both sides of the hiring equation -
            built on semantic search, ATS scoring, and feedback-aware re-ranking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>}
            title="Resume Intelligence"
            desc="Instant ATS scoring, skill extraction, and AI-powered resume feedback that tells you exactly what to improve."
          />
          <FeatureCard
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>}
            title="Smart Job Matching"
            desc="Personalized recommendations weighted by your location, salary, and experience preferences - not just keywords."
          />
          <FeatureCard
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            title="Recruiter Workspace"
            desc="Rank thousands of resumes against any JD. Filter, re-rank with feedback, and export - all in one dashboard."
          />
          <FeatureCard
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>}
            title="Ranking Intelligence"
            desc="NDCG, Spearman correlation, and reorder metrics show exactly how feedback is improving your rankings."
          />
          <FeatureCard
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
            title="Feedback-Aware AI"
            desc="Every thumbs-up or rating instantly improves rankings for future sessions. Your workspace learns with you."
          />
          <FeatureCard
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
            title="Unified Dashboard"
            desc="Clean metric cards, premium tables, and clear ranking comparisons. No clutter. Just signal."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 to-navy-700 px-8 py-14 md:px-14 md:py-16 shadow-pop">
          <div className="absolute inset-0 jf-grid-bg opacity-20 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
                Ready to find your perfect match?
              </h3>
              <p className="mt-3 text-blue-100/80 leading-relaxed">
                Join thousands of candidates and recruiters using JobFusion to make
                smarter hiring decisions every day.
              </p>
            </div>
            <Link
              to={getStartedLink()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-navy-800 text-sm font-semibold hover:bg-blue-50 transition-colors w-fit"
            >
              Launch JobFusion
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
