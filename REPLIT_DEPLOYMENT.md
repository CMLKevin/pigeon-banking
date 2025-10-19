# Pigeon Banking - Replit Deployment Guide

This guide will help you deploy Pigeon Banking on Replit with PostgreSQL database support.

## Prerequisites

- A Replit account
- Basic understanding of environment variables

## Step 1: Import Project to Replit

1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Select "Import from GitHub"
4. Enter your repository URL
5. Click "Import from GitHub"

## Step 2: Provision PostgreSQL Database

Replit uses **Neon** (serverless PostgreSQL) for database hosting. The database automatically scales down after 5 minutes of inactivity to save costs.

### Option A: Using the Replit UI (Recommended)

1. In your Repl workspace, look for the **Tools** pane on the left sidebar
2. Click on the **PostgreSQL** icon or search for "Database" in the tools search
3. Click "Create Database" or "Add PostgreSQL"
4. Replit will automatically:
   - Provision a Neon PostgreSQL database
   - Create the `DATABASE_URL` environment variable
   - Set up connection credentials (PGHOST, PGUSER, PGPASSWORD, PGDATABASE)

### Option B: Using Replit's Database Manager

1. Open the workspace search (Cmd/Ctrl + K)
2. Type "Database"
3. Select "Database" from the tools
4. Click "Create Database"

## Step 3: Verify Environment Variables

After provisioning the database, verify these environment variables are set in your Repl:

Go to **Tools** → **Secrets** (or the lock icon 🔒 in the left sidebar) and check for:

- `DATABASE_URL` - Complete PostgreSQL connection string (automatically created by Replit)
- `PGHOST` - Database hostname (automatically created by Replit)
- `PGUSER` - Database username (automatically created by Replit)
- `PGPASSWORD` - Database password (automatically created by Replit)

You may also want to add:
- `JWT_SECRET` - A random string for JWT token generation (you should create this)
- `PORT` - Server port (optional, defaults to 3000)

## Step 4: Database Features

### Automatic Schema Initialization

Pigeon Banking automatically creates all necessary tables and indexes when the application starts. No manual SQL setup required!

### Database Management Tools

Replit provides built-in tools to manage your PostgreSQL database:

#### 1. SQL Runner
- Execute SQL queries directly
- View query results in a table format
- Access via Tools → Database → SQL Runner

#### 2. Drizzle Studio (Visual Interface)
- Browse and modify data visually
- Manage schema and relationships
- Create, update, and delete records
- Access via Tools → Database → Drizzle Studio

### Serverless Architecture Benefits

Replit's PostgreSQL (powered by Neon) provides:

1. **Automatic Scaling**: Database scales down after 5 minutes of inactivity
2. **Instant Wake-up**: Reactivates instantly upon receiving a query
3. **Cost Efficient**: Only pay for active compute time
4. **SSL Security**: All connections are encrypted via SSL
5. **Automatic Backups**: Neon provides point-in-time recovery

## Step 5: Run the Application

### Development Mode (Testing in Repl)

1. Click the "Run" button at the top of your Repl
2. The application will:
   - Install all dependencies
   - Connect to PostgreSQL
   - Initialize the database schema
   - Start the backend server (port 3001)
   - Start the frontend development server (port 5000)

3. You should see output like:
   ```
   ✓ PostgreSQL database connected successfully
   New client connected to PostgreSQL
   Server running on port 3001
   Frontend dev server running on port 5000
   ```

### Production Deployment

When you deploy your Repl (click "Deploy" button):

1. The deployment process will:
   - Install all dependencies
   - Build the frontend for production (optimized)
   - Start the backend server with NODE_ENV=production
   - Serve the built frontend from the same server

2. Production configuration automatically:
   - Uses production build commands (not dev)
   - Serves static files efficiently
   - Handles client-side routing
   - Sets NODE_ENV=production for optimizations

## Step 6: Access Your Application

### Development Mode:
- Backend API: `https://your-repl-name.your-username.repl.co:3001`
- Frontend: `https://your-repl-name.your-username.repl.co:5000`

