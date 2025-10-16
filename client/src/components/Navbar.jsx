import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [marketsDropdownOpen, setMarketsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isMarketsActive = () => {
    return location.pathname.startsWith('/crypto') || location.pathname.startsWith('/trading');
  };

  const navLinkClass = (path) => {
    return `px-4 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-gradient-phantom text-white shadow-glow'
        : 'text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-secondary'
    }`;
  };

  const navDropdownClass = () => {
    return `px-4 py-2.5 rounded-2xl font-medium transition-all duration-200 cursor-pointer ${
      isMarketsActive()
        ? 'bg-gradient-phantom text-white shadow-glow'
        : 'text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-secondary'
    }`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMarketsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-phantom-bg-secondary/50 backdrop-blur-xl border-b border-phantom-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 bg-gradient-phantom rounded-2xl flex items-center justify-center transform transition-all group-hover:scale-110 group-hover:shadow-glow shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-phantom bg-clip-text text-transparent">
                Agon
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </span>
              </Link>
              <Link to="/swap" className={navLinkClass('/swap')}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Swap
                </span>
              </Link>
              <Link to="/users" className={navLinkClass('/users')}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Users & Send
                </span>
              </Link>
              <Link to="/auctions" className={navLinkClass('/auctions')}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Auctions
                </span>
              </Link>
              <Link to="/escrow" className={navLinkClass('/escrow')}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Escrow
                </span>
              </Link>
              <Link to="/games" className={navLinkClass('/games')}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Games
                </span>
              </Link>
              
              {/* Markets Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMarketsDropdownOpen(!marketsDropdownOpen)}
                  className={navDropdownClass()}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Markets
                    <svg className={`w-4 h-4 transition-transform ${marketsDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                
                {marketsDropdownOpen && (
                  <div className="absolute top-full mt-2 w-56 bg-phantom-bg-secondary/95 backdrop-blur-xl rounded-2xl shadow-xl border border-phantom-border py-2 z-50">
                    <Link
                      to="/trading"
                      className="flex items-center gap-3 px-4 py-3 text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary transition-colors"
                      onClick={() => setMarketsDropdownOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-medium">Trading</div>
                        <div className="text-xs text-phantom-text-tertiary">Crypto + Stocks + Gold</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
              {user?.is_admin && (
                <Link to="/admin" className={navLinkClass('/admin')}>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Admin
                  </span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 px-4 py-2.5 bg-phantom-bg-tertiary rounded-2xl border border-phantom-border">
              <div className="w-9 h-9 bg-gradient-phantom rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-xs text-phantom-text-tertiary">Logged in as</p>
                <p className="text-sm font-semibold text-phantom-text-primary">{user?.username}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2.5 text-sm font-medium text-phantom-text-secondary hover:text-phantom-error hover:bg-phantom-bg-tertiary rounded-2xl transition-all duration-200 flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
