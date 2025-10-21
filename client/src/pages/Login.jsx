import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Neo-noir art deco background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gold light rays */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-gold/20 via-gold/5 to-transparent"></div>
        <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-gold-light/10 via-gold/5 to-transparent" style={{ animationDelay: '1s' }}></div>
        
        {/* Art deco geometric patterns */}
        <div className="absolute top-1/4 left-10 w-32 h-32 border-2 border-gold/10 transform rotate-45"></div>
        <div className="absolute bottom-1/4 right-10 w-40 h-40 border border-deco-silver/10 transform -rotate-12"></div>
        
        {/* Ambient gold glow */}
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-gold/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gold-bronze/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-slide-up">
        {/* Art Deco Logo and Title */}
        <div className="text-center mb-10">
          {/* Geometric stepped logo */}
          <div className="inline-block relative mb-8">
            <div className="absolute inset-0 bg-gradient-gold opacity-20 transform rotate-45 blur-xl"></div>
            <div className="relative">
              {/* Outer geometric frame */}
              <div className="w-24 h-24 border-4 border-gold relative mx-auto bg-noir-darker shadow-gold-glow">
                {/* Corner decorations */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-gold"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gold"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gold"></div>
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gold animate-pulse-glow" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                </div>
              </div>
              
              {/* Art deco rays */}
              <div className="absolute top-0 left-1/2 w-px h-6 bg-gradient-to-t from-gold to-transparent -translate-x-1/2 -translate-y-full"></div>
              <div className="absolute top-0 left-1/2 w-px h-4 bg-gradient-to-t from-gold-light to-transparent -translate-x-1/2 -translate-y-full rotate-12 origin-bottom"></div>
              <div className="absolute top-0 left-1/2 w-px h-4 bg-gradient-to-t from-gold-light to-transparent -translate-x-1/2 -translate-y-full -rotate-12 origin-bottom"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-gold tracking-widest">
              PIGEON
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold"></div>
              <p className="text-deco-silver tracking-[0.3em] text-sm">BANKING</p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold"></div>
            </div>
            <p className="text-deco-silver/70 text-sm tracking-wider mt-4">WELCOME BACK</p>
          </div>
        </div>

        {/* Art Deco Login Card */}
        <div className="bg-noir-dark/80 backdrop-blur-xl shadow-card border-2 border-gold/30 p-8 relative overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
          
          {/* Stepped border accent */}
          <div className="absolute top-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Minecraft Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {error && (
              <div className="bg-deco-burgundy/10 border-2 border-deco-burgundy/50 text-deco-burgundy px-4 py-3.5 flex items-center gap-3 animate-scale-in relative">
                <div className="absolute top-0 left-0 w-2 h-2 bg-deco-burgundy"></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-deco-burgundy"></div>
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium tracking-wide">{error}</span>
              </div>
            )}

            <Button type="submit" fullWidth disabled={loading} size="large">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center relative">
            <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-6"></div>
            <p className="text-deco-silver">
              Don't have an account?{' '}
              <Link to="/signup" className="text-gold font-semibold hover:text-gold-light transition-colors border-b border-gold/50 hover:border-gold-light">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Art Deco Footer */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold/50"></div>
            <div className="w-1 h-1 bg-gold transform rotate-45"></div>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold/50"></div>
          </div>
          <p className="text-deco-silver/50 text-xs tracking-widest uppercase">
            Stoneworks Payment System
          </p>
          <Link
            to="/admin/login"
            className="text-deco-silver/60 hover:text-gold transition-colors text-xs inline-flex items-center gap-2 border border-deco-silver/20 hover:border-gold/50 px-3 py-1.5 group"
          >
            <svg className="w-3.5 h-3.5 group-hover:text-gold transition-colors" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="tracking-wider">ADMIN ACCESS</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