### Production Deployment:
- Application: `https://your-repl-name.your-username.repl.co`
  - Frontend and backend served from the same URL
  - API routes accessible at `/api/*`

## Database Connection Details

The application is optimized for Replit's serverless PostgreSQL with:

### Connection Pool Settings
- **Max connections**: 10
- **Min idle connections**: 0 (optimized for serverless)
- **Idle timeout**: 30 seconds
- **Connection timeout**: 10 seconds
- **Keep-alive**: Enabled to prevent connection drops

### Retry Logic
All database queries include automatic retry logic (up to 3 attempts) to handle:
- Serverless cold starts
- Temporary network issues
- Database wake-up delays

### SSL Configuration
SSL is enabled by default for secure connections to Neon PostgreSQL.

## Troubleshooting

### Database Connection Fails

**Problem**: `DATABASE_URL is required for PostgreSQL connection`

**Solution**: 
1. Ensure PostgreSQL is provisioned via Tools → Database
2. Check that `DATABASE_URL` exists in Secrets/Environment Variables
3. Restart the Repl

### Schema Initialization Errors

**Problem**: Tables fail to create

**Solution**:
1. Check the console logs for specific error messages
2. Use SQL Runner to manually check database state
3. Drop and recreate tables if needed using Drizzle Studio

### Connection Timeouts

**Problem**: Queries timeout after database idle period

**Solution**:
- This is expected behavior with serverless databases
- The application includes automatic retry logic
- The first query after idle may take 1-2 seconds (cold start)
- Subsequent queries will be instant

### Version Compatibility

**Problem**: `pg_dump` version mismatch errors

**Solution**:
- Replit's PostgreSQL runs on a specific version
- Use the built-in SQL Runner or Drizzle Studio instead of command-line tools
- For backups, use the application's built-in backup scripts:
  ```bash
  node server/scripts/backup-db.js
  ```

## Environment Variables Reference

| Variable | Required | Description | Set By |
|----------|----------|-------------|--------|
| DATABASE_URL | Yes | Complete PostgreSQL connection string | Replit (auto) |
| PGHOST | Yes | Database hostname | Replit (auto) |
| PGUSER | Yes | Database username | Replit (auto) |
| PGPASSWORD | Yes | Database password | Replit (auto) |
| PGDATABASE | No | Database name | Replit (auto) |
| JWT_SECRET | Yes | Secret for JWT tokens | You (manual) |
| PORT | No | Server port (default: 3000) | You (manual) |
| PGSSL | No | Enable/disable SSL (default: true) | You (manual) |

## Database Schema

The application automatically creates these tables:

1. **users** - User accounts and authentication
2. **wallets** - User balances (Agon, Game Chips)
3. **transactions** - Payment and transfer history
4. **activity_logs** - User activity tracking
5. **invite_codes** - Invite code management
6. **auctions** - Auction listings
7. **bids** - Auction bids
8. **game_history** - Gaming activity records

Plus optimized indexes for performance.

## Best Practices

1. **Monitor Database Usage**: Check the Database tab in Replit to monitor usage and costs
2. **Regular Backups**: Use the backup scripts to export data periodically
3. **Index Optimization**: The application includes pre-configured indexes for common queries
4. **Connection Pooling**: Don't modify pool settings unless you understand the implications
5. **Error Handling**: All database operations include retry logic for serverless reliability

## Support

For issues specific to:
- **Replit Platform**: Check [Replit Docs](https://docs.replit.com/cloud-services/storage-and-databases/sql-database)
- **Database Issues**: Use the built-in Database tools in Replit
- **Application Issues**: Check the application logs in the Console

## Additional Resources

- [Replit PostgreSQL Documentation](https://docs.replit.com/cloud-services/storage-and-databases/sql-database)
- [Neon (PostgreSQL Provider) Docs](https://neon.tech/docs)
- [PostgreSQL Node.js Client (pg)](https://node-postgres.com/)

---

**Note**: This application is fully compatible with Replit's PostgreSQL implementation (Neon). All configuration is optimized for serverless architecture with automatic scaling and cost efficiency.

