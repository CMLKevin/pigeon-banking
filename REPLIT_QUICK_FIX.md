# Replit Quick Fix - Missing Dependencies

## 🚨 Error: Cannot find package 'node-fetch'

This error means the dependencies are not installed on Replit.

---

## ✅ Quick Fix (Run in Replit Shell)

### Option 1: Use the Helper Script
```bash
bash install-replit.sh
```

### Option 2: Manual Install
```bash
# Install all dependencies (root, server, client)
npm run install:all
```

### Option 3: Individual Install
```bash
# If install:all fails, install each separately
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

---

## 🔍 Why This Happened

When you pulled the latest code from GitHub, Replit didn't automatically install the new dependencies. The `node-fetch` package (and others) exist in `package.json` but aren't in `node_modules`.

---

## 📋 Complete Setup Checklist

### 1. Install Dependencies ✅
```bash
npm run install:all
```

Wait for it to complete (may take 2-3 minutes).

### 2. Configure Secrets ✅
Go to Replit → 🔒 **Secrets** and set:

**Required:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Random 32+ char string (generate: `openssl rand -base64 32`)

**Optional:**
- `NODE_ENV` - Set to `production` for deployments
- `PGCONNECT_TIMEOUT` - Set to `30` for database connection timeout

### 3. Verify Installation ✅
```bash
# Check if node-fetch is installed
ls server/node_modules | grep node-fetch
```

Should output: `node-fetch`

### 4. Start the Server ✅
Click the **"Run"** button in Replit, or in Shell:
```bash
npm run dev
```

You should see:
```
✓ PostgreSQL database connected successfully
Agon server is running on port 3001
```

---

## 🚀 Deployment Steps

After dependencies are installed:

### For Development Testing
1. Click **"Run"** button
2. Access via Webview or internal URL
3. Test functionality

### For Production Deployment
1. Click **"Deploy"** button
2. Wait for build to complete
3. Access via deployment URL (HTTPS)

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'XXX'"
**Solution:** Run `npm run install:all` again

### Error: "Permission denied: install-replit.sh"
**Solution:** Run `chmod +x install-replit.sh` first

### Error: "npm ERR! network timeout"
**Solution:** 
- Check Replit's internet connection
- Try again in a few minutes
- Or install packages individually: `cd server && npm install node-fetch`

### Error: "Database connection failed"
**Solution:**
- Verify `DATABASE_URL` is set in Secrets
- Check PostgreSQL is provisioned in Replit
- Format should be: `postgresql://user:pass@host:5432/dbname`

### Error: "Missing JWT_SECRET"
**Solution:**
- Generate: `openssl rand -base64 32`
- Add to Replit Secrets as `JWT_SECRET`

### Server starts but crashes immediately
**Solution:**
1. Check Replit Shell for full error message
2. Most common: missing environment variables
3. Run: `echo $DATABASE_URL` to verify secrets are loaded
4. May need to restart Replit after adding secrets

---

## 📦 Dependencies Overview

### Root Dependencies
- `concurrently` - Run multiple npm scripts simultaneously

### Server Dependencies (server/package.json)
- `bcryptjs` - Password hashing
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `express` - Web framework
- `express-validator` - Input validation
- `jsonwebtoken` - JWT authentication
- **`node-fetch`** - HTTP requests to Polymarket API ⚠️
- `pg` - PostgreSQL client
- `nodemon` - Auto-restart on file changes (dev)

### Client Dependencies (client/package.json)
- `react` - UI framework
- `react-router-dom` - Routing
- `axios` - HTTP client
- `vite` - Build tool
- `tailwindcss` - CSS framework

---

## 🔄 After Pulling Updates from GitHub

Whenever you pull new code from GitHub in Replit:

```bash
# 1. Pull latest code
git pull origin main

# 2. Reinstall dependencies (in case new ones were added)
npm run install:all

# 3. Restart server
# Click Stop button (if running), then Run button
```

---

## 💡 Prevention

To avoid this in the future, you can set up a Replit config to auto-install:

### Update .replit file
The `run` command already includes `npm run install:all`:
```toml
run = "npm run install:all && npm run dev"
```

This ensures dependencies are installed every time you click Run.

For deployment:
```toml
[deployment]
run = ["sh", "-c", "npm run install:all && npm run start:prod"]
```

This is already configured in your `.replit` file! ✅

---

## 📊 Expected Timeline

- Install dependencies: **2-3 minutes**
- First server startup: **10-15 seconds**
- Database initialization: **5 seconds**
- Sync jobs start: **5 seconds after database**
- Total: **~3-4 minutes** from install to running

---

## ✅ Success Indicators

### In Shell/Console:
```
✓ PostgreSQL database connected successfully
Agon server is running on port 3001
```

### In Browser:
- Login page loads
- Can create account
- Can login
- Dashboard shows wallet balance
- Games are accessible
- Admin panel loads (if admin user exists)

---

## 🆘 Still Not Working?

### 1. Clean Install
```bash
# Remove all node_modules
rm -rf node_modules server/node_modules client/node_modules

# Remove package-lock files
rm -f package-lock.json server/package-lock.json client/package-lock.json

# Reinstall everything
npm run install:all
```

### 2. Check Node Version
```bash
node --version
```

Should be: `v20.x.x` or higher

If not, update in `.replit`:
```toml
modules = ["nodejs-20", "postgresql-16"]
```

### 3. Verify File Integrity
```bash
# Check if polymarketService.js exists
ls -la server/src/services/polymarketService.js

# Check if it imports node-fetch
head -5 server/src/services/polymarketService.js
```

Should show:
```javascript
import fetch from 'node-fetch';
```

### 4. Manual Package Install
If `npm run install:all` keeps failing:
```bash
# Install server packages only
cd server
npm install bcryptjs cors dotenv express express-validator jsonwebtoken node-fetch pg
cd ..
```

---

## 📞 Support Resources

- **GitHub Issues**: Report bugs on the repository
- **Replit Docs**: [https://docs.replit.com](https://docs.replit.com)
- **Node.js ESM**: [https://nodejs.org/api/esm.html](https://nodejs.org/api/esm.html)

---

**Status**: 🔧 Dependencies need to be installed
**Action Required**: Run `npm run install:all` in Replit Shell
**Estimated Time**: 2-3 minutes

