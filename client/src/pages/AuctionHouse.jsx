import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { auctionAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const AuctionHouse = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    loadAuctions();
  }, [statusFilter]);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const response = await auctionAPI.getAllAuctions(statusFilter);
      setAuctions(response.data.auctions);
    } catch (error) {
      console.error('Failed to load auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      Common: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
      Uncommon: 'text-green-400 bg-green-400/10 border-green-400/30',
      Rare: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
      Epic: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
      Legendary: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
      Mythic: 'text-pink-400 bg-pink-400/10 border-pink-400/30'
    };
    return colors[rarity] || colors.Common;
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">
              Auction House
            </h1>
            <p className="text-phantom-text-secondary text-lg">
              Browse and bid on Minecraft items from Stoneworks players
            </p>
          </div>
          <Link to="/auctions/create">
            <Button size="large">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Auction
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {['active', 'ended', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
                statusFilter === status
                  ? 'bg-gradient-phantom text-white shadow-glow'
                  : 'bg-phantom-bg-secondary text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
              <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary opacity-20"></div>
            </div>
          </div>
        ) : auctions.length === 0 ? (
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-12 text-center">
            <svg className="w-20 h-20 text-phantom-text-tertiary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-xl font-semibold text-phantom-text-primary mb-2">No Auctions Found</h3>
            <p className="text-phantom-text-secondary mb-6">
              {statusFilter === 'active' 
                ? 'Be the first to create an auction!'
                : `No ${statusFilter} auctions at this time.`}
            </p>
            {statusFilter === 'active' && (
              <Link to="/auctions/create">
                <Button>Create Auction</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                to={`/auctions/${auction.id}`}
                className="group bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 overflow-hidden"
              >
                {/* Header with Rarity Badge */}
                <div className="p-6 border-b border-phantom-border">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-phantom-text-primary group-hover:text-phantom-accent-primary transition-colors line-clamp-1">
                      {auction.item_name}
                    </h3>
                    <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${getRarityColor(auction.rarity)}`}>
                      {auction.rarity}
                    </span>
                  </div>
                  
                  {auction.item_description && (
                    <p className="text-sm text-phantom-text-secondary line-clamp-2 mb-3">
                      {auction.item_description}
                    </p>
                  )}

                  {auction.durability !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-phantom-accent-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-phantom-text-secondary">
                        Durability: <span className="text-phantom-text-primary font-medium">{auction.durability}%</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Bid Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-xs text-phantom-text-tertiary mb-1">
                      {auction.current_bid ? 'Current Bid' : 'Starting Price'}
                    </p>
                    <p className="text-2xl font-bold bg-gradient-phantom bg-clip-text text-transparent">
                      Ⱥ {formatCurrency(auction.current_bid || auction.starting_price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div>
                      <p className="text-phantom-text-tertiary">Seller</p>
                      <p className="text-phantom-text-primary font-medium">{auction.seller_username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-phantom-text-tertiary">Bids</p>
                      <p className="text-phantom-accent-primary font-bold">{auction.bid_count}</p>
                    </div>
                  </div>

                  {auction.status === 'active' && (
                    <div className="flex items-center justify-between p-3 bg-phantom-bg-tertiary/50 rounded-xl">
                      <span className="text-sm text-phantom-text-secondary flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Time Left
                      </span>
                      <span className="text-sm font-semibold text-phantom-text-primary">
                        {getTimeRemaining(auction.end_date)}
                      </span>
                    </div>
                  )}

                  {auction.status === 'ended' && auction.highest_bidder_username && (
                    <div className="p-3 bg-phantom-warning/10 border border-phantom-warning/30 rounded-xl">
                      <p className="text-xs text-phantom-text-tertiary mb-1">Winner</p>
                      <p className="text-sm font-semibold text-phantom-warning">{auction.highest_bidder_username}</p>
                    </div>
                  )}

                  {auction.status === 'completed' && (
                    <div className="p-3 bg-phantom-success/10 border border-phantom-success/30 rounded-xl">
                      <p className="text-xs text-phantom-success font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionHouse;

