# PhantomPay/Agon Deployment Guide

## 🏗️ Architecture Analysis

### Current Stack
- **Frontend**: React 18 + Vite (static build)
- **Backend**: Node.js + Express REST API
- **Database**: SQLite (file-based)
- **Game State**: In-memory (`crashGameState` Map)
- **Authentication**: JWT with bcrypt
- **No WebSockets**: Polling-based REST API

### Critical Requirements
1. ✅ **Persistent file storage** - SQLite database must persist
2. ✅ **Single instance deployment** - In-memory crash game state requires single server
3. ✅ **Long-running process** - Express server needs to stay alive
4. ✅ **Environment variables** - JWT_SECRET, PORT, NODE_ENV
5. ✅ **Static file serving** - React build output

### ⚠️ Important Limitations
- **In-memory game state** means horizontal scaling is not possible without migrating to Redis/PostgreSQL
- **SQLite** is not ideal for high concurrency (100+ simultaneous users)
- **No connection pooling** for database

---

## 🎯 Platform Recommendations

### 🥇 **BEST: VPS (Virtual Private Server)**

**Recommended Providers:**
- **Hetzner** (~$4/month) - Best value, Europe-based
- **DigitalOcean Droplet** ($6/month) - Most popular, great docs
- **Linode** ($5/month) - Reliable, owned by Akamai
- **Vultr** ($6/month) - Good global locations

#### ✅ Pros
- Full control over environment
- Perfect for SQLite + in-memory state
- Best performance and reliability
- Can scale vertically (upgrade RAM/CPU)
- No cold starts
- Persistent storage built-in
- Can run both frontend and backend
- Cost-effective long-term

#### ❌ Cons
- Requires server management knowledge
- Need to configure nginx, PM2, SSL certificates
- Manual deployment setup
- Responsible for security updates

#### 💰 Cost
- **$4-12/month** depending on resources
- **Recommended**: 2GB RAM, 1 vCPU, 50GB SSD (~$6/month)

#### 🚀 Deployment Steps (DigitalOcean)
```bash
# 1. Create Ubuntu 22.04 droplet
# 2. SSH into server
ssh root@your_server_ip

# 3. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Install nginx (web server)
sudo apt install nginx

# 6. Clone your repo
git clone https://github.com/CMLKevin/phantom-pay.git
cd phantom-pay

# 7. Install dependencies
npm run install:all

# 8. Create .env file
cd server
cat > .env << EOF
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# 9. Build frontend
cd ../client
npm run build

# 10. Start backend with PM2
cd ../server
pm2 start src/server.js --name phantompay-api

# 11. Configure nginx to serve frontend and proxy API
sudo nano /etc/nginx/sites-available/phantompay

# 12. Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/phantompay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 13. Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# 14. Save PM2 config to restart on reboot
pm2 save
pm2 startup
```

#### 📝 Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend - serve React build
    root /root/phantom-pay/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

### 🥈 **GOOD: Fly.io**

#### ✅ Pros
- Excellent for SQLite apps
- Persistent volumes support
- Deploy from GitHub
- Global edge deployment
- Good performance
- Free tier (2 VMs)
- CLI-based deployment

#### ❌ Cons
- Learning curve for `fly.toml` config
- Free tier limited to 3GB storage
- Need to configure volume mounts

#### 💰 Cost
- **Free tier**: 3 shared VMs, 3GB storage
- **Paid**: ~$5-15/month for production

#### 🚀 Deployment Steps
```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Create app
fly launch

# 4. Create persistent volume for SQLite
fly volumes create phantompay_data --size 1

# 5. Deploy
fly deploy
```

#### 📝 fly.toml Configuration
```toml
app = "phantompay"
primary_region = "iad"

[build]
  [build.args]
    NODE_VERSION = "18"

[env]
  PORT = "3001"
  NODE_ENV = "production"

[mounts]
  source = "phantompay_data"
  destination = "/data"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

---

### 🥉 **AFFORDABLE: Render**

#### ✅ Pros
- Free tier available
- Persistent disks
- Auto-deploy from GitHub
- Easy setup
- Managed SSL
- Good for testing/staging

#### ❌ Cons
- **Free tier has cold starts** (service sleeps after 15 min inactivity)
- Limited resources on free tier
- Can be slow
- Database storage limits

#### 💰 Cost
- **Free tier**: 750 hours/month, 0.5GB RAM, persistent disk
- **Paid**: $7/month (no cold starts, more resources)

#### 🚀 Deployment Steps
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect GitHub repo
5. Configure:
   - **Build Command**: `npm run install:all && cd client && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**: Add `JWT_SECRET`
6. Add persistent disk at `/opt/render/project/src/server/database.db`
7. Deploy

---

### ⚠️ **NOT RECOMMENDED**

#### ❌ **Vercel / Netlify**
- **Problem**: Serverless functions (stateless)
- SQLite won't persist
- In-memory crash game state won't work
- Edge functions timeout after 10-30 seconds
- **Verdict**: ❌ Won't work without major architecture changes

