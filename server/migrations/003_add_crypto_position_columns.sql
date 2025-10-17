-- Add columns to crypto_positions table for commission, maintenance fees, and analytics
-- These columns track the costs and current state of leveraged trading positions
-- Note: total_maintenance_fees and last_maintenance_fee_at may already exist from migration 002

ALTER TABLE crypto_positions 
ADD COLUMN IF NOT EXISTS commission_agon NUMERIC(18,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_maintenance_fees NUMERIC(18,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_maintenance_fee_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_price NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS pnl_percentage NUMERIC(8,4);

-- Add comment for documentation
COMMENT ON COLUMN crypto_positions.commission_agon IS 'Commission fee paid when opening the position';
COMMENT ON COLUMN crypto_positions.total_maintenance_fees IS 'Cumulative daily maintenance fees charged';
COMMENT ON COLUMN crypto_positions.last_maintenance_fee_at IS 'Timestamp of last maintenance fee charge';
COMMENT ON COLUMN crypto_positions.current_price IS 'Cached current price for quick PnL calculation';
COMMENT ON COLUMN crypto_positions.pnl_percentage IS 'Cached PnL percentage for quick display';
