# Running PhantomPay on Replit

## 🚀 Quick Start

### Step 1: Import to Replit

1. Go to [replit.com](https://replit.com) and sign in
2. Click **"Create Repl"**
3. Select **"Import from GitHub"**
4. Enter your repository URL or upload the PhantomPay folder
5. Replit will auto-detect Node.js

### Step 2: Configure Environment Variables

1. Click the **"Secrets"** tab (🔒 lock icon) in the left sidebar
2. Add these secrets:

```
JWT_SECRET=your-super-secret-key-here-change-this
PORT=3001
NODE_ENV=development
```

**Important:** Generate a secure JWT_SECRET. You can use this command in Replit Shell:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Run the Application

1. The `.replit` file is already configured
2. Click the **"Run"** button at the top
3. Wait for installation (first run takes 2-3 minutes)
4. You should see:
   ```
   Agon server is running on port 3001
   VITE v5.x.x ready in XXX ms
   ➜  Local: http://localhost:3000/
   ```

### Step 4: Access Your App

- Replit will show a webview on the right side
- Click **"Open in new tab"** for the full experience
- The URL will be something like: `https://phantompay.username.repl.co`

---

## 📁 Files Created/Modified for Replit

### `.replit` (Configuration)
Tells Replit how to run your app:
```
run = "npm run install:all && npm run dev"
```

### `replit.nix` (Dependencies)
Specifies system dependencies (Node.js 18, npm, nodemon)

### Updated Files:
1. **`client/src/services/api.js`** - Auto-detects Replit environment
2. **`client/vite.config.js`** - Allows external access (`host: '0.0.0.0'`)
3. **`server/src/server.js`** - Listens on all interfaces

---

## 🎮 How It Works on Replit

### Port Configuration
- **Frontend (Vite)**: Port 3000 (exposed to internet)
- **Backend (Express)**: Port 3001 (internal only)
- Vite proxies `/api` requests to backend automatically

### Development Mode
The app runs both servers simultaneously using `concurrently`:
```bash
npm run dev
# Runs: frontend (Vite) + backend (Express)
```

---

## ⚙️ Common Issues & Solutions

### Issue: "Cannot find module"
**Solution:** Delete `.replit` cache and click Run again
```bash
# In Replit Shell:
rm -rf node_modules client/node_modules server/node_modules
npm run install:all
```

### Issue: "Port 3000 already in use"
**Solution:** Stop and restart the Repl
- Click **Stop** button
- Wait 5 seconds
- Click **Run** again

### Issue: "Database locked" error
**Solution:** Replit is restarting. Wait 10 seconds and refresh.

### Issue: Frontend can't connect to backend
**Solution:** Check that both servers are running. Look for these messages in console:
```
✅ Agon server is running on port 3001
✅ VITE ready
```

### Issue: Changes not reflecting
**Solution:** Replit auto-reloads, but sometimes needs manual refresh:
- For frontend: Refresh browser (Ctrl/Cmd + R)
- For backend: Stop and Run again

---

## 🔧 Replit-Specific Tips

### 1. Viewing Logs
- The **Console** tab shows both frontend and backend logs
- Backend logs are prefixed with `[server]`
- Frontend logs are prefixed with `[client]`

### 2. Database Location
- SQLite database is at: `server/database.db`
- It persists between runs (Replit has persistent storage)
- To reset database: Delete `server/database.db` and restart

### 3. Keep It Awake (Paid Plan Only)
- Free tier: Sleeps after inactivity
- Hacker plan ($7/month): Can enable "Always On"
- To enable: Settings → Enable "Always On"

### 4. Multiple Ports
- Replit can handle both ports (3000, 3001)
- Only port 3000 is exposed to the internet
- Port 3001 is accessible internally via localhost

---

## 🎯 Testing Your Deployment

### 1. Health Check
Open in browser:
```
https://your-repl-url.repl.co/api/health
```
Should return:
```json
{"status":"ok","message":"Agon server is running"}
```

### 2. Create Test Account
1. Open your app
2. Click "Sign Up"
3. Create a test admin account (first user is auto-admin)
4. Login and explore features

### 3. Check Database
In Replit Shell:
```bash
cd server
sqlite3 database.db "SELECT * FROM users;"
```

---

## 🚨 Limitations on Replit

### Performance
- Slower than dedicated hosting
- May lag with 10+ concurrent users
- Not recommended for production with real money

### Free Tier Limits
- ⚠️ Sleeps after 1 hour of inactivity
- ⚠️ Game state (crash games) will reset on sleep
- ⚠️ Users will experience 10-30 second wake-up time

### When to Upgrade
- Upgrade to Hacker ($7/month) if:
  - You want "Always On" (no sleep)
  - You have regular users
  - You're using the game features

---

## 📝 Development Workflow on Replit

### Making Changes
1. Edit files directly in Replit editor
2. Frontend: Changes auto-reload via Vite HMR
3. Backend: nodemon auto-restarts server
4. Test in the webview

### Debugging
```bash
# View backend logs
# They appear in the Console automatically

# View database
cd server
sqlite3 database.db
.tables
.schema users
SELECT * FROM users;
.quit
```

### Resetting Everything
```bash
# Delete database
rm server/database.db

# Clear all node_modules
rm -rf node_modules client/node_modules server/node_modules

# Reinstall
npm run install:all

# Restart (click Stop, then Run)
```

---

## 🎓 Next Steps

### For Testing/Development
✅ You're all set! Replit is perfect for:
- Testing features
- Showing friends/demos
- Learning and experimentation

### For Production
⚠️ Consider migrating to:
- **Fly.io** ($0-5/month) - Better performance
- **Railway** ($5/month) - More reliable
- **DigitalOcean VPS** ($6/month) - Best performance

See `DEPLOYMENT_GUIDE.md` for production options.

---

## 🆘 Getting Help

### Replit Issues
- Check Replit status: [status.replit.com](https://status.replit.com)
- Replit docs: [docs.replit.com](https://docs.replit.com)

### PhantomPay Issues
- Check console logs in Replit
- Review `SETUP.md` for general setup
- Check `API.md` for API documentation

---

**Happy coding! 🎉**

