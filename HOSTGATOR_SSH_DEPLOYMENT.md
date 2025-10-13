# HostGator Shared Hosting Deployment Guide

## ⚠️ CRITICAL: Port Limitations on HostGator

**IMPORTANT**: On HostGator shared hosting, **only ports 22 and 2222** (SSH) are publicly accessible. 

- ❌ **Custom ports like 3001 are BLOCKED** by the firewall
- ❌ You **CANNOT** run a Node.js app directly on a custom port
- ✅ You **MUST** use cPanel's "Setup Node.js App" feature
- ✅ The backend runs through **Apache Passenger**, not as a standalone server

## How It Works

### Architecture
1. **Frontend**: Static files deployed to `/home/username/public_html/`
2. **Backend**: Node.js app runs through cPanel's Node.js App manager (Apache Passenger)
3. **Access**: 
   - Frontend: `http://yourdomain.com`
   - Backend API: `http://yourdomain.com/api` (configured in cPanel)

### The Deployment Process

The `deploy-shared-hosting.sh` script:
1. ✅ Sets up Node.js via NVM
2. ✅ Clones PhantomPay repository
3. ✅ Builds frontend and deploys to `public_html/`
4. ✅ Prepares backend files
5. ✅ Creates environment configuration
6. ✅ Generates JWT secret
7. ✅ Creates reference documentation
8. ⚠️  **DOES NOT start the backend** - you must configure cPanel manually

## Usage

### Step 1: Run the Deployment Script

```bash
# SSH into your HostGator account
ssh username@yourdomain.com

# Download and run the script
wget https://raw.githubusercontent.com/YourRepo/PhantomPay/main/deploy-shared-hosting.sh
bash deploy-shared-hosting.sh
```

Or if you already have the files:
```bash
cd /path/to/PhantomPay
bash deploy-shared-hosting.sh
```

### Step 2: Follow the Interactive Prompts

The script will ask you:
1. **Deployment location** - Where to deploy files (default: `~/phantompay`)
2. **Frontend deployment** - Deploy to `public_html`? (recommended: yes)
3. **Frontend location** - Root domain or subdirectory? (default: root)
4. **Backend API path** - URL path for API (default: `/api`)

### Step 3: Configure Backend in cPanel

After the script completes, you **MUST** configure the backend in cPanel:

1. **Login to cPanel**
   - URL: `https://yourdomain.com:2083`
   - Or through your HostGator client area

2. **Find "Setup Node.js App"**
   - Look under "Software" section
   - Click to open

3. **Click "CREATE APPLICATION"**

4. **Configure the Application:**
   ```
   Node.js version:        18.x or higher
   Application mode:       Production
   Application root:       phantompay/server
   Application URL:        /api
   Application startup file: src/server.js
   ```

5. **Add Environment Variables:**
   - Click "Add Variable"
   - Variable name: `JWT_SECRET`
   - Variable value: (copy from `~/phantompay/JWT_SECRET.txt`)
   - Add another variable:
     - Name: `NODE_ENV`
     - Value: `production`
   
   **⚠️ DO NOT set PORT** - cPanel/Passenger sets this automatically

6. **Create and Start:**
   - Click "CREATE"
   - Wait for cPanel to configure
   - Click "START APP"
   - Verify status shows "Running"

### Step 4: Test Your Deployment

1. **Test Frontend:**
   - Visit: `http://yourdomain.com`
   - Should see PhantomPay interface

2. **Test Backend:**
   - Visit: `http://yourdomain.com/api/health`
   - Should see: `{"status":"ok"}`

3. **Test Full Stack:**
   - Create an account
   - Login
   - Verify games work

## File Structure

