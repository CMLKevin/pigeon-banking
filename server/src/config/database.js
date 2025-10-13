import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required for PostgreSQL connection.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL?.toLowerCase() === 'false' ? false : { rejectUnauthorized: false }
});

const query = async (text, params = []) => {
  const { rows } = await pool.query(text, params);
  return rows;
};

const queryOne = async (text, params = []) => {
  const { rows } = await pool.query(text, params);
  return rows[0] || null;
};

const exec = async (text, params = []) => {
  const res = await pool.query(text, params);
  return { rowCount: res.rowCount, rows: res.rows };
};

const tx = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const adapter = {
      query: async (text, params = []) => (await client.query(text, params)).rows,
      queryOne: async (text, params = []) => {
        const { rows } = await client.query(text, params);
        return rows[0] || null;
      },
      exec: async (text, params = []) => {
        const res = await client.query(text, params);
        return { rowCount: res.rowCount, rows: res.rows };
      }
    };
    const result = await fn(adapter);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const initSchema = async () => {
  // Users
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      disabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Wallets
  await exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agon NUMERIC DEFAULT 0.0,
      stoneworks_dollar NUMERIC DEFAULT 0.0,
      agon_escrow NUMERIC DEFAULT 0.0
    )
  `);

  // Transactions
  await exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      transaction_type TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Activity logs
  await exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Invite codes
  await exec(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      is_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      used_at TIMESTAMPTZ
    )
  `);

  // Auctions
  await exec(`
    CREATE TABLE IF NOT EXISTS auctions (
      id SERIAL PRIMARY KEY,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      item_description TEXT,
      rarity TEXT NOT NULL,
      durability INTEGER,
      starting_price NUMERIC NOT NULL,
      current_bid NUMERIC,
      highest_bidder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      end_date TIMESTAMPTZ NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `);

  // Bids
  await exec(`
    CREATE TABLE IF NOT EXISTS bids (
      id SERIAL PRIMARY KEY,
      auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
      bidder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Game history
  await exec(`
    CREATE TABLE IF NOT EXISTS game_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_type TEXT NOT NULL,
      bet_amount NUMERIC NOT NULL,
      result TEXT NOT NULL,
      choice JSONB NOT NULL DEFAULT '{}'::jsonb,
      won BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Indexes
  await exec('CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)');
  await exec('CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_activity_action ON activity_logs(action)');
  await exec('CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at)');
  await exec('CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code)');
  await exec('CREATE INDEX IF NOT EXISTS idx_invite_codes_used ON invite_codes(is_used)');
  await exec('CREATE INDEX IF NOT EXISTS idx_auctions_seller ON auctions(seller_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status)');
  await exec('CREATE INDEX IF NOT EXISTS idx_auctions_end_date ON auctions(end_date)');
  await exec('CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_game_history_user ON game_history(user_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at)');
};

await initSchema();

const db = { query, queryOne, exec, tx };
export default db;

