# Replit Deployment Migration Guide

## Problem
Replit's PostgreSQL deployment system detects schema differences between your code's schema definitions and the production database, triggering migration warnings that suggest dropping tables and columns that should exist.

## Why This Happens
- Your `database.js` uses `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
- Replit's migration system doesn't recognize these as "official" migrations
- Replit compares against its tracked schema state, not the actual database

## Solution
All schema changes have been formalized as numbered migration files (001, 002, 003, etc.) so Replit recognizes them as intentional.

## Migration Files

### 001_add_user_sessions.sql
- Creates `user_sessions` table
- Adds session management for authentication

### 002_add_maintenance_fee.sql
- Adds `last_maintenance_fee_at` and `total_maintenance_fees` to `crypto_positions`
- Tracks daily maintenance fees on leveraged positions

### 003_add_crypto_position_columns.sql
- Adds `commission_agon`, `current_price`, `pnl_percentage` to `crypto_positions`
- Ensures all analytics columns exist (idempotent with migration 002)
- Safe to run even if columns already exist

### 004_add_auction_disputes.sql
- Creates `auction_disputes` table
- Allows users to report auction issues
- Creates necessary indexes

## How to Deploy on Replit

### Option 1: Accept Migration (Recommended)
When Replit shows migration warnings, **review them carefully**. After adding these migration files:
1. The migrations should now show as CREATE/ADD instead of DROP
2. Review the migration preview
3. If it only shows CREATE TABLE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS, proceed
4. **DO NOT proceed if it shows DROP TABLE or DROP COLUMN**

### Option 2: Manual Migration Before Deploy
Run migrations manually before deploying:
```bash
cd server
node migrations/run-migration.js 003_add_crypto_position_columns.sql
node migrations/run-migration.js 004_add_auction_disputes.sql
```

Then deploy normally.

### Option 3: Force Deploy
If Replit still shows incorrect DROP commands:
1. Check if Replit has a "skip migration check" or "force deploy" option
2. Your schema is correct - Replit is confused
3. Use force deploy to bypass the migration system

## Important Notes
- ✅ All migrations use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` - they're safe to run multiple times
- ⚠️ **NEVER** accept a migration that drops `auction_disputes` table
- ⚠️ **NEVER** accept a migration that drops columns from `crypto_positions`
- 🔍 Always review migration previews before accepting

## Emergency Rollback
If Replit accidentally drops tables/columns:
1. Restore from database backup
2. Run all migration files in order
3. Verify data integrity
