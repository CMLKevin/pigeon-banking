#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Usage:
 *   node migrations/run-migration.js <migration-file.sql>
 *   node migrations/run-migration.js 001_add_user_sessions.sql
 * 
 * This script runs SQL migration files against the PostgreSQL database.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get migration file from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: No migration file specified');
  console.error('Usage: node run-migration.js <migration-file.sql>');
  console.error('Example: node run-migration.js 001_add_user_sessions.sql');
  process.exit(1);
}

const migrationPath = path.join(__dirname, migrationFile);

// Validate database connection
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env file or environment');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL?.toLowerCase() === 'false' ? false : { rejectUnauthorized: false }
  });

  try {
    // Read migration file
    console.log(`📖 Reading migration file: ${migrationFile}`);
    const sql = readFileSync(migrationPath, 'utf8');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    try {
      // Start transaction
      console.log('📝 Starting migration transaction...');
      await client.query('BEGIN');
      
      // Run migration
      console.log('⚙️  Executing migration...');
      await client.query(sql);
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('✅ Migration completed successfully!');
      
      // Show table info
      const result = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_sessions'
        ORDER BY ordinal_position
      `);
      
      if (result.rows.length > 0) {
        console.log('\n📊 user_sessions table structure:');
        result.rows.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
      }
      
      // Show indexes
      const indexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'user_sessions'
      `);
      
      if (indexes.rows.length > 0) {
        console.log('\n🔍 Indexes created:');
        indexes.rows.forEach(row => {
          console.log(`  - ${row.indexname}`);
        });
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.code === 'ENOENT') {
      console.error(`\nMigration file not found: ${migrationPath}`);
      console.error('Available migrations:');
      const { readdirSync } = await import('fs');
      const files = readdirSync(__dirname).filter(f => f.endsWith('.sql'));
      files.forEach(f => console.error(`  - ${f}`));
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

