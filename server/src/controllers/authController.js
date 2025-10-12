import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
const JWT_EXPIRES_IN = '7d';

export const signup = async (req, res) => {
  try {
    const { username, password, inviteCode } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    if (username.length < 3 || username.length > 16) {
      return res.status(400).json({ error: 'Username must be between 3 and 16 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Validate invite code
    const invite = db.prepare('SELECT id, is_used FROM invite_codes WHERE code = ?').get(inviteCode);
    if (!invite) {
      return res.status(400).json({ error: 'Invalid invite code' });
    }
    if (invite.is_used) {
      return res.status(400).json({ error: 'This invite code has already been used' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = insertUser.run(username, hashedPassword);
    const userId = result.lastInsertRowid;

    // Mark invite code as used
    db.prepare('UPDATE invite_codes SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId, invite.id);

    // Create wallet with initial balance (100 of each currency)
    const insertWallet = db.prepare(
      'INSERT INTO wallets (user_id, agon, stoneworks_dollar) VALUES (?, ?, ?)'
    );
    insertWallet.run(userId, 100.0, 100.0);

    // Generate token
    const fresh = db.prepare('SELECT id, username, is_admin FROM users WHERE id = ?').get(userId);
    const token = jwt.sign({ id: fresh.id, username: fresh.username, is_admin: !!fresh.is_admin }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
        username,
        is_admin: !!fresh.is_admin
      }
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
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username, is_admin: !!user.is_admin }, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    });

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

export const getProfile = (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, created_at, is_admin FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const wallet = db.prepare('SELECT agon, stoneworks_dollar FROM wallets WHERE user_id = ?').get(req.user.id);

    res.json({
      user,
      wallet
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

