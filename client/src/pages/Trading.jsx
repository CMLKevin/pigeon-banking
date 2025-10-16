import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { walletAPI } from '../services/api';
import { tradingAPI, cryptoAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: 'from-orange-500 to-yellow-600' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: 'from-blue-500 to-purple-600' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', color: 'from-yellow-400 to-orange-500' },
  { id: 'gold', symbol: 'XAU', name: 'Gold', color: 'from-yellow-500 to-amber-600' },
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla', color: 'from-red-500 to-rose-600' },
  { id: 'aapl', symbol: 'AAPL', name: 'Apple', color: 'from-gray-600 to-slate-700' },
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA', color: 'from-emerald-500 to-green-600' },
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

  const load = async () => {
    try {
      setLoading(true);
      const [pricesRes, walletRes, positionsRes] = await Promise.all([
        tradingAPI.getCurrentPrices(),
        walletAPI.getWallet(),
        cryptoAPI.getUserPositions('open')
      ]);
      setPrices(pricesRes.data.prices || {});
      setWallet(walletRes.data);
      setPositions(positionsRes.data.positions || []);
    } catch (e) {
      console.error(e);
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
      if (margin > parseFloat(wallet.agon)) throw new Error('Insufficient Agon balance');

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
  const walletAgon = wallet ? parseFloat(wallet.agon) : 0;
  const canSubmit = !!wallet && marginNum > 0 && isFinite(marginNum) && leverage >= 1 && leverage <= 10 && ['long','short'].includes(positionType) && marginNum <= walletAgon && !!selectedPrice;

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
  const disabledReason = useMemo(() => {
    if (isSubmitting) return '';
    if (!wallet) return 'Loading wallet...';
    if (!selectedPrice) return 'Price unavailable; please wait.';
    if (!marginNum || marginNum <= 0) return 'Enter a positive margin.';
    if (marginNum > walletAgon) return 'Insufficient Agon balance.';
    if (leverage < 1 || leverage > 10) return 'Leverage must be between 1x and 10x.';
    if (!['long','short'].includes(positionType)) return 'Select a valid position type.';
    return '';
  }, [wallet, selectedPrice, marginNum, walletAgon, leverage, positionType, isSubmitting]);

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {Object.keys(prices || {}).length === 0 && (
          <div className="mb-4 bg-phantom-bg-secondary/50 border border-phantom-border text-phantom-text-secondary px-4 py-3 rounded-xl text-sm">
            Live prices are temporarily unavailable. Data will appear as it is fetched.
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
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
                    className={`min-w-[120px] px-3 py-2 rounded-xl border transition-all ${
                      active
                        ? 'bg-gradient-phantom text-white shadow-glow border-transparent'
                        : 'bg-phantom-bg-secondary/50 border-phantom-border text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium">{a.symbol}</div>
                      <div className={`text-[11px] ${ch >= 0 ? 'text-green-400' : 'text-red-400'}`}>{(isFinite(ch) ? ch : 0).toFixed(2)}%</div>
                    </div>
                    <div className="text-sm font-semibold">{p != null ? `$${Number(p).toFixed(2)}` : '--'}</div>
                  </button>
                );
              })}
            </div>
            <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selected.color} flex items-center justify-center text-white font-bold`}>
                    {selected.symbol}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-phantom-text-primary">{selected.name}</div>
                    <div className="text-sm text-phantom-text-tertiary">{selected.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-phantom-text-primary">${selectedPrice ? selectedPrice.toFixed(2) : '--'}</div>
                  <div className={`text-sm ${((prices[selectedAsset]?.change_24h || 0) >= 0) ? 'text-green-500' : 'text-red-500'}`}>
                    {(Number(prices[selectedAsset]?.change_24h ?? 0)).toFixed(2)}%
                  </div>
                  {lastUpdatedAgeSec != null && (
                    <div className="text-[11px] text-phantom-text-tertiary">Updated {lastUpdatedAgeSec}s ago</div>
                  )}
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="px-3 py-1 text-xs rounded-lg border border-phantom-border text-phantom-text-secondary hover:bg-phantom-bg-tertiary disabled:opacity-50"
                    >
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Asset" value={selectedAsset} onChange={setSelectedAsset} options={ASSETS.map(a => ({ value: a.id, label: `${a.name} (${a.symbol})` }))} />
                <Select label="Position" value={positionType} onChange={setPositionType} options={[{ value: 'long', label: 'Long' }, { value: 'short', label: 'Short' }]} />
                <Select label="Leverage" value={leverage} onChange={(v) => setLeverage(Number(v))} options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1}x` }))} />
                <Input label="Margin (Ⱥ)" type="number" value={marginAmount} onChange={setMarginAmount} min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="flex gap-2 mt-2">
                {[0.25, 0.5, 0.75, 1].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    disabled={!wallet || walletAgon <= 0}
                    onClick={() => handleQuickMargin(pct)}
                    className="px-3 py-1 text-xs rounded-lg border border-phantom-border text-phantom-text-secondary hover:bg-phantom-bg-tertiary disabled:opacity-50"
                  >
                    {Math.round(pct * 100)}%
                  </button>
                ))}
              </div>

              {marginAmount && parseFloat(marginAmount) > 0 && (
                <div className="mt-4 bg-phantom-bg-tertiary/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-phantom-text-tertiary">Commission ({(commissionRate * 100).toFixed(2)}%):</span>
                    <span className="text-phantom-text-primary font-semibold">Ⱥ {(parseFloat(marginAmount) * commissionRate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-phantom-text-tertiary">Daily Maintenance Fee ({(maintenanceRate * 100).toFixed(2)}%):</span>
                    <span className="text-phantom-text-primary font-semibold">Ⱥ {(parseFloat(marginAmount) * maintenanceRate).toFixed(2)} / day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-phantom-text-tertiary">Net Margin:</span>
                    <span className="text-phantom-text-primary font-semibold">Ⱥ {(parseFloat(marginAmount) * (1 - commissionRate)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-phantom-border">
                    <span className="text-phantom-text-primary font-medium">Position Value:</span>
                    <span className="text-phantom-accent-primary font-bold">Ⱥ {positionValue.toFixed(2)}</span>
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
                <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
              {success && (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-xl text-sm">{success}</div>
              )}

              <Button className="mt-4 w-full" onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? 'Submitting...' : 'Open Position'}
              </Button>
              {(!isSubmitting && !canSubmit && disabledReason) && (
                <div className="mt-2 text-xs text-phantom-text-tertiary">{disabledReason}</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6">
              <div className="text-phantom-text-secondary text-sm mb-2">Agon Balance</div>
              <div className="text-2xl font-bold text-phantom-text-primary">{wallet ? `Ⱥ ${Number(wallet.agon).toFixed(2)}` : '--'}</div>
            </div>
            <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-phantom-text-primary font-semibold">Your Open Positions</div>
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
              <div className="space-y-3">
                {filteredPositions.length === 0 && (
                  <div className="text-phantom-text-tertiary text-sm">No open positions.</div>
                )}
                {filteredPositions.map((p) => {
                  const val = Number((p.total_value ?? p.margin_agon) || 0);
                  const pnlPct = p.pnl_percentage != null ? Number(p.pnl_percentage) : null;
                  const priceNow = p.current_price != null ? Number(p.current_price) : null;
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-phantom-bg-tertiary/40 rounded-xl p-3">
                      <div>
                        <div className="text-phantom-text-secondary text-sm">{p.coin_id} • {p.position_type} • {Number(p.leverage).toFixed(0)}x</div>
                        <div className="text-[11px] text-phantom-text-tertiary">{priceNow != null ? `Price: $${priceNow.toFixed(2)}` : 'Price unavailable'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-phantom-text-primary font-semibold">Value: Ⱥ {val.toFixed(2)}</div>
                        <div className={`text-[12px] ${pnlPct == null ? 'text-phantom-text-tertiary' : pnlPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pnlPct == null ? '--' : `${pnlPct.toFixed(2)}%`}</div>
                        <button
                          onClick={() => handleClose(p.id)}
                          disabled={!!closing[p.id]}
                          className="mt-1 inline-flex items-center px-3 py-1 text-xs rounded-lg border border-phantom-border text-phantom-text-secondary hover:text-phantom-error hover:border-phantom-error disabled:opacity-50"
                        >
                          {closing[p.id] ? 'Closing...' : 'Close'}
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
    </div>
  );
}


