import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../../database.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
const initDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      disabled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Wallets table - each user has balances for both currencies
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      phantom_coin REAL DEFAULT 0.0,
      stoneworks_dollar REAL DEFAULT 0.0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Transactions table - for tracking all payments and swaps
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER,
      transaction_type TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Activity logs table - records key user actions for admin analytics
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_from_user 
    ON transactions(from_user_id);
    
    CREATE INDEX IF NOT EXISTS idx_transactions_to_user 
    ON transactions(to_user_id);
    
    CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
    ON transactions(created_at);

    CREATE INDEX IF NOT EXISTS idx_activity_user 
    ON activity_logs(user_id);

    CREATE INDEX IF NOT EXISTS idx_activity_action 
    ON activity_logs(action);

    CREATE INDEX IF NOT EXISTS idx_activity_created_at 
    ON activity_logs(created_at);
  `);

  // Best-effort migration for existing databases: add columns if missing
  // SQLite doesn't support IF NOT EXISTS for ADD COLUMN; attempt and ignore errors
  try { db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0"); } catch (e) {}

  console.log('Database initialized successfully');
};

initDatabase();

export default db;

