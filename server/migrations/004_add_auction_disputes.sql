-- Create auction_disputes table for tracking reported auction issues
-- This allows users to report problems with auctions (non-delivery, scams, etc.)

CREATE TABLE IF NOT EXISTS auction_disputes (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auction_disputes_auction ON auction_disputes(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_disputes_reporter ON auction_disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_auction_disputes_status ON auction_disputes(status);

-- Add comments for documentation
COMMENT ON TABLE auction_disputes IS 'Tracks user-reported issues with auctions';
COMMENT ON COLUMN auction_disputes.issue_type IS 'Type of issue: non_delivery, item_mismatch, scam, other';
COMMENT ON COLUMN auction_disputes.status IS 'Status: pending, investigating, resolved, rejected';
