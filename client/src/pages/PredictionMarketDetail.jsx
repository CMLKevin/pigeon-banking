import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { predictionAPI, walletAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const PredictionMarketDetail = () => {
  const { id } = useParams();
  const [market, setMarket] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [lastQuote, setLastQuote] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Trade form state
  const [side, setSide] = useState('yes');
  const [action, setAction] = useState('buy');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadData();
    // Refresh every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const loadData = async () => {
    try {
      const [marketRes, walletRes] = await Promise.all([
        predictionAPI.getMarketById(id),
        walletAPI.getWallet()
      ]);
      setMarket(marketRes.data.market);
      setQuotes(marketRes.data.quotes);
      setLastQuote(marketRes.data.lastQuote);
      setWallet(walletRes.data.wallet);
    } catch (error) {
      console.error('Failed to load market:', error);
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setTrading(true);

    try {
      await predictionAPI.placeOrder(id, side, action, qty);
      setSuccess(`${action === 'buy' ? 'Bought' : 'Sold'} ${qty} ${side.toUpperCase()} shares successfully!`);
      setQuantity('');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setTrading(false);
    }
  };

  const getExecutionPrice = () => {
    if (!lastQuote) return 0;
    if (action === 'buy') {
      return side === 'yes' ? parseFloat(lastQuote.yes_ask) : parseFloat(lastQuote.no_ask);
    } else {
      return side === 'yes' ? parseFloat(lastQuote.yes_bid) : parseFloat(lastQuote.no_bid);
    }
  };

  const estimateCost = () => {
    const qty = parseFloat(quantity) || 0;
    const price = getExecutionPrice();
    const baseCost = qty * price;
    const fee = action === 'buy' ? baseCost * 0.01 : 0;
    return action === 'buy' ? baseCost + fee : baseCost;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
            <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary opacity-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-12 text-center">
            <p className="text-phantom-text-secondary text-lg">Market not found</p>
            <Link to="/prediction-markets">
              <Button className="mt-6">Back to Markets</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const yesMid = lastQuote ? (parseFloat(lastQuote.yes_bid) + parseFloat(lastQuote.yes_ask)) / 2 : 0.5;
  const noMid = lastQuote ? (parseFloat(lastQuote.no_bid) + parseFloat(lastQuote.no_ask)) / 2 : 0.5;

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Back Button */}
        <Link to="/prediction-markets" className="inline-flex items-center text-phantom-text-secondary hover:text-phantom-accent-primary transition-colors mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Markets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Question */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
              <h1 className="text-3xl font-bold text-phantom-text-primary mb-4">
                {market.question}
              </h1>
              
              {market.metadata?.description && (
                <p className="text-phantom-text-secondary mb-4">
                  {market.metadata.description}
                </p>
              )}

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-xl text-sm font-semibold ${
                  market.status === 'active' ? 'bg-green-500/10 border border-green-500/30 text-green-500' :
                  market.status === 'resolved' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-500' :
                  'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500'
                }`}>
                  {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
                </span>
                {market.end_date && (
                  <span className="text-sm text-phantom-text-tertiary">
                    Closes: {new Date(market.end_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Current Prices */}
            {lastQuote && market.status === 'active' && (
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
                <h2 className="text-2xl font-bold text-phantom-text-primary mb-6">Current Prices</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 rounded-2xl">
                    <p className="text-sm text-phantom-text-tertiary mb-2">YES</p>
                    <p className="text-4xl font-bold text-green-500 mb-4">
                      {(yesMid * 100).toFixed(1)}¢
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-phantom-text-tertiary">Buy (Ask):</span>
                        <span className="text-phantom-text-primary font-semibold">{(parseFloat(lastQuote.yes_ask) * 100).toFixed(1)}¢</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-phantom-text-tertiary">Sell (Bid):</span>
                        <span className="text-phantom-text-primary font-semibold">{(parseFloat(lastQuote.yes_bid) * 100).toFixed(1)}¢</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-2xl">
                    <p className="text-sm text-phantom-text-tertiary mb-2">NO</p>
                    <p className="text-4xl font-bold text-red-500 mb-4">
                      {(noMid * 100).toFixed(1)}¢
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-phantom-text-tertiary">Buy (Ask):</span>
                        <span className="text-phantom-text-primary font-semibold">{(parseFloat(lastQuote.no_ask) * 100).toFixed(1)}¢</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-phantom-text-tertiary">Sell (Bid):</span>
                        <span className="text-phantom-text-primary font-semibold">{(parseFloat(lastQuote.no_bid) * 100).toFixed(1)}¢</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resolution */}
            {market.status === 'resolved' && market.resolution && (
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
                <h2 className="text-2xl font-bold text-phantom-text-primary mb-4">Resolution</h2>
                <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                  <p className="text-xl font-semibold text-blue-500">
                    Market resolved: {market.resolution.toUpperCase()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Trading Panel */}
          {market.status === 'active' && (
            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                <p className="text-sm text-phantom-text-tertiary mb-1">Your Balance</p>
                <p className="text-2xl font-bold text-phantom-text-primary">
                  Ⱥ {formatCurrency(wallet?.agon || 0)}
                </p>
              </div>

              {/* Trading Form */}
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                <h3 className="text-xl font-bold text-phantom-text-primary mb-6">Place Order</h3>

                <form onSubmit={handleTrade} className="space-y-6">
                  {/* Side Selection */}
                  <div>
                    <label className="block text-sm font-medium text-phantom-text-primary mb-2">
                      Outcome
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSide('yes')}
                        className={`px-4 py-3 rounded-2xl font-medium transition-all ${
                          side === 'yes'
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:bg-phantom-bg-tertiary/80'
                        }`}
                      >
                        YES
                      </button>
                      <button
                        type="button"
                        onClick={() => setSide('no')}
                        className={`px-4 py-3 rounded-2xl font-medium transition-all ${
                          side === 'no'
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:bg-phantom-bg-tertiary/80'
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>

                  {/* Action Selection */}
                  <div>
                    <label className="block text-sm font-medium text-phantom-text-primary mb-2">
                      Action
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAction('buy')}
                        className={`px-4 py-3 rounded-2xl font-medium transition-all ${
                          action === 'buy'
                            ? 'bg-gradient-phantom text-white shadow-lg'
                            : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:bg-phantom-bg-tertiary/80'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        type="button"
                        onClick={() => setAction('sell')}
                        className={`px-4 py-3 rounded-2xl font-medium transition-all ${
                          action === 'sell'
                            ? 'bg-gradient-phantom text-white shadow-lg'
                            : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:bg-phantom-bg-tertiary/80'
                        }`}
                      >
                        Sell
                      </button>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <Input
                    label="Quantity (Shares)"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    min="1"
                    max="1000"
                    step="1"
                    required
                  />

                  {/* Order Summary */}
                  {quantity && parseFloat(quantity) > 0 && (
                    <div className="p-4 bg-phantom-bg-tertiary/50 rounded-2xl space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-phantom-text-tertiary">Price per share:</span>
                        <span className="text-phantom-text-primary font-semibold">
                          Ⱥ {getExecutionPrice().toFixed(3)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-phantom-text-tertiary">Subtotal:</span>
                        <span className="text-phantom-text-primary">
                          Ⱥ {(parseFloat(quantity) * getExecutionPrice()).toFixed(3)}
                        </span>
                      </div>
                      {action === 'buy' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-phantom-text-tertiary">Fee (1%):</span>
                          <span className="text-phantom-text-primary">
                            Ⱥ {(parseFloat(quantity) * getExecutionPrice() * 0.01).toFixed(3)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-2 border-t border-phantom-border">
                        <span className="text-phantom-text-primary">Total:</span>
                        <span className="text-phantom-accent-primary">
                          Ⱥ {estimateCost().toFixed(3)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {success && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-2xl text-sm">
                      {success}
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-2xl text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    disabled={trading || !quantity || parseFloat(quantity) <= 0}
                  >
                    {trading ? 'Processing...' : `${action === 'buy' ? 'Buy' : 'Sell'} ${side.toUpperCase()}`}
                  </Button>
                </form>
              </div>

              {/* Info Card */}
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                <h4 className="font-semibold text-phantom-text-primary mb-3">How it works</h4>
                <ul className="space-y-2 text-sm text-phantom-text-secondary">
                  <li>• Shares pay Ⱥ1 if outcome occurs, Ⱥ0 otherwise</li>
                  <li>• Price = probability (70¢ = 70% chance)</li>
                  <li>• Buy to open position, sell to close</li>
                  <li>• 1% fee on buys only</li>
                  <li>• Settled automatically on resolution</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionMarketDetail;

