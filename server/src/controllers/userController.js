import db from '../config/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await db.query(
      `SELECT u.id, u.username, u.created_at, u.is_admin, u.disabled,
              w.agon, w.stoneworks_dollar
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.id != $1
       ORDER BY u.username ASC`,
      [req.user.id]
    );

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query: q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = await db.query(
      `SELECT u.id, u.username, u.created_at,
              w.agon, w.stoneworks_dollar
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       WHERE u.username ILIKE $1 AND u.id != $2
       ORDER BY u.username ASC
       LIMIT 20`,
      [
        `%${q}%`,
        req.user.id
      ]
    );

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

