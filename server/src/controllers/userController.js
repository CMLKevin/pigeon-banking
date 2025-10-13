import db from '../config/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await db.query(
      `SELECT id, username, created_at, is_admin, disabled
       FROM users
       WHERE id != $1
       ORDER BY username ASC`,
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
      `SELECT id, username, created_at
       FROM users
       WHERE username ILIKE $1 AND id != $2
       ORDER BY username ASC
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

