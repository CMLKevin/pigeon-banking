import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    // Refresh user flags from DB (disabled/admin) for every request
    const row = await db.queryOne(
      'SELECT id, username, is_admin, disabled FROM users WHERE id = $1',
      [user.id]
    );
    if (!row) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (row.disabled) {
      return res.status(403).json({ error: 'Account disabled. Contact admin.' });
    }
    req.user = { id: row.id, username: row.username, is_admin: !!row.is_admin };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