```
/home/username/
├── phantompay/                          # Application directory
│   ├── client/
│   │   ├── dist/                       # Built frontend (copied to public_html)
│   │   ├── src/
│   │   └── package.json
│   ├── server/
│   │   ├── src/
│   │   │   └── server.js              # ← Startup file for cPanel
│   │   ├── database.db                 # SQLite database
│   │   ├── .env                        # Environment variables
│   │   └── package.json
│   ├── JWT_SECRET.txt                  # Your JWT secret (keep secure!)
│   ├── DEPLOYMENT_INFO.txt             # Deployment summary
│   └── CPANEL_QUICK_REFERENCE.txt      # Quick reference guide
│
├── public_html/                         # Web-accessible directory
│   ├── index.html                      # Frontend entry point
│   ├── .htaccess                       # Apache configuration
│   └── assets/                         # Static assets
│
└── .nvm/                               # Node Version Manager
    └── ...
```

## Managing Your Application

### Check Backend Status
1. Login to cPanel
2. Go to "Setup Node.js App"
3. View status (should show "Running")

### Restart Backend
1. cPanel → Setup Node.js App
2. Click "RESTART APP"

### View Logs
1. cPanel → Setup Node.js App
2. Click "Show log" link (Passenger logs)

Or via SSH:
```bash
# View recent logs
tail -f ~/phantompay/server/logs/passenger.log
```

### Update PhantomPay

```bash
# SSH into your server
ssh username@yourdomain.com

# Update the code
cd ~/phantompay
git pull origin main

# Update frontend
cd client
npm install
npm run build
cp -r dist/* ~/public_html/

# Update backend
cd ../server
npm install
```

Then in cPanel:
1. Go to Setup Node.js App
2. Click "RESTART APP"

### Backup Database

```bash
# Manual backup
cp ~/phantompay/server/database.db ~/backup-$(date +%Y%m%d).db

# Automatic daily backup (add to crontab)
crontab -e
# Add this line:
0 2 * * * cp ~/phantompay/server/database.db ~/backups/db-$(date +\%Y\%m\%d).db
```

## Troubleshooting

### Backend Won't Start in cPanel

**Symptoms**: Status shows "Stopped" or error message

**Solutions**:
1. Check "Application root" is correct: `phantompay/server`
2. Verify "Application startup file" is `src/server.js`
3. Click "Show log" to view Passenger errors
4. Ensure JWT_SECRET is added to environment variables
5. Try STOP then START

**Common Errors**:
- `Cannot find module`: Run `cd ~/phantompay/server && npm install`
- `JWT_SECRET is not defined`: Add to cPanel environment variables
- `Permission denied`: Check file permissions: `chmod 755 ~/phantompay/server`

### Frontend Shows 404 Errors

**Symptoms**: Blank page or "Not Found"

**Solutions**:
1. Verify files exist: `ls -la ~/public_html/`
2. Check .htaccess: `cat ~/public_html/.htaccess`
3. Clear browser cache (Ctrl+F5)
4. Check file permissions: `chmod 644 ~/public_html/index.html`

### API Requests Fail (CORS Errors)

**Symptoms**: "CORS policy" errors in browser console

**Solutions**:
1. Verify backend is "Running" in cPanel
2. Check "Application URL" matches `/api` (or your chosen path)
3. Test API directly: `curl http://yourdomain.com/api/health`
4. View Passenger logs for errors
5. Ensure JWT_SECRET is set in cPanel environment

### Database Locked Errors

**Symptoms**: "database is locked" errors

**Solutions**:
1. Stop app in cPanel
2. Wait 10 seconds
3. Start app in cPanel

If problem persists:
```bash
# Check database permissions
chmod 644 ~/phantompay/server/database.db
chmod 755 ~/phantompay/server/
```

### Application Shows "Application Error"

**Symptoms**: Generic error page

**Solutions**:
1. Check Passenger logs in cPanel (click "Show log")
2. Common causes:
   - Missing JWT_SECRET environment variable
   - Incorrect application root path
   - Node.js version too old (need 16+)
   - Missing dependencies: `cd ~/phantompay/server && npm install`
   - Database permission issues

## Important Notes

### Port Limitations
- ❌ Ports 80, 443, 3001, 8080, etc. are **NOT accessible** on shared hosting
- ✅ Only SSH ports (22, 2222) work
- ✅ Web traffic goes through Apache (port 80/443) → Passenger → Your app
- ✅ cPanel automatically assigns internal port for your app

