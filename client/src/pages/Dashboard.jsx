import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WalletCard from '../components/WalletCard';
import TransactionItem from '../components/TransactionItem';
import { walletAPI, paymentAPI } from '../services/api';

const Dashboard = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        walletAPI.getWallet(),
        paymentAPI.getTransactions(10)
      ]);
      
      setWallet(walletRes.data.wallet);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletCard
            currency="agon"
            balance={wallet?.agon || 0}
          />
          <WalletCard
            currency="stoneworks_dollar"
            balance={wallet?.stoneworks_dollar || 0}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
          <h2 className="text-2xl font-bold text-phantom-text-primary mb-6 flex items-center gap-3">
            <svg className="w-7 h-7 text-phantom-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/send">
              <div className="group p-6 bg-phantom-bg-tertiary/50 border-2 border-phantom-border rounded-2xl hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="font-bold text-phantom-text-primary text-lg mb-1">Send Payment</h3>
                <p className="text-sm text-phantom-text-secondary">Transfer to other users</p>
              </div>
            </Link>
            <Link to="/swap">
              <div className="group p-6 bg-phantom-bg-tertiary/50 border-2 border-phantom-border rounded-2xl hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="font-bold text-phantom-text-primary text-lg mb-1">Swap Currency</h3>
                <p className="text-sm text-phantom-text-secondary">Exchange 1:1 ratio</p>
              </div>
            </Link>
            <Link to="/users">
              <div className="group p-6 bg-phantom-bg-tertiary/50 border-2 border-phantom-border rounded-2xl hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-phantom-text-primary text-lg mb-1">View Users</h3>
                <p className="text-sm text-phantom-text-secondary">Browse all members</p>
              </div>
            </Link>
            <Link to="/marketplace">
              <div className="group p-6 bg-phantom-bg-tertiary/50 border-2 border-phantom-border rounded-2xl hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-phantom-text-primary text-lg mb-1">Marketplace</h3>
                <p className="text-sm text-phantom-text-secondary">Auctions, bids & escrow</p>
              </div>
            </Link>
            
            {/* Game Quick Actions */}
            <Link to="/games/coinflip">
              <div className="group p-6 bg-phantom-bg-tertiary/50 border-2 border-phantom-border rounded-2xl hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-phantom-text-primary text-lg mb-1">Coin Flip</h3>
                <p className="text-sm text-phantom-text-secondary">45% win • 2x payout</p>
              </div>
            </Link>
            <Link to="/games/blackjack">
              <div className="group p-6 bg-phantom-bg-tertiary/50 border-2 border-phantom-border rounded-2xl hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-phantom-text-primary text-lg mb-1">Blackjack</h3>
                <p className="text-sm text-phantom-text-secondary">Beat the dealer • 3:2</p>
              </div>
            </Link>
            <Link to="/games/plinko">
              <div className="group p-6 bg-phantom-bg-tertiary/50 border-2 border-phantom-border rounded-2xl hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="font-bold text-phantom-text-primary text-lg mb-1">Plinko</h3>
                <p className="text-sm text-phantom-text-secondary">Up to 1000x multiplier</p>
              </div>
            </Link>
            <Link to="/games">
              <div className="group p-6 bg-phantom-bg-tertiary/50 border-2 border-phantom-border rounded-2xl hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-bold text-phantom-text-primary text-lg mb-1">Game Center</h3>
                <p className="text-sm text-phantom-text-secondary">View all games</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-phantom-text-primary flex items-center gap-3">
              <svg className="w-7 h-7 text-phantom-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Transactions
            </h2>
            <button className="text-phantom-accent-primary font-semibold hover:text-phantom-purple-light transition-colors text-sm">
              View All
            </button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-phantom-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-phantom-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-phantom-text-primary font-semibold text-lg mb-2">No transactions yet</p>
              <p className="text-sm text-phantom-text-secondary">Start by sending a payment or swapping currencies</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
