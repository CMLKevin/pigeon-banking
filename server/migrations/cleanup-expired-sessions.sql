-- Migration: Cleanup expired sessions
-- Description: Removes expired and revoked sessions to keep the table clean

-- Delete expired sessions (older than expires_at)
DELETE FROM user_sessions 
WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();

-- Delete revoked sessions older than 30 days (keep for audit trail)
DELETE FROM user_sessions 
WHERE revoked = TRUE 
  AND created_at < NOW() - INTERVAL '30 days';

-- Show statistics
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE revoked = FALSE) as active_sessions,
  COUNT(*) FILTER (WHERE revoked = TRUE) as revoked_sessions,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_sessions
FROM user_sessions;

