import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { predictionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PredictionAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableMarkets, setAvailableMarkets] = useState([]);
  const [whitelistedMarkets, setWhitelistedMarkets] = useState([]);
  const [stats, setStats] = useState(null);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manualMarketId, setManualMarketId] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/prediction-markets');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.is_admin) {
      loadAvailableMarkets();
    }
  }, [user]);

  const loadAvailableMarkets = async () => {
    try {
      const res = await predictionAPI.getAvailableMarkets();
      setAvailableMarkets(res.data.markets || []);
      setWhitelistedMarkets(res.data.whitelistedMarkets || []);
      setStats(res.data.stats);
      if (res.data.error) {
        setApiError(res.data.error);
      } else {
        setApiError('');
      }
    } catch (error) {
      console.error('Failed to load markets:', error);
      setError('Failed to load available markets');
      setApiError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWhitelist = async (pm_market_id) => {
    setError('');
    setSuccess('');

    try {
      await predictionAPI.whitelistMarket(pm_market_id);
      setSuccess('Market added successfully!');
      setManualMarketId('');
      setShowManualAdd(false);
      await loadAvailableMarkets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add market');
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualMarketId.trim()) {
      setError('Please enter a market ID');
      return;
    }
    await handleWhitelist(manualMarketId.trim());
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this market?')) {
      return;
    }

    try {
      await predictionAPI.removeMarket(id);
      setSuccess('Market removed successfully!');
      await loadAvailableMarkets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove market');
    }
  };

  const handlePauseResume = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      await predictionAPI.updateMarketStatus(id, newStatus);
      setSuccess(`Market ${newStatus === 'active' ? 'resumed' : 'paused'} successfully!`);
      await loadAvailableMarkets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update market status');
    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">
            Prediction Markets Admin
          </h1>
          <p className="text-phantom-text-secondary text-lg">
            Manage whitelisted prediction markets from Polymarket
          </p>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-500 px-6 py-4 rounded-2xl">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Card */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-400 text-sm font-medium mb-1">Total Available</p>
                      <p className="text-3xl font-bold text-blue-500">{stats.totalAvailable}</p>
                    </div>
                    <svg className="w-10 h-10 text-blue-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 text-sm font-medium mb-1">Whitelisted</p>
                      <p className="text-3xl font-bold text-green-500">{stats.totalWhitelisted}</p>
                    </div>
                    <svg className="w-10 h-10 text-green-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-400 text-sm font-medium mb-1">Available to Add</p>
                      <p className="text-3xl font-bold text-purple-500">{stats.availableToAdd}</p>
                    </div>
                    <svg className="w-10 h-10 text-purple-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* API Error Warning */}
            {apiError && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-yellow-500 font-semibold mb-2">Polymarket API Connection Issue</h3>
                    <p className="text-yellow-500/80 text-sm mb-3">{apiError}</p>
                    <p className="text-yellow-500/60 text-sm">
                      You can still manually add markets using their Market ID from Polymarket.com
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Market Addition */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-phantom-text-primary mb-2">Manually Add Market</h2>
                  <p className="text-phantom-text-secondary text-sm">
                    Add a market by entering its condition_id from Polymarket
                  </p>
                </div>
                <button
                  onClick={() => setShowManualAdd(!showManualAdd)}
                  className="px-4 py-2 bg-phantom-accent-primary/10 hover:bg-phantom-accent-primary/20 text-phantom-accent-primary rounded-xl transition-colors"
                >
                  {showManualAdd ? 'Hide' : 'Show'}
                </button>
              </div>

              {showManualAdd && (
                <div className="space-y-4">
                  <form onSubmit={handleManualAdd} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-phantom-text-primary mb-2">
                        Market ID (condition_id)
                      </label>
                      <input
                        type="text"
                        value={manualMarketId}
                        onChange={(e) => setManualMarketId(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-phantom-bg-tertiary border-2 border-phantom-border text-phantom-text-primary placeholder:text-phantom-text-tertiary rounded-xl focus:outline-none focus:border-phantom-accent-primary transition-colors"
                      />
                      <p className="text-xs text-phantom-text-tertiary mt-2">
                        Example: 0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917
                      </p>
                    </div>

                    <Button type="submit" size="medium">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Market
                    </Button>
                  </form>

                  {/* Help Text */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      How to find a Market ID
                    </h4>
                    <ol className="text-sm text-blue-400/80 space-y-2 ml-7">
                      <li>1. Go to <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Polymarket.com</a></li>
                      <li>2. Browse and click on a market you want to add</li>
                      <li>3. Look in the browser's developer tools (F12) → Network tab</li>
                      <li>4. Find API calls containing "condition_id" or look in the page source</li>
                      <li>5. Copy the condition_id (starts with 0x...)</li>
                      <li>6. Paste it above and click "Add Market"</li>
                    </ol>
                    <p className="text-xs text-blue-400/60 mt-3">
                      The system will automatically fetch market details, token IDs, and initial prices from Polymarket.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Whitelisted Markets */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
              <h2 className="text-2xl font-bold text-phantom-text-primary mb-6">Whitelisted Markets</h2>
              
              {whitelistedMarkets.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-phantom-text-tertiary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-phantom-text-secondary mb-2">No markets whitelisted yet</p>
                  <p className="text-phantom-text-tertiary text-sm">
                    Add your first market using the form above
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {whitelistedMarkets.map((market) => (
                    <div
                      key={market.id}
                      className="p-6 bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border hover:border-phantom-accent-primary/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-phantom-text-primary">
                              {market.question}
                            </h3>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              market.status === 'active' 
                                ? 'bg-green-500/20 text-green-500' 
                                : market.status === 'paused'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-blue-500/20 text-blue-500'
                            }`}>
                              {market.status}
                            </span>
                          </div>
                          <p className="text-xs text-phantom-text-tertiary font-mono mb-2">
                            ID: {market.pm_market_id}
                          </p>
                          {market.end_date && (
                            <p className="text-sm text-phantom-text-secondary">
                              Closes: {new Date(market.end_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {market.status === 'active' && (
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={() => handlePauseResume(market.id, market.status)}
                            >
                              Pause
                            </Button>
                          )}
                          {market.status === 'paused' && (
                            <Button
                              size="small"
                              onClick={() => handlePauseResume(market.id, market.status)}
                            >
                              Resume
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => handleRemove(market.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Markets from Polymarket */}
            {availableMarkets.length > 0 && (
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-phantom-text-primary mb-1">
                      Available Markets from Polymarket
                    </h2>
                    <p className="text-phantom-text-secondary text-sm">
                      Browse and add markets from Polymarket API
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-lg text-sm font-medium">
                    {availableMarkets.filter(m => !m.isWhitelisted).length} available
                  </span>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {availableMarkets.filter(m => !m.isWhitelisted).length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-phantom-text-secondary">
                        All available markets have been whitelisted
                      </p>
                    </div>
                  ) : (
                    availableMarkets.filter(m => !m.isWhitelisted).slice(0, 50).map((market) => (
                    <div
                      key={market.pm_market_id}
                      className="p-6 bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border hover:border-phantom-accent-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="text-lg font-bold text-phantom-text-primary mb-2">
                            {market.question}
                          </h3>
                          {market.metadata?.description && (
                            <p className="text-sm text-phantom-text-secondary mb-2">
                              {market.metadata.description.substring(0, 200)}
                              {market.metadata.description.length > 200 ? '...' : ''}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-phantom-text-tertiary">
                            {market.volume && (
                              <span>Volume: ${Number(market.volume).toLocaleString()}</span>
                            )}
                            {market.liquidity && (
                              <span>Liquidity: ${Number(market.liquidity).toLocaleString()}</span>
                            )}
                            {market.end_date && (
                              <span>Closes: {new Date(market.end_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="small"
                          onClick={() => handleWhitelist(market.pm_market_id)}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </Button>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionAdmin;

