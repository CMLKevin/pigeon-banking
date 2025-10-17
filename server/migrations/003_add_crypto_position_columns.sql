-- Add additional tracking columns to crypto_positions table
-- These columns support commission tracking, maintenance fees, and real-time PnL display

-- Add commission tracking
ALTER TABLE crypto_positions 
ADD COLUMN IF NOT EXISTS commission_agon NUMERIC(18,6) DEFAULT 0;

-- Add current price and PnL percentage for real-time tracking
ALTER TABLE crypto_positions 
ADD COLUMN IF NOT EXISTS current_price NUMERIC(18,8);

ALTER TABLE crypto_positions 
ADD COLUMN IF NOT EXISTS pnl_percentage NUMERIC(8,4);

-- Note: last_maintenance_fee_at and total_maintenance_fees were added in migration 002
-- This migration adds the remaining columns needed for the trading system
