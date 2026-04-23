import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      active
        ? 'text-white bg-white/10'
        : 'text-white/80 hover:text-white hover:bg-white/10'
    }`}
  >
    {children}
  </Link>
);

const Header = ({ user }) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        localStorage.removeItem('userRole');
        navigate('/auth');
      })
      .catch((error) => {
        console.error('Error logging out: ', error);
      });
  };

  const emailInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-navy-700/95 backdrop-blur supports-[backdrop-filter]:bg-navy-700/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-blue-200 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-navy-800" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7l8-4 8 4-8 4-8-4z" />
              <path d="M4 12l8 4 8-4" />
              <path d="M4 17l8 4 8-4" />
            </svg>
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">JobFusion</span>
          <span className="hidden sm:inline-flex ml-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200 bg-white/10 px-1.5 py-0.5 rounded">AI</span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/" active={location.pathname === '/'}>Home</NavLink>
          <NavLink to="/about" active={location.pathname === '/about'}>About</NavLink>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                  {emailInitial}
                </div>
                <span className="text-xs text-white/80 max-w-[180px] truncate">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/auth"
                className="text-sm font-semibold text-navy-800 bg-white px-3.5 py-1.5 rounded-md hover:bg-blue-50 transition-colors shadow-sm"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
