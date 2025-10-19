#!/usr/bin/env node
/**
 * Verify and fix database schema for trading
 */

import db from './src/config/database.js';

console.log('🔍 Verifying database schema for trading...\n');

async function verifySchema() {
  try {
    // Check if maintenance fee columns exist
    console.log('Checking crypto_positions table...');
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'crypto_positions'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Found columns:', columns.map(c => c.column_name).join(', '));
    
    const hasMaintenanceFeeAt = columns.some(c => c.column_name === 'last_maintenance_fee_at');
    const hasTotalMaintenanceFees = columns.some(c => c.column_name === 'total_maintenance_fees');
    
    if (!hasMaintenanceFeeAt || !hasTotalMaintenanceFees) {
      console.log('\n⚠️  Missing maintenance fee columns. Adding them...');
      
      if (!hasMaintenanceFeeAt) {
        await db.exec(`
          ALTER TABLE crypto_positions
          ADD COLUMN IF NOT EXISTS last_maintenance_fee_at TIMESTAMPTZ
        `);
        console.log('✅ Added last_maintenance_fee_at column');
      }
      
      if (!hasTotalMaintenanceFees) {
        await db.exec(`
          ALTER TABLE crypto_positions
          ADD COLUMN IF NOT EXISTS total_maintenance_fees NUMERIC(18,6) DEFAULT 0
        `);
        console.log('✅ Added total_maintenance_fees column');
      }
    } else {
      console.log('✅ All maintenance fee columns exist');
    }
    
    // Verify wallet columns
    console.log('\nChecking wallets table...');
    const walletColumns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wallets'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Found columns:', walletColumns.map(c => c.column_name).join(', '));
    
    const hasAgon = walletColumns.some(c => c.column_name === 'agon');
    const hasAgonEscrow = walletColumns.some(c => c.column_name === 'agon_escrow');
    
    if (!hasAgon || !hasAgonEscrow) {
      console.log('❌ Missing required wallet columns!');
      process.exit(1);
    }
    
    console.log('✅ All wallet columns exist');
    
    // Test a sample query
    console.log('\nTesting sample queries...');
    const samplePosition = await db.queryOne(`
      SELECT id, user_id, coin_id, status, margin_agon, last_maintenance_fee_at, total_maintenance_fees
      FROM crypto_positions
      LIMIT 1
    `);
    
    if (samplePosition) {
      console.log('✅ Sample position query successful');
      console.log('   Position ID:', samplePosition.id);
      console.log('   Maintenance fees:', samplePosition.total_maintenance_fees || 0);
    } else {
      console.log('ℹ️  No positions in database yet');
    }
    
    const sampleWallet = await db.queryOne(`
      SELECT user_id, agon, agon_escrow
      FROM wallets
      LIMIT 1
    `);
    
    if (sampleWallet) {
      console.log('✅ Sample wallet query successful');
      console.log('   Stoneworks Dollars balance:', sampleWallet.agon);
      console.log('   Stoneworks Dollars escrow:', sampleWallet.agon_escrow);
    } else {
      console.log('ℹ️  No wallets in database yet');
    }
    
    console.log('\n✅ Database schema verification complete!');
    console.log('All required columns for trading are present.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Schema verification failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifySchema();
