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

  const calculateCommissionRate = () => {
    return 0.01 + ((leverage - 1) / 9) * 0.04; // 1% to 5%
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                    {(prices[selectedAsset]?.change_24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="Asset" value={selectedAsset} onChange={setSelectedAsset} options={ASSETS.map(a => ({ value: a.id, label: `${a.name} (${a.symbol})` }))} />
                <Select label="Position" value={positionType} onChange={setPositionType} options={[{ value: 'long', label: 'Long' }, { value: 'short', label: 'Short' }]} />
                <Select label="Leverage" value={leverage} onChange={(v) => setLeverage(Number(v))} options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1}x` }))} />
                <Input label="Margin (Ⱥ)" type="number" value={marginAmount} onChange={setMarginAmount} min="0" step="0.01" placeholder="0.00" />
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
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
              {success && (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-xl text-sm">{success}</div>
              )}

              <Button className="mt-4 w-full" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Open Position'}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6">
              <div className="text-phantom-text-secondary text-sm mb-2">Agon Balance</div>
              <div className="text-2xl font-bold text-phantom-text-primary">{wallet ? `Ⱥ ${Number(wallet.agon).toFixed(2)}` : '--'}</div>
            </div>
            <div className="bg-phantom-bg-secondary/50 border border-phantom-border rounded-2xl p-6">
              <div className="text-phantom-text-primary font-semibold mb-3">Your Open Positions</div>
              <div className="space-y-3">
                {positions.length === 0 && (
                  <div className="text-phantom-text-tertiary text-sm">No open positions.</div>
                )}
                {positions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-phantom-bg-tertiary/40 rounded-xl p-3">
                    <div className="text-phantom-text-secondary text-sm">{p.coin_id} • {p.position_type} • {p.leverage}x</div>
                    <div className="text-phantom-text-primary font-semibold">Value: Ⱥ {Number(p.total_value || p.margin_agon).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


