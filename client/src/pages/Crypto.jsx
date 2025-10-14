import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { cryptoAPI, walletAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

// Simple Price Chart Component
const PriceChart = ({ prices, coinSymbol }) => {
  if (!prices || prices.length === 0) {
    return <div className="text-phantom-text-tertiary text-sm">No data available</div>;
  }

  const maxPrice = Math.max(...prices.map(p => p.price));
  const minPrice = Math.min(...prices.map(p => p.price));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="w-full h-48 relative">
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`gradient-${coinSymbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#AB9FF2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#AB9FF2" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={`M ${prices.map((p, i) => {
            const x = (i / (prices.length - 1)) * 100;
            const y = 100 - ((p.price - minPrice) / priceRange) * 80;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')} L 100 100 L 0 100 Z`}
          fill={`url(#gradient-${coinSymbol})`}
        />
        
        {/* Line */}
        <path
          d={prices.map((p, i) => {
            const x = (i / (prices.length - 1)) * 100;
            const y = 100 - ((p.price - minPrice) / priceRange) * 80;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          fill="none"
          stroke="#AB9FF2"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

const Crypto = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [historicalPrices, setHistoricalPrices] = useState({});
  const [positions, setPositions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [selectedDays, setSelectedDays] = useState(7);
  
  // Trading form state
  const [positionType, setPositionType] = useState('long');
  const [leverage, setLeverage] = useState(1);
  const [marginAmount, setMarginAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: 'from-orange-500 to-yellow-600' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: 'from-blue-500 to-purple-600' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: 'from-yellow-400 to-orange-500' }
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [pricesRes, walletRes, positionsRes, statsRes] = await Promise.all([
        cryptoAPI.getCurrentPrices(),
        walletAPI.getWallet(),
        cryptoAPI.getUserPositions('open'),
        cryptoAPI.getUserStats()
      ]);
      
      setPrices(pricesRes.data.prices);
      setWallet(walletRes.data);
      setPositions(positionsRes.data.positions);
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Error loading crypto data:', err);
      setError('Failed to load crypto data');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalPrices = async (coinId, days) => {
    try {
      const res = await cryptoAPI.getHistoricalPrices(coinId, days);
      setHistoricalPrices(prev => ({
        ...prev,
        [coinId]: res.data.prices
      }));
    } catch (err) {
      console.error('Error loading historical prices:', err);
    }
  };

  useEffect(() => {
    loadData();
    
    // Refresh prices every 30 seconds
    const interval = setInterval(() => {
      cryptoAPI.getCurrentPrices().then(res => {
        setPrices(res.data.prices);
      }).catch(err => console.error('Error refreshing prices:', err));
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadHistoricalPrices(selectedCoin, selectedDays);
  }, [selectedCoin, selectedDays]);

  const calculateCommission = () => {
    const commissionRate = 0.01 + ((leverage - 1) / 9) * 0.04; // 1% to 5%
    return commissionRate;
  };

  const calculatePositionValue = () => {
    const margin = parseFloat(marginAmount) || 0;
    const commission = margin * calculateCommission();
    const netMargin = margin - commission;
    return netMargin * leverage;
  };

  const handleOpenPosition = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const margin = parseFloat(marginAmount);
      if (margin <= 0) {
        throw new Error('Margin must be positive');
      }
      if (margin > parseFloat(wallet.agon)) {
        throw new Error('Insufficient Agon balance');
      }

      await cryptoAPI.openPosition(selectedCoin, positionType, leverage, margin);
      setSuccess(`Successfully opened ${positionType} position on ${coins.find(c => c.id === selectedCoin).name}!`);
      setMarginAmount('');
      
      // Reload data
      await loadData();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to open position');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePosition = async (positionId) => {
    if (!confirm('Are you sure you want to close this position?')) return;

    try {
      await cryptoAPI.closePosition(positionId);
      setSuccess('Position closed successfully!');
      await loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close position');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
          <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary opacity-20"></div>
        </div>
      </div>
    );
  }

  const selectedCoinData = coins.find(c => c.id === selectedCoin);
  const selectedCoinPrice = prices[selectedCoin];
  const commission = calculateCommission();
  const positionValue = calculatePositionValue();

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent">Crypto Trading</h1>
          </div>
          <p className="text-phantom-text-secondary">Trade Bitcoin, Ethereum, and Dogecoin with up to 10x leverage</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <p className="text-phantom-text-tertiary text-sm mb-1">Open Positions</p>
              <p className="text-3xl font-bold text-phantom-text-primary">{stats.open_positions}</p>
              <p className="text-xs text-phantom-text-tertiary mt-1">Ⱥ {Number(stats.total_margin || 0).toFixed(2)} margin</p>
            </div>
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <p className="text-phantom-text-tertiary text-sm mb-1">Total P&L</p>
              <p className={`text-3xl font-bold ${Number(stats.net_pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Number(stats.net_pnl || 0) >= 0 ? '+' : ''}Ⱥ {Number(stats.net_pnl || 0).toFixed(2)}
              </p>
              <p className="text-xs text-phantom-text-tertiary mt-1">{stats.closed_positions} closed trades</p>
            </div>
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <p className="text-phantom-text-tertiary text-sm mb-1">Win Rate</p>
              <p className="text-3xl font-bold text-phantom-text-primary">{stats.win_rate}%</p>
              <p className="text-xs text-phantom-text-tertiary mt-1">{stats.winning_trades}W / {stats.losing_trades}L</p>
            </div>
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <p className="text-phantom-text-tertiary text-sm mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-phantom-text-primary">Ⱥ {Number(wallet?.agon || 0).toFixed(2)}</p>
              <p className="text-xs text-phantom-text-tertiary mt-1">Ready to trade</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Price Cards & Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coins.map(coin => {
                const priceData = prices[coin.id];
                if (!priceData) return null;
                
                const isPositive = priceData.change_24h >= 0;
                
                return (
                  <button
                    key={coin.id}
                    onClick={() => setSelectedCoin(coin.id)}
                    className={`bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-2xl shadow-card border-2 p-6 text-left transition-all hover:shadow-card-hover ${
                      selectedCoin === coin.id ? 'border-phantom-accent-primary' : 'border-phantom-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${coin.color} flex items-center justify-center shadow-glow-sm`}>
                        <span className="text-white font-bold text-sm">{coin.symbol}</span>
                      </div>
                      <div className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                        isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {isPositive ? '+' : ''}{Number(priceData.change_24h || 0).toFixed(2)}%
                      </div>
                    </div>
                    <p className="text-phantom-text-tertiary text-sm mb-1">{coin.name}</p>
                    <p className="text-2xl font-bold text-phantom-text-primary">
                      ${Number(priceData.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Price Chart */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-phantom-text-primary flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedCoinData.color} flex items-center justify-center shadow-glow-sm`}>
                      <span className="text-white font-bold text-sm">{selectedCoinData.symbol}</span>
                    </div>
                    {selectedCoinData.name}
                  </h2>
                  {selectedCoinPrice && (
                    <p className="text-3xl font-bold text-phantom-text-primary mt-2">
                      ${Number(selectedCoinPrice.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {[1, 7, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setSelectedDays(days)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedDays === days
                          ? 'bg-gradient-phantom text-white shadow-glow'
                          : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:text-phantom-text-primary'
                      }`}
                    >
                      {days}D
                    </button>
                  ))}
                </div>
              </div>
              <PriceChart prices={historicalPrices[selectedCoin] || []} coinSymbol={selectedCoinData.symbol} />
            </div>

            {/* Open Positions */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-phantom-text-primary">Open Positions</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-phantom-accent-primary/10 border border-phantom-accent-primary/30">
                  <span className="text-sm font-semibold text-phantom-accent-primary">{positions.length}</span>
                  <span className="text-xs text-phantom-text-tertiary">position{positions.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              {positions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-phantom-text-secondary">No open positions</p>
                  <p className="text-sm text-phantom-text-tertiary mt-2">Open your first position to start trading</p>
                  <p className="text-xs text-phantom-text-tertiary mt-1">💡 You can open multiple positions on different coins or strategies</p>
                </div>
              ) : (
                <>
                  {/* Position Summary by Coin */}
                  {positions.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-phantom-border">
                      {coins.map(coin => {
                        const coinPositions = positions.filter(p => p.coin_id === coin.id);
                        if (coinPositions.length === 0) return null;
                        
                        const longCount = coinPositions.filter(p => p.position_type === 'long').length;
                        const shortCount = coinPositions.filter(p => p.position_type === 'short').length;
                        
                        return (
                          <div key={coin.id} className="bg-phantom-bg-tertiary/50 rounded-xl p-3 border border-phantom-border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${coin.color} flex items-center justify-center shadow-glow-sm`}>
                                <span className="text-white font-bold text-[10px]">{coin.symbol}</span>
                              </div>
                              <span className="text-sm font-bold text-phantom-text-primary">{coinPositions.length}</span>
                            </div>
                            <div className="flex gap-2 text-[10px]">
                              {longCount > 0 && (
                                <span className="text-green-500 font-medium">{longCount} LONG</span>
                              )}
                              {shortCount > 0 && (
                                <span className="text-red-500 font-medium">{shortCount} SHORT</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {positions.map(position => {
                    const coin = coins.find(c => c.id === position.coin_id);
                    const isProfitable = Number(position.unrealized_pnl || 0) >= 0;
                    
                    return (
                      <div key={position.id} className="bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border p-6 hover:border-phantom-accent-primary/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${coin.color} flex items-center justify-center shadow-glow-sm`}>
                              <span className="text-white font-bold text-sm">{coin.symbol}</span>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-phantom-text-primary">{coin.name}</p>
                              <p className="text-sm text-phantom-text-tertiary">
                                {position.position_type.toUpperCase()} • {Number(position.leverage).toFixed(1)}x Leverage
                              </p>
                              <p className="text-xs text-phantom-text-tertiary">
                                Position #{position.id} • Opened {new Date(position.opened_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-xl font-semibold ${
                            position.position_type === 'long'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {position.position_type.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-phantom-text-tertiary mb-1">Entry Price</p>
                            <p className="text-sm font-semibold text-phantom-text-primary">
                              ${Number(position.entry_price || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-phantom-text-tertiary mb-1">Current Price</p>
                            <p className="text-sm font-semibold text-phantom-text-primary">
                              ${Number(position.current_price || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-phantom-text-tertiary mb-1">Margin</p>
                            <p className="text-sm font-semibold text-phantom-text-primary">
                              Ⱥ {Number(position.margin_agon || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-phantom-text-tertiary mb-1">Unrealized P&L</p>
                            <p className={`text-sm font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                              {isProfitable ? '+' : ''}Ⱥ {Number(position.unrealized_pnl || 0).toFixed(2)}
                              <span className="text-xs ml-1">({Number(position.pnl_percentage || 0).toFixed(1)}%)</span>
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleClosePosition(position.id)}
                          className="w-full px-4 py-3 rounded-xl bg-phantom-error/20 text-phantom-error hover:bg-phantom-error/30 font-semibold transition-all"
                        >
                          Close Position
                        </button>
                      </div>
                    );
                  })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="lg:col-span-1">
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 sticky top-24">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-phantom-text-primary mb-2">Open New Position</h2>
                <p className="text-xs text-phantom-text-tertiary">💡 You can open multiple positions simultaneously</p>
              </div>
              
              <form onSubmit={handleOpenPosition} className="space-y-6">
                {/* Coin Selection */}
                <div>
                  <label className="block text-sm font-medium text-phantom-text-secondary mb-2">
                    Select Cryptocurrency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {coins.map(coin => (
                      <button
                        key={coin.id}
                        type="button"
                        onClick={() => setSelectedCoin(coin.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedCoin === coin.id
                            ? 'border-phantom-accent-primary bg-phantom-accent-primary/10'
                            : 'border-phantom-border hover:border-phantom-border-light'
                        }`}
                      >
                        <div className={`w-8 h-8 mx-auto rounded-lg bg-gradient-to-br ${coin.color} flex items-center justify-center shadow-glow-sm mb-1`}>
                          <span className="text-white font-bold text-xs">{coin.symbol}</span>
                        </div>
                        <p className="text-xs text-phantom-text-primary font-medium">{coin.symbol}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position Type */}
                <div>
                  <label className="block text-sm font-medium text-phantom-text-secondary mb-2">
                    Position Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPositionType('long')}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        positionType === 'long'
                          ? 'bg-green-500 text-white shadow-glow'
                          : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:text-green-500'
                      }`}
                    >
                      Long (Buy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPositionType('short')}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        positionType === 'short'
                          ? 'bg-red-500 text-white shadow-glow'
                          : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:text-red-500'
                      }`}
                    >
                      Short (Sell)
                    </button>
                  </div>
                </div>

                {/* Leverage */}
                <div>
                  <label className="block text-sm font-medium text-phantom-text-secondary mb-2">
                    Leverage: {leverage}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={leverage}
                    onChange={(e) => setLeverage(parseFloat(e.target.value))}
                    className="w-full h-2 bg-phantom-bg-tertiary rounded-lg appearance-none cursor-pointer accent-phantom-accent-primary"
                  />
                  <div className="flex justify-between text-xs text-phantom-text-tertiary mt-1">
                    <span>1x</span>
                    <span>10x</span>
                  </div>
                </div>

                {/* Margin Amount */}
                <div>
                  <label className="block text-sm font-medium text-phantom-text-secondary mb-2">
                    Margin Amount (Ⱥ)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={marginAmount}
                    onChange={(e) => setMarginAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border-2 bg-phantom-bg-tertiary text-phantom-text-primary placeholder:text-phantom-text-tertiary border-phantom-border hover:border-phantom-border-light focus:border-phantom-accent-primary focus:shadow-input focus:outline-none transition-all"
                    required
                  />
                  <p className="text-xs text-phantom-text-tertiary mt-1">
                    Available: Ⱥ {Number(wallet?.agon || 0).toFixed(2)}
                  </p>
                </div>

                {/* Position Summary */}
                {marginAmount && parseFloat(marginAmount) > 0 && (
                  <div className="bg-phantom-bg-tertiary/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-phantom-text-tertiary">Commission ({(commission * 100).toFixed(2)}%):</span>
                      <span className="text-phantom-text-primary font-semibold">
                        Ⱥ {Number(parseFloat(marginAmount) * commission).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-phantom-text-tertiary">Net Margin:</span>
                      <span className="text-phantom-text-primary font-semibold">
                        Ⱥ {Number(parseFloat(marginAmount) * (1 - commission)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-phantom-border">
                      <span className="text-phantom-text-primary font-medium">Position Value:</span>
                      <span className="text-phantom-accent-primary font-bold">
                        Ⱥ {Number(positionValue).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-xl text-sm">
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !marginAmount || parseFloat(marginAmount) <= 0}
                  className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    positionType === 'long'
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-glow'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-glow'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? 'Opening Position...' : `Open ${positionType.toUpperCase()} Position`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Crypto;

