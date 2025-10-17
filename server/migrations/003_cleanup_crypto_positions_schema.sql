-- Clean up crypto_positions table schema
-- This migration removes the old maintenance_fee_agon column that was renamed to total_maintenance_fees

-- Only drop the old column if it exists (it won't exist in new deployments)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crypto_positions' 
    AND column_name = 'maintenance_fee_agon'
  ) THEN
    ALTER TABLE crypto_positions DROP COLUMN maintenance_fee_agon;
    RAISE NOTICE 'Dropped old maintenance_fee_agon column';
  ELSE
    RAISE NOTICE 'Column maintenance_fee_agon does not exist, skipping';
  END IF;
END $$;
