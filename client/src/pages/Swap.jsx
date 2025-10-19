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
    { value: 'agon', label: 'Stoneworks Dollars (₷)' },
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
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">Swap Currency</h1>
          <p className="text-phantom-text-secondary text-lg">Exchange between Stoneworks Dollars and Game Chips at 1:1 ratio</p>
        </div>

        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
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
                <span className="text-phantom-text-tertiary">Available balance:</span>
                <span className="font-semibold text-phantom-text-primary">
                  {formatCurrency(getBalance(fromCurrency))} {getCurrencyName(fromCurrency)}
                </span>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2">
              <button
                type="button"
                onClick={handleSwap}
                className="w-14 h-14 bg-phantom-bg-tertiary border-2 border-phantom-border hover:border-phantom-accent-primary rounded-2xl flex items-center justify-center hover:shadow-glow-sm transition-all duration-200 group"
              >
                <svg className="w-6 h-6 text-phantom-accent-primary group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                <span className="text-phantom-text-tertiary">Available balance:</span>
                <span className="font-semibold text-phantom-text-primary">
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

            {/* Exchange Info */}
            {amount && (
              <div className="bg-gradient-card border border-phantom-border-light rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-phantom-text-secondary text-sm mb-1">You will receive</p>
                    <p className="text-phantom-text-primary text-2xl font-bold">{amount} {getCurrencyName(toCurrency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-phantom-text-tertiary text-xs">Exchange rate</p>
                    <p className="text-phantom-accent-primary font-bold">1:1</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-phantom-error/10 border-2 border-phantom-error/30 text-phantom-error px-4 py-3.5 rounded-2xl flex items-center gap-3 animate-scale-in">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-phantom-success/10 border-2 border-phantom-success/30 text-phantom-success px-4 py-3.5 rounded-2xl flex items-center gap-3 animate-scale-in">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{success}</span>
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
