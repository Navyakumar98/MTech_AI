import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleCard = ({ title, desc, onClick, icon, accent }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden text-left bg-white rounded-2xl border border-ink-100 shadow-card hover:border-navy-300 hover:shadow-[0_16px_32px_-16px_rgba(45,79,163,0.45)] hover:-translate-y-0.5 transition-all duration-300 p-6 w-full md:w-72"
  >
    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-transparent group-hover:bg-[linear-gradient(180deg,rgba(45,79,163,0.07),rgba(45,79,163,0.015))] transition-colors duration-300" />
    <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center mb-5`}>
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-ink-900 mb-1.5">{title}</h3>
    <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
    <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-navy-600 group-hover:text-navy-500 transition-colors">
      Continue
      <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
    </div>
  </button>
);

const RoleSelection = () => {
  const navigate = useNavigate();
  const handleSelect = (role) => {
    if (role === 'jobseeker') navigate('/jobseeker');
    else if (role === 'recruiter') navigate('/recruiter');
  };

  return (
    <div className="relative min-h-screen bg-surface-subtle pt-28 pb-20 px-6 flex flex-col items-center overflow-hidden">
      <div className="absolute inset-0 jf-grid-bg opacity-50 pointer-events-none" />
      <div className="relative text-center max-w-xl jf-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-ink-100 shadow-card text-xs font-medium text-ink-600 mb-5">
          Choose your workspace
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-ink-900">
          How would you like to use JobFusion?
        </h1>
        <p className="mt-3 text-ink-500">
          Pick a role to open the right workspace — you can switch anytime.
        </p>
      </div>

      <div className="relative mt-12 flex flex-col md:flex-row gap-5">
        <RoleCard
          title="Job Seeker"
          desc="Upload your resume, tune preferences, and get ranked matches with AI feedback."
          onClick={() => handleSelect('jobseeker')}
          accent="bg-brand-accentSoft text-brand-accent"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
          }
        />
        <RoleCard
          title="Recruiter"
          desc="Paste a JD, rank candidates, filter by fit, and export a polished shortlist."
          onClick={() => handleSelect('recruiter')}
          accent="bg-navy-50 text-navy-700"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>
    </div>
  );
};

export default RoleSelection;
