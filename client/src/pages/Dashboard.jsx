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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in relative z-10">
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

        {/* Art Deco Quick Actions */}
        <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-8 relative">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
          
          <h2 className="text-2xl font-bold text-gold mb-6 flex items-center gap-3 uppercase tracking-wider">
            <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/send">
              <div className="group p-6 bg-noir-charcoal/50 border-2 border-gold/30 hover:border-gold hover:shadow-gold-glow transition-all duration-300 cursor-pointer transform hover:scale-105 relative">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-gold-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="font-bold text-gold text-lg mb-1 uppercase tracking-wide">Send Payment</h3>
                <p className="text-xs text-deco-silver/70 uppercase tracking-wider">Transfer to other users</p>
              </div>
            </Link>
            <Link to="/swap">
              <div className="group p-6 bg-noir-charcoal/50 border-2 border-gold/30 hover:border-gold hover:shadow-gold-glow transition-all duration-300 cursor-pointer transform hover:scale-105 relative">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-gold-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="font-bold text-gold text-lg mb-1 uppercase tracking-wide">Swap Currency</h3>
                <p className="text-xs text-deco-silver/70 uppercase tracking-wider">Exchange 1:1 ratio</p>
              </div>
            </Link>
            <Link to="/users">
              <div className="group p-6 bg-noir-charcoal/50 border-2 border-gold/30 hover:border-gold hover:shadow-gold-glow transition-all duration-300 cursor-pointer transform hover:scale-105 relative">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 border-2 border-gold-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gold text-lg mb-1 uppercase tracking-wide">View Users</h3>
                <p className="text-xs text-deco-silver/70 uppercase tracking-wider">Browse all members</p>
              </div>
            </Link>
            {/* Game Quick Actions */}
            <Link to="/games/coinflip">
              <div className="group p-6 bg-noir-charcoal/50 border-2 border-gold/30 hover:border-gold hover:shadow-gold-glow transition-all duration-300 cursor-pointer transform hover:scale-105 relative">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-500 border-2 border-gold-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gold text-lg mb-1 uppercase tracking-wide">Coin Flip</h3>
                <p className="text-xs text-deco-silver/70 uppercase tracking-wider">45% win • 2x payout</p>
              </div>
            </Link>
            <Link to="/games/blackjack">
              <div className="group p-6 bg-noir-charcoal/50 border-2 border-gold/30 hover:border-gold hover:shadow-gold-glow transition-all duration-300 cursor-pointer transform hover:scale-105 relative">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-gold-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gold text-lg mb-1 uppercase tracking-wide">Blackjack</h3>
                <p className="text-xs text-deco-silver/70 uppercase tracking-wider">Beat the dealer • 3:2</p>
              </div>
            </Link>
            <Link to="/games/plinko">
              <div className="group p-6 bg-noir-charcoal/50 border-2 border-gold/30 hover:border-gold hover:shadow-gold-glow transition-all duration-300 cursor-pointer transform hover:scale-105 relative">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 border-2 border-gold-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="font-bold text-gold text-lg mb-1 uppercase tracking-wide">Plinko</h3>
                <p className="text-xs text-deco-silver/70 uppercase tracking-wider">Up to 1000x multiplier</p>
              </div>
            </Link>
            <Link to="/games">
              <div className="group p-6 bg-noir-charcoal/50 border-2 border-gold/30 hover:border-gold hover:shadow-gold-glow transition-all duration-300 cursor-pointer transform hover:scale-105 relative">
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 border-2 border-gold-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gold text-lg mb-1 uppercase tracking-wide">Game Center</h3>
                <p className="text-xs text-deco-silver/70 uppercase tracking-wider">View all games</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Art Deco Recent Transactions */}
        <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-8 relative">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gold flex items-center gap-3 uppercase tracking-wider">
              <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Transactions
            </h2>
            <button className="text-gold font-semibold hover:text-gold-light transition-colors text-xs uppercase tracking-wider border-b border-gold/50 hover:border-gold-light">
              View All
            </button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 border-2 border-gold/30 bg-noir-darker flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gold font-bold text-lg mb-2 uppercase tracking-wide">No transactions yet</p>
              <p className="text-sm text-deco-silver/60">Start by sending a payment or swapping currencies</p>
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
