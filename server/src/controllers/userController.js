import db from '../config/database.js';

export const getAllUsers = (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.created_at,
        u.is_admin,
        u.disabled
      FROM users u
      WHERE u.id != ?
      ORDER BY u.username ASC
    `).all(req.user.id);

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchUsers = (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.created_at
      FROM users u
      WHERE u.username LIKE ? AND u.id != ?
      ORDER BY u.username ASC
      LIMIT 20
    `).all(`%${query}%`, req.user.id);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

