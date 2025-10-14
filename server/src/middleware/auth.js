import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'phantompay';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'phantompay-users';

// Minimal cookie parser to avoid extra deps
function getCookie(req, name) {
  const cookieHeader = req.headers['cookie'];
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(cookieHeader.split(';').map(c => {
    const idx = c.indexOf('=');
    const k = c.slice(0, idx).trim();
    const v = decodeURIComponent(c.slice(idx + 1));
    return [k, v];
  }));
  return cookies[name] || null;
}

export const authenticateToken = async (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server auth not configured' });
  }

  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = getCookie(req, 'pp_token');
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });

    // Validate active session (jti) to prevent token mixups and enable revocation
    const session = await db.queryOne(
      'SELECT user_id, revoked, expires_at FROM user_sessions WHERE jti = $1',
      [payload.jti]
    );
    if (!session || session.user_id !== payload.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    if (session.revoked) {
      return res.status(401).json({ error: 'Session revoked' });
    }
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Refresh user flags from DB (disabled/admin) for every request
    const row = await db.queryOne(
      'SELECT id, username, is_admin, disabled FROM users WHERE id = $1',
      [payload.id]
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

