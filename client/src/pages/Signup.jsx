import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(username, password, inviteCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
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
            <p className="text-deco-silver/70 text-sm tracking-wider mt-4">THE FUTURE OF FINANCE</p>
          </div>
        </div>

        {/* Art Deco Signup Card */}
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
              label="Invite Code (Optional)"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter your invite code for bonus"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              }
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

            <div className="bg-noir-charcoal/50 border-2 border-gold/20 p-4 relative">
              <div className="absolute top-0 left-3 w-px h-full bg-gold/10"></div>
              <div className="absolute top-0 right-3 w-px h-full bg-gold/10"></div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 border-2 border-gold flex items-center justify-center bg-noir-darker">
                    <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-gold font-bold mb-2 tracking-wide uppercase text-sm">Invitation Bonus</p>
                  <p className="text-sm text-deco-silver/80 leading-relaxed">
                    Receive <span className="text-gold font-bold">100 Stoneworks Dollars ($)</span> and{' '}
                    <span className="text-gold-bronze font-bold">100 Game Chips</span> with a valid invitation code.
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" fullWidth disabled={loading} size="large">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center relative">
            <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mb-6"></div>
            <p className="text-deco-silver">
              Already have an account?{' '}
              <Link to="/login" className="text-gold font-semibold hover:text-gold-light transition-colors border-b border-gold/50 hover:border-gold-light">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Art Deco Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold/50"></div>
            <div className="w-1 h-1 bg-gold transform rotate-45"></div>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold/50"></div>
          </div>
          <p className="text-deco-silver/50 text-xs tracking-widest uppercase">
            Stoneworks Payment System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
