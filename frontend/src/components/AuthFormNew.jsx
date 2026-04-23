import React, { useEffect, useState } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

/* ---------- Primitives ---------- */

const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-xs font-medium text-ink-600 mb-1.5">{label}</label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
  </div>
);

const inputClass =
  'w-full px-3.5 py-2.5 text-sm rounded-lg border border-ink-100 bg-white text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition';

const selectClass =
  "w-full pl-3.5 pr-9 py-2.5 text-sm rounded-lg border border-ink-100 bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition appearance-none bg-no-repeat bg-[length:1rem] bg-[right_0.75rem_center]";

const selectBg = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
};

/* ---------- Main ---------- */

const AuthFormNew = () => {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [role, setRole] = useState('jobSeeker');
  const [error, setError] = useState(null);

  const [salaryType, setSalaryType] = useState('range');
  const [currency, setCurrency] = useState('INR');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [fixedSalary, setFixedSalary] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('yearly');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (isLogin) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userRole = userDoc.data().role;
          localStorage.setItem('userRole', userRole);
          if (userRole === 'jobSeeker') navigate('/jobseeker');
          else if (userRole === 'recruiter') navigate('/recruiter');
          else navigate('/select-role');
        } else {
          navigate('/select-role');
        }
      } catch (firebaseError) {
        setError(firebaseError.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password !== retypePassword) {
      setError('Passwords do not match.');
      setSubmitting(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        fullName,
        phone,
        role,
        details,
        createdAt: new Date(),
        salary:
          role === 'jobSeeker'
            ? {
                type: salaryType,
                currency,
                period: salaryPeriod,
                min: salaryType === 'range' ? Number(minSalary) : null,
                max: salaryType === 'range' ? Number(maxSalary) : null,
                fixed: salaryType === 'fixed' ? Number(fixedSalary) : null,
                negotiable: salaryType === 'negotiable',
              }
            : null,
      });
      localStorage.setItem('userRole', role);
      if (role === 'jobSeeker') navigate('/jobseeker');
      else navigate('/recruiter');
    } catch (firebaseError) {
      console.error('Firebase Auth Error:', firebaseError);
      let errorMessage = 'An unknown error occurred.';
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        default:
          errorMessage = firebaseError.message;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'jobSeeker') navigate('/jobseeker');
    else if (userRole === 'recruiter') navigate('/recruiter');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-surface-subtle pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.05fr_1fr] gap-8 items-stretch">
        {/* LEFT: brand panel */}
        <div className="hidden lg:flex relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 to-navy-700 p-10 text-white shadow-pop">
          <div className="absolute inset-0 jf-grid-bg opacity-20 pointer-events-none" />
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-brand-accent/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col justify-between w-full">
            <div>
              <div className="inline-flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4" /><path d="M4 17l8 4 8-4" />
                  </svg>
                </div>
                <span className="text-lg font-semibold tracking-tight">JobFusion</span>
              </div>
              <h2 className="mt-10 text-3xl font-semibold tracking-tight leading-tight">
                Hiring, reimagined with AI that actually learns from feedback.
              </h2>
              <p className="mt-4 text-sm text-blue-100/80 leading-relaxed max-w-sm">
                Join candidates and recruiters using JobFusion to match smarter, faster,
                and with clear ranking intelligence.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-5">
              <div>
                <div className="text-2xl font-semibold tabular-nums">92%</div>
                <div className="text-[10px] uppercase tracking-wider text-blue-100/70 mt-1">Avg Match</div>
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums">48K+</div>
                <div className="text-[10px] uppercase tracking-wider text-blue-100/70 mt-1">Jobs Indexed</div>
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums">3.2×</div>
                <div className="text-[10px] uppercase tracking-wider text-blue-100/70 mt-1">Faster Shortlisting</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: form panel */}
        <div className="bg-white rounded-3xl border border-ink-100 shadow-card p-8 md:p-10 jf-fade-up">
          {/* Toggle */}
          <div className="mb-7">
            <div className="inline-flex p-1 rounded-xl bg-ink-50 border border-ink-100">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isLogin ? 'bg-white text-navy-700 shadow-card' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  !isLogin ? 'bg-white text-navy-700 shadow-card' : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                Create account
              </button>
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {isLogin
                ? 'Log in to continue to your JobFusion workspace.'
                : 'A few details and you’re in — it takes less than a minute.'}
            </p>
          </div>

          {isLogin ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  className={inputClass}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              {error && (
                <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-navy-700 text-white text-sm font-semibold shadow-pop hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting && (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                )}
                Log in
              </button>

              <p className="pt-2 text-center text-xs text-ink-500">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(null); }}
                  className="text-brand-accent font-semibold hover:text-brand-accentDark"
                >
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role toggle */}
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1.5">I am a</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-ink-50 border border-ink-100">
                  <button
                    type="button"
                    onClick={() => setRole('jobSeeker')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                      role === 'jobSeeker' ? 'bg-white text-navy-700 shadow-card' : 'text-ink-500 hover:text-ink-800'
                    }`}
                  >
                    Job Seeker
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                      role === 'recruiter' ? 'bg-white text-navy-700 shadow-card' : 'text-ink-500 hover:text-ink-800'
                    }`}
                  >
                    Recruiter
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full name">
                  <input className={inputClass} placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </Field>
                <Field label="Email">
                  <input type="email" className={inputClass} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Field>
                <Field label="Phone">
                  <input type="tel" className={inputClass} placeholder="(123) 456-7890" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <div className="hidden md:block" />
                <Field label="Password">
                  <input type="password" className={inputClass} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Field>
                <Field label="Retype password">
                  <input type="password" className={inputClass} placeholder="••••••••" value={retypePassword} onChange={(e) => setRetypePassword(e.target.value)} required />
                </Field>
              </div>

              {role === 'jobSeeker' && (
                <div className="p-4 rounded-xl bg-ink-50/60 border border-ink-100 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Salary expectation
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Field label="Type">
                      <select className={selectClass} style={selectBg} value={salaryType} onChange={(e) => setSalaryType(e.target.value)}>
                        <option value="range">Range</option>
                        <option value="fixed">Fixed</option>
                        <option value="negotiable">Negotiable</option>
                      </select>
                    </Field>
                    <Field label="Currency">
                      <select className={selectClass} style={selectBg} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </Field>
                    <Field label="Period">
                      <select className={selectClass} style={selectBg} value={salaryPeriod} onChange={(e) => setSalaryPeriod(e.target.value)}>
                        <option value="yearly">Per year</option>
                        <option value="monthly">Per month</option>
                        <option value="hourly">Per hour</option>
                      </select>
                    </Field>
                  </div>

                  {salaryType === 'range' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Min salary">
                        <input type="number" className={inputClass} placeholder="e.g. 80000" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} />
                      </Field>
                      <Field label="Max salary">
                        <input type="number" className={inputClass} placeholder="e.g. 150000" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} />
                      </Field>
                    </div>
                  )}
                  {salaryType === 'fixed' && (
                    <Field label="Expected salary">
                      <input type="number" className={inputClass} placeholder="e.g. 120000" value={fixedSalary} onChange={(e) => setFixedSalary(e.target.value)} />
                    </Field>
                  )}
                </div>
              )}

              <Field label="Additional details (optional)">
                <textarea
                  rows="3"
                  className={`${inputClass} resize-y`}
                  placeholder="Tell us a bit about yourself or your company…"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </Field>

              {error && (
                <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-navy-700 text-white text-sm font-semibold shadow-pop hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting && (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                )}
                Create account
              </button>

              <p className="pt-2 text-center text-xs text-ink-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(null); }}
                  className="text-brand-accent font-semibold hover:text-brand-accentDark"
                >
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthFormNew;
