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
        w.phantom_coin, w.stoneworks_dollar,
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
        (SELECT SUM(amount) FROM transactions WHERE transaction_type = 'payment') AS total_payment_volume,
        (SELECT AVG(amount) FROM transactions WHERE transaction_type = 'payment') AS avg_payment,
        (SELECT SUM(phantom_coin) FROM wallets) AS sum_pc,
        (SELECT SUM(stoneworks_dollar) FROM wallets) AS sum_sw
    `).get();

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
        w.phantom_coin, w.stoneworks_dollar
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

    res.json({ 
      totals, 
      activity24h, 
      volumeByDay, 
      userGrowth,
      topUsers,
      recentTransactions
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

export default router;



