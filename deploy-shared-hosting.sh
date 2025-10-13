#!/bin/bash
# PhantomPay Shared Hosting Deployment Script
# Works on HostGator, Bluehost, and similar shared hosting environments
# Compatible with Ubuntu, CentOS, AlmaLinux
# Usage: bash deploy-shared-hosting.sh

set -e

echo "🚀 PhantomPay Shared Hosting Deployment"
echo "========================================"
echo ""

# Get current directory
DEPLOY_DIR=$(pwd)
echo "📁 Deploying to: $DEPLOY_DIR"
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo "🖥️  Detected OS: $OS ($VERSION)"
else
    OS="unknown"
    echo "⚠️  Could not detect OS, proceeding anyway..."
fi
echo ""

# Check if Node.js is installed
echo "🔍 Checking for Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
else
    echo "❌ Node.js not found!"
    echo ""
    echo "📋 Please install Node.js first:"
    echo "   - HostGator: Use cPanel 'Setup Node.js App' or install via nvm"
    echo "   - Manual: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "             source ~/.bashrc"
    echo "             nvm install 18"
    exit 1
fi
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found! Please install Node.js properly."
    exit 1
fi

# Check if Git is installed
echo "🔍 Checking for Git..."
if ! command -v git &> /dev/null; then
    echo "❌ Git not found!"
    echo "   Please install Git or contact your hosting provider."
    exit 1
fi
echo "✅ Git found"
echo ""

# Check if directory is empty (except hidden files)
if [ "$(ls -A $DEPLOY_DIR 2>/dev/null | grep -v '^\.' | wc -l)" -gt 0 ]; then
    echo "⚠️  Warning: Current directory is not empty!"
    echo "   Files may be overwritten during deployment."
    read -p "   Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
    echo ""
fi

# Prompt for GitHub repo
read -p "📂 Enter your GitHub repo URL (default: https://github.com/CMLKevin/phantom-pay.git): " REPO_URL
REPO_URL=${REPO_URL:-https://github.com/CMLKevin/phantom-pay.git}
echo ""

# Clone repository into current directory
echo "📥 Cloning repository into current directory..."
if [ -d ".git" ]; then
    echo "⚠️  Git repository already exists, pulling latest changes..."
    git pull origin main
else
    # Clone to a temp directory then move contents
    TEMP_DIR=$(mktemp -d)
    git clone "$REPO_URL" "$TEMP_DIR"
    
    # Move contents to current directory
    shopt -s dotglob
    mv "$TEMP_DIR"/* "$DEPLOY_DIR/" 2>/dev/null || true
    rmdir "$TEMP_DIR"
fi
echo "✅ Repository cloned"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "   This may take a few minutes..."

# Install root dependencies
if [ -f "package.json" ]; then
    npm install
fi

# Install client dependencies
if [ -d "client" ] && [ -f "client/package.json" ]; then
    echo "   Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

# Install server dependencies
if [ -d "server" ] && [ -f "server/package.json" ]; then
    echo "   Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

echo "✅ Dependencies installed"
echo ""

# Create environment file
echo "🔐 Setting up environment variables..."
if [ ! -f "server/.env" ]; then
    # Generate secure JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    cat > server/.env << EOF
PORT=3001
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
EOF
    
    echo "✅ Environment file created"
    echo "🔒 Your JWT_SECRET: $JWT_SECRET"
    echo "   (Save this somewhere safe!)"
else
    echo "✅ Environment file already exists"
fi
echo ""

# Build frontend
echo "🏗️  Building frontend..."
if [ -d "client" ]; then
    cd client
    npm run build
    cd ..
    echo "✅ Frontend built"
else
    echo "⚠️  Client directory not found, skipping frontend build"
fi
echo ""

# Check for PM2
echo "🔍 Checking for PM2..."
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 found"
    USE_PM2=true
else
    echo "⚠️  PM2 not found"
    read -p "   Install PM2? (y/n): " INSTALL_PM2
    if [ "$INSTALL_PM2" = "y" ] || [ "$INSTALL_PM2" = "Y" ]; then
        npm install -g pm2
        USE_PM2=true
        echo "✅ PM2 installed"
    else
        USE_PM2=false
        echo "   Skipping PM2 installation"
    fi
fi
echo ""

# Start/Restart application with PM2
if [ "$USE_PM2" = true ]; then
    echo "🚀 Starting application with PM2..."
    cd server
    
    # Stop existing instance if running
    pm2 delete phantompay-api 2>/dev/null || true
    
    # Start application
    pm2 start src/server.js --name phantompay-api
    pm2 save
    
    echo "✅ Application started"
    echo ""
    echo "📊 PM2 Status:"
    pm2 status
    cd ..
else
    echo "⚠️  PM2 not available. You'll need to start the server manually:"
    echo "   cd server && node src/server.js"
fi
echo ""

# Setup instructions for HostGator
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📁 Application deployed to: $DEPLOY_DIR"
echo ""

if [ "$USE_PM2" = true ]; then
    echo "📊 Useful commands:"
    echo "   pm2 status                    - Check app status"
    echo "   pm2 logs phantompay-api       - View logs"
    echo "   pm2 restart phantompay-api    - Restart app"
    echo "   pm2 stop phantompay-api       - Stop app"
    echo "   pm2 monit                     - Monitor resources"
    echo ""
fi

echo "🌐 Setting up web access:"
echo ""
echo "For HostGator cPanel:"
echo "1. Go to cPanel → 'Setup Node.js App'"
echo "2. Click 'Create Application'"
echo "3. Set these values:"
echo "   - Node.js version: 18.x or higher"
echo "   - Application mode: Production"
echo "   - Application root: $(basename $DEPLOY_DIR)"
echo "   - Application URL: your-domain.com (or subdomain)"
echo "   - Application startup file: server/src/server.js"
echo "   - Environment variables:"
echo "     PORT=3001"
echo "     JWT_SECRET=(copy from above)"
echo "     NODE_ENV=production"
echo "4. Click 'Create'"
echo ""

echo "📁 File structure:"
echo "   $DEPLOY_DIR/client/dist/     - Frontend build (static files)"
echo "   $DEPLOY_DIR/server/           - Backend server"
echo "   $DEPLOY_DIR/server/database.db - SQLite database"
echo "   $DEPLOY_DIR/server/.env       - Environment variables"
echo ""

echo "🔧 Next steps:"
echo "1. Set up Node.js app in cPanel (see instructions above)"
echo "2. Point your domain/subdomain to the application"
echo "3. Visit your domain to access PhantomPay"
echo "4. Create an admin account"
echo ""

echo "📚 Need help?"
echo "   - HostGator Node.js docs: https://www.hostgator.com/help/article/how-to-install-nodejs-npm-and-pm2"
echo "   - Check server logs: pm2 logs phantompay-api"
echo "   - Database location: $DEPLOY_DIR/server/database.db"
echo ""

echo "✅ All done! Your PhantomPay instance is ready."
echo ""

# Display the backend URL
echo "🔗 Backend API will be available at:"
echo "   http://localhost:3001/health (for testing)"
echo ""

# Reminder about static files
echo "⚠️  Important: To serve the frontend, configure your web server to:"
echo "   - Serve static files from: $DEPLOY_DIR/client/dist/"
echo "   - Proxy /api/* requests to: http://localhost:3001/api/"
echo ""

echo "🎊 Happy deploying!"

