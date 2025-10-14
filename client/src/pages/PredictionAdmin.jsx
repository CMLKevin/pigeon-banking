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
            {/* Whitelisted Markets */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
              <h2 className="text-2xl font-bold text-phantom-text-primary mb-6">Whitelisted Markets</h2>
              
              {availableMarkets.filter(m => m.isWhitelisted).length === 0 ? (
                <p className="text-phantom-text-secondary text-center py-8">
                  No markets whitelisted yet
                </p>
              ) : (
                <div className="space-y-4">
                  {availableMarkets.filter(m => m.isWhitelisted).map((market) => (
                    <div
                      key={market.pm_market_id}
                      className="p-6 bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="text-lg font-bold text-phantom-text-primary mb-2">
                            {market.question}
                          </h3>
                          <p className="text-sm text-phantom-text-tertiary">
                            ID: {market.pm_market_id}
                          </p>
                        </div>
                        <div className="flex gap-2">
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
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
              <h2 className="text-2xl font-bold text-phantom-text-primary mb-6">
                Available Markets from Polymarket
              </h2>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {availableMarkets.filter(m => !m.isWhitelisted).length === 0 ? (
                  <p className="text-phantom-text-secondary text-center py-8">
                    All available markets have been whitelisted
                  </p>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionAdmin;