### Process Management
- ❌ PM2 is **NOT needed** (cPanel manages processes)
- ✅ Auto-restart is built into cPanel/Passenger
- ✅ Memory limits are enforced by cPanel
- ✅ Logging is handled by Passenger

### Environment Variables
- ✅ Set in cPanel, not in `.env` file (though `.env` is a good backup)
- ⚠️ **Never** set PORT - cPanel sets this automatically
- ✅ Always set JWT_SECRET in cPanel
- ✅ Set NODE_ENV=production

## Reference Files

After deployment, you'll have these reference files:

### 1. DEPLOYMENT_INFO.txt
Quick summary with:
- File locations
- cPanel configuration details
- Access URLs
- Quick commands

View anytime:
```bash
cat ~/phantompay/DEPLOYMENT_INFO.txt
```

### 2. CPANEL_QUICK_REFERENCE.txt
Comprehensive guide with:
- cPanel backend management
- Update procedures
- Backup/restore commands
- Troubleshooting steps
- Common commands

View anytime:
```bash
cat ~/phantompay/CPANEL_QUICK_REFERENCE.txt
```

### 3. JWT_SECRET.txt
Your secret key for JWT tokens
- ⚠️ Keep this secure!
- Used in cPanel environment variables
- Needed for updates/redeployment

## Security Best Practices

1. **Protect JWT Secret**
   ```bash
   chmod 600 ~/phantompay/JWT_SECRET.txt
   ```

2. **Regular Backups**
   - Set up automated daily database backups
   - Keep at least 7 days of backups
   - Test restore procedure

3. **Monitor Logs**
   - Check Passenger logs regularly
   - Watch for suspicious activity
   - Set up log rotation

4. **Update Regularly**
   - Keep PhantomPay updated
   - Update Node.js version in cPanel when available
   - Update dependencies: `npm update`

5. **Change Default Credentials**
   - Change admin password immediately after deployment
   - Use strong, unique passwords

## FAQ

**Q: Can I use PM2 instead of cPanel?**
A: No. PM2 processes on custom ports are blocked. You must use cPanel's Node.js App feature.

**Q: Why can't I access port 3001?**
A: HostGator shared hosting only allows ports 22/2222. All web traffic goes through Apache on ports 80/443.

**Q: Can I use a different port like 8080?**
A: No. Only cPanel-managed applications work. The port is assigned internally by Passenger.

**Q: Do I need to configure Apache manually?**
A: No. cPanel's Node.js App setup automatically configures Apache Passenger for you.

**Q: Where are the application logs?**
A: In cPanel → Setup Node.js App → "Show log" link. Passenger manages all logging.

**Q: How do I restart the app?**
A: cPanel → Setup Node.js App → "RESTART APP" button. Never restart via SSH.

**Q: Can I run the backend somewhere else?**
A: Not on HostGator shared hosting. For custom setups, you need VPS or dedicated hosting.

## Support Resources

- **HostGator cPanel Guide**: https://www.hostgator.com/help/cpanel
- **Node.js App Setup**: https://www.hostgator.com/help/article/how-to-install-nodejs-npm-and-pm2
- **SSH Access**: https://www.hostgator.com/help/article/how-to-get-ssh-access
- **HostGator Support**: https://www.hostgator.com/contact

## Differences from VPS Deployment

| Feature | Shared Hosting | VPS |
|---------|---------------|-----|
| **Ports** | Only 22/2222 | All ports available |
| **Backend** | cPanel Node.js App | PM2 or systemd |
| **Process Manager** | Apache Passenger | PM2 |
| **Port Config** | Auto-assigned | Manual (3001, etc.) |
| **Restart** | cPanel button | `pm2 restart` |
| **Logs** | Passenger logs | PM2 logs |
| **Root Access** | No | Yes |
| **Custom Services** | No | Yes |

If you need custom port access or more control, consider upgrading to VPS hosting and using the `deploy-vps.sh` script instead.

## Credits

Optimized for HostGator shared hosting with cPanel.
Also works with Bluehost, SiteGround, and similar shared hosting providers.
