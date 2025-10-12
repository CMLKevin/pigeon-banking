import db from '../config/database.js';

// Helper function to check and close expired auctions
const closeExpiredAuctions = () => {
  try {
    const expiredAuctions = db.prepare(`
      SELECT id, highest_bidder_id, current_bid
      FROM auctions 
      WHERE status = 'active' AND end_date <= datetime('now')
    `).all();

    for (const auction of expiredAuctions) {
      db.prepare('UPDATE auctions SET status = ? WHERE id = ?').run('ended', auction.id);
      
      // Log activity
      if (auction.highest_bidder_id) {
        db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
          .run(auction.highest_bidder_id, 'auction_won', JSON.stringify({ 
            auctionId: auction.id, 
            amount: auction.current_bid 
          }));
      }
    }
  } catch (error) {
    console.error('Error closing expired auctions:', error);
  }
};

// Get all active auctions
export const getAllAuctions = (req, res) => {
  try {
    closeExpiredAuctions();

    const { status = 'active', limit = 50 } = req.query;
    
    const auctions = db.prepare(`
      SELECT 
        a.*,
        u.username as seller_username,
        bidder.username as highest_bidder_username,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE a.status = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(status, parseInt(limit));

    res.json({ auctions });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
};

// Get single auction details
export const getAuctionById = (req, res) => {
  try {
    closeExpiredAuctions();

    const { id } = req.params;
    
    const auction = db.prepare(`
      SELECT 
        a.*,
        u.username as seller_username,
        bidder.username as highest_bidder_username,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE a.id = ?
    `).get(id);

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Get bid history
    const bids = db.prepare(`
      SELECT b.*, u.username
      FROM bids b
      LEFT JOIN users u ON b.bidder_id = u.id
      WHERE b.auction_id = ?
      ORDER BY b.created_at DESC
      LIMIT 20
    `).all(id);

    res.json({ auction, bids });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
};

// Create new auction
export const createAuction = (req, res) => {
  try {
    const { itemName, itemDescription, rarity, durability, startingPrice, daysUntilEnd } = req.body;

    // Validation
    if (!itemName || !rarity || !startingPrice || !daysUntilEnd) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (parseFloat(startingPrice) <= 0) {
      return res.status(400).json({ error: 'Starting price must be greater than 0' });
    }

    if (parseInt(daysUntilEnd) < 1 || parseInt(daysUntilEnd) > 30) {
      return res.status(400).json({ error: 'Auction duration must be between 1 and 30 days' });
    }

    const validRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    if (!validRarities.includes(rarity)) {
      return res.status(400).json({ error: 'Invalid rarity' });
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(daysUntilEnd));

    // Create auction
    const result = db.prepare(`
      INSERT INTO auctions (
        seller_id, item_name, item_description, rarity, durability, 
        starting_price, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      itemName,
      itemDescription || null,
      rarity,
      durability || null,
      parseFloat(startingPrice),
      endDate.toISOString()
    );

    // Log activity
    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'auction_created', JSON.stringify({ 
        auctionId: result.lastInsertRowid,
        itemName 
      }));

    // Fetch created auction
    const auction = db.prepare(`
      SELECT a.*, u.username as seller_username
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ auction });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ error: 'Failed to create auction' });
  }
};

// Place bid on auction
export const placeBid = (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount' });
    }

    const bidAmount = parseFloat(amount);

    // Use transaction for atomicity
    const transaction = db.transaction(() => {
      // Get auction details
      const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
      
      if (!auction) {
        throw new Error('Auction not found');
      }

      if (auction.status !== 'active') {
        throw new Error('Auction is not active');
      }

      if (new Date(auction.end_date) <= new Date()) {
        throw new Error('Auction has ended');
      }

      if (auction.seller_id === req.user.id) {
        throw new Error('Cannot bid on your own auction');
      }

      // Check minimum bid
      const minBid = auction.current_bid 
        ? auction.current_bid + 1  // Minimum increment of 1 Agon
        : auction.starting_price;

      if (bidAmount < minBid) {
        throw new Error(`Bid must be at least ${minBid} Agon`);
      }

      // Get bidder's wallet
      const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if user has enough available balance
      if (wallet.agon < bidAmount) {
        throw new Error('Insufficient balance');
      }

      // If user already has the highest bid, refund the previous bid first
      if (auction.highest_bidder_id === req.user.id) {
        // Return previous escrow amount
        db.prepare('UPDATE wallets SET agon = agon + ?, agon_escrow = agon_escrow - ? WHERE user_id = ?')
          .run(auction.current_bid, auction.current_bid, req.user.id);
      }

      // If there was a previous highest bidder (different user), refund them
      if (auction.highest_bidder_id && auction.highest_bidder_id !== req.user.id) {
        // Return escrowed funds to previous highest bidder
        db.prepare('UPDATE wallets SET agon = agon + ?, agon_escrow = agon_escrow - ? WHERE user_id = ?')
          .run(auction.current_bid, auction.current_bid, auction.highest_bidder_id);
        
        // Deactivate their bid
        db.prepare('UPDATE bids SET is_active = 0 WHERE auction_id = ? AND bidder_id = ?')
          .run(id, auction.highest_bidder_id);

        // Log refund activity
        db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
          .run(auction.highest_bidder_id, 'bid_refunded', JSON.stringify({ 
            auctionId: id, 
            amount: auction.current_bid 
          }));
      }

      // Move funds from bidder's balance to escrow
      db.prepare('UPDATE wallets SET agon = agon - ?, agon_escrow = agon_escrow + ? WHERE user_id = ?')
        .run(bidAmount, bidAmount, req.user.id);

      // Update auction
      db.prepare('UPDATE auctions SET current_bid = ?, highest_bidder_id = ? WHERE id = ?')
        .run(bidAmount, req.user.id, id);

      // Create bid record
      const bidResult = db.prepare(`
        INSERT INTO bids (auction_id, bidder_id, amount) VALUES (?, ?, ?)
      `).run(id, req.user.id, bidAmount);

      // Log activity
      db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
        .run(req.user.id, 'bid_placed', JSON.stringify({ 
          auctionId: id, 
          amount: bidAmount 
        }));

      return bidResult.lastInsertRowid;
    });

    const bidId = transaction();

    // Get updated auction
    const updatedAuction = db.prepare(`
      SELECT a.*, u.username as seller_username, bidder.username as highest_bidder_username
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE a.id = ?
    `).get(id);

    res.json({ 
      message: 'Bid placed successfully',
      auction: updatedAuction,
      bidId
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(400).json({ error: error.message || 'Failed to place bid' });
  }
};

// Confirm item delivery and release escrow (with 5% commission to admin)
export const confirmDelivery = (req, res) => {
  try {
    const { id } = req.params;

    const transaction = db.transaction(() => {
      // Get auction details
      const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
      
      if (!auction) {
        throw new Error('Auction not found');
      }

      if (auction.status !== 'ended') {
        throw new Error('Auction must be ended to confirm delivery');
      }

      if (auction.highest_bidder_id !== req.user.id) {
        throw new Error('Only the winning bidder can confirm delivery');
      }

      if (auction.status === 'completed') {
        throw new Error('Delivery already confirmed');
      }

      if (!auction.highest_bidder_id || !auction.current_bid) {
        throw new Error('No winning bid found');
      }

      // Calculate 5% commission
      const commissionRate = 0.05;
      const grossAmount = parseFloat(auction.current_bid);
      const commissionAmount = parseFloat((grossAmount * commissionRate).toFixed(2));
      const netToSeller = parseFloat((grossAmount - commissionAmount).toFixed(2));

      // Find a platform admin account to receive commission
      const admin = db.prepare('SELECT id, username FROM users WHERE is_admin = 1 ORDER BY id ASC LIMIT 1').get();

      // Release escrow split: net to seller, commission to admin (if exists)
      db.prepare('UPDATE wallets SET agon = agon + ? WHERE user_id = ?')
        .run(netToSeller, auction.seller_id);
      if (admin && admin.id) {
        db.prepare('UPDATE wallets SET agon = agon + ? WHERE user_id = ?')
          .run(commissionAmount, admin.id);
      }

      // Remove full amount from bidder's escrow
      db.prepare('UPDATE wallets SET agon_escrow = agon_escrow - ? WHERE user_id = ?')
        .run(grossAmount, auction.highest_bidder_id);

      // Mark auction as completed
      db.prepare('UPDATE auctions SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('completed', id);

      // Create transaction records
      // Buyer -> Seller (net)
      db.prepare(`
        INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
        VALUES (?, ?, 'auction', 'agon', ?, ?)
      `).run(
        auction.highest_bidder_id,
        auction.seller_id,
        netToSeller,
        `Auction payment (net) for ${auction.item_name}`
      );

      // Buyer -> Admin (commission)
      if (admin && admin.id && commissionAmount > 0) {
        db.prepare(`
          INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
          VALUES (?, ?, 'commission', 'agon', ?, ?)
        `).run(
          auction.highest_bidder_id,
          admin.id,
          commissionAmount,
          `Auction commission (5%) for ${auction.item_name}`
        );
      }

      // Log activities
      db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
        .run(auction.seller_id, 'auction_completed', JSON.stringify({ 
          auctionId: id, 
          grossAmount, 
          netToSeller, 
          commissionAmount 
        }));

      db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
        .run(auction.highest_bidder_id, 'delivery_confirmed', JSON.stringify({ 
          auctionId: id, 
          amount: grossAmount 
        }));

      if (admin && admin.id && commissionAmount > 0) {
        db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
          .run(admin.id, 'auction_commission_received', JSON.stringify({ 
            auctionId: id, 
            commissionAmount, 
            sellerId: auction.seller_id 
          }));
      }
    });

    transaction();

    res.json({ message: 'Delivery confirmed and payment released to seller' });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(400).json({ error: error.message || 'Failed to confirm delivery' });
  }
};

// Get user's auctions (selling)
export const getMyAuctions = (req, res) => {
  try {
    closeExpiredAuctions();

    const auctions = db.prepare(`
      SELECT 
        a.*,
        bidder.username as highest_bidder_username,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
      FROM auctions a
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE a.seller_id = ?
      ORDER BY a.created_at DESC
    `).all(req.user.id);

    res.json({ auctions });
  } catch (error) {
    console.error('Get my auctions error:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
};

// Get user's bids
export const getMyBids = (req, res) => {
  try {
    closeExpiredAuctions();

    const bids = db.prepare(`
      SELECT 
        b.*,
        a.item_name,
        a.rarity,
        a.current_bid,
        a.highest_bidder_id,
        a.status,
        a.end_date,
        seller.username as seller_username,
        (b.bidder_id = a.highest_bidder_id AND b.is_active = 1) as is_winning
      FROM bids b
      LEFT JOIN auctions a ON b.auction_id = a.id
      LEFT JOIN users seller ON a.seller_id = seller.id
      WHERE b.bidder_id = ? AND b.is_active = 1
      ORDER BY b.created_at DESC
    `).all(req.user.id);

    res.json({ bids });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
};

// Cancel auction (only if no bids)
export const cancelAuction = (req, res) => {
  try {
    const { id } = req.params;

    const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
    
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auction.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this auction' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ error: 'Can only cancel active auctions' });
    }

    if (auction.highest_bidder_id) {
      return res.status(400).json({ error: 'Cannot cancel auction with active bids' });
    }

    db.prepare('UPDATE auctions SET status = ? WHERE id = ?').run('cancelled', id);

    // Log activity
    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'auction_cancelled', JSON.stringify({ auctionId: id }));

    res.json({ message: 'Auction cancelled successfully' });
  } catch (error) {
    console.error('Cancel auction error:', error);
    res.status(500).json({ error: 'Failed to cancel auction' });
  }
};

