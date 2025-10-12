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
      agon REAL DEFAULT 0.0,
      stoneworks_dollar REAL DEFAULT 0.0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migration: Rename phantom_coin to agon if it exists
  try {
    const tableInfo = db.pragma('table_info(wallets)');
    const hasPhantomCoin = tableInfo.some(col => col.name === 'phantom_coin');
    const hasAgon = tableInfo.some(col => col.name === 'agon');
    
    if (hasPhantomCoin && !hasAgon) {
      // Create temporary table with new schema
      db.exec(`
        CREATE TABLE wallets_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          agon REAL DEFAULT 0.0,
          stoneworks_dollar REAL DEFAULT 0.0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      // Copy data from old table to new
      db.exec(`INSERT INTO wallets_new (id, user_id, agon, stoneworks_dollar)
               SELECT id, user_id, phantom_coin, stoneworks_dollar FROM wallets`);
      
      // Drop old table and rename new one
      db.exec(`DROP TABLE wallets`);
      db.exec(`ALTER TABLE wallets_new RENAME TO wallets`);
      
      console.log('Successfully migrated phantom_coin to agon');
    }
  } catch (e) {
    console.log('Migration check:', e.message);
  }

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

  // Invite codes table - one-time use codes for user registration
  db.exec(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      created_by INTEGER NOT NULL,
      used_by INTEGER,
      is_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Auctions table - for auction house listings
  db.exec(`
    CREATE TABLE IF NOT EXISTS auctions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      item_description TEXT,
      rarity TEXT NOT NULL,
      durability INTEGER,
      starting_price REAL NOT NULL,
      current_bid REAL,
      highest_bidder_id INTEGER,
      end_date DATETIME NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (highest_bidder_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Bids table - for tracking all bids on auctions
  db.exec(`
    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auction_id INTEGER NOT NULL,
      bidder_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
      FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Game history table - for tracking game results
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_type TEXT NOT NULL,
      bet_amount REAL NOT NULL,
      result TEXT NOT NULL,
      choice TEXT NOT NULL,
      won INTEGER NOT NULL,
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

    CREATE INDEX IF NOT EXISTS idx_invite_codes_code 
    ON invite_codes(code);

    CREATE INDEX IF NOT EXISTS idx_invite_codes_used 
    ON invite_codes(is_used);

    CREATE INDEX IF NOT EXISTS idx_auctions_seller 
    ON auctions(seller_id);

    CREATE INDEX IF NOT EXISTS idx_auctions_status 
    ON auctions(status);

    CREATE INDEX IF NOT EXISTS idx_auctions_end_date 
    ON auctions(end_date);

    CREATE INDEX IF NOT EXISTS idx_bids_auction 
    ON bids(auction_id);

    CREATE INDEX IF NOT EXISTS idx_bids_bidder 
    ON bids(bidder_id);

    CREATE INDEX IF NOT EXISTS idx_game_history_user 
    ON game_history(user_id);

    CREATE INDEX IF NOT EXISTS idx_game_history_created_at 
    ON game_history(created_at);
  `);

  // Best-effort migration for existing databases: add columns if missing
  // SQLite doesn't support IF NOT EXISTS for ADD COLUMN; attempt and ignore errors
  try { db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE wallets ADD COLUMN agon_escrow REAL DEFAULT 0.0"); } catch (e) {}

  console.log('Database initialized successfully');
};

initDatabase();

export default db;

