import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    return `px-4 py-2.5 font-medium transition-all duration-300 relative ${
      isActive(path)
        ? 'text-gold shadow-gold-glow before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-gold'
        : 'text-deco-silver hover:text-gold-light'
    }`;
  };

  return (
    <nav className="bg-noir-dark/95 backdrop-blur-xl border-b-2 border-gold/30 sticky top-0 z-50 shadow-xl">
      {/* Art Deco top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-gold"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-deco-silver/20"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              {/* Art Deco geometric logo */}
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 bg-gradient-gold opacity-20 transform rotate-45"></div>
                <div className="relative w-full h-full border-2 border-gold flex items-center justify-center bg-noir-darker transform transition-all group-hover:scale-110 group-hover:shadow-gold-glow">
                  <svg className="w-7 h-7 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gold tracking-wider">
                  PIGEON
                </span>
                <span className="text-xs text-deco-silver tracking-widest -mt-1">
                  BANKING
                </span>
              </div>
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
                  Send
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
              
              <Link to="/trading" className={navLinkClass('/trading')}>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Trading
                </span>
              </Link>
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
            <div className="hidden sm:flex items-center space-x-3 px-4 py-2.5 bg-noir-charcoal border-2 border-gold/30 relative overflow-hidden">
              {/* Art deco corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-gold"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-gold"></div>
              
              <div className="w-9 h-9 bg-gradient-gold flex items-center justify-center text-noir-black font-bold text-sm shadow-gold-glow border border-gold-dark">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-xs text-deco-silver/60 uppercase tracking-wider">Logged in as</p>
                <p className="text-sm font-semibold text-gold">{user?.username}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2.5 text-sm font-medium text-deco-silver hover:text-deco-burgundy border border-deco-silver/30 hover:border-deco-burgundy/50 bg-noir-charcoal hover:bg-noir-slate transition-all duration-300 flex items-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="relative z-10">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
