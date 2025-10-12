import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { auctionAPI, walletAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
    // Refresh data every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const loadData = async () => {
    try {
      const [auctionRes, walletRes] = await Promise.all([
        auctionAPI.getAuctionById(id),
        walletAPI.getWallet()
      ]);
      
      setAuction(auctionRes.data.auction);
      setBids(auctionRes.data.bids);
      setWallet(walletRes.data.wallet);

      // Set suggested bid amount
      const minBid = auctionRes.data.auction.current_bid 
        ? parseFloat(auctionRes.data.auction.current_bid) + 1
        : parseFloat(auctionRes.data.auction.starting_price);
      setBidAmount(minBid.toString());
    } catch (error) {
      console.error('Failed to load auction:', error);
      setError('Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    const minBid = auction.current_bid 
      ? parseFloat(auction.current_bid) + 1
      : parseFloat(auction.starting_price);

    if (parseFloat(bidAmount) < minBid) {
      setError(`Bid must be at least Ⱥ ${minBid}`);
      return;
    }

    setBidding(true);

    try {
      await auctionAPI.placeBid(id, parseFloat(bidAmount));
      setSuccess('Bid placed successfully!');
      await loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid. Please try again.');
    } finally {
      setBidding(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('Confirm that you have received the item? This will release payment to the seller.')) {
      return;
    }

    setConfirming(true);

    try {
      await auctionAPI.confirmDelivery(id);
      setSuccess('Delivery confirmed! Payment has been released to the seller.');
      await loadData();
      
      setTimeout(() => {
        navigate('/auctions');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm delivery. Please try again.');
    } finally {
      setConfirming(false);
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

    if (diff <= 0) return 'Auction Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
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

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-12 text-center">
            <p className="text-phantom-text-secondary text-lg">Auction not found</p>
            <Link to="/auctions">
              <Button className="mt-6">Back to Auction House</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === auction.seller_id;
  const isWinner = auction.status === 'ended' && user?.id === auction.highest_bidder_id;
  const isHighestBidder = user?.id === auction.highest_bidder_id && auction.status === 'active';
  const canBid = auction.status === 'active' && !isOwner;

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Back Button */}
        <Link to="/auctions" className="inline-flex items-center text-phantom-text-secondary hover:text-phantom-accent-primary transition-colors mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Auction House
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Item Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Item Card */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-phantom-text-primary mb-3">
                    {auction.item_name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-xl text-sm font-semibold border ${getRarityColor(auction.rarity)}`}>
                      {auction.rarity}
                    </span>
                    {auction.status === 'active' && (
                      <span className="px-4 py-1.5 rounded-xl text-sm font-semibold bg-phantom-success/10 border border-phantom-success/30 text-phantom-success">
                        Active
                      </span>
                    )}
                    {auction.status === 'ended' && (
                      <span className="px-4 py-1.5 rounded-xl text-sm font-semibold bg-phantom-warning/10 border border-phantom-warning/30 text-phantom-warning">
                        Ended
                      </span>
                    )}
                    {auction.status === 'completed' && (
                      <span className="px-4 py-1.5 rounded-xl text-sm font-semibold bg-phantom-success/10 border border-phantom-success/30 text-phantom-success flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {auction.item_description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-phantom-text-tertiary uppercase mb-2">Description</h3>
                  <p className="text-phantom-text-secondary leading-relaxed whitespace-pre-wrap">
                    {auction.item_description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {auction.durability !== null && (
                  <div className="p-4 bg-phantom-bg-tertiary/50 rounded-2xl">
                    <p className="text-xs text-phantom-text-tertiary mb-1">Durability</p>
                    <p className="text-lg font-bold text-phantom-text-primary">{auction.durability}%</p>
                  </div>
                )}
                <div className="p-4 bg-phantom-bg-tertiary/50 rounded-2xl">
                  <p className="text-xs text-phantom-text-tertiary mb-1">Total Bids</p>
                  <p className="text-lg font-bold text-phantom-accent-primary">{auction.bid_count}</p>
                </div>
                <div className="p-4 bg-phantom-bg-tertiary/50 rounded-2xl">
                  <p className="text-xs text-phantom-text-tertiary mb-1">Seller</p>
                  <p className="text-lg font-bold text-phantom-text-primary">{auction.seller_username}</p>
                </div>
                <div className="p-4 bg-phantom-bg-tertiary/50 rounded-2xl">
                  <p className="text-xs text-phantom-text-tertiary mb-1">Started</p>
                  <p className="text-sm font-medium text-phantom-text-primary">
                    {new Date(auction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
              <h2 className="text-2xl font-bold text-phantom-text-primary mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-phantom-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Bid History
              </h2>

              {bids.length === 0 ? (
                <p className="text-center py-8 text-phantom-text-secondary">No bids yet. Be the first to bid!</p>
              ) : (
                <div className="space-y-3">
                  {bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`flex justify-between items-center p-4 rounded-2xl ${
                        index === 0
                          ? 'bg-gradient-card border border-phantom-border-light'
                          : 'bg-phantom-bg-tertiary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {index === 0 && (
                          <svg className="w-5 h-5 text-phantom-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        <div>
                          <p className="font-semibold text-phantom-text-primary">{bid.username}</p>
                          <p className="text-xs text-phantom-text-tertiary">
                            {new Date(bid.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold bg-gradient-phantom bg-clip-text text-transparent">
                          Ⱥ {formatCurrency(bid.amount)}
                        </p>
                        {index === 0 && bid.is_active && (
                          <p className="text-xs text-phantom-accent-primary font-medium">Highest Bid</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Bidding/Status */}
          <div className="space-y-6">
            {/* Current Bid/Price */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <p className="text-sm text-phantom-text-tertiary mb-2">
                {auction.current_bid ? 'Current Bid' : 'Starting Price'}
              </p>
              <p className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-4">
                Ⱥ {formatCurrency(auction.current_bid || auction.starting_price)}
              </p>

              {auction.status === 'active' && (
                <div className="flex items-center justify-between p-4 bg-phantom-bg-tertiary/50 rounded-xl mb-6">
                  <span className="text-sm text-phantom-text-secondary flex items-center gap-2">
                    <svg className="w-5 h-5 text-phantom-warning animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Ends
                  </span>
                  <span className="text-sm font-semibold text-phantom-text-primary">
                    {getTimeRemaining(auction.end_date)}
                  </span>
                </div>
              )}

              {/* Your Balance */}
              {wallet && !isOwner && (
                <div className="mb-6 p-4 bg-gradient-card rounded-xl">
                  <p className="text-xs text-phantom-text-tertiary mb-1">Your Balance</p>
                  <p className="text-lg font-bold text-phantom-text-primary">
                    Ⱥ {formatCurrency(wallet.agon)}
                  </p>
                </div>
              )}

              {/* Messages */}
              {success && (
                <div className="mb-4 bg-phantom-success/10 border-2 border-phantom-success/30 text-phantom-success px-4 py-3 rounded-2xl flex items-center gap-2 animate-scale-in">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{success}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-phantom-error/10 border-2 border-phantom-error/30 text-phantom-error px-4 py-3 rounded-2xl flex items-center gap-2 animate-scale-in">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Status Messages */}
              {isHighestBidder && (
                <div className="mb-4 p-4 bg-phantom-success/10 border border-phantom-success/30 rounded-xl">
                  <p className="text-sm font-semibold text-phantom-success flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    You have the highest bid!
                  </p>
                </div>
              )}

              {isOwner && (
                <div className="mb-4 p-4 bg-phantom-accent-primary/10 border border-phantom-accent-primary/30 rounded-xl">
                  <p className="text-sm font-semibold text-phantom-accent-primary">
                    This is your auction
                  </p>
                </div>
              )}

              {/* Bid Form */}
              {canBid && (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <Input
                    label="Your Bid (Ⱥ)"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter bid amount"
                    min={auction.current_bid ? parseFloat(auction.current_bid) + 1 : parseFloat(auction.starting_price)}
                    step="0.01"
                    required
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                  <Button type="submit" fullWidth size="large" disabled={bidding || auction.status !== 'active'}>
                    {bidding ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Placing Bid...
                      </span>
                    ) : (
                      'Place Bid'
                    )}
                  </Button>
                  <p className="text-xs text-phantom-text-tertiary text-center">
                    Funds will be held in escrow until outbid or auction ends
                  </p>
                </form>
              )}

              {/* Winner Confirmation */}
              {isWinner && (
                <div className="space-y-4">
                  <div className="p-4 bg-phantom-success/10 border border-phantom-success/30 rounded-xl">
                    <p className="text-sm font-semibold text-phantom-success mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      You won this auction!
                    </p>
                    <p className="text-xs text-phantom-text-secondary">
                      Contact the seller to arrange item delivery. Once received, confirm below to release payment.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    size="large"
                    onClick={handleConfirmDelivery}
                    disabled={confirming}
                  >
                    {confirming ? 'Confirming...' : 'Confirm Item Received'}
                  </Button>
                </div>
              )}
            </div>

            {/* Escrow Status */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-2xl shadow-card border border-phantom-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-phantom-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="font-bold text-phantom-text-primary">Escrow Protection</h3>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    auction.status === 'active' ? 'bg-phantom-success text-white' : 'bg-phantom-bg-tertiary text-phantom-text-tertiary'
                  }`}>
                    {auction.status === 'active' ? '✓' : '1'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-phantom-text-primary">Place Bid</p>
                    <p className="text-xs text-phantom-text-secondary">Funds held in secure escrow</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    auction.status === 'ended' || auction.status === 'completed' ? 'bg-phantom-success text-white' : 'bg-phantom-bg-tertiary text-phantom-text-tertiary'
                  }`}>
                    {auction.status === 'ended' || auction.status === 'completed' ? '✓' : '2'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-phantom-text-primary">Auction Ends</p>
                    <p className="text-xs text-phantom-text-secondary">Winner receives item from seller</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    auction.status === 'completed' ? 'bg-phantom-success text-white' : 'bg-phantom-bg-tertiary text-phantom-text-tertiary'
                  }`}>
                    {auction.status === 'completed' ? '✓' : '3'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-phantom-text-primary">Confirm Delivery</p>
                    <p className="text-xs text-phantom-text-secondary">Payment released to seller</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-phantom-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-phantom-text-tertiary">Protection</span>
                  <span className="text-phantom-success font-semibold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;

