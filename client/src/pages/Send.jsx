import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { walletAPI, paymentAPI, userAPI } from '../services/api';
import { formatCurrency, getCurrencyName } from '../utils/formatters';

const Send = () => {
  const [wallet, setWallet] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [currency, setCurrency] = useState('phantom_coin');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, usersRes] = await Promise.all([
        walletAPI.getWallet(),
        userAPI.getAllUsers()
      ]);
      
      setWallet(walletRes.data.wallet);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const currencyOptions = [
    { value: 'phantom_coin', label: 'PhantomCoin' },
    { value: 'stoneworks_dollar', label: 'Stoneworks Dollar' }
  ];

  const userOptions = [
    { value: '', label: 'Select a user...' },
    ...users.map(user => ({
      value: user.username,
      label: user.username
    }))
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedUser) {
      setError('Please select a recipient');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      await paymentAPI.sendPayment(selectedUser, currency, parseFloat(amount), description);
      setSuccess(`Successfully sent ${amount} ${getCurrencyName(currency)} to ${selectedUser}`);
      setAmount('');
      setDescription('');
      setSelectedUser('');
      loadData();
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getBalance = () => {
    if (!wallet) return 0;
    return wallet[currency];
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">Send Payment</h1>
          <p className="text-phantom-text-secondary text-lg">Transfer funds to other PhantomPay users</p>
        </div>

        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient */}
            <Select
              label="Recipient"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              options={userOptions}
              required
            />

            {/* Currency */}
            <div>
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={currencyOptions}
              />
              <div className="flex justify-between text-sm mt-2 px-1">
                <span className="text-phantom-text-tertiary">Available balance:</span>
                <span className="font-semibold text-phantom-text-primary">
                  {formatCurrency(getBalance())} {getCurrencyName(currency)}
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

            {/* Description */}
            <Input
              label="Description (Optional)"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this payment for?"
            />

            {/* Summary */}
            {selectedUser && amount && (
              <div className="bg-gradient-card border border-phantom-border-light rounded-2xl p-5">
                <p className="text-phantom-text-secondary text-sm font-semibold mb-4">Payment Summary</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-phantom-text-tertiary text-sm">To</span>
                    <span className="text-phantom-text-primary font-semibold">{selectedUser}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-phantom-text-tertiary text-sm">Amount</span>
                    <span className="text-phantom-accent-primary font-bold text-lg">{amount} {getCurrencyName(currency)}</span>
                  </div>
                  {description && (
                    <div className="flex justify-between items-start pt-2 border-t border-phantom-border">
                      <span className="text-phantom-text-tertiary text-sm">Note</span>
                      <span className="text-phantom-text-secondary text-sm text-right max-w-[200px]">{description}</span>
                    </div>
                  )}
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
                {loading ? 'Sending...' : 'Send Payment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Send;
