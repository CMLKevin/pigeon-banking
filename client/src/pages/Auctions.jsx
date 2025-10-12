import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { auctionAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const Auctions = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [allAuctions, setAllAuctions] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    loadAllData();
  }, [statusFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [auctionsRes, myAuctionsRes, bidsRes] = await Promise.all([
        auctionAPI.getAllAuctions(statusFilter),
        auctionAPI.getMyAuctions(),
        auctionAPI.getMyBids()
      ]);
      
      setAllAuctions(auctionsRes.data.auctions);
      setMyAuctions(myAuctionsRes.data.auctions);
      setMyBids(bidsRes.data.bids);
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

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-phantom-success/10', border: 'border-phantom-success/30', text: 'text-phantom-success' },
      ended: { bg: 'bg-phantom-warning/10', border: 'border-phantom-warning/30', text: 'text-phantom-warning' },
      completed: { bg: 'bg-phantom-accent-primary/10', border: 'border-phantom-accent-primary/30', text: 'text-phantom-accent-primary' },
      cancelled: { bg: 'bg-phantom-error/10', border: 'border-phantom-error/30', text: 'text-phantom-error' }
    };
    return badges[status] || badges.active;
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
              Browse items, manage your listings, and track your bids
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

        {/* Main Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
              activeTab === 'browse'
                ? 'bg-gradient-phantom text-white shadow-glow'
                : 'bg-phantom-bg-secondary text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Browse Auctions
            </span>
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
              activeTab === 'listings'
                ? 'bg-gradient-phantom text-white shadow-glow'
                : 'bg-phantom-bg-secondary text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Listings
              {myAuctions.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-phantom-accent-primary/20 text-phantom-accent-primary">
                  {myAuctions.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
              activeTab === 'bids'
                ? 'bg-gradient-phantom text-white shadow-glow'
                : 'bg-phantom-bg-secondary text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              My Bids
              {myBids.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-phantom-accent-primary/20 text-phantom-accent-primary">
                  {myBids.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Status Filter (only for Browse tab) */}
        {activeTab === 'browse' && (
          <div className="mb-6 flex gap-2">
            {['active', 'ended', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  statusFilter === status
                    ? 'bg-phantom-bg-tertiary text-phantom-text-primary border border-phantom-accent-primary/50'
                    : 'bg-phantom-bg-secondary/40 text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-secondary'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
              <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary opacity-20"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Browse Auctions Tab */}
            {activeTab === 'browse' && (
              <>
                {allAuctions.length === 0 ? (
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
                    {allAuctions.map((auction) => (
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
              </>
            )}

            {/* My Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-4">
                {myAuctions.length === 0 ? (
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-12 text-center">
                    <svg className="w-20 h-20 text-phantom-text-tertiary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-phantom-text-primary mb-2">No Auctions Yet</h3>
                    <p className="text-phantom-text-secondary mb-6">
                      Create your first auction to start selling
                    </p>
                    <Link to="/auctions/create">
                      <Button>Create Auction</Button>
                    </Link>
                  </div>
                ) : (
                  myAuctions.map((auction) => (
                    <Link
                      key={auction.id}
                      to={`/auctions/${auction.id}`}
                      className="block bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              <h3 className="text-xl font-bold text-phantom-text-primary">
                                {auction.item_name}
                              </h3>
                              <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${getRarityColor(auction.rarity)}`}>
                                {auction.rarity}
                              </span>
                              {(() => {
                                const badge = getStatusBadge(auction.status);
                                return (
                                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}>
                                    {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-phantom-text-tertiary mb-1">
                              {auction.current_bid ? 'Current Bid' : 'Starting Price'}
                            </p>
                            <p className="text-lg font-bold bg-gradient-phantom bg-clip-text text-transparent">
                              Ⱥ {formatCurrency(auction.current_bid || auction.starting_price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-phantom-text-tertiary mb-1">Bids</p>
                            <p className="text-lg font-semibold text-phantom-accent-primary">
                              {auction.bid_count}
                            </p>
                          </div>
                          {auction.highest_bidder_username && (
                            <div>
                              <p className="text-xs text-phantom-text-tertiary mb-1">Highest Bidder</p>
                              <p className="text-sm font-medium text-phantom-text-primary">
                                {auction.highest_bidder_username}
                              </p>
                            </div>
                          )}
                          {auction.status === 'active' && (
                            <div>
                              <p className="text-xs text-phantom-text-tertiary mb-1">Time Left</p>
                              <p className="text-sm font-semibold text-phantom-text-primary">
                                {getTimeRemaining(auction.end_date)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* My Bids Tab */}
            {activeTab === 'bids' && (
              <div className="space-y-4">
                {myBids.length === 0 ? (
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-12 text-center">
                    <svg className="w-20 h-20 text-phantom-text-tertiary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-phantom-text-primary mb-2">No Bids Yet</h3>
                    <p className="text-phantom-text-secondary mb-6">
                      Browse auctions to place your first bid
                    </p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="inline-flex"
                    >
                      <Button>Browse Auctions</Button>
                    </button>
                  </div>
                ) : (
                  myBids.map((bid) => {
                    const isWinning = bid.highest_bidder_id === bid.bidder_id && bid.auction_status === 'active';
                    return (
                      <Link
                        key={bid.id}
                        to={`/auctions/${bid.auction_id}`}
                        className="block bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all duration-300 overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-phantom-text-primary">
                                  {bid.item_name}
                                </h3>
                                <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${getRarityColor(bid.rarity)}`}>
                                  {bid.rarity}
                                </span>
                                {isWinning ? (
                                  <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-phantom-success/10 border border-phantom-success/30 text-phantom-success flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    Winning
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-phantom-text-tertiary/10 border border-phantom-text-tertiary/30 text-phantom-text-tertiary">
                                    Outbid
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-phantom-text-secondary">
                                Seller: {bid.seller_username}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-phantom-text-tertiary mb-1">Your Bid</p>
                              <p className="text-lg font-bold text-phantom-accent-primary">
                                Ⱥ {formatCurrency(bid.amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-phantom-text-tertiary mb-1">Current Bid</p>
                              <p className="text-lg font-semibold text-phantom-text-primary">
                                Ⱥ {formatCurrency(bid.current_bid)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-phantom-text-tertiary mb-1">Status</p>
                              {(() => {
                                const badge = getStatusBadge(bid.auction_status);
                                return (
                                  <p className={`text-sm font-semibold ${badge.text}`}>
                                    {bid.auction_status?.charAt(0).toUpperCase() + bid.auction_status?.slice(1)}
                                  </p>
                                );
                              })()}
                            </div>
                            {bid.auction_status === 'active' && (
                              <div>
                                <p className="text-xs text-phantom-text-tertiary mb-1">Time Left</p>
                                <p className="text-sm font-semibold text-phantom-text-primary">
                                  {getTimeRemaining(bid.end_date)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Auctions;