#### ⚠️ **Heroku**
- **Problem**: Ephemeral filesystem
- SQLite database will be erased every 24 hours
- Need PostgreSQL add-on ($5-9/month)
- Expensive for what you get
- **Verdict**: ⚠️ Possible but requires migration from SQLite

#### ⚠️ **Replit**
- **Problem**: Slow performance, frequent cold starts
- Good for development, not production
- Limited resources
- Can be unreliable
- **Verdict**: ⚠️ Only for testing/demos

---

## 📊 Comparison Table

| Platform | Cost/Month | Persistent Storage | Cold Starts | Performance | Ease of Setup | Production-Ready |
|----------|------------|-------------------|-------------|-------------|---------------|------------------|
| **VPS (DigitalOcean)** | $6 | ✅ Yes | ❌ No | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Best |
| **Fly.io** | $0-15 | ✅ Yes (volumes) | ❌ No | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Good |
| **Render** | $0-7 | ✅ Yes (disks) | ⚠️ Yes (free) | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Paid only |
| **Railway** | $5-20 | ✅ Yes | ❌ No | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Good |
| **Heroku** | $7-16 | ⚠️ Needs addon | ❌ No | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ Need DB |
| **Vercel/Netlify** | $0-20 | ❌ No | ✅ Yes | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ Won't work |
| **Replit** | $0-7 | ✅ Yes | ⚠️ Yes | ⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ Dev only |

---

## 🎯 Final Recommendations

### For Your Use Case (PhantomPay):

1. **🏆 Best Choice: DigitalOcean Droplet ($6/month)**
   - Most control, best performance
   - Perfect for SQLite + in-memory state
   - One-time setup, then forget it
   - Use Ubuntu 22.04, nginx, PM2

2. **🥈 Runner-up: Fly.io (Free tier or $5/month)**
   - Easier deployment than VPS
   - Good performance
   - Persistent volumes for SQLite
   - Great for quick launch

3. **🥉 Budget Option: Render ($7/month paid tier)**
   - Easiest deployment (GitHub integration)
   - Good for MVP/testing
   - **Must use paid tier** to avoid cold starts
   - Persistent disk for SQLite

---

## 🔧 Architecture Improvements for Future Scaling

If you plan to scale beyond 1 server, consider:

### 1. **Migrate Crash Game State to Redis**
```javascript
// Instead of in-memory Map:
const crashGameState = {
  currentRound: null,
  bets: new Map()
};

// Use Redis:
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Store round data:
await redis.set('crash:round', JSON.stringify(roundData));
await redis.hset('crash:bets', userId, JSON.stringify(bet));
```

### 2. **Migrate SQLite to PostgreSQL**
```bash
# Benefits:
# - Better concurrency (100+ users)
# - Connection pooling
# - ACID compliance
# - Horizontal scaling
# - Managed services (Supabase, Railway, Render)

# Migration tools:
npm install pg
# Use tools like pgloader or prisma migrate
```

### 3. **Add WebSockets for Real-time Updates**
```javascript
// For crash game live multiplier updates
import { Server } from 'socket.io';

const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('join_crash', () => {
    // Broadcast multiplier updates
  });
});
```

---

## 🚀 Quick Start for Production

### Option 1: VPS (Recommended)
```bash
# 1. Get a DigitalOcean droplet ($6/month)
# 2. Run automated setup script
curl -sL https://gist.github.com/yourscript/setup.sh | bash

# 3. Configure domain DNS:
# - Add A record pointing to your server IP
# - Wait for DNS propagation (5-30 minutes)

# 4. Visit your domain and enjoy!
```

### Option 2: Fly.io (Fastest)
```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Deploy in 3 commands
fly launch
fly volumes create data --size 1
fly deploy

# 3. Done! Fly gives you a free .fly.dev domain
```

---

## 🛡️ Security Checklist

Before going to production:

- [ ] Change `JWT_SECRET` to strong random string (32+ characters)
- [ ] Enable HTTPS/SSL (Let's Encrypt is free)
- [ ] Set up firewall (UFW on Ubuntu: `ufw allow 80,443/tcp`)
- [ ] Create non-root user for app
- [ ] Set up automatic backups for SQLite database
- [ ] Add rate limiting to API endpoints
- [ ] Configure CORS properly
- [ ] Set up monitoring (UptimeRobot, Better Uptime)
- [ ] Enable automatic security updates
- [ ] Review admin credentials and change defaults

---

## 📚 Additional Resources

- [DigitalOcean Node.js Deployment Guide](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-22-04)
- [Fly.io SQLite Guide](https://fly.io/docs/reference/sqlite/)
- [PM2 Process Manager Docs](https://pm2.keymetrics.io/)
- [Let's Encrypt SSL Setup](https://letsencrypt.org/getting-started/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)

---

**Created**: October 13, 2025  
**Status**: ✅ Production-Ready Deployment Guide

