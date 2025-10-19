import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import TradingViewChart from '../components/TradingViewChart';
import { walletAPI } from '../services/api';
import { tradingAPI, cryptoAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: 'from-orange-500 to-yellow-600', tvSymbol: 'BTCUSD' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: 'from-blue-500 to-purple-600', tvSymbol: 'ETHUSD' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: 'from-yellow-400 to-orange-500', tvSymbol: 'DOGEUSD' },
  { id: 'gold', symbol: 'XAU', name: 'Gold', color: 'from-yellow-500 to-amber-600', tvSymbol: 'GOLD' },
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla', color: 'from-red-500 to-rose-600', tvSymbol: 'NASDAQ:TSLA' },
  { id: 'aapl', symbol: 'AAPL', name: 'Apple', color: 'from-gray-600 to-slate-700', tvSymbol: 'NASDAQ:AAPL' },
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA', color: 'from-emerald-500 to-green-600', tvSymbol: 'NASDAQ:NVDA' },
];

export default function Trading() {
  const [wallet, setWallet] = useState(null);
  const [prices, setPrices] = useState({});
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('bitcoin');
  const [positionType, setPositionType] = useState('long');
  const [leverage, setLeverage] = useState(1);
  const [marginAmount, setMarginAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closing, setClosing] = useState({});
  const [positionsFilter, setPositionsFilter] = useState('all'); // 'all' | 'selected'
  const [refreshing, setRefreshing] = useState(false);

  const handleQuickMargin = (pct) => {
    if (!wallet) return;
    const bal = parseFloat(wallet.agon) || 0;
    const amt = Math.max(0, bal * pct);
    setMarginAmount(amt.toFixed(2));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await tradingAPI.getCurrentPrices();
      setPrices(res.data.prices || {});
    } catch (_) {
    } finally {
      setRefreshing(false);
    }
  };

  const calculateCommissionRate = () => {
    return 0.01 + ((leverage - 1) / 9) * 0.04; // 1% to 5%
  };

  const handleClose = async (positionId) => {
    setError('');
    setSuccess('');
    setClosing(prev => ({ ...prev, [positionId]: true }));
    try {
      await cryptoAPI.closePosition(positionId);
      await load();
      setSuccess('Position closed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to close position');
    } finally {
      setClosing(prev => ({ ...prev, [positionId]: false }));
    }
  };

  const commissionRate = calculateCommissionRate();
  const maintenanceRate = useMemo(() => {
    return 0.001 + ((leverage - 1) / 9) * 0.009; // 0.1% to 1.0% daily
  }, [leverage]);
  const positionValue = useMemo(() => {
    const margin = parseFloat(marginAmount) || 0;
    const commission = margin * commissionRate;
    const netMargin = margin - commission;
    return netMargin * leverage;
  }, [marginAmount, commissionRate, leverage]);

  const withTimeout = (p, ms) => {
    return Promise.race([
      p,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
    ]);
  };

  const load = async () => {
    try {
      setLoading(true);
      const [pricesRes, walletRes, positionsRes] = await Promise.allSettled([
        withTimeout(tradingAPI.getCurrentPrices(), 7000),
        withTimeout(walletAPI.getWallet(), 7000),
        withTimeout(cryptoAPI.getUserPositions('open'), 7000)
      ]);

      if (pricesRes.status === 'fulfilled') {
        setPrices(pricesRes.value.data.prices || {});
      } else {
        console.error('Failed to load prices:', pricesRes.reason);
      }

      if (walletRes.status === 'fulfilled') {
        const walletData = walletRes.value.data.wallet || walletRes.value.data;
        console.log('[Trading] Wallet data received:', walletData);
        console.log('[Trading] Agon balance type:', typeof walletData?.agon, 'value:', walletData?.agon);
        
        // Backend now returns numbers, but add safety check
        if (walletData && typeof walletData.agon === 'string') {
          console.warn('[Trading] Wallet agon is string, converting to number');
          walletData.agon = parseFloat(walletData.agon) || 0;
        }
        if (walletData && typeof walletData.stoneworks_dollar === 'string') {
          walletData.stoneworks_dollar = parseFloat(walletData.stoneworks_dollar) || 0;
        }
        
        setWallet(walletData);
      } else {
        console.error('[Trading] Failed to load wallet:', walletRes.reason);
      }

      if (positionsRes.status === 'fulfilled') {
        setPositions(positionsRes.value.data.positions || []);
      } else {
        console.error('Failed to load positions:', positionsRes.reason);
      }
    } catch (e) {
      console.error('Load error:', e);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      tradingAPI.getCurrentPrices().then(res => setPrices(res.data.prices || {})).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const sa = localStorage.getItem('trading.selectedAsset');
      if (sa && ASSETS.some(a => a.id === sa)) setSelectedAsset(sa);
      const pt = localStorage.getItem('trading.positionType');
      if (pt === 'long' || pt === 'short') setPositionType(pt);
      const levStr = localStorage.getItem('trading.leverage');
      const lev = levStr != null ? Number(levStr) : null;
      if (lev && lev >= 1 && lev <= 10) setLeverage(lev);
      const mm = localStorage.getItem('trading.marginAmount');
      if (mm != null) setMarginAmount(mm);
      const pf = localStorage.getItem('trading.positionsFilter');
      if (pf === 'all' || pf === 'selected') setPositionsFilter(pf);
    } catch (_) {
    }
  }, []);

  useEffect(() => {
    try {
      if (selectedAsset) localStorage.setItem('trading.selectedAsset', selectedAsset);
      localStorage.setItem('trading.positionType', positionType);
      localStorage.setItem('trading.leverage', String(leverage));
      localStorage.setItem('trading.marginAmount', marginAmount);
      localStorage.setItem('trading.positionsFilter', positionsFilter);
    } catch (_) {
    }
  }, [selectedAsset, positionType, leverage, marginAmount, positionsFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const margin = parseFloat(marginAmount);
      if (margin <= 0) throw new Error('Margin must be positive');
      // Round to 2 decimal places to handle floating point precision
      const marginRounded = Math.round(margin * 100) / 100;
      const balanceRounded = Math.round(parseFloat(wallet.agon) * 100) / 100;
      if (marginRounded > balanceRounded) throw new Error('Insufficient Stoneworks Dollars balance');

      // Reuse existing open position backend for crypto; restrict non-crypto for now via same endpoint name by mapping ids
      await cryptoAPI.openPosition(selectedAsset, positionType, leverage, margin);
      setSuccess(`Opened ${positionType} on ${ASSETS.find(a => a.id === selectedAsset)?.name}`);
      setMarginAmount('');
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to open position');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selected = ASSETS.find(a => a.id === selectedAsset);
  const selectedPrice = prices[selectedAsset]?.price;
  const selectedData = prices[selectedAsset] || null;
  const lastUpdated = selectedData?.last_updated ? new Date(selectedData.last_updated) : null;
  const lastUpdatedAgeSec = lastUpdated ? Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000)) : null;
  const marginNum = parseFloat(marginAmount) || 0;
  const walletAgon = wallet && wallet.agon != null ? parseFloat(wallet.agon) : 0;
  // Round values for comparison to handle floating point precision
  const marginNumRounded = Math.round(marginNum * 100) / 100;
  const walletAgonRounded = Math.round(walletAgon * 100) / 100;
  const canSubmit = !!wallet && marginNum > 0 && isFinite(marginNum) && leverage >= 1 && leverage <= 10 && ['long','short'].includes(positionType) && marginNumRounded <= walletAgonRounded && !!selectedPrice;

  const commission = useMemo(() => marginNum * commissionRate, [marginNum, commissionRate]);
  const netMargin = useMemo(() => Math.max(0, marginNum - commission), [marginNum, commission]);
  const estQty = useMemo(() => {
    if (!selectedPrice || selectedPrice <= 0) return 0;
    return (netMargin * leverage) / selectedPrice;
  }, [netMargin, leverage, selectedPrice]);
  const estLiq = useMemo(() => {
    if (!selectedPrice || leverage <= 0) return 0;
    const pct = (1 / leverage) * 0.9;
    return positionType === 'long' ? selectedPrice * (1 - pct) : selectedPrice * (1 + pct);
  }, [selectedPrice, leverage, positionType]);
  
  const getSubmitButtonText = useMemo(() => {
    if (!wallet) return 'Loading wallet...';
    if (!selectedPrice) return 'Price unavailable; please wait.';
    if (!marginNum || marginNum <= 0) return 'Enter a positive margin.';
    // Round values for comparison to handle floating point precision
    const marginNumRounded = Math.round(marginNum * 100) / 100;
    const walletAgonRounded = Math.round(walletAgon * 100) / 100;
    if (marginNumRounded > walletAgonRounded) return 'Insufficient Stoneworks Dollars balance.';
    if (leverage < 1 || leverage > 10) return 'Leverage must be between 1x and 10x.';
    if (!['long','short'].includes(positionType)) return 'Select a valid position type.';
    return '';
  }, [wallet, selectedPrice, marginNum, walletAgon, leverage, positionType, isSubmitting]);
  
  const disabledReason = getSubmitButtonText;

  // Client-side enrich positions with latest prices for live PnL updates
  const enhancedPositions = useMemo(() => {
    return (positions || []).map((pos) => {
      const out = { ...pos };
      const priceObj = prices[pos.coin_id];
      if (out.status === 'open' && priceObj && priceObj.price != null) {
        const currentPrice = Number(priceObj.price);
        const entryPrice = Number(out.entry_price);
        const margin = Number(out.margin_agon);
        const lev = Number(out.leverage);
        if (isFinite(currentPrice) && isFinite(entryPrice) && entryPrice > 0 && isFinite(margin) && isFinite(lev)) {
          let unrealizedPnl;
          if (out.position_type === 'long') {
            const diff = currentPrice - entryPrice;
            unrealizedPnl = (diff / entryPrice) * margin * lev;
          } else {
            const diff = entryPrice - currentPrice;
            unrealizedPnl = (diff / entryPrice) * margin * lev;
          }
          out.current_price = currentPrice;
          out.unrealized_pnl = unrealizedPnl;
          out.total_value = margin + unrealizedPnl;
          out.pnl_percentage = margin > 0 ? (unrealizedPnl / margin) * 100 : null;
          
          // Calculate daily maintenance fee
          const maintenanceFeeRate = 0.001 + ((lev - 1) / 9) * 0.009;
          out.daily_fee = margin * maintenanceFeeRate;
        }
      }
      return out;
    });
  }, [positions, prices]);

  const filteredPositions = useMemo(() => {
    if (positionsFilter === 'selected') {
      return enhancedPositions.filter(p => p.coin_id === selectedAsset);
    }
    return enhancedPositions;
  }, [enhancedPositions, positionsFilter, selectedAsset]);

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    const totalMargin = enhancedPositions.reduce((sum, p) => sum + Number(p.margin_agon || 0), 0);
    const totalUnrealizedPnl = enhancedPositions.reduce((sum, p) => sum + Number(p.unrealized_pnl || 0), 0);
    const totalValue = totalMargin + totalUnrealizedPnl;
    const totalPnlPct = totalMargin > 0 ? (totalUnrealizedPnl / totalMargin) * 100 : 0;
    
    return {
      totalMargin,
      totalUnrealizedPnl,
      totalValue,
      totalPnlPct,
      positionCount: enhancedPositions.length
    };
  }, [enhancedPositions]);

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

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      {/* Top Stats Bar */}
      <div className="border-b border-phantom-border bg-phantom-bg-secondary/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-phantom-bg-tertiary/50 rounded-lg p-3">
              <div className="text-[10px] text-phantom-text-tertiary uppercase tracking-wide mb-1">Wallet Balance</div>
              <div className="text-lg font-bold text-phantom-accent-primary">
                {wallet && wallet.agon != null ? `$ ${Number(wallet.agon).toFixed(2)}` : '--'}
              </div>
            </div>
            <div className="bg-phantom-bg-tertiary/50 rounded-lg p-3">
              <div className="text-[10px] text-phantom-text-tertiary uppercase tracking-wide mb-1">Total Margin</div>
              <div className="text-lg font-bold text-phantom-text-primary">
                $ {portfolioStats.totalMargin.toFixed(2)}
              </div>
            </div>
            <div className="bg-phantom-bg-tertiary/50 rounded-lg p-3">
              <div className="text-[10px] text-phantom-text-tertiary uppercase tracking-wide mb-1">Unrealized P&L</div>
              <div className={`text-lg font-bold ${portfolioStats.totalUnrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioStats.totalUnrealizedPnl >= 0 ? '+' : ''}$ {portfolioStats.totalUnrealizedPnl.toFixed(2)}
              </div>
            </div>
            <div className="bg-phantom-bg-tertiary/50 rounded-lg p-3">
              <div className="text-[10px] text-phantom-text-tertiary uppercase tracking-wide mb-1">Total Value</div>
              <div className="text-lg font-bold text-phantom-accent-primary">
                $ {portfolioStats.totalValue.toFixed(2)}
              </div>
            </div>
            <div className="bg-phantom-bg-tertiary/50 rounded-lg p-3">
              <div className="text-[10px] text-phantom-text-tertiary uppercase tracking-wide mb-1">ROI %</div>
              <div className={`text-lg font-bold ${portfolioStats.totalPnlPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioStats.totalPnlPct >= 0 ? '+' : ''}{portfolioStats.totalPnlPct.toFixed(2)}%
              </div>
            </div>
            <div className="bg-phantom-bg-tertiary/50 rounded-lg p-3">
              <div className="text-[10px] text-phantom-text-tertiary uppercase tracking-wide mb-1">Open Positions</div>
              <div className="text-lg font-bold text-phantom-text-primary">
                {portfolioStats.positionCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {Object.keys(prices || {}).length === 0 && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-5 py-4 rounded-xl text-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Live prices are loading. Data will appear as it is fetched.</span>
          </div>
        )}
        {/* Main Grid: Chart Left, Controls Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {/* TradingView Chart - Matches Right Side Height */}
            <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6 overflow-hidden shadow-lg h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selected.color} flex items-center justify-center text-white font-bold shadow-md`}>
                    {selected.symbol}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-phantom-text-primary">{selected.name}</div>
                    <div className="text-sm text-phantom-text-tertiary">{selected.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-phantom-text-primary">${selectedPrice ? selectedPrice.toFixed(2) : '--'}</div>
                  <div className={`text-base font-semibold ${((prices[selectedAsset]?.change_24h || 0) >= 0) ? 'text-green-500' : 'text-red-500'}`}>
                    {(Number(prices[selectedAsset]?.change_24h ?? 0)).toFixed(2)}% {((prices[selectedAsset]?.change_24h || 0) >= 0) ? '↑' : '↓'}
                  </div>
                  {lastUpdatedAgeSec != null && (
                    <div className="text-xs text-phantom-text-tertiary mt-1">Updated {lastUpdatedAgeSec}s ago</div>
                  )}
                </div>
              </div>
              <TradingViewChart 
                symbol={ASSETS.find(a => a.id === selectedAsset)?.tvSymbol || 'BTCUSD'} 
                theme="dark" 
                height={1100}
              />
            </div>
          </div>

          {/* Right Side: Trading Controls */}
          <div className="lg:col-span-4 space-y-6">
            {/* Available Balance Card */}
            <div className="bg-gradient-to-br from-phantom-accent-primary/10 to-phantom-accent-secondary/10 border-2 border-phantom-accent-primary/30 rounded-2xl p-6 shadow-lg">
              <div className="text-sm text-phantom-text-secondary mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Available Balance
              </div>
              <div className="text-4xl font-bold text-phantom-accent-primary mb-1">
                {wallet && wallet.agon != null ? `$ ${Number(wallet.agon).toFixed(2)}` : '--'}
              </div>
              <div className="text-xs text-phantom-text-tertiary">Ready to trade</div>
            </div>

            {/* Trading Form */}
            <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6 shadow-lg">
              <div className="text-lg font-bold text-phantom-text-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Open Position
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Position Type Toggle */}
                <div>
                  <label className="block text-sm font-semibold text-phantom-text-primary mb-3">
                    Position Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPositionType('long')}
                      className={`py-4 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                        positionType === 'long'
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                          : 'bg-phantom-bg-tertiary/50 text-phantom-text-secondary border border-phantom-border hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        LONG
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPositionType('short')}
                      className={`py-4 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                        positionType === 'short'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                          : 'bg-phantom-bg-tertiary/50 text-phantom-text-secondary border border-phantom-border hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        SHORT
                      </div>
                    </button>
                  </div>
                </div>

                {/* Leverage Slider */}
                <div>
                  <label className="block text-sm font-semibold text-phantom-text-primary mb-3">
                    Leverage: <span className="text-phantom-accent-primary text-lg">{leverage}x</span>
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={leverage}
                      onChange={(e) => setLeverage(Number(e.target.value))}
                      className="w-full h-3 bg-phantom-bg-tertiary rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(139, 92, 246) ${((leverage - 1) / 9) * 100}%, rgb(55, 65, 81) ${((leverage - 1) / 9) * 100}%, rgb(55, 65, 81) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-phantom-text-tertiary px-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => (
                        <span key={x} className={leverage === x ? 'text-phantom-accent-primary font-bold scale-110' : ''}>{x}x</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Investment Amount */}
                <div>
                  <Input 
                    label="Investment Amount ($)" 
                    type="number" 
                    value={marginAmount} 
                    onChange={(e) => setMarginAmount(e.target.value)} 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00"
                  />
                  <div className="flex gap-2 mt-3">
                    {[0.25, 0.5, 0.75, 1].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        disabled={!wallet || walletAgon <= 0}
                        onClick={() => handleQuickMargin(pct)}
                        className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-phantom-border text-phantom-text-secondary hover:bg-phantom-accent-primary/10 hover:border-phantom-accent-primary/30 hover:text-phantom-accent-primary disabled:opacity-50 transition-all"
                      >
                        {Math.round(pct * 100)}%
                      </button>
                    ))}
                  </div>
                </div>

              {marginAmount && parseFloat(marginAmount) > 0 && (
                <div className="mt-4 bg-phantom-bg-tertiary/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-phantom-text-tertiary">Commission ({(commissionRate * 100).toFixed(2)}%):</span>
                    <span className="text-phantom-text-primary font-semibold">$ {(parseFloat(marginAmount) * commissionRate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-phantom-text-tertiary">Daily Maintenance Fee ({(maintenanceRate * 100).toFixed(2)}%):</span>
                    <span className="text-phantom-text-primary font-semibold">$ {(parseFloat(marginAmount) * maintenanceRate).toFixed(2)} / day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-phantom-text-tertiary">Net Margin:</span>
                    <span className="text-phantom-text-primary font-semibold">$ {(parseFloat(marginAmount) * (1 - commissionRate)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-phantom-border">
                    <span className="text-phantom-text-primary font-medium">Position Value:</span>
                    <span className="text-phantom-accent-primary font-bold">$ {positionValue.toFixed(2)}</span>
                  </div>
                  {(marginNum > 0 && selectedPrice) && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-phantom-text-tertiary">Est. Quantity:</span>
                        <span className="text-phantom-text-primary font-semibold">{estQty.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-phantom-text-tertiary">Est. Liq. Price:</span>
                        <span className="text-phantom-text-primary font-semibold">${estLiq.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

                <Button type="submit" className="w-full" disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? 'Opening Position...' : 'Open Position'}
                </Button>
                {(!isSubmitting && !canSubmit && disabledReason) && (
                  <div className="mt-2 text-xs text-phantom-text-tertiary text-center">{disabledReason}</div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Asset Selection - Full Width Below */}
        <div className="mt-8">
          <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6 shadow-lg" style={{minHeight: '200px'}}>
            <div className="text-sm font-semibold text-phantom-text-primary mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Select Asset
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {ASSETS.map(a => {
                const data = prices[a.id];
                const p = data?.price;
                const ch = Number(data?.change_24h ?? 0);
                const active = selectedAsset === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAsset(a.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      active
                        ? 'bg-gradient-phantom text-white shadow-glow border-transparent scale-105'
                        : 'bg-phantom-bg-tertiary/30 border-phantom-border text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary hover:border-phantom-accent-primary/30'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">{a.symbol}</div>
                    <div className="text-sm font-semibold mb-1">{p != null ? `$${Number(p).toFixed(2)}` : '--'}</div>
                    <div className={`text-[11px] font-medium ${active ? 'text-white/80' : ch >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {ch >= 0 ? '+' : ''}{(isFinite(ch) ? ch : 0).toFixed(2)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Open Positions - Full Width Below */}
        <div className="mt-8">
          <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="text-lg font-bold text-phantom-text-primary">Your Open Positions</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPositionsFilter('all')}
                  className={`px-3 py-1 text-xs rounded-lg border ${positionsFilter === 'all' ? 'bg-gradient-phantom text-white border-transparent' : 'border-phantom-border text-phantom-text-secondary hover:bg-phantom-bg-tertiary'}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPositionsFilter('selected')}
                  className={`px-3 py-1 text-xs rounded-lg border ${positionsFilter === 'selected' ? 'bg-gradient-phantom text-white border-transparent' : 'border-phantom-border text-phantom-text-secondary hover:bg-phantom-bg-tertiary'}`}
                >
                  {selected?.symbol || 'Selected'}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredPositions.length === 0 && (
                <div className="text-phantom-text-tertiary text-sm">No open positions.</div>
              )}
              {filteredPositions.map((p) => {
                const val = Number((p.total_value ?? p.margin_agon) || 0);
                const pnlPct = p.pnl_percentage != null ? Number(p.pnl_percentage) : null;
                const priceNow = p.current_price != null ? Number(p.current_price) : null;
                const pnlAmount = p.unrealized_pnl != null ? Number(p.unrealized_pnl) : null;
                const assetInfo = ASSETS.find(a => a.id === p.coin_id);
                return (
                  <div key={p.id} className="bg-phantom-bg-tertiary/40 rounded-xl p-5 border border-phantom-border/50 hover:border-phantom-accent-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${assetInfo?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white text-sm font-bold`}>
                          {assetInfo?.symbol || p.coin_id.slice(0,3).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-base font-bold text-phantom-text-primary">{assetInfo?.name || p.coin_id}</div>
                          <div className="text-xs text-phantom-text-tertiary">
                            {p.position_type === 'long' ? '📈' : '📉'} {p.position_type.toUpperCase()} • {Number(p.leverage).toFixed(0)}x
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${pnlPct == null ? 'bg-phantom-bg-tertiary text-phantom-text-tertiary' : pnlPct >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {pnlPct == null ? '--' : `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-phantom-text-tertiary mb-1">Entry Price</div>
                        <div className="text-phantom-text-primary font-semibold">${Number(p.entry_price).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-phantom-text-tertiary mb-1">Current Price</div>
                        <div className="text-phantom-text-primary font-semibold">{priceNow != null ? `$${priceNow.toFixed(2)}` : '--'}</div>
                      </div>
                      <div>
                        <div className="text-phantom-text-tertiary mb-1">Margin</div>
                        <div className="text-phantom-text-primary font-semibold">$ {Number(p.margin_agon).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-phantom-text-tertiary mb-1">P&L</div>
                        <div className={`font-semibold ${pnlAmount == null ? 'text-phantom-text-tertiary' : pnlAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {pnlAmount == null ? '--' : `${pnlAmount >= 0 ? '+' : ''}$ ${pnlAmount.toFixed(2)}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-phantom-text-tertiary mb-1">Daily Fee</div>
                        <div className="text-yellow-500 font-semibold">
                          {p.daily_fee != null ? `$ ${Number(p.daily_fee).toFixed(4)}` : '--'}
                        </div>
                      </div>
                      <div>
                        <div className="text-phantom-text-tertiary mb-1">Total Value</div>
                        <div className="text-phantom-accent-primary font-bold">$ {val.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end pt-4 border-t border-phantom-border">
                      <button
                        onClick={() => handleClose(p.id)}
                        disabled={!!closing[p.id]}
                        className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-50 transition-all"
                      >
                        {closing[p.id] ? 'Closing...' : 'Close Position'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


