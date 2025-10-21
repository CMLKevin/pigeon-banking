import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { walletAPI } from '../services/api';
import { formatCurrency, getCurrencyName } from '../utils/formatters';

const Swap = () => {
  const [wallet, setWallet] = useState(null);
  const [fromCurrency, setFromCurrency] = useState('agon');
  const [toCurrency, setToCurrency] = useState('stoneworks_dollar');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const response = await walletAPI.getWallet();
      setWallet(response.data.wallet);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const currencyOptions = [
    { value: 'agon', label: 'Stoneworks Dollars ($)' },
    { value: 'stoneworks_dollar', label: 'Game Chips' }
  ];

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (fromCurrency === toCurrency) {
      setError('Cannot swap to the same currency');
      return;
    }

    setLoading(true);

    try {
      await walletAPI.swapCurrency(fromCurrency, toCurrency, parseFloat(amount));
      setSuccess(`Successfully swapped ${amount} ${getCurrencyName(fromCurrency)} to ${getCurrencyName(toCurrency)}`);
      setAmount('');
      loadWallet();
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBalance = (currency) => {
    if (!wallet) return 0;
    return wallet[currency];
  };

  return (
    <div className="min-h-screen bg-gradient-dark relative">
      {/* Art deco background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
      </div>
      
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in relative z-10">
        {/* Art deco header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold"></div>
            <div className="w-12 h-12 border-2 border-gold bg-noir-darker flex items-center justify-center transform rotate-45">
              <svg className="w-6 h-6 text-gold -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold"></div>
          </div>
          <h1 className="text-4xl font-bold text-gold tracking-widest mb-3">CURRENCY EXCHANGE</h1>
          <p className="text-deco-silver text-sm tracking-wider">INSTANT 1:1 CONVERSION RATE</p>
        </div>

        <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-8 relative">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Currency */}
            <div>
              <Select
                label="From"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                options={currencyOptions}
              />
              <div className="flex justify-between text-sm mt-2 px-1">
                <span className="text-deco-silver/60 uppercase tracking-wider text-xs">Available:</span>
                <span className="font-bold text-gold">
                  {formatCurrency(getBalance(fromCurrency))} {getCurrencyName(fromCurrency)}
                </span>
              </div>
            </div>

            {/* Art deco swap button */}
            <div className="flex justify-center -my-2">
              <button
                type="button"
                onClick={handleSwap}
                className="w-16 h-16 bg-noir-charcoal border-2 border-gold hover:border-gold-light hover:shadow-gold-glow flex items-center justify-center transition-all duration-300 group relative"
              >
                <div className="absolute top-0 left-0 w-2 h-2 bg-gold"></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 bg-gold"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-gold"></div>
                <svg className="w-7 h-7 text-gold group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To Currency */}
            <div>
              <Select
                label="To"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                options={currencyOptions}
              />
              <div className="flex justify-between text-sm mt-2 px-1">
                <span className="text-deco-silver/60 uppercase tracking-wider text-xs">Available:</span>
                <span className="font-bold text-gold">
                  {formatCurrency(getBalance(toCurrency))} {getCurrencyName(toCurrency)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <Input
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />

            {/* Art deco exchange info */}
            {amount && (
              <div className="bg-noir-charcoal/50 border-2 border-gold/20 p-5 relative">
                <div className="absolute top-0 left-3 w-px h-full bg-gold/10"></div>
                <div className="absolute top-0 right-3 w-px h-full bg-gold/10"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-deco-silver/60 text-xs uppercase tracking-widest mb-2">You Receive</p>
                    <p className="text-gold text-3xl font-bold tracking-wide">{amount}</p>
                    <p className="text-deco-silver text-sm mt-1">{getCurrencyName(toCurrency)}</p>
                  </div>
                  <div className="text-right">
                    <div className="border border-gold/30 px-3 py-2 bg-noir-darker">
                      <p className="text-deco-silver/60 text-xs uppercase tracking-widest mb-1">Rate</p>
                      <p className="text-gold font-bold text-lg">1:1</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {success && (
              <div className="bg-deco-emerald/10 border-2 border-deco-emerald/50 text-deco-emerald px-4 py-3.5 flex items-center gap-3 animate-scale-in relative">
                <div className="absolute top-0 left-0 w-2 h-2 bg-deco-emerald"></div>
                <div className="absolute top-0 right-0 w-2 h-2 bg-deco-emerald"></div>
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium tracking-wide">{success}</span>
              </div>
            )}

            <div className="flex space-x-4 pt-2">
              <Button type="button" variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Swapping...' : 'Swap Currency'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Swap;
