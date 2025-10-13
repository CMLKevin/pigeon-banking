#!/bin/bash
# PhantomPay VPS Deployment Script
# Compatible with Ubuntu 22.04+ and CentOS 8+/AlmaLinux/Rocky Linux
# Usage: curl -sL https://raw.githubusercontent.com/CMLKevin/phantom-pay/main/deploy-vps.sh | sudo bash

set -e

echo "🚀 PhantomPay VPS Deployment Script"
echo "===================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use: sudo bash deploy-vps.sh)"
  exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo "🖥️  Detected OS: $OS ($VERSION)"
else
    echo "❌ Cannot detect operating system"
    exit 1
fi
echo ""

# Install Node.js based on OS
echo "📦 Step 1: Installing Node.js 18..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    # Ubuntu/Debian
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ]; then
    # CentOS/RHEL/AlmaLinux/Rocky Linux
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
else
    echo "❌ Unsupported OS: $OS"
    echo "   This script supports Ubuntu, Debian, CentOS, AlmaLinux, Rocky Linux"
    exit 1
fi

echo "✅ Node.js $(node --version) installed"
echo ""

echo "📦 Step 2: Installing PM2 process manager..."
npm install -g pm2
echo "✅ PM2 installed"
echo ""

echo "📦 Step 3: Installing nginx..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update
    apt-get install -y nginx
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ]; then
    yum install -y nginx
    systemctl enable nginx
fi
echo "✅ Nginx installed"
echo ""

echo "📦 Step 4: Installing Git..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get install -y git
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ]; then
    yum install -y git
fi
echo "✅ Git installed"
echo ""

# Prompt for domain name
read -p "🌐 Enter your domain name (or press Enter to use IP address): " DOMAIN
if [ -z "$DOMAIN" ]; then
  DOMAIN=$(curl -s ifconfig.me)
  echo "Using IP address: $DOMAIN"
fi

# Prompt for GitHub repo
read -p "📂 Enter your GitHub repo URL (default: https://github.com/CMLKevin/phantom-pay.git): " REPO_URL
REPO_URL=${REPO_URL:-https://github.com/CMLKevin/phantom-pay.git}

# Clone repository
APP_DIR="/opt/phantompay"
echo ""
echo "📥 Step 5: Cloning repository..."
if [ -d "$APP_DIR" ]; then
  echo "⚠️  Directory $APP_DIR already exists. Removing..."
  rm -rf "$APP_DIR"
fi

git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"
echo "✅ Repository cloned"
echo ""

echo "📦 Step 6: Installing dependencies..."
npm run install:all
echo "✅ Dependencies installed"
echo ""

echo "🔐 Step 7: Creating environment file..."
JWT_SECRET=$(openssl rand -base64 32)
cat > "$APP_DIR/server/.env" << EOF
PORT=3001
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
EOF
echo "✅ Environment file created"
echo ""

echo "🏗️  Step 8: Building frontend..."
cd "$APP_DIR/client"
npm run build
echo "✅ Frontend built"
echo ""

echo "🚀 Step 9: Starting backend with PM2..."
cd "$APP_DIR/server"
pm2 delete phantompay-api 2>/dev/null || true
pm2 start src/server.js --name phantompay-api
pm2 save
pm2 startup systemd -u root --hp /root
echo "✅ Backend started"
echo ""

echo "🌐 Step 10: Configuring nginx..."
cat > /etc/nginx/sites-available/phantompay << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend - serve React build
    root $APP_DIR/client/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/phantompay /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
nginx -t
systemctl restart nginx
echo "✅ Nginx configured"
echo ""

echo "🔥 Step 11: Configuring firewall..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    # UFW for Ubuntu/Debian
    ufw --force enable
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ]; then
    # firewalld for CentOS/RHEL
    systemctl start firewalld
    systemctl enable firewalld
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi
echo "✅ Firewall configured"
echo ""

echo "📧 Step 12: Installing Certbot for SSL..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get install -y certbot python3-certbot-nginx
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ]; then
    yum install -y certbot python3-certbot-nginx
fi

# Ask if user wants to set up SSL now
echo ""
read -p "🔒 Do you want to set up SSL with Let's Encrypt now? (y/n): " SETUP_SSL
if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
  if [ "$DOMAIN" != "$(curl -s ifconfig.me)" ]; then
    read -p "📧 Enter your email for SSL certificate notifications: " EMAIL
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect
    echo "✅ SSL certificate installed"
  else
    echo "⚠️  SSL setup skipped (using IP address instead of domain)"
  fi
else
  echo "⏭️  SSL setup skipped. Run this later: certbot --nginx -d $DOMAIN"
fi
echo ""

echo "📊 Step 13: Setting up database backup cron job..."
# Create backup script
cat > /usr/local/bin/backup-phantompay-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/phantompay-backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
cp /opt/phantompay/server/database.db "$BACKUP_DIR/database_$DATE.db"
# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "database_*.db" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-phantompay-db.sh

# Add cron job (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-phantompay-db.sh") | crontab -
echo "✅ Daily database backup configured (2 AM)"
echo ""

echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📍 Your app is now running at:"
if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
  echo "   https://$DOMAIN"
else
  echo "   http://$DOMAIN"
fi
echo ""
echo "📊 Useful commands:"
echo "   pm2 status                    - Check app status"
echo "   pm2 logs phantompay-api       - View logs"
echo "   pm2 restart phantompay-api    - Restart app"
echo "   pm2 monit                     - Monitor resources"
echo "   nginx -t                      - Test nginx config"
echo "   systemctl status nginx        - Check nginx status"
echo ""
echo "📁 Application directory: $APP_DIR"
echo "📁 Nginx config: /etc/nginx/sites-available/phantompay"
echo "📁 Database: $APP_DIR/server/database.db"
echo "📁 Backups: /opt/phantompay-backups/"
echo ""
echo "🔒 Important: Save your JWT_SECRET:"
echo "   $JWT_SECRET"
echo ""
echo "📚 Next steps:"
echo "   1. Update your DNS to point to this server's IP: $(curl -s ifconfig.me)"
echo "   2. Create an admin account in the app"
echo "   3. Set up monitoring (optional)"
echo "   4. Configure automatic security updates"
echo ""
echo "✅ All done! Your PhantomPay instance is ready to use."

