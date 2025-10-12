import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin
router.use(authenticateToken, requireAdmin);

// Users list with balances and stats
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.created_at, u.is_admin, u.disabled,
        w.agon, w.stoneworks_dollar,
        (
          SELECT COUNT(1) FROM transactions t 
          WHERE t.from_user_id = u.id OR t.to_user_id = u.id
        ) AS transaction_count
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      ORDER BY u.created_at DESC
    `).all();
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Force-end an auction (admin testing utility)
router.post('/auctions/:id/force-end', (req, res) => {
  try {
    const { id } = req.params;

    const auction = db.prepare('SELECT * FROM auctions WHERE id = ?').get(id);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ error: 'Auction is not active' });
    }

    // Mark as ended if there is a highest bidder; else keep it active
    db.prepare('UPDATE auctions SET status = ?, end_date = CURRENT_TIMESTAMP WHERE id = ?')
      .run('ended', id);

    // Log admin action
    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'admin_force_end_auction', JSON.stringify({ auctionId: id }));

    res.json({ message: 'Auction force-ended for testing.' });
  } catch (e) {
    console.error('Force end auction error:', e);
    res.status(500).json({ error: 'Failed to force end auction' });
  }
});

// Toggle disable/enable user
router.post('/users/:id/toggle-disabled', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT disabled, username FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newVal = user.disabled ? 0 : 1;
    db.prepare('UPDATE users SET disabled = ? WHERE id = ?').run(newVal, id);
    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'admin_toggle_disabled', JSON.stringify({ targetUserId: id, targetUsername: user.username, disabled: !!newVal }));
    res.json({ id: Number(id), disabled: !!newVal });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Promote/demote admin
router.post('/users/:id/toggle-admin', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT is_admin, username FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newVal = user.is_admin ? 0 : 1;
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(newVal, id);
    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'admin_toggle_admin', JSON.stringify({ targetUserId: id, targetUsername: user.username, is_admin: !!newVal }));
    res.json({ id: Number(id), is_admin: !!newVal });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user admin status' });
  }
});

// Adjust user balance (admin)
router.post('/users/:id/adjust-balance', (req, res) => {
  try {
    const { id } = req.params;
    const { currency, amount } = req.body;

    if (!['agon', 'stoneworks_dollar'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    const delta = Number(amount);
    if (!isFinite(delta) || delta === 0) {
      return res.status(400).json({ error: 'Amount must be non-zero number' });
    }

    const wallet = db.prepare('SELECT agon, stoneworks_dollar FROM wallets WHERE user_id = ?').get(id);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const newBalance = (wallet[currency] || 0) + delta;
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Resulting balance cannot be negative' });
    }

    db.prepare(`UPDATE wallets SET ${currency} = ? WHERE user_id = ?`).run(newBalance, id);

    // Record transaction for audit
    db.prepare(`
      INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
      VALUES (?, ?, 'admin_adjust', ?, ?, ?)
    `).run(
      req.user.id,
      id,
      currency,
      Math.abs(delta),
      delta > 0 ? 'Admin credit' : 'Admin debit'
    );

    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'admin_adjust_balance', JSON.stringify({ targetUserId: id, currency, amount: delta }));

    const updated = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(id);
    res.json({ message: 'Balance updated', wallet: updated });
  } catch (e) {
    console.error('Adjust balance error:', e);
    res.status(500).json({ error: 'Failed to adjust balance' });
  }
});

// Aggregated metrics
router.get('/metrics', (req, res) => {
  try {
    const totals = db.prepare(`
      SELECT 
        (SELECT COUNT(1) FROM users) AS total_users,
        (SELECT COUNT(1) FROM users WHERE disabled = 1) AS disabled_users,
        (SELECT COUNT(1) FROM users WHERE is_admin = 1) AS admin_users,
        (SELECT COUNT(1) FROM transactions) AS total_transactions,
        (SELECT COUNT(1) FROM transactions WHERE transaction_type = 'payment') AS payment_count,
        (SELECT COUNT(1) FROM transactions WHERE transaction_type = 'swap') AS swap_count,
        (SELECT COUNT(1) FROM transactions WHERE transaction_type = 'auction') AS auction_count,
        (SELECT COUNT(1) FROM transactions WHERE transaction_type = 'commission') AS commission_count,
        (SELECT SUM(amount) FROM transactions WHERE transaction_type = 'payment') AS total_payment_volume,
        (SELECT AVG(amount) FROM transactions WHERE transaction_type = 'payment') AS avg_payment,
        (SELECT SUM(amount) FROM transactions WHERE transaction_type = 'commission') AS total_commission_collected,
        (SELECT SUM(agon) FROM wallets) AS sum_agon,
        (SELECT SUM(stoneworks_dollar) FROM wallets) AS sum_sw
    `).get();

    // Coin Flip totals
    const coinflipTotalsRow = db.prepare(`
      SELECT 
        COUNT(1) AS total_games,
        SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN won = 0 THEN 1 ELSE 0 END) AS losses,
        COUNT(DISTINCT user_id) AS unique_players,
        SUM(bet_amount) AS total_bet,
        SUM(CASE WHEN won = 1 THEN bet_amount ELSE 0 END) AS total_bet_won
      FROM game_history
      WHERE game_type = 'coinflip'
    `).get();

    const coinflipTotals = coinflipTotalsRow ? {
      total_games: Number(coinflipTotalsRow.total_games || 0),
      wins: Number(coinflipTotalsRow.wins || 0),
      losses: Number(coinflipTotalsRow.losses || 0),
      unique_players: Number(coinflipTotalsRow.unique_players || 0),
      total_bet: Number(coinflipTotalsRow.total_bet || 0),
      total_bet_won: Number(coinflipTotalsRow.total_bet_won || 0),
      win_rate: coinflipTotalsRow.total_games ? Number(((coinflipTotalsRow.wins || 0) / coinflipTotalsRow.total_games * 100).toFixed(2)) : 0,
      house_profit: Number(((coinflipTotalsRow.total_bet || 0) - (coinflipTotalsRow.total_bet_won || 0)).toFixed(2))
    } : {
      total_games: 0, wins: 0, losses: 0, unique_players: 0, total_bet: 0, total_bet_won: 0, win_rate: 0, house_profit: 0
    };

    // Blackjack totals
    const blackjackTotalsRow = db.prepare(`
      SELECT 
        COUNT(1) AS total_games,
        SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN won = 0 THEN 1 ELSE 0 END) AS losses,
        COUNT(DISTINCT user_id) AS unique_players,
        SUM(bet_amount) AS total_bet,
        SUM(CASE WHEN won = 1 THEN bet_amount ELSE 0 END) AS total_bet_won,
        SUM(CASE WHEN result = 'blackjack' THEN 1 ELSE 0 END) AS blackjacks,
        SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END) AS pushes
      FROM game_history
      WHERE game_type = 'blackjack'
    `).get();

    const blackjackTotals = blackjackTotalsRow ? {
      total_games: Number(blackjackTotalsRow.total_games || 0),
      wins: Number(blackjackTotalsRow.wins || 0),
      losses: Number(blackjackTotalsRow.losses || 0),
      unique_players: Number(blackjackTotalsRow.unique_players || 0),
      total_bet: Number(blackjackTotalsRow.total_bet || 0),
      total_bet_won: Number(blackjackTotalsRow.total_bet_won || 0),
      blackjacks: Number(blackjackTotalsRow.blackjacks || 0),
      pushes: Number(blackjackTotalsRow.pushes || 0),
      win_rate: blackjackTotalsRow.total_games ? Number(((blackjackTotalsRow.wins || 0) / blackjackTotalsRow.total_games * 100).toFixed(2)) : 0,
      house_profit: Number(((blackjackTotalsRow.total_bet || 0) - (blackjackTotalsRow.total_bet_won || 0)).toFixed(2))
    } : {
      total_games: 0, wins: 0, losses: 0, unique_players: 0, total_bet: 0, total_bet_won: 0, blackjacks: 0, pushes: 0, win_rate: 0, house_profit: 0
    };

    // Coin flip games by day (last 14 days)
    const coinflipByDay = db.prepare(`
      SELECT DATE(created_at) AS day,
        COUNT(1) AS games,
        SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN won = 0 THEN 1 ELSE 0 END) AS losses,
        SUM(bet_amount) AS total_bet,
        SUM(CASE WHEN won = 1 THEN bet_amount ELSE 0 END) AS bet_won
      FROM game_history
      WHERE game_type = 'coinflip'
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 14
    `).all();

    // Blackjack games by day (last 14 days)
    const blackjackByDay = db.prepare(`
      SELECT DATE(created_at) AS day,
        COUNT(1) AS games,
        SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN won = 0 THEN 1 ELSE 0 END) AS losses,
        SUM(bet_amount) AS total_bet,
        SUM(CASE WHEN won = 1 THEN bet_amount ELSE 0 END) AS bet_won
      FROM game_history
      WHERE game_type = 'blackjack'
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 14
    `).all();

    // Top coin flip players
    const topCoinflipPlayers = db.prepare(`
      SELECT u.id, u.username,
        COUNT(gh.id) AS games_played,
        SUM(CASE WHEN gh.won = 1 THEN 1 ELSE 0 END) AS wins,
        SUM(gh.bet_amount) AS total_bet,
        SUM(CASE WHEN gh.won = 1 THEN gh.bet_amount ELSE -gh.bet_amount END) AS player_net
      FROM game_history gh
      JOIN users u ON u.id = gh.user_id
      WHERE gh.game_type = 'coinflip'
      GROUP BY u.id
      ORDER BY games_played DESC
      LIMIT 10
    `).all();

    // Top blackjack players
    const topBlackjackPlayers = db.prepare(`
      SELECT u.id, u.username,
        COUNT(gh.id) AS games_played,
        SUM(CASE WHEN gh.won = 1 THEN 1 ELSE 0 END) AS wins,
        SUM(gh.bet_amount) AS total_bet,
        SUM(CASE WHEN gh.won = 1 THEN gh.bet_amount ELSE -gh.bet_amount END) AS player_net
      FROM game_history gh
      JOIN users u ON u.id = gh.user_id
      WHERE gh.game_type = 'blackjack'
      GROUP BY u.id
      ORDER BY games_played DESC
      LIMIT 10
    `).all();

    const activity24h = db.prepare(`
      SELECT action, COUNT(1) as count
      FROM activity_logs
      WHERE created_at >= datetime('now', '-1 day')
      GROUP BY action
      ORDER BY count DESC
    `).all();

    const volumeByDay = db.prepare(`
      SELECT DATE(created_at) as day,
        SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as payment_volume,
        SUM(CASE WHEN transaction_type = 'swap' THEN amount ELSE 0 END) as swap_volume,
        COUNT(CASE WHEN transaction_type = 'payment' THEN 1 END) as payment_count,
        COUNT(CASE WHEN transaction_type = 'swap' THEN 1 END) as swap_count
      FROM transactions
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 14
    `).all();

    const userGrowth = db.prepare(`
      SELECT DATE(created_at) as day, COUNT(1) as new_users
      FROM users
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 14
    `).all();

    const topUsers = db.prepare(`
      SELECT u.id, u.username,
        (SELECT COUNT(1) FROM transactions t WHERE t.from_user_id = u.id) as sent_count,
        (SELECT COUNT(1) FROM transactions t WHERE t.to_user_id = u.id) as received_count,
        (SELECT SUM(amount) FROM transactions t WHERE t.from_user_id = u.id AND t.transaction_type = 'payment') as total_sent,
        w.agon, w.stoneworks_dollar
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.disabled = 0
      ORDER BY (sent_count + received_count) DESC
      LIMIT 10
    `).all();

    const recentTransactions = db.prepare(`
      SELECT t.*, 
        uf.username as from_username, 
        ut.username as to_username
      FROM transactions t
      LEFT JOIN users uf ON uf.id = t.from_user_id
      LEFT JOIN users ut ON ut.id = t.to_user_id
      ORDER BY t.created_at DESC
      LIMIT 20
    `).all();

    // Auction metrics
    const auctionTotals = db.prepare(`
      SELECT 
        (SELECT COUNT(1) FROM auctions) AS total_auctions,
        (SELECT COUNT(1) FROM auctions WHERE status = 'active') AS active_auctions,
        (SELECT COUNT(1) FROM auctions WHERE status = 'ended') AS ended_auctions,
        (SELECT COUNT(1) FROM auctions WHERE status = 'completed') AS completed_auctions,
        (SELECT COUNT(1) FROM bids) AS total_bids,
        (SELECT COUNT(DISTINCT bidder_id) FROM bids) AS unique_bidders,
        (SELECT AVG(current_bid) FROM auctions WHERE status IN ('completed', 'ended')) AS avg_final_bid,
        (SELECT SUM(current_bid) FROM auctions WHERE status = 'completed') AS total_auction_revenue,
        (SELECT AVG(bid_count) FROM (
          SELECT COUNT(1) as bid_count FROM bids GROUP BY auction_id
        )) AS avg_bids_per_auction
    `).get();

    const auctionsByDay = db.prepare(`
      SELECT DATE(created_at) as day,
        COUNT(1) as auctions_created,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'completed' THEN current_bid ELSE 0 END) as revenue
      FROM auctions
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 14
    `).all();

    const bidsByDay = db.prepare(`
      SELECT DATE(created_at) as day,
        COUNT(1) as bids_placed,
        COUNT(DISTINCT bidder_id) as unique_bidders
      FROM bids
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 14
    `).all();

    const topAuctions = db.prepare(`
      SELECT a.id, a.item_name, a.rarity, a.starting_price, a.current_bid, a.status,
        u.username as seller_username,
        (SELECT COUNT(1) FROM bids WHERE auction_id = a.id) as bid_count
      FROM auctions a
      LEFT JOIN users u ON u.id = a.seller_id
      ORDER BY a.current_bid DESC
      LIMIT 10
    `).all();

    const topBidders = db.prepare(`
      SELECT u.id, u.username,
        COUNT(DISTINCT b.auction_id) as auctions_participated,
        COUNT(b.id) as total_bids_placed,
        SUM(b.amount) as total_bid_amount,
        COUNT(CASE WHEN a.highest_bidder_id = u.id AND a.status = 'completed' THEN 1 END) as auctions_won
      FROM users u
      JOIN bids b ON b.bidder_id = u.id
      LEFT JOIN auctions a ON a.id = b.auction_id
      WHERE u.disabled = 0
      GROUP BY u.id
      ORDER BY auctions_won DESC, total_bids_placed DESC
      LIMIT 10
    `).all();

    const rarityDistribution = db.prepare(`
      SELECT rarity, COUNT(1) as count,
        AVG(current_bid) as avg_price,
        SUM(CASE WHEN status = 'completed' THEN current_bid ELSE 0 END) as total_revenue
      FROM auctions
      GROUP BY rarity
      ORDER BY count DESC
    `).all();

    res.json({ 
      totals, 
      activity24h, 
      volumeByDay, 
      userGrowth,
      topUsers,
      recentTransactions,
      auctionTotals,
      auctionsByDay,
      bidsByDay,
      topAuctions,
      topBidders,
      rarityDistribution,
      coinflipTotals,
      coinflipByDay,
      topCoinflipPlayers,
      blackjackTotals,
      blackjackByDay,
      topBlackjackPlayers
    });
  } catch (e) {
    console.error('Metrics error:', e);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Activity logs (paginated)
router.get('/activity', (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const rows = db.prepare(`
      SELECT a.*, u.username
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));
    res.json({ activity: rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get all invite codes
router.get('/invite-codes', (req, res) => {
  try {
    const codes = db.prepare(`
      SELECT ic.*, 
        creator.username as created_by_username,
        user.username as used_by_username
      FROM invite_codes ic
      LEFT JOIN users creator ON creator.id = ic.created_by
      LEFT JOIN users user ON user.id = ic.used_by
      ORDER BY ic.created_at DESC
    `).all();
    res.json({ codes });
  } catch (e) {
    console.error('Fetch invite codes error:', e);
    res.status(500).json({ error: 'Failed to fetch invite codes' });
  }
});

// Create new invite code
router.post('/invite-codes', (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Check if code already exists
    const existing = db.prepare('SELECT id FROM invite_codes WHERE code = ?').get(code);
    if (existing) {
      return res.status(400).json({ error: 'This invite code already exists' });
    }

    // Create invite code
    const result = db.prepare('INSERT INTO invite_codes (code, created_by) VALUES (?, ?)').run(code, req.user.id);
    
    // Log activity
    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'admin_create_invite_code', JSON.stringify({ code }));

    // Fetch the created code with details
    const newCode = db.prepare(`
      SELECT ic.*, 
        creator.username as created_by_username
      FROM invite_codes ic
      LEFT JOIN users creator ON creator.id = ic.created_by
      WHERE ic.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ code: newCode });
  } catch (e) {
    console.error('Create invite code error:', e);
    res.status(500).json({ error: 'Failed to create invite code' });
  }
});

// Generate random invite code
router.post('/invite-codes/generate', (req, res) => {
  try {
    // Generate a random 8-character alphanumeric code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar-looking chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists (unlikely but possible)
    const existing = db.prepare('SELECT id FROM invite_codes WHERE code = ?').get(code);
    if (existing) {
      // Recursive retry if collision (very rare)
      return router.post('/invite-codes/generate')(req, res);
    }

    // Create invite code
    const result = db.prepare('INSERT INTO invite_codes (code, created_by) VALUES (?, ?)').run(code, req.user.id);
    
    // Log activity
    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'admin_generate_invite_code', JSON.stringify({ code }));

    // Fetch the created code with details
    const newCode = db.prepare(`
      SELECT ic.*, 
        creator.username as created_by_username
      FROM invite_codes ic
      LEFT JOIN users creator ON creator.id = ic.created_by
      WHERE ic.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ code: newCode });
  } catch (e) {
    console.error('Generate invite code error:', e);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

// Delete invite code (only if unused)
router.delete('/invite-codes/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const code = db.prepare('SELECT code, is_used FROM invite_codes WHERE id = ?').get(id);
    if (!code) {
      return res.status(404).json({ error: 'Invite code not found' });
    }

    if (code.is_used) {
      return res.status(400).json({ error: 'Cannot delete used invite codes' });
    }

    db.prepare('DELETE FROM invite_codes WHERE id = ?').run(id);
    
    // Log activity
    db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)')
      .run(req.user.id, 'admin_delete_invite_code', JSON.stringify({ code: code.code }));

    res.json({ message: 'Invite code deleted successfully' });
  } catch (e) {
    console.error('Delete invite code error:', e);
    res.status(500).json({ error: 'Failed to delete invite code' });
  }
});

export default router;



