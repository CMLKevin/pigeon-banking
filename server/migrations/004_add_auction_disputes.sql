-- Add auction disputes table for handling auction issues and refunds
-- This table tracks user-reported issues with auctions

CREATE TABLE IF NOT EXISTS auction_disputes (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_auction_disputes_auction ON auction_disputes(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_disputes_reporter ON auction_disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_auction_disputes_status ON auction_disputes(status);
