# PhantomPay Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration

#### Server Environment Variables (server/.env)
- [x] `PORT=3001` - Server port (can be changed for deployment)
- [x] `NODE_ENV=production` - Set to production for live deployment
- [x] `JWT_SECRET=transrights` - **CONFIGURED** (⚠️ Change for production!)

#### Verify Configuration
```bash
# Check if .env exists
ls -la server/.env

# Verify environment variables (doesn't show values for security)
cd server && node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT); console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');"
```

---

### 2. Dependencies

#### Install All Dependencies
```bash
npm run install:all
```

This installs:
- Root dependencies (concurrently)
- Client dependencies (React, Vite, etc.)
- Server dependencies (Express, SQLite, etc.)

#### Verify Installation
```bash
# Check root
npm list --depth=0

# Check client
cd client && npm list --depth=0

# Check server
cd ../server && npm list --depth=0
```

---

### 3. Database Initialization

The SQLite database is automatically created on first run.

#### Manual Database Reset (if needed)
```bash
# Backup existing database
cp server/database.db server/database.db.backup

# Remove database (will be recreated on next run)
rm server/database.db

# Start server to recreate
cd server && npm start
```

---

### 4. Build Frontend

```bash
cd client
npm run build
```

This creates `client/dist/` with production-optimized files.

#### Verify Build
```bash
ls -la client/dist/
# Should see: index.html, assets/ folder
```

---

### 5. Test Locally

#### Start Development Servers
```bash
npm run dev
```

Access at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

#### Test Checklist
- [ ] Can access frontend
- [ ] Can create account
- [ ] Can login
- [ ] Can view wallet
- [ ] Can send payment
- [ ] Can swap currencies
- [ ] Games work (Coin Flip, Crash, Plinko, Blackjack)
- [ ] Auctions work
- [ ] Admin panel works

---

### 6. Production Build Test

#### Build and Start Production Mode
```bash
# Build frontend
cd client
npm run build

# Start backend in production
cd ../server
NODE_ENV=production npm start
```

#### Serve Frontend (using nginx, serve, or similar)
```bash
# Option 1: Using 'serve' package
npx serve client/dist -p 3000

# Option 2: The backend can serve static files (see server.js)
```

---

### 7. Security Checklist

- [ ] ✅ JWT_SECRET is set (currently: "transrights")
- [ ] ⚠️ Change JWT_SECRET for production deployment
- [ ] `.env` files are in `.gitignore`
- [ ] Database file is in `.gitignore`
- [ ] No sensitive data in version control
- [ ] CORS is configured appropriately
- [ ] Admin credentials are secured

#### Generate Secure JWT Secret (Optional)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to server/.env JWT_SECRET
```

---

### 8. Platform-Specific Setup

#### For Replit
1. Import repo to Replit
2. Add to Secrets:
   - `JWT_SECRET=transrights`
   - `PORT=3001`
   - `NODE_ENV=production`
3. Click "Run"
4. See `REPLIT_SETUP.md` for details

#### For VPS (DigitalOcean, Hetzner, etc.)
1. Use `deploy-vps.sh` script
2. Configure nginx reverse proxy
3. Set up PM2 for process management
4. See `DEPLOYMENT_GUIDE.md` for details

#### For Fly.io
1. Install Fly CLI
2. Run `fly launch`
3. Configure volumes for SQLite
4. See `DEPLOYMENT_GUIDE.md` for details

#### For Railway
1. Connect GitHub repo
2. Add environment variables in dashboard
3. Configure persistent volume
4. See `DEPLOYMENT_GUIDE.md` for details

---

### 9. Post-Deployment Verification

#### Health Check
```bash
curl https://your-domain.com/health
# Should return: {"status":"ok","message":"Agon server is running"}
```

#### Create Admin Account
1. Visit your deployed URL
2. Click "Sign Up"
3. Create account (first user is auto-admin)
4. Login and verify dashboard access

#### Test Core Features
- [ ] User registration works
- [ ] Login/logout works
- [ ] Wallet displays correctly
- [ ] Payments can be sent
- [ ] Currency swap works
- [ ] Games are playable
- [ ] Auctions function correctly
- [ ] Admin panel accessible

---

### 10. Monitoring & Maintenance

#### Check Logs
```bash
# VPS with PM2
pm2 logs phantompay-api

# Replit
# View in Console tab

# Docker
docker logs phantompay-server
```

#### Database Backup
```bash
# Create backup
cp server/database.db server/database.db.backup.$(date +%Y%m%d)

# Automated backup (add to cron)
0 2 * * * cp /path/to/server/database.db /path/to/backups/db.$(date +\%Y\%m\%d).backup
```

---

## 🚀 Quick Deploy Commands

### Local Development
```bash
npm run install:all
npm run dev
```

### Production (VPS)
```bash
npm run install:all
cd client && npm run build
cd ../server && NODE_ENV=production npm start
```

### Using Deployment Scripts
```bash
# VPS deployment
chmod +x deploy-vps.sh
./deploy-vps.sh

# Shared hosting (if applicable)
chmod +x deploy-shared-hosting.sh
./deploy-shared-hosting.sh
```

---

## 📋 Current Configuration Status

| Item | Status | Notes |
|------|--------|-------|
| **JWT_SECRET** | ✅ Set | Value: "transrights" |
| **Environment Files** | ✅ Created | server/.env, server/.env.example |
| **Dependencies** | ⚠️ Run install | `npm run install:all` |
| **Database** | ⚠️ Auto-created | Created on first run |
| **Frontend Build** | ⚠️ Run build | `cd client && npm run build` |
| **Git Ignored** | ✅ Configured | .env files properly ignored |

---

## 🎯 Ready to Deploy?

### Quick Start for Each Platform:

**Replit:** See `REPLIT_SETUP.md`  
**VPS:** See `DEPLOYMENT_GUIDE.md` → VPS section  
**Fly.io:** See `DEPLOYMENT_GUIDE.md` → Fly.io section  
**Railway:** See `DEPLOYMENT_GUIDE.md` → Railway section  

---

## 🆘 Troubleshooting

### "Cannot find module 'dotenv'"
```bash
cd server && npm install
```

### "JWT_SECRET is not defined"
```bash
# Check if .env exists
ls server/.env

# If not, create it:
cp server/.env.example server/.env
# Edit and set JWT_SECRET
```

### "Database locked"
```bash
# Stop all running instances
# Wait 10 seconds
# Restart server
```

### "Port already in use"
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env
```

---

**Last Updated:** Ready for deployment with JWT_SECRET configured

