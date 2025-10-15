import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { userAPI, walletAPI, paymentAPI } from '../services/api';
import { formatCurrency, getCurrencyName, formatDate } from '../utils/formatters';

const UsersAndPayments = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  
  // Send payment modal state
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currency, setCurrency] = useState('agon');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // View mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadData = async () => {
    try {
      const [usersRes, walletRes] = await Promise.all([
        userAPI.getAllUsers(),
        walletAPI.getWallet()
      ]);
      setUsers(usersRes.data.users);
      setFilteredUsers(usersRes.data.users);
      setWallet(walletRes.data.wallet);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSendModal = (user) => {
    setSelectedUser(user);
    setShowSendModal(true);
    setError('');
    setSuccess('');
    setAmount('');
    setDescription('');
    setCurrency('agon');
  };

  const closeSendModal = () => {
    setShowSendModal(false);
    setSelectedUser(null);
    setAmount('');
    setDescription('');
    setError('');
    setSuccess('');
  };

  const handleSendPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    const balance = wallet[currency];

    if (parsedAmount > balance) {
      setError(`Insufficient balance. You have ${formatCurrency(balance)} ${getCurrencyName(currency)}`);
      return;
    }

    setSending(true);

    try {
      await paymentAPI.sendPayment(selectedUser.username, currency, parsedAmount, description);
      setSuccess(`Successfully sent ${formatCurrency(parsedAmount)} ${getCurrencyName(currency)} to ${selectedUser.username}!`);
      
      // Reload data to update balances
      await loadData();
      
      // Close modal after delay
      setTimeout(() => {
        closeSendModal();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const currencyOptions = [
    { value: 'agon', label: 'Agon (Ⱥ)' },
    { value: 'stoneworks_dollar', label: 'Game Chips' }
  ];

  const getBalance = () => {
    if (!wallet) return 0;
    return wallet[currency];
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

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent">Users & Payments</h1>
          </div>
          <p className="text-phantom-text-secondary">Browse users, view balances, and send payments</p>
        </div>

        {/* Search and View Controls */}
        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-phantom-text-tertiary mr-2">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'grid'
                    ? 'bg-phantom-accent-primary text-white shadow-glow'
                    : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:text-phantom-text-primary'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'list'
                    ? 'bg-phantom-accent-primary text-white shadow-glow'
                    : 'bg-phantom-bg-tertiary text-phantom-text-secondary hover:text-phantom-text-primary'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="ml-4 px-3 py-1.5 bg-phantom-bg-tertiary rounded-xl text-sm text-phantom-text-secondary">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </span>
            </div>
          </div>
        </div>

        {/* Users Display */}
        {filteredUsers.length === 0 ? (
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-16 text-center">
            <div className="w-24 h-24 bg-phantom-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-phantom-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-phantom-text-primary font-semibold text-lg mb-2">
              {searchQuery ? 'No users found' : 'No users registered yet'}
            </p>
            {searchQuery && (
              <p className="text-sm text-phantom-text-secondary">Try a different search term</p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 hover:border-phantom-accent-primary/30 hover:shadow-card-hover transition-all duration-200 group"
              >
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-phantom rounded-3xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-2xl">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-phantom-text-primary mb-1">{user.username}</h3>
                  <p className="text-xs text-phantom-text-tertiary">
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>

                {/* Balances */}
                <div className="bg-phantom-bg-tertiary/50 rounded-2xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-phantom-text-tertiary">Agon</span>
                    <span className="text-sm font-bold text-phantom-text-primary">
                      Ⱥ {formatCurrency(user.agon || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-phantom-text-tertiary">Game Chips</span>
                    <span className="text-sm font-bold text-phantom-text-primary">
                      {formatCurrency(user.stoneworks_dollar || 0)}
                    </span>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={() => openSendModal(user)}
                  className="w-full px-4 py-3 bg-gradient-phantom text-white rounded-2xl hover:shadow-glow transition-all duration-200 font-semibold flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Payment
                </button>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-phantom-bg-tertiary/50 border-b border-phantom-border">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-phantom-text-tertiary uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-phantom-text-tertiary uppercase tracking-wider">
                      Agon Balance
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-phantom-text-tertiary uppercase tracking-wider">
                      Game Chips
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-phantom-text-tertiary uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-phantom-text-tertiary uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-phantom-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-phantom-bg-tertiary/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-phantom rounded-2xl flex items-center justify-center shadow-md mr-3">
                            <span className="text-white font-bold text-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-phantom-text-primary">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-phantom-text-primary">
                          Ⱥ {formatCurrency(user.agon || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-phantom-text-primary">
                          {formatCurrency(user.stoneworks_dollar || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-phantom-text-tertiary">
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openSendModal(user)}
                          className="px-4 py-2 bg-gradient-phantom text-white rounded-xl hover:shadow-glow transition-all duration-200 font-semibold text-sm inline-flex items-center gap-2 transform hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Send Payment Modal */}
      {showSendModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-phantom-bg-secondary border border-phantom-border rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-phantom-bg-secondary border-b border-phantom-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-phantom rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-phantom-text-primary">Send Payment</h2>
                  <p className="text-sm text-phantom-text-tertiary">To {selectedUser.username}</p>
                </div>
              </div>
              <button
                onClick={closeSendModal}
                className="w-8 h-8 rounded-xl hover:bg-phantom-bg-tertiary text-phantom-text-secondary hover:text-phantom-text-primary transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendPayment} className="p-6 space-y-6">
              {/* Currency Selection */}
              <div>
                <Select
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={currencyOptions}
                />
                <div className="flex justify-between text-sm mt-2 px-1">
                  <span className="text-phantom-text-tertiary">Your balance:</span>
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

              {/* Payment Summary */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-phantom-bg-tertiary/50 border border-phantom-border rounded-2xl p-4">
                  <p className="text-xs font-semibold text-phantom-text-tertiary uppercase mb-3">Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-phantom-text-tertiary">Recipient</span>
                      <span className="text-sm font-semibold text-phantom-text-primary">{selectedUser.username}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-phantom-text-tertiary">Amount</span>
                      <span className="text-lg font-bold text-phantom-accent-primary">
                        {formatCurrency(parseFloat(amount))} {getCurrencyName(currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              {error && (
                <div className="bg-phantom-error/10 border-2 border-phantom-error/30 text-phantom-error px-4 py-3 rounded-2xl flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-phantom-success/10 border-2 border-phantom-success/30 text-phantom-success px-4 py-3 rounded-2xl flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{success}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" fullWidth onClick={closeSendModal} disabled={sending}>
                  Cancel
                </Button>
                <Button type="submit" fullWidth disabled={sending || !amount || parseFloat(amount) <= 0}>
                  {sending ? 'Sending...' : 'Send Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAndPayments;

