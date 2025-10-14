import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { predictionAPI, walletAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const PredictionMarkets = () => {
  const [markets, setMarkets] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, resolved
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [marketsRes, walletRes] = await Promise.all([
        predictionAPI.getMarkets(),
        walletAPI.getWallet()
      ]);
      setMarkets(marketsRes.data.markets);
      setWallet(walletRes.data.wallet);
    } catch (error) {
      console.error('Failed to load markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = markets.filter(m => {
    // Filter by status
    if (filter === 'active' && m.status !== 'active') return false;
    if (filter === 'resolved' && m.status !== 'resolved') return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return m.question.toLowerCase().includes(query);
    }
    
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500' },
      paused: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500' },
      resolved: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500' }
    };
    return badges[status] || badges.active;
  };

  const getPriceColor = (price) => {
    if (price > 0.65) return 'text-green-500';
    if (price < 0.35) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">
            Prediction Markets
          </h1>
          <p className="text-phantom-text-secondary text-lg">
            Trade on the outcome of real-world events
          </p>
        </div>

        {/* Balance Card */}
        <div className="mb-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Available Balance</p>
              <h2 className="text-3xl font-bold tracking-tight">
                Ⱥ {formatCurrency(wallet?.agon || 0)}
              </h2>
            </div>
            <Link to="/prediction-portfolio">
              <Button size="large" variant="secondary">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                View Portfolio
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets..."
              className="w-full px-5 py-4 pl-12 bg-phantom-bg-secondary border-2 border-phantom-border text-phantom-text-primary placeholder:text-phantom-text-tertiary rounded-2xl focus:outline-none focus:border-phantom-accent-primary focus:shadow-input transition-all duration-200"
            />
            <svg className="w-5 h-5 text-phantom-text-tertiary absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-phantom-text-tertiary hover:text-phantom-text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {['all', 'active', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-gradient-phantom text-white shadow-glow'
                  : 'bg-phantom-bg-secondary text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({markets.filter(m => f === 'all' || m.status === f).length})
            </button>
          ))}
        </div>

        {/* Markets List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
              <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary opacity-20"></div>
            </div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-12 text-center">
            <svg className="w-20 h-20 text-phantom-text-tertiary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-semibold text-phantom-text-primary mb-2">No Markets Available</h3>
            <p className="text-phantom-text-secondary">
              Check back soon for new prediction markets
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredMarkets.map((market) => {
              const badge = getStatusBadge(market.status);
              const quote = market.lastQuote;
              const yesMid = quote ? (parseFloat(quote.yes_bid) + parseFloat(quote.yes_ask)) / 2 : 0.5;
              const noMid = quote ? (parseFloat(quote.no_bid) + parseFloat(quote.no_ask)) / 2 : 0.5;

              return (
                <Link
                  key={market.id}
                  to={`/prediction-markets/${market.id}`}
                  className="group bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <h3 className="text-xl font-bold text-phantom-text-primary group-hover:text-phantom-accent-primary transition-colors mb-2">
                          {market.question}
                        </h3>
                        {market.end_date && (
                          <p className="text-sm text-phantom-text-tertiary">
                            Closes: {new Date(market.end_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}>
                        {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
                      </span>
                    </div>

                    {market.status !== 'resolved' && quote && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-phantom-bg-tertiary/50 rounded-2xl">
                          <p className="text-xs text-phantom-text-tertiary mb-1">YES</p>
                          <p className={`text-2xl font-bold ${getPriceColor(yesMid)}`}>
                            {(yesMid * 100).toFixed(1)}¢
                          </p>
                          <div className="mt-2 text-xs">
                            <span className="text-phantom-text-tertiary">Buy: </span>
                            <span className="text-phantom-text-primary">{(parseFloat(quote.yes_ask) * 100).toFixed(1)}¢</span>
                            <span className="text-phantom-text-tertiary mx-2">|</span>
                            <span className="text-phantom-text-tertiary">Sell: </span>
                            <span className="text-phantom-text-primary">{(parseFloat(quote.yes_bid) * 100).toFixed(1)}¢</span>
                          </div>
                        </div>
                        <div className="p-4 bg-phantom-bg-tertiary/50 rounded-2xl">
                          <p className="text-xs text-phantom-text-tertiary mb-1">NO</p>
                          <p className={`text-2xl font-bold ${getPriceColor(noMid)}`}>
                            {(noMid * 100).toFixed(1)}¢
                          </p>
                          <div className="mt-2 text-xs">
                            <span className="text-phantom-text-tertiary">Buy: </span>
                            <span className="text-phantom-text-primary">{(parseFloat(quote.no_ask) * 100).toFixed(1)}¢</span>
                            <span className="text-phantom-text-tertiary mx-2">|</span>
                            <span className="text-phantom-text-tertiary">Sell: </span>
                            <span className="text-phantom-text-primary">{(parseFloat(quote.no_bid) * 100).toFixed(1)}¢</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {market.status === 'resolved' && market.resolution && (
                      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                        <p className="text-sm font-semibold text-blue-500">
                          Resolved: {market.resolution.toUpperCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionMarkets;

