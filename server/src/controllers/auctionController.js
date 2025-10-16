import db from '../config/database.js';

// Helper function to check and close expired auctions
const closeExpiredAuctions = async () => {
  try {
    const expiredAuctions = await db.query(`
      SELECT id, highest_bidder_id, current_bid
      FROM auctions 
      WHERE status = 'active' AND end_date <= NOW()
    `);

    for (const auction of expiredAuctions) {
      await db.exec('UPDATE auctions SET status = $1 WHERE id = $2', ['ended', auction.id]);
      
      // Log activity
      if (auction.highest_bidder_id) {
        await db.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
          , [auction.highest_bidder_id, 'auction_won', JSON.stringify({ 
            auctionId: auction.id, 
            amount: auction.current_bid 
          })]);
      }
    }
  } catch (error) {
    console.error('Error closing expired auctions:', error);
  }
};

// Get all active auctions
export const getAllAuctions = async (req, res) => {
  try {
    await closeExpiredAuctions();

    const { status = 'active', limit = 50 } = req.query;
    
    const auctions = await db.query(`
      SELECT 
        a.*,
        u.username as seller_username,
        bidder.username as highest_bidder_username,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE a.status = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `, [status, parseInt(limit)]);

    res.json({ auctions });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
};

// Get single auction details
export const getAuctionById = async (req, res) => {
  try {
    await closeExpiredAuctions();

    const { id } = req.params;
    
    const auction = await db.queryOne(`
      SELECT 
        a.*,
        u.username as seller_username,
        bidder.username as highest_bidder_username,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE a.id = $1
    `, [id]);

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Get bid history
    const bids = await db.query(`
      SELECT b.*, u.username
      FROM bids b
      LEFT JOIN users u ON b.bidder_id = u.id
      WHERE b.auction_id = $1
      ORDER BY b.created_at DESC
      LIMIT 20
    `, [id]);

    res.json({ auction, bids });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
};

// Create new auction
export const createAuction = async (req, res) => {
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
    const inserted = await db.queryOne(`
      INSERT INTO auctions (
        seller_id, item_name, item_description, rarity, durability, 
        starting_price, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
      [
        req.user.id,
        itemName,
        itemDescription || null,
        rarity,
        durability || null,
        parseFloat(startingPrice),
        endDate.toISOString()
      ]
    );

    // Log activity
    await db.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
      , [req.user.id, 'auction_created', JSON.stringify({ 
        auctionId: inserted.id,
        itemName 
      })]);

    // Fetch created auction
    const auction = await db.queryOne(`
      SELECT a.*, u.username as seller_username
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      WHERE a.id = $1
    `, [inserted.id]);

    res.status(201).json({ auction });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ error: 'Failed to create auction' });
  }
};

// Place bid on auction
export const placeBid = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount' });
    }

    const bidAmount = parseFloat(amount);

    // Use transaction for atomicity
    const bidId = await db.tx(async (q) => {
      // Get auction details
      const auction = await q.queryOne('SELECT * FROM auctions WHERE id = $1', [id]);
      
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
      const currentBid = parseFloat(auction.current_bid) || 0;
      const startingPrice = parseFloat(auction.starting_price) || 0;
      const minBid = currentBid > 0 ? currentBid + 1 : startingPrice;  // Minimum increment of 1 Agon

      if (bidAmount < minBid) {
        throw new Error(`Bid must be at least ${minBid.toFixed(2)} Agon`);
      }

      // Get bidder's wallet
      const wallet = await q.queryOne('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if user has enough available balance
      const availableBalance = parseFloat(wallet.agon) || 0;
      if (availableBalance < bidAmount) {
        throw new Error('Insufficient balance');
      }

      // If user already has the highest bid, refund the previous bid first
      if (auction.highest_bidder_id === req.user.id) {
        // Return previous escrow amount
        await q.exec('UPDATE wallets SET agon = agon + $1, agon_escrow = agon_escrow - $1 WHERE user_id = $2', [currentBid, req.user.id]);
      }

      // If there was a previous highest bidder (different user), refund them
      if (auction.highest_bidder_id && auction.highest_bidder_id !== req.user.id) {
        // Return escrowed funds to previous highest bidder
        await q.exec('UPDATE wallets SET agon = agon + $1, agon_escrow = agon_escrow - $1 WHERE user_id = $2', [currentBid, auction.highest_bidder_id]);
        
        // Deactivate their bid
        await q.exec('UPDATE bids SET is_active = FALSE WHERE auction_id = $1 AND bidder_id = $2', [id, auction.highest_bidder_id]);

        // Log refund activity
        await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
          , [auction.highest_bidder_id, 'bid_refunded', JSON.stringify({ 
            auctionId: id, 
            amount: currentBid 
          })]);
      }

      // Move funds from bidder's balance to escrow
      await q.exec('UPDATE wallets SET agon = agon - $1, agon_escrow = agon_escrow + $1 WHERE user_id = $2', [bidAmount, req.user.id]);

      // Update auction
      await q.exec('UPDATE auctions SET current_bid = $1, highest_bidder_id = $2 WHERE id = $3', [bidAmount, req.user.id, id]);

      // Create bid record
      const bidInserted = await q.queryOne('INSERT INTO bids (auction_id, bidder_id, amount) VALUES ($1, $2, $3) RETURNING id', [id, req.user.id, bidAmount]);

      // Log activity
      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
        , [req.user.id, 'bid_placed', JSON.stringify({ 
          auctionId: id, 
          amount: bidAmount 
        })]);

      return bidInserted.id;
    });

    // Get updated auction
    const updatedAuction = await db.queryOne(`
      SELECT a.*, u.username as seller_username, bidder.username as highest_bidder_username
      FROM auctions a
      LEFT JOIN users u ON a.seller_id = u.id
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE a.id = $1
    `, [id]);

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
export const confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    await db.tx(async (q) => {
      // Get auction details
      const auction = await q.queryOne('SELECT * FROM auctions WHERE id = $1', [id]);
      
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
      const grossAmount = parseFloat(auction.current_bid) || 0;
      const commissionAmount = parseFloat((grossAmount * commissionRate).toFixed(2));
      const netToSeller = parseFloat((grossAmount - commissionAmount).toFixed(2));

      // Find a platform admin account to receive commission
      const admin = await q.queryOne('SELECT id, username FROM users WHERE is_admin = TRUE ORDER BY id ASC LIMIT 1');

      // Release escrow split: net to seller, commission to admin (if exists)
      await q.exec('UPDATE wallets SET agon = agon + $1 WHERE user_id = $2', [netToSeller, auction.seller_id]);
      if (admin && admin.id) {
        await q.exec('UPDATE wallets SET agon = agon + $1 WHERE user_id = $2', [commissionAmount, admin.id]);
      }

      // Remove full amount from bidder's escrow
      await q.exec('UPDATE wallets SET agon_escrow = agon_escrow - $1 WHERE user_id = $2', [grossAmount, auction.highest_bidder_id]);

      // Mark auction as completed
      await q.exec("UPDATE auctions SET status = 'completed', completed_at = NOW() WHERE id = $1", [id]);

      // Create transaction records
      // Buyer -> Seller (net)
      await q.exec(
        `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
         VALUES ($1, $2, 'auction', 'agon', $3, $4)`,
        [auction.highest_bidder_id, auction.seller_id, netToSeller, `Auction payment (net) for ${auction.item_name}`]
      );

      // Buyer -> Admin (commission)
      if (admin && admin.id && commissionAmount > 0) {
        await q.exec(
          `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
           VALUES ($1, $2, 'commission', 'agon', $3, $4)`,
          [auction.highest_bidder_id, admin.id, commissionAmount, `Auction commission (5%) for ${auction.item_name}`]
        );
      }

      // Log activities
      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
        , [auction.seller_id, 'auction_completed', JSON.stringify({ 
          auctionId: id, 
          grossAmount, 
          netToSeller, 
          commissionAmount 
        })]);

      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
        , [auction.highest_bidder_id, 'delivery_confirmed', JSON.stringify({ 
          auctionId: id, 
          amount: grossAmount 
        })]);

      if (admin && admin.id && commissionAmount > 0) {
        await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
          , [admin.id, 'auction_commission_received', JSON.stringify({ 
            auctionId: id, 
            commissionAmount, 
            sellerId: auction.seller_id 
          })]);
      }
    });

    res.json({ message: 'Delivery confirmed and payment released to seller' });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(400).json({ error: error.message || 'Failed to confirm delivery' });
  }
};

// Report delivery issue (dispute)
export const reportDeliveryIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { issueType, description } = req.body;

    if (!issueType || !description) {
      return res.status(400).json({ error: 'Issue type and description are required' });
    }

    const validIssueTypes = ['item_not_received', 'item_damaged', 'wrong_item', 'seller_unresponsive'];
    if (!validIssueTypes.includes(issueType)) {
      return res.status(400).json({ error: 'Invalid issue type' });
    }

    await db.tx(async (q) => {
      // Get auction details
      const auction = await q.queryOne('SELECT * FROM auctions WHERE id = $1', [id]);
      
      if (!auction) {
        throw new Error('Auction not found');
      }

      if (auction.status !== 'ended') {
        throw new Error('Auction must be ended to report delivery issues');
      }

      if (auction.highest_bidder_id !== req.user.id) {
        throw new Error('Only the winning bidder can report delivery issues');
      }

      if (auction.status === 'completed') {
        throw new Error('Cannot report issues on completed auctions');
      }

      // Create dispute record
      await q.exec(`
        INSERT INTO auction_disputes (auction_id, reporter_id, issue_type, description, status, created_at)
        VALUES ($1, $2, $3, $4, 'pending', NOW())
      `, [id, req.user.id, issueType, description]);

      // Log activity
      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
        , [req.user.id, 'delivery_issue_reported', JSON.stringify({ 
          auctionId: id, 
          issueType, 
          description 
        })]);

      // Notify seller
      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
        , [auction.seller_id, 'delivery_issue_reported_against', JSON.stringify({ 
          auctionId: id, 
          issueType, 
          reporterId: req.user.id 
        })]);

      // Update auction status to disputed
      await q.exec("UPDATE auctions SET status = 'disputed' WHERE id = $1", [id]);
    });

    res.json({ message: 'Delivery issue reported. Admin will review the case.' });
  } catch (error) {
    console.error('Report delivery issue error:', error);
    res.status(400).json({ error: error.message || 'Failed to report delivery issue' });
  }
};

// Auto-release escrow after timeout (admin function)
export const autoReleaseEscrow = async (req, res) => {
  try {
    // Only admins can trigger auto-release
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    await db.tx(async (q) => {
      // Get auction details
      const auction = await q.queryOne('SELECT * FROM auctions WHERE id = $1', [id]);
      
      if (!auction) {
        throw new Error('Auction not found');
      }

      if (auction.status !== 'ended' && auction.status !== 'disputed') {
        throw new Error('Auction must be ended or disputed to auto-release escrow');
      }

      if (!auction.highest_bidder_id || !auction.current_bid) {
        throw new Error('No winning bid found');
      }

      // Calculate amounts
      const commissionRate = 0.05;
      const grossAmount = parseFloat(auction.current_bid) || 0;
      const commissionAmount = parseFloat((grossAmount * commissionRate).toFixed(2));
      const netToSeller = parseFloat((grossAmount - commissionAmount).toFixed(2));

      // Find admin account
      const admin = await q.queryOne('SELECT id, username FROM users WHERE is_admin = TRUE ORDER BY id ASC LIMIT 1');

      // Release escrow
      await q.exec('UPDATE wallets SET agon = agon + $1 WHERE user_id = $2', [netToSeller, auction.seller_id]);
      if (admin && admin.id) {
        await q.exec('UPDATE wallets SET agon = agon + $1 WHERE user_id = $2', [commissionAmount, admin.id]);
      }

      // Remove from bidder's escrow
      await q.exec('UPDATE wallets SET agon_escrow = agon_escrow - $1 WHERE user_id = $2', [grossAmount, auction.highest_bidder_id]);

      // Mark auction as completed
      await q.exec("UPDATE auctions SET status = 'completed', completed_at = NOW() WHERE id = $1", [id]);

      // Create transaction records
      await q.exec(
        `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
         VALUES ($1, $2, 'auction', 'agon', $3, $4)`,
        [auction.highest_bidder_id, auction.seller_id, netToSeller, `Auction payment (auto-released) for ${auction.item_name}`]
      );

      if (admin && admin.id && commissionAmount > 0) {
        await q.exec(
          `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
           VALUES ($1, $2, 'commission', 'agon', $3, $4)`,
          [auction.highest_bidder_id, admin.id, commissionAmount, `Auction commission (auto-released) for ${auction.item_name}`]
        );
      }

      // Log activities
      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
        , [auction.seller_id, 'auction_auto_completed', JSON.stringify({ 
          auctionId: id, 
          grossAmount, 
          netToSeller, 
          commissionAmount,
          reason 
        })]);

      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
        , [auction.highest_bidder_id, 'escrow_auto_released', JSON.stringify({ 
          auctionId: id, 
          amount: grossAmount,
          reason 
        })]);

      if (admin && admin.id && commissionAmount > 0) {
        await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
          , [admin.id, 'auction_commission_auto_received', JSON.stringify({ 
            auctionId: id, 
            commissionAmount, 
            sellerId: auction.seller_id,
            reason 
          })]);
      }
    });

    res.json({ message: 'Escrow auto-released successfully' });
  } catch (error) {
    console.error('Auto-release escrow error:', error);
    res.status(400).json({ error: error.message || 'Failed to auto-release escrow' });
  }
};

// Get escrow status for user
export const getEscrowStatus = async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    let whereClause = '';
    let params = [req.user.id];

    if (status === 'active') {
      whereClause = `AND a.status IN ('active', 'ended', 'disputed')`;
    } else if (status === 'completed') {
      whereClause = `AND a.status = 'completed'`;
    } else if (status === 'all') {
      whereClause = '';
    }

    const escrowData = await db.query(`
      SELECT 
        a.id,
        a.item_name,
        a.current_bid,
        a.status,
        a.end_date,
        a.completed_at,
        seller.username as seller_username,
        bidder.username as highest_bidder_username,
        CASE 
          WHEN a.seller_id = $1 THEN 'seller'
          WHEN a.highest_bidder_id = $1 THEN 'buyer'
          ELSE 'other'
        END as user_role,
        CASE 
          WHEN a.seller_id = $1 AND a.status = 'ended' THEN 'awaiting_confirmation'
          WHEN a.highest_bidder_id = $1 AND a.status = 'ended' THEN 'confirm_delivery'
          WHEN a.highest_bidder_id = $1 AND a.status = 'disputed' THEN 'dispute_pending'
          WHEN a.status = 'completed' THEN 'completed'
          ELSE 'active'
        END as escrow_status
      FROM auctions a
      LEFT JOIN users seller ON a.seller_id = seller.id
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE (a.seller_id = $1 OR a.highest_bidder_id = $1)
        AND a.highest_bidder_id IS NOT NULL
        ${whereClause}
      ORDER BY a.created_at DESC
    `, params);

    res.json({ escrowTransactions: escrowData });
  } catch (error) {
    console.error('Get escrow status error:', error);
    res.status(500).json({ error: 'Failed to fetch escrow status' });
  }
};

// Get user's auctions (selling)
export const getMyAuctions = async (req, res) => {
  try {
    await closeExpiredAuctions();

    const auctions = await db.query(`
      SELECT 
        a.*,
        bidder.username as highest_bidder_username,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bid_count
      FROM auctions a
      LEFT JOIN users bidder ON a.highest_bidder_id = bidder.id
      WHERE a.seller_id = $1
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    res.json({ auctions });
  } catch (error) {
    console.error('Get my auctions error:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
};

// Get user's bids
export const getMyBids = async (req, res) => {
  try {
    await closeExpiredAuctions();

    const bids = await db.query(`
      SELECT 
        b.*,
        a.item_name,
        a.rarity,
        a.current_bid,
        a.highest_bidder_id,
        a.status,
        a.end_date,
        seller.username as seller_username,
        (b.bidder_id = a.highest_bidder_id AND b.is_active = TRUE) as is_winning
      FROM bids b
      LEFT JOIN auctions a ON b.auction_id = a.id
      LEFT JOIN users seller ON a.seller_id = seller.id
      WHERE b.bidder_id = $1 AND b.is_active = TRUE
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json({ bids });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
};

// Cancel auction (only if no bids)
export const cancelAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await db.queryOne('SELECT * FROM auctions WHERE id = $1', [id]);
    
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

    await db.exec("UPDATE auctions SET status = 'cancelled' WHERE id = $1", [id]);

    // Log activity
    await db.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)'
      , [req.user.id, 'auction_cancelled', JSON.stringify({ auctionId: id })]);

    res.json({ message: 'Auction cancelled successfully' });
  } catch (error) {
    console.error('Cancel auction error:', error);
    res.status(500).json({ error: 'Failed to cancel auction' });
  }
};

