import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { auctionAPI } from '../services/api';

const CreateAuction = () => {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [rarity, setRarity] = useState('Common');
  const [durability, setDurability] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [daysUntilEnd, setDaysUntilEnd] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const rarityOptions = [
    { value: 'Common', label: 'Common' },
    { value: 'Uncommon', label: 'Uncommon' },
    { value: 'Rare', label: 'Rare' },
    { value: 'Epic', label: 'Epic' },
    { value: 'Legendary', label: 'Legendary' },
    { value: 'Mythic', label: 'Mythic' }
  ];

  const durationOptions = [
    { value: '1', label: '1 Day' },
    { value: '3', label: '3 Days' },
    { value: '5', label: '5 Days' },
    { value: '7', label: '7 Days' },
    { value: '14', label: '14 Days' },
    { value: '30', label: '30 Days' }
  ];

  const getRarityColor = (rarityValue) => {
    const colors = {
      Common: 'text-gray-400',
      Uncommon: 'text-green-400',
      Rare: 'text-blue-400',
      Epic: 'text-purple-400',
      Legendary: 'text-orange-400',
      Mythic: 'text-pink-400'
    };
    return colors[rarityValue] || colors.Common;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!itemName.trim()) {
      setError('Item name is required');
      return;
    }

    if (!startingPrice || parseFloat(startingPrice) <= 0) {
      setError('Starting price must be greater than 0');
      return;
    }

    if (durability && (parseFloat(durability) < 0 || parseFloat(durability) > 100)) {
      setError('Durability must be between 0 and 100');
      return;
    }

    setLoading(true);

    try {
      const response = await auctionAPI.createAuction(
        itemName,
        itemDescription || null,
        rarity,
        durability ? parseInt(durability) : null,
        parseFloat(startingPrice),
        parseInt(daysUntilEnd)
      );

      navigate(`/auctions/${response.data.auction.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">
            Create Auction
          </h1>
          <p className="text-phantom-text-secondary text-lg">
            List your Minecraft item for auction
          </p>
        </div>

        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Name */}
            <Input
              label="Item Name"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Diamond Sword, Netherite Helmet"
              required
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />

            {/* Item Description */}
            <div>
              <label className="block text-phantom-text-primary font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Add details about the item (enchantments, special properties, etc.)"
                rows={4}
                className="w-full px-4 py-3 bg-phantom-bg-secondary border-2 border-phantom-border text-phantom-text-primary placeholder:text-phantom-text-tertiary rounded-2xl focus:outline-none focus:border-phantom-accent-primary focus:shadow-input transition-all duration-200 resize-none"
              />
            </div>

            {/* Rarity and Durability Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Rarity"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  options={rarityOptions}
                />
                <p className={`mt-2 text-sm font-semibold ${getRarityColor(rarity)}`}>
                  {rarity} Item
                </p>
              </div>

              <Input
                label="Durability (Optional)"
                type="number"
                value={durability}
                onChange={(e) => setDurability(e.target.value)}
                placeholder="0-100"
                min="0"
                max="100"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
            </div>

            {/* Starting Price and Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Starting Price (Ⱥ)"
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              <Select
                label="Auction Duration"
                value={daysUntilEnd}
                onChange={(e) => setDaysUntilEnd(e.target.value)}
                options={durationOptions}
              />
            </div>

            {/* Info Box */}
            <div className="bg-gradient-card border border-phantom-border-light rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-phantom-accent-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-phantom-text-secondary">
                  <p className="font-semibold text-phantom-text-primary mb-2">How Auctions Work</p>
                  <ul className="space-y-1">
                    <li>• Bids are placed in Agon (Ⱥ) and held in escrow</li>
                    <li>• When outbid, funds are automatically refunded</li>
                    <li>• After auction ends, the winner must confirm delivery</li>
                    <li>• Once confirmed, payment is released to the seller</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-phantom-error/10 border-2 border-phantom-error/30 text-phantom-error px-4 py-3.5 rounded-2xl flex items-center gap-3 animate-scale-in">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => navigate('/marketplace')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                size="large"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Auction
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;

