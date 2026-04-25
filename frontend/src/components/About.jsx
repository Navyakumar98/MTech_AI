import React from 'react';
import { Link } from 'react-router-dom';

const Bullet = ({ title, desc, icon }) => (
  <div className="flex gap-4 p-5 rounded-2xl border border-ink-100 bg-white shadow-card">
    <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-accentSoft text-brand-accent flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h4 className="text-sm font-semibold text-ink-900 mb-1">{title}</h4>
      <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const About = () => {
  return (
    <div className="min-h-screen bg-surface-subtle pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto jf-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-ink-100 shadow-card text-xs font-medium text-ink-600 mb-6">
            About JobFusion
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-ink-900 leading-tight">
            Built for the future of hiring
          </h1>
          <p className="mt-5 text-ink-500 leading-relaxed">
            JobFusion is an AI-powered platform that connects talented candidates
            with the right opportunities - and helps recruiters find the right
            people, faster. It combines semantic matching, ATS scoring, and
            feedback-aware re-ranking into one elegant workspace.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-4">
          <Bullet
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>}
            title="Resume Analysis"
            desc="Instant ATS scoring, skill extraction, and personalized feedback to make every resume stand out."
          />
          <Bullet
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>}
            title="Job Recommendations"
            desc="Jobs ranked by location, salary, and experience fit - weighted the way you care about them."
          />
          <Bullet
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>}
            title="Recruiter Tools"
            desc="Upload a JD, rank candidates, filter by salary/experience, and export a clean shortlist in minutes."
          />
          <Bullet
            icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>}
            title="Ranking Intelligence"
            desc="NDCG, Spearman, and reorder metrics show exactly how feedback is sharpening your results."
          />
        </div>

        <div className="mt-14 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 shadow-pop transition-colors"
          >
            Back to Home
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
          <p className="mt-8 text-xs uppercase tracking-wider text-ink-400">
            Engineered to shape the future of hiring
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
