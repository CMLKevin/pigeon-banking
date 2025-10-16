import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { auctionAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const EscrowDashboard = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [escrowTransactions, setEscrowTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEscrowData();
  }, [activeTab]);

  const loadEscrowData = async () => {
    try {
      setLoading(true);
      const response = await auctionAPI.getEscrowStatus(activeTab);
      setEscrowTransactions(response.data.escrowTransactions);
    } catch (err) {
      console.error('Failed to load escrow data:', err);
      setError('Failed to load escrow transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-phantom-success bg-phantom-success/10 border-phantom-success/30',
      ended: 'text-phantom-warning bg-phantom-warning/10 border-phantom-warning/30',
      disputed: 'text-phantom-error bg-phantom-error/10 border-phantom-error/30',
      completed: 'text-phantom-accent-primary bg-phantom-accent-primary/10 border-phantom-accent-primary/30'
    };
    return colors[status] || colors.active;
  };

  const getEscrowStatusColor = (escrowStatus) => {
    const colors = {
      active: 'text-phantom-success',
      awaiting_confirmation: 'text-phantom-warning',
      confirm_delivery: 'text-phantom-accent-primary',
      dispute_pending: 'text-phantom-error',
      completed: 'text-phantom-success'
    };
    return colors[escrowStatus] || colors.active;
  };

  const getEscrowStatusText = (escrowStatus) => {
    const texts = {
      active: 'Active Bidding',
      awaiting_confirmation: 'Awaiting Confirmation',
      confirm_delivery: 'Confirm Delivery',
      dispute_pending: 'Dispute Pending',
      completed: 'Completed'
    };
    return texts[escrowStatus] || escrowStatus;
  };

  const getRoleText = (userRole) => {
    return userRole === 'seller' ? 'Selling' : 'Buying';
  };

  const getRoleColor = (userRole) => {
    return userRole === 'seller' 
      ? 'text-phantom-accent-primary bg-phantom-accent-primary/10 border-phantom-accent-primary/30'
      : 'text-phantom-success bg-phantom-success/10 border-phantom-success/30';
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-phantom-text-primary mb-2">Escrow Dashboard</h1>
          <p className="text-phantom-text-secondary">Track all your escrow transactions and their current status</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-2xl p-1 border border-phantom-border">
          {[
            { key: 'active', label: 'Active', count: escrowTransactions.filter(t => t.status === 'active').length },
            { key: 'ended', label: 'Ended', count: escrowTransactions.filter(t => t.status === 'ended').length },
            { key: 'disputed', label: 'Disputed', count: escrowTransactions.filter(t => t.status === 'disputed').length },
            { key: 'completed', label: 'Completed', count: escrowTransactions.filter(t => t.status === 'completed').length },
            { key: 'all', label: 'All', count: escrowTransactions.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-phantom-accent-primary text-white shadow-lg'
                  : 'text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary/50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key 
                    ? 'bg-white/20 text-white' 
                    : 'bg-phantom-accent-primary/20 text-phantom-accent-primary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-phantom-error/10 border-2 border-phantom-error/30 text-phantom-error px-4 py-3 rounded-2xl flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Transactions List */}
        {escrowTransactions.length === 0 ? (
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-phantom-bg-tertiary/50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-phantom-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-phantom-text-primary mb-2">No Escrow Transactions</h3>
            <p className="text-phantom-text-secondary mb-6">
              {activeTab === 'all' 
                ? "You don't have any escrow transactions yet. Start by bidding on auctions or creating your own."
                : `No ${activeTab} escrow transactions found.`}
            </p>
            <Link to="/auctions">
              <Button variant="primary">Browse Auctions</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {escrowTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-phantom-text-primary">
                        {transaction.item_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${getRoleColor(transaction.user_role)}`}>
                        {getRoleText(transaction.user_role)}
                      </span>
                      <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-phantom-text-tertiary mb-1">Amount</p>
                        <p className="text-lg font-bold bg-gradient-phantom bg-clip-text text-transparent">
                          Ⱥ {formatCurrency(transaction.current_bid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-phantom-text-tertiary mb-1">
                          {transaction.user_role === 'seller' ? 'Buyer' : 'Seller'}
                        </p>
                        <p className="text-sm font-semibold text-phantom-text-primary">
                          {transaction.user_role === 'seller' 
                            ? transaction.highest_bidder_username 
                            : transaction.seller_username}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-phantom-text-tertiary mb-1">Escrow Status</p>
                        <p className={`text-sm font-semibold ${getEscrowStatusColor(transaction.escrow_status)}`}>
                          {getEscrowStatusText(transaction.escrow_status)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-phantom-text-tertiary">
                      <span>
                        Started: {new Date(transaction.created_at || transaction.end_date).toLocaleDateString()}
                      </span>
                      {transaction.completed_at && (
                        <span>
                          Completed: {new Date(transaction.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Link to={`/auctions/${transaction.id}`}>
                      <Button variant="secondary" size="small">
                        View Details
                      </Button>
                    </Link>
                    
                    {transaction.escrow_status === 'confirm_delivery' && transaction.user_role === 'buyer' && (
                      <Button variant="primary" size="small">
                        Confirm Delivery
                      </Button>
                    )}
                    
                    {transaction.escrow_status === 'dispute_pending' && (
                      <Button variant="secondary" size="small" disabled>
                        Under Review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EscrowDashboard;
