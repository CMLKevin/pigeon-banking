-- Rollback Migration: Remove user_sessions table
-- WARNING: This will delete all active user sessions and log everyone out
-- Only run this if you need to revert the session management changes

-- Drop indexes first
DROP INDEX IF EXISTS idx_user_sessions_active;
DROP INDEX IF EXISTS idx_user_sessions_revoked;
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_user_id;

-- Drop table
DROP TABLE IF EXISTS user_sessions;

-- Note: After running this rollback, you must also:
-- 1. Revert the auth middleware changes
-- 2. Revert the authController changes
-- 3. Update JWT_SECRET to remove the requirement
-- 4. Restart the server

