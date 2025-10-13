# 🚀 Quick Start: Deploy PhantomPay in 5 Minutes

## ✅ Pre-Configured for Deployment

This codebase is **ready to deploy** with minimal setup. JWT_SECRET and environment variables are already configured.

---

## 🎯 Choose Your Platform

### Option 1: Replit (Easiest - No Server Management)

**Time:** 2 minutes | **Cost:** Free (with sleep) or $7/month (always-on)

1. Go to [replit.com](https://replit.com)
2. Click **"Create Repl"** → **"Import from GitHub"**
3. Paste your repo URL
4. Click **"Secrets"** (🔒) and add:
   - `JWT_SECRET` = `transrights`
   - `PORT` = `3001`
5. Click **"Run"**
6. ✅ Done! App is live

📖 **Detailed Guide:** `REPLIT_SETUP.md`

---

### Option 2: Fly.io (Best Balance - Free Tier Available)

**Time:** 10 minutes | **Cost:** Free or $5/month

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login and launch:
   ```bash
   fly auth login
   fly launch
   ```

3. Configure:
   - Choose app name
   - Select region
   - Create persistent volume for SQLite
   - Set JWT_SECRET: `fly secrets set JWT_SECRET=transrights`

4. Deploy:
   ```bash
   fly deploy
   ```

📖 **Detailed Guide:** `DEPLOYMENT_GUIDE.md` → Fly.io section

---

### Option 3: VPS (Most Control - DigitalOcean, Hetzner, etc.)

**Time:** 15-30 minutes | **Cost:** $4-12/month

1. Create Ubuntu 22.04 VPS
2. SSH into server:
   ```bash
   ssh root@your_server_ip
   ```

3. Run automated deployment:
   ```bash
   git clone https://github.com/yourusername/phantompay.git
   cd phantompay
   chmod +x deploy-vps.sh
   ./deploy-vps.sh
   ```

4. The script automatically:
   - Installs Node.js, nginx, PM2
   - Sets up environment variables
   - Builds frontend
   - Starts backend with PM2
   - Configures nginx reverse proxy

📖 **Detailed Guide:** `DEPLOYMENT_GUIDE.md` → VPS section

---

### Option 4: Railway (Easy with GitHub Integration)

**Time:** 5 minutes | **Cost:** $5/month

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"** → **"Deploy from GitHub repo"**
3. Select your PhantomPay repository
4. Add environment variables:
   - `JWT_SECRET` = `transrights`
   - `PORT` = `3001`
   - `NODE_ENV` = `production`
5. Add persistent volume for SQLite database
6. Deploy!

📖 **Detailed Guide:** `DEPLOYMENT_GUIDE.md` → Railway section

---

## 🔧 Before Deploying: Quick Check

Run this command to verify everything is ready:

```bash
npm run check-deployment
```

Expected output:
```
✅ READY FOR DEPLOYMENT!
```

---

## ⚙️ Environment Variables (Already Configured!)

The codebase comes with `server/.env` pre-configured:

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=transrights
```

**For Replit/Railway/Fly.io:** Add these as environment variables in their dashboards.

**For VPS:** The `deploy-vps.sh` script creates this automatically.

---

## 📦 What's Included

Your deployment will have:
- ✅ User authentication (JWT)
- ✅ Multi-currency wallet (Agon, Stoneworks Dollar)
- ✅ Payment system
- ✅ Currency swap
- ✅ Games (Coin Flip, Crash, Plinko, Blackjack)
- ✅ Auction house
- ✅ Admin panel
- ✅ SQLite database (auto-created)

---

## 🎮 First Steps After Deployment

1. **Access Your App:**
   - Replit: Click "Open in new tab"
   - Fly.io: `https://your-app-name.fly.dev`
   - VPS: `http://your_server_ip`
   - Railway: Provided URL in dashboard

2. **Create Admin Account:**
   - Click "Sign Up"
   - Create first account (automatically gets admin privileges)

3. **Test Features:**
   - View wallet
   - Send a test payment to yourself
   - Try currency swap
   - Play a game
   - Access admin panel

---

## 🔐 Security Notes

- **JWT_SECRET:** Currently set to `transrights`
  - ✅ Fine for testing/personal use
  - ⚠️  For production with real users, consider changing to a random string:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```

- **HTTPS:** Most platforms (Fly.io, Railway, Replit) provide automatic HTTPS
- **VPS:** Use Let's Encrypt for free SSL (included in deploy-vps.sh)

---

## 📊 Platform Comparison

| Platform | Setup Time | Monthly Cost | Best For |
|----------|-----------|--------------|----------|
| **Replit** | 2 min | $0-7 | Testing, demos, learning |
| **Fly.io** | 10 min | $0-5 | Production, free tier |
| **Railway** | 5 min | $5+ | Easy GitHub deploys |
| **VPS** | 30 min | $4-12 | Full control, best performance |

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- **VPS/Replit:** Database auto-creates on first run, wait 10 seconds
- **Fly.io:** Ensure volume is attached
- **Railway:** Ensure persistent volume is configured

### "JWT must be provided"
- Check that JWT_SECRET is set in environment variables
- Verify .env file exists (for VPS)

### "Port already in use"
- Change PORT in environment variables
- Or kill process: `lsof -ti:3001 | xargs kill -9` (VPS only)

### App works but games don't load
- Clear browser cache
- Check browser console for errors
- Verify frontend build is up to date: `npm run build`

---

## 📚 Additional Resources

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Replit Setup:** `REPLIT_SETUP.md`
- **Deployment Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **API Documentation:** `API.md`
- **Architecture:** `ARCHITECTURE.md`

---

## 🎉 You're Ready!

Pick a platform above and follow the steps. The codebase is configured and ready to go.

**Need help?** Check the detailed guides or open an issue on GitHub.

**Happy deploying! 🚀**


