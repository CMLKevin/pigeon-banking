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
    { value: 'agon', label: 'Stoneworks Dollars ($)' },
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
            <div className="animate-spin h-16 w-16 border-4 border-gold/20 border-t-gold"></div>
            <div className="absolute top-0 left-0 animate-ping h-16 w-16 border-2 border-gold opacity-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative">
      {/* Art deco background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
      </div>
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative z-10">
        {/* Art deco header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold"></div>
            <div className="w-12 h-12 border-2 border-gold bg-noir-darker flex items-center justify-center">
              <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold"></div>
          </div>
          <h1 className="text-4xl font-bold text-gold tracking-widest mb-2">MEMBERS DIRECTORY</h1>
          <p className="text-deco-silver text-sm tracking-wider">BROWSE & SEND PAYMENTS</p>
        </div>

        {/* Art deco search panel */}
        <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-6 mb-6 relative">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gold"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gold"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gold"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gold"></div>
          
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
              <span className="text-xs text-deco-silver/60 mr-2 uppercase tracking-wider">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 border-2 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gold border-gold text-noir-black shadow-gold-glow'
                    : 'bg-noir-charcoal border-gold/30 text-deco-silver hover:border-gold/50'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 border-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-gold border-gold text-noir-black shadow-gold-glow'
                    : 'bg-noir-charcoal border-gold/30 text-deco-silver hover:border-gold/50'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="ml-4 px-3 py-1.5 bg-noir-charcoal border border-gold/30 text-xs text-gold font-bold uppercase tracking-wider">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
              </span>
            </div>
          </div>
        </div>

        {/* Users Display */}
        {filteredUsers.length === 0 ? (
          <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-16 text-center relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
            <div className="w-24 h-24 border-2 border-gold/30 bg-noir-darker flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gold font-bold text-lg mb-2 uppercase tracking-wide">
              {searchQuery ? 'No users found' : 'No users registered yet'}
            </p>
            {searchQuery && (
              <p className="text-sm text-deco-silver/60">Try a different search term</p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View - Art Deco
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-6 hover:border-gold hover:shadow-gold-glow transition-all duration-300 group relative"
              >
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold"></div>
                
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-gold border-2 border-gold-dark flex items-center justify-center shadow-gold-glow mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-noir-black font-bold text-2xl">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gold mb-1 uppercase tracking-wide">{user.username}</h3>
                  <p className="text-xs text-deco-silver/60 uppercase tracking-wider">
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>

                {/* Balances */}
                <div className="bg-noir-charcoal/50 border border-gold/20 p-4 mb-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-deco-silver/60 uppercase tracking-wider">Stoneworks $</span>
                    <span className="text-sm font-bold text-gold">
                      ${formatCurrency(user.agon || 0)}
                    </span>
                  </div>
                  <div className="h-px bg-gold/10"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-deco-silver/60 uppercase tracking-wider">Game Chips</span>
                    <span className="text-sm font-bold text-gold-bronze">
                      {formatCurrency(user.stoneworks_dollar || 0)}
                    </span>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={() => openSendModal(user)}
                  className="w-full px-4 py-3 bg-gradient-gold border-2 border-gold text-noir-black hover:shadow-gold-glow transition-all duration-300 font-bold flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 uppercase tracking-wider text-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Payment
                </button>
              </div>
            ))}
          </div>
        ) : (
          // List View - Art Deco
          <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gold"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gold"></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-noir-charcoal/50 border-b-2 border-gold/20">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gold uppercase tracking-widest">
                      User
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gold uppercase tracking-widest">
                      Stoneworks $
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gold uppercase tracking-widest">
                      Game Chips
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gold uppercase tracking-widest">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gold uppercase tracking-widest">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-noir-charcoal/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-gold border border-gold-dark flex items-center justify-center shadow-md mr-3">
                            <span className="text-noir-black font-bold text-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-bold text-gold uppercase tracking-wide">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gold">
                          ${formatCurrency(user.agon || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gold-bronze">
                          {formatCurrency(user.stoneworks_dollar || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-deco-silver/60 uppercase tracking-wider">
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openSendModal(user)}
                          className="px-4 py-2 bg-gradient-gold border border-gold text-noir-black hover:shadow-gold-glow transition-all duration-300 font-bold text-xs inline-flex items-center gap-2 transform hover:scale-105 active:scale-95 uppercase tracking-wider"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

      {/* Art Deco Send Payment Modal */}
      {showSendModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-noir-dark border-2 border-gold shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in relative">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold z-10"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold z-10"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold z-10"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold z-10"></div>
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-noir-darker border-b-2 border-gold/30 px-6 py-4 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-gold border border-gold-dark flex items-center justify-center">
                  <span className="text-noir-black font-bold">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gold uppercase tracking-wider">Send Payment</h2>
                  <p className="text-xs text-deco-silver/60 uppercase tracking-wider">To {selectedUser.username}</p>
                </div>
              </div>
              <button
                onClick={closeSendModal}
                className="w-8 h-8 border border-gold/30 hover:border-gold hover:bg-noir-charcoal text-deco-silver hover:text-gold transition-colors flex items-center justify-center"
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
                  <span className="text-deco-silver/60 uppercase tracking-wider text-xs">Your balance:</span>
                  <span className="font-bold text-gold">
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
                <div className="bg-noir-charcoal/50 border-2 border-gold/20 p-4 relative">
                  <div className="absolute top-0 left-2 w-px h-full bg-gold/10"></div>
                  <div className="absolute top-0 right-2 w-px h-full bg-gold/10"></div>
                  <p className="text-xs font-bold text-gold uppercase tracking-widest mb-3">Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-deco-silver/60 uppercase tracking-wider">Recipient</span>
                      <span className="text-sm font-bold text-gold uppercase">{selectedUser.username}</span>
                    </div>
                    <div className="h-px bg-gold/10"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-deco-silver/60 uppercase tracking-wider">Amount</span>
                      <span className="text-lg font-bold text-gold">
                        {formatCurrency(parseFloat(amount))} {getCurrencyName(currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              {error && (
                <div className="bg-deco-burgundy/10 border-2 border-deco-burgundy/50 text-deco-burgundy px-4 py-3 flex items-center gap-3 relative">
                  <div className="absolute top-0 left-0 w-2 h-2 bg-deco-burgundy"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 bg-deco-burgundy"></div>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium tracking-wide">{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-deco-emerald/10 border-2 border-deco-emerald/50 text-deco-emerald px-4 py-3 flex items-center gap-3 relative">
                  <div className="absolute top-0 left-0 w-2 h-2 bg-deco-emerald"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 bg-deco-emerald"></div>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium tracking-wide">{success}</span>
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

