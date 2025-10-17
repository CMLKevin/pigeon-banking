# Database Migrations

This directory contains SQL migration files for the PhantomPay database.

## Quick Start

```bash
# Run the required session management migration
cd server
node migrations/run-migration.js 001_add_user_sessions.sql
```

## Available Migrations

- **001_add_user_sessions.sql** - Adds user session tracking table (REQUIRED)
- **cleanup-expired-sessions.sql** - Removes old/expired sessions (maintenance)
- **rollback_001_add_user_sessions.sql** - Reverts session table changes

## Usage

### Run a migration
```bash
node migrations/run-migration.js <migration-file.sql>
```

### Run manually via psql
```bash
psql $DATABASE_URL < migrations/001_add_user_sessions.sql
```

### Via Replit Database Console
Copy SQL from migration file and paste into Replit's database query tool.

## Before You Begin

1. Ensure `DATABASE_URL` is set in environment
2. Backup your database (if in production)
3. Test migrations on a staging environment first

## After Migration

Don't forget to:
1. Set `JWT_SECRET` environment variable
2. Set `CORS_ORIGINS` environment variable
3. Restart the server
4. Clear browser cache/cookies

See [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md) for detailed instructions.

