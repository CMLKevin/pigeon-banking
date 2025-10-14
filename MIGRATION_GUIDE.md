# Database Migration Guide

This guide explains how to apply database migrations for the PhantomPay/Agon platform.

## Overview

Migrations are located in `server/migrations/` and handle schema changes needed for new features or security updates.

## Current Migrations

### 001_add_user_sessions.sql
- **Purpose**: Adds `user_sessions` table for secure session management
- **Created**: 2024-10-14
- **Required for**: Security hardening to prevent cross-account login issues
- **Status**: **REQUIRED** - Must be run before deploying latest code

## How to Run Migrations

### Method 1: Using the Migration Runner (Recommended)

```bash
# From the server directory
cd server

# Run a specific migration
node migrations/run-migration.js 001_add_user_sessions.sql
```

The migration runner will:
- ✅ Validate database connection
- ✅ Run migration in a transaction (rolls back on error)
- ✅ Show table structure after completion
- ✅ Display created indexes

### Method 2: Manual SQL Execution

If you prefer to run migrations manually:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Copy and paste the SQL from the migration file
\i server/migrations/001_add_user_sessions.sql

# Verify the table was created
\d user_sessions
```

### Method 3: Replit Database Tool

If using Replit:
1. Open the Database tool from the sidebar
2. Click "Query" or "Console"
3. Copy the contents of `server/migrations/001_add_user_sessions.sql`
4. Paste and execute
5. Verify with `SELECT * FROM user_sessions LIMIT 1;`

## Environment Setup Required

After running the migration, you **must** set these environment variables:

### Required
- `JWT_SECRET` - Strong random string (32+ characters)
  - Example: `openssl rand -base64 32`
  
### Recommended
- `CORS_ORIGINS` - Comma-separated list of allowed origins
  - Example: `https://agonfinance.replit.app,https://yourdomain.com`
- `JWT_EXPIRES_IN` - Token expiration time (default: 30d)
  - Example: `7d`, `30d`, `365d`
- `JWT_ISSUER` - Token issuer identifier (default: phantompay)
- `JWT_AUDIENCE` - Token audience identifier (default: phantompay-users)

### Replit Secrets Setup

1. Click the 🔐 Secrets icon (padlock) in the left sidebar
2. Add these secrets:
   ```
   JWT_SECRET=<your-random-string>
   CORS_ORIGINS=https://agonfinance.replit.app
   NODE_ENV=production
   ```
3. Redeploy your application

## Migration Checklist

Before deploying the latest code:

- [ ] Run migration: `001_add_user_sessions.sql`
- [ ] Verify table exists: `SELECT * FROM user_sessions LIMIT 1;`
- [ ] Set `JWT_SECRET` environment variable
- [ ] Set `CORS_ORIGINS` environment variable
- [ ] Set `NODE_ENV=production` for production deployments
- [ ] Install new dependency: `cookie-parser` (already in package.json)
- [ ] Rebuild and restart server
- [ ] Test login/logout functionality
- [ ] Verify sessions are isolated between tabs/users

## Post-Migration Verification

After deploying, verify the migration worked:

```bash
# Check that sessions table exists and has correct structure
psql $DATABASE_URL -c "\d user_sessions"

# Check for active sessions
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_sessions WHERE revoked = FALSE;"

# View recent sessions
psql $DATABASE_URL -c "SELECT jti, user_id, created_at, expires_at, revoked FROM user_sessions ORDER BY created_at DESC LIMIT 5;"
```

## Maintenance

### Cleanup Old Sessions

Run periodically to remove expired sessions:

```bash
node migrations/run-migration.js cleanup-expired-sessions.sql
```

Or set up a cron job:
```sql
-- Auto-cleanup (run daily)
DELETE FROM user_sessions 
WHERE (expires_at IS NOT NULL AND expires_at < NOW())
   OR (revoked = TRUE AND created_at < NOW() - INTERVAL '30 days');
```

### Revoke All Sessions (Force Logout All Users)

```sql
UPDATE user_sessions SET revoked = TRUE WHERE revoked = FALSE;
```

### Revoke Specific User's Sessions

```sql
UPDATE user_sessions 
SET revoked = TRUE 
WHERE user_id = <user_id> AND revoked = FALSE;
```

## Rollback

⚠️ **WARNING**: Rolling back will log out all users and remove session tracking.

```bash
node migrations/run-migration.js rollback_001_add_user_sessions.sql
```

After rollback, you must also:
1. Revert code changes to auth middleware and controllers
2. Remove JWT_SECRET requirement
3. Restart the server

## Troubleshooting

### Migration fails with "table already exists"

The migration uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen. If it does:
```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_sessions';

-- If it exists, skip the migration
```

### "JWT_SECRET is required" error

Set the environment variable:
```bash
# For Replit: Use Secrets (🔐 icon)
# For local: Add to .env file
JWT_SECRET=your-secret-key-here
```

### Users can't login after migration

Check:
1. JWT_SECRET is set correctly
2. Database migration completed successfully
3. Server restarted after migration
4. No errors in server logs related to `user_sessions`

### CORS errors after deployment

Set CORS_ORIGINS:
```bash
CORS_ORIGINS=https://agonfinance.replit.app
```

Or allow all origins during testing (NOT RECOMMENDED for production):
```javascript
// Temporarily comment out CORS restriction in server.js
app.use(cors({ credentials: true, origin: true }));
```

## Support

If you encounter issues:
1. Check server logs for specific error messages
2. Verify all environment variables are set
3. Ensure database migration completed successfully
4. Try clearing browser cookies and localStorage
5. Test in an incognito window

## Migration History

| Migration | Date | Description | Status |
|-----------|------|-------------|--------|
| 001_add_user_sessions | 2024-10-14 | Add session tracking table | ✅ Required |

---

**Next Steps**: After running migrations, proceed with deployment following the [REPLIT_DEPLOYMENT_FIXES.md](../REPLIT_DEPLOYMENT_FIXES.md) guide.

