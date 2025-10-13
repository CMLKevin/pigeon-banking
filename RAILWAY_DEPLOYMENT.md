# Railway Deployment Guide for PhantomPay

## 🚂 Quick Deploy to Railway

Railway is a modern platform with GitHub integration, making deployment easy.

---

## Prerequisites

- GitHub account with your PhantomPay repo
- Railway account (sign up at [railway.app](https://railway.app))

---

## 🚀 Deployment Steps

### Step 1: Connect GitHub Repository

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your **PhantomPay** repository

### Step 2: Configure Environment Variables

Railway will auto-detect the Dockerfile. Now add environment variables:

1. Click on your service
2. Go to **"Variables"** tab
3. Add these variables:

```env
JWT_SECRET=transrights
PORT=3001
NODE_ENV=production
```

Click **"Add Variable"** for each one.

### Step 3: Add Persistent Volume (CRITICAL!)

SQLite database needs persistent storage:

1. Go to **"Settings"** tab
2. Scroll to **"Volumes"**
3. Click **"+ New Volume"**
4. Configure:
   - **Mount Path**: `/data`
   - Click **"Add"**

This ensures your database persists across deployments.

### Step 4: Deploy

1. Railway will automatically build and deploy
2. Watch the build logs in the **"Deployments"** tab
3. Wait for deployment to complete (2-5 minutes)

### Step 5: Get Your URL

1. Go to **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Your app will be at: `https://your-app.up.railway.app`

---

## ✅ Post-Deployment

### Test Your Deployment

1. Visit your Railway URL
2. Click **"Sign Up"** and create an account
3. Login and verify:
   - ✅ Dashboard loads
   - ✅ Wallet displays
   - ✅ Can send payments
   - ✅ Games work
   - ✅ Auctions function

### Check Health

Visit: `https://your-app.up.railway.app/health`

Should return:
```json
{"status":"ok","message":"Agon server is running"}
```

---

## 🔧 Configuration Details

### Docker Build

Railway uses the `Dockerfile` in the root directory:
- Builds frontend with Vite
- Installs backend dependencies
- Runs Node.js server

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | `transrights` | Authentication token secret |
| `PORT` | `3001` | Server port (Railway auto-maps) |
| `NODE_ENV` | `production` | Runtime environment |

### Persistent Storage

The volume at `/data` stores:
- SQLite database (`database.db`)
- Persists across deployments and restarts

---

## 💰 Pricing

Railway pricing (as of 2024):
- **Free Trial**: $5 credit (good for testing)
- **Usage-Based**: ~$5-10/month for small apps
- **No credit card** required for trial

### Cost Breakdown
- Compute: Based on usage
- Storage: ~$0.25/GB/month
- Bandwidth: Usually negligible

**Estimated for PhantomPay**: $5-7/month with moderate usage

---

## 🐛 Troubleshooting

### Build Error: "vite: not found"

✅ **FIXED** in latest Dockerfile. The fix:
- Changed `npm ci --only=production` to `npm ci` for frontend build
- This installs vite (devDependency) needed for building

If you still see this:
1. Make sure you've pushed the latest Dockerfile
2. Trigger a new deployment in Railway

### "Database locked" Error

**Cause**: Volume not configured
**Solution**:
1. Add volume at `/data` mount path (see Step 3)
2. Redeploy

### "Cannot read properties of undefined"

**Cause**: Environment variables not set
**Solution**:
1. Verify all variables in Railway dashboard
2. Restart deployment

### Frontend Shows 404 Errors

**Cause**: Frontend not built or served correctly
**Solution**:
1. Check build logs for errors
2. Verify `client/dist` was created in build
3. Redeploy

### App Crashes on Startup

**Check logs**:
1. Go to **"Deployments"** tab
2. Click on latest deployment
3. View logs for errors

Common causes:
- Missing `JWT_SECRET` variable
- Volume not mounted
- Port configuration issue

---

## 📊 Monitoring & Logs

### View Logs

1. Go to your Railway project
2. Click on service
3. **"Deployments"** tab
4. Click on active deployment
5. See real-time logs

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Request metrics
- Deployment history

Access in **"Metrics"** tab.

---

## 🔄 Updates & Redeployment

### Automatic Deployments

Railway automatically deploys on git push:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main
```

Railway detects the push and redeploys automatically.

### Manual Redeploy

1. Go to **"Deployments"** tab
2. Click **"⋮"** menu on latest deployment
3. Select **"Redeploy"**

### Rollback

1. Go to **"Deployments"** tab
2. Find previous working deployment
3. Click **"⋮"** → **"Redeploy"**

---

## 🔐 Security

### Environment Variables

- Stored securely by Railway
- Not visible in logs
- Can be updated without redeployment

### HTTPS

- ✅ Automatic HTTPS on all Railway domains
- Free SSL certificates
- No configuration needed

### Database Backups

⚠️ Railway doesn't auto-backup volumes. For production:

**Option 1: Manual Backups**
```bash
# SSH into Railway (if available)
railway run bash
cp /data/database.db /data/database.db.backup
```

**Option 2: Scheduled Backups**
- Add backup script to codebase
- Run via cron or scheduled Railway task

**Option 3: Migrate to PostgreSQL**
- Railway offers managed PostgreSQL
- Better for production with auto-backups

---

## 🚀 Optimization Tips

### 1. Use Railway CLI

Install Railway CLI for easier management:

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run commands in Railway environment
railway run node check-deployment.js
```

### 2. Enable Auto-Scaling

Railway can auto-scale based on traffic:
1. Go to **"Settings"**
2. Configure **"Replicas"** (paid plans)

### 3. Monitor Costs

1. Go to **"Usage"** tab
2. View current spend
3. Set up alerts in **"Settings"**

---

## 🆚 Railway vs Other Platforms

| Feature | Railway | Fly.io | Replit | VPS |
|---------|---------|--------|--------|-----|
| **Setup Time** | 5 min | 10 min | 2 min | 30 min |
| **Cost** | $5-10 | $0-5 | $0-7 | $4-12 |
| **GitHub Integration** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Auto HTTPS** | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Manual |
| **Database Volumes** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Auto Redeploy** | ✅ Yes | ❌ Manual | ✅ Yes | ❌ Manual |
| **Best For** | GitHub workflows | Production apps | Quick demos | Full control |

---

## 📝 Checklist

Before deploying to Railway:

- [x] ✅ Dockerfile fixed (vite build issue resolved)
- [x] ✅ Environment variables ready (`JWT_SECRET`, `PORT`, `NODE_ENV`)
- [ ] GitHub repo pushed with latest changes
- [ ] Railway account created
- [ ] Repository connected to Railway
- [ ] Environment variables configured in Railway
- [ ] Volume added at `/data` mount path
- [ ] Deployment successful
- [ ] Domain generated
- [ ] App tested and working

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Push updates
git push origin main  # Auto-deploys

# View logs
railway logs

# Set environment variable
railway variables set JWT_SECRET=transrights

# Run command in Railway environment
railway run <command>
```

### Important URLs

- **Railway Dashboard**: https://railway.app/dashboard
- **Documentation**: https://docs.railway.app
- **CLI Docs**: https://docs.railway.app/develop/cli

---

## 📚 Additional Resources

- **Main Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Quick Start**: `QUICK_START_DEPLOYMENT.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Replit Guide**: `REPLIT_SETUP.md`

---

## ✨ Summary

Railway deployment is now configured and ready:

1. ✅ Dockerfile fixed for vite build
2. ✅ `railway.json` configuration added
3. ✅ Environment variables documented
4. ✅ Volume setup instructions included

**Your PhantomPay app should now deploy successfully to Railway!**

Push your changes and try deploying again. The vite error is fixed. 🚀

