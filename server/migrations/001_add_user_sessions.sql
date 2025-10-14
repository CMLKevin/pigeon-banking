-- Migration: Add user_sessions table for secure session management
-- Created: 2024-10-14
-- Description: Adds session tracking table to prevent cross-account login issues and enable session revocation

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  jti TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for efficient session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON user_sessions(revoked);

-- Create compound index for active session queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, revoked, expires_at) 
  WHERE revoked = FALSE;

-- Add comment to table
COMMENT ON TABLE user_sessions IS 'Stores active user sessions with JWT identifiers (jti) for secure authentication';
COMMENT ON COLUMN user_sessions.jti IS 'JWT ID - unique identifier for each session token';
COMMENT ON COLUMN user_sessions.user_id IS 'References the user who owns this session';
COMMENT ON COLUMN user_sessions.created_at IS 'When the session was created';
COMMENT ON COLUMN user_sessions.expires_at IS 'When the session expires (NULL for no expiration)';
COMMENT ON COLUMN user_sessions.revoked IS 'Whether the session has been manually revoked';

