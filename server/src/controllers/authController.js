import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'phantompay';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'phantompay-users';

function issueToken(userId, username, isAdmin, jti) {
  return jwt.sign(
    { id: userId, username, is_admin: !!isAdmin, jti },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
  );
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('pp_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30
  });
}

export const signup = async (req, res) => {
  try {
    const { username, password, inviteCode } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || username.length > 16) {
      return res.status(400).json({ error: 'Username must be between 3 and 16 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await db.queryOne('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Validate invite code if provided
    let invite = null;
    let hasBonus = false;
    
    if (inviteCode && inviteCode.trim()) {
      invite = await db.queryOne('SELECT id, is_used FROM invite_codes WHERE code = $1', [inviteCode.trim()]);
      if (!invite) {
        return res.status(400).json({ error: 'Invalid invite code' });
      }
      if (invite.is_used) {
        return res.status(400).json({ error: 'This invite code has already been used' });
      }
      hasBonus = true;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userRow = await db.queryOne(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    const userId = userRow.id;

    // Mark invite code as used if provided
    if (invite) {
      await db.exec('UPDATE invite_codes SET is_used = TRUE, used_by = $1, used_at = NOW() WHERE id = $2', [userId, invite.id]);
    }

    // Create wallet with initial balance only if invite code was provided
    const initialAgon = hasBonus ? 100.0 : 0.0;
    const initialStoneWorksDollar = hasBonus ? 100.0 : 0.0;
    await db.exec('INSERT INTO wallets (user_id, agon, stoneworks_dollar) VALUES ($1, $2, $3)', [userId, initialAgon, initialStoneWorksDollar]);

    // Create session and token
    const fresh = await db.queryOne('SELECT id, username, is_admin FROM users WHERE id = $1', [userId]);
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server auth not configured' });
    }
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.exec('INSERT INTO user_sessions (jti, user_id, created_at, expires_at, revoked) VALUES ($1, $2, NOW(), $3, FALSE)', [jti, fresh.id, expiresAt]);
    const token = issueToken(fresh.id, fresh.username, fresh.is_admin, jti);
    setAuthCookie(res, token);

    res.status(201).json({
      message: hasBonus ? 'User created successfully with signup bonus!' : 'User created successfully',
      token,
      user: {
        id: userId,
        username,
        is_admin: !!fresh.is_admin
      },
      hasBonus
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await db.queryOne('SELECT * FROM users WHERE username = $1', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server auth not configured' });
    }
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.exec('INSERT INTO user_sessions (jti, user_id, created_at, expires_at, revoked) VALUES ($1, $2, NOW(), $3, FALSE)', [jti, user.id, expiresAt]);
    const token = issueToken(user.id, user.username, user.is_admin, jti);
    setAuthCookie(res, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        is_admin: !!user.is_admin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await db.queryOne('SELECT id, username, created_at, is_admin FROM users WHERE id = $1', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const wallet = await db.queryOne('SELECT agon, stoneworks_dollar FROM wallets WHERE user_id = $1', [req.user.id]);

    res.json({
      user,
      wallet
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

