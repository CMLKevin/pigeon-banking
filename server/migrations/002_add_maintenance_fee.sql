-- Add columns to track daily maintenance fees on positions
ALTER TABLE crypto_positions
ADD COLUMN IF NOT EXISTS last_maintenance_fee_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_maintenance_fees NUMERIC(18,6) DEFAULT 0;


