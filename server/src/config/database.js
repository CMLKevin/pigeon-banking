import { Pool } from 'pg';

// Replit provides DATABASE_URL automatically when PostgreSQL is provisioned
// Also supports individual credentials: PGHOST, PGUSER, PGPASSWORD, PGDATABASE
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required for PostgreSQL connection.');
  console.error('If using Replit, provision a PostgreSQL database from the Tools pane.');
}

// Pool configuration optimized for Replit's serverless PostgreSQL (Neon)
const pool = new Pool({
  connectionString,
  // SSL configuration - Replit/Neon requires SSL
  ssl: process.env.PGSSL?.toLowerCase() === 'false' ? false : { rejectUnauthorized: false },
  // Serverless-optimized settings
  max: 10, // Maximum number of clients in the pool
  min: 0, // Minimum idle clients (0 for serverless to reduce costs)
  // Keep-alive to prevent connection drops
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Event handlers for better error visibility in Replit
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
});

pool.on('connect', (client) => {
  console.log('New client connected to PostgreSQL');
});

pool.on('remove', (client) => {
  console.log('Client removed from pool');
});

// Wrapper functions with retry logic for serverless cold starts
const query = async (text, params = [], retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { rows } = await pool.query(text, params);
      return rows;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Query failed, retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

const queryOne = async (text, params = [], retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { rows } = await pool.query(text, params);
      return rows[0] || null;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`QueryOne failed, retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

const exec = async (text, params = [], retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await pool.query(text, params);
      return { rowCount: res.rowCount, rows: res.rows };
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Exec failed, retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
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
  // Users (must be created first since other tables reference it)
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

  // Sessions
  await exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      jti TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      revoked BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  // Wallets
  await exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agon NUMERIC DEFAULT 0.0,
      stoneworks_dollar NUMERIC DEFAULT 0.0
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

  // Crypto Trading Tables
  await exec(`
    CREATE TABLE IF NOT EXISTS crypto_positions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      coin_id TEXT NOT NULL,
      position_type TEXT NOT NULL,
      leverage NUMERIC(4,2) NOT NULL,
      quantity NUMERIC(18,8) NOT NULL,
      entry_price NUMERIC(18,8) NOT NULL,
      liquidation_price NUMERIC(18,8),
      margin_agon NUMERIC(18,6) NOT NULL,
      unrealized_pnl NUMERIC(18,6) DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      opened_at TIMESTAMPTZ DEFAULT NOW(),
      closed_at TIMESTAMPTZ,
      closed_price NUMERIC(18,8),
      realized_pnl NUMERIC(18,6),
      commission_agon NUMERIC(18,6) DEFAULT 0,
      total_maintenance_fees NUMERIC(18,6) DEFAULT 0,
      last_maintenance_fee_at TIMESTAMPTZ,
      current_price NUMERIC(18,8),
      pnl_percentage NUMERIC(8,4)
    )
  `);

  // Add missing columns to crypto_positions if they don't exist (for existing databases)
  await exec(`
    ALTER TABLE crypto_positions 
    ADD COLUMN IF NOT EXISTS commission_agon NUMERIC(18,6) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_maintenance_fees NUMERIC(18,6) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_maintenance_fee_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS current_price NUMERIC(18,8),
    ADD COLUMN IF NOT EXISTS pnl_percentage NUMERIC(8,4)
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS crypto_price_history (
      id SERIAL PRIMARY KEY,
      coin_id TEXT NOT NULL,
      price NUMERIC(18,8) NOT NULL,
      volume_24h NUMERIC(18,2),
      market_cap NUMERIC(18,2),
      change_24h NUMERIC(8,4),
      recorded_at TIMESTAMPTZ DEFAULT NOW()
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
  await exec('CREATE INDEX IF NOT EXISTS idx_game_history_user ON game_history(user_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at)');
  await exec('CREATE INDEX IF NOT EXISTS idx_crypto_positions_user ON crypto_positions(user_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_crypto_positions_coin ON crypto_positions(coin_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_crypto_positions_status ON crypto_positions(status)');
  await exec('CREATE INDEX IF NOT EXISTS idx_crypto_price_history_coin ON crypto_price_history(coin_id)');
  await exec('CREATE INDEX IF NOT EXISTS idx_crypto_price_history_recorded_at ON crypto_price_history(recorded_at)');
};

// Test database connection
const testConnection = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ PostgreSQL database connected successfully');
    return true;
  } catch (err) {
    console.error('✗ Failed to connect to PostgreSQL database:', err.message);
    return false;
  }
};

// Graceful shutdown handler for Replit
const shutdown = async () => {
  console.log('Closing PostgreSQL connection pool...');
  await pool.end();
  console.log('PostgreSQL pool closed');
};

// Handle process termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('beforeExit', shutdown);

// Test connection before initializing schema
await testConnection();

// Initialize database schema
await initSchema();

const db = { query, queryOne, exec, tx, pool, shutdown };
export default db;

