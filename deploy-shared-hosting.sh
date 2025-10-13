#!/bin/bash
# PhantomPay Shared Hosting Deployment Script
# Optimized for HostGator SSH deployment
# Works on Bluehost and similar cPanel/shared hosting environments
# Compatible with Ubuntu, CentOS, AlmaLinux
# Usage: bash deploy-shared-hosting.sh

set -e

# Colors for output (if terminal supports it)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

echo "🚀 PhantomPay Shared Hosting Deployment (HostGator SSH)"
echo "========================================================"
echo ""
echo "⚠️  IMPORTANT: HostGator Shared Hosting Limitations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   - Only ports 22/2222 (SSH) are publicly accessible"
echo "   - Custom backend ports (3001, etc.) are BLOCKED"
echo "   - Backend MUST run through cPanel 'Setup Node.js App'"
echo "   - This script prepares files for cPanel configuration"
echo ""
echo "This script will:"
echo "  ✓ Install/verify Node.js and required dependencies"
echo "  ✓ Clone and set up PhantomPay application"
echo "  ✓ Build and deploy frontend to public_html"
echo "  ✓ Prepare backend for cPanel Node.js App setup"
echo "  ✓ Create environment configuration"
echo "  ✓ Provide step-by-step cPanel instructions"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Detect HostGator environment
HOME_DIR=$HOME
PUBLIC_HTML="$HOME_DIR/public_html"
echo "🏠 Home directory: $HOME_DIR"

# Get current directory
DEPLOY_DIR=$(pwd)
echo "📁 Current directory: $DEPLOY_DIR"
echo ""

# Ask where to deploy
echo "📍 Deployment Location:"
echo "   1) Current directory ($DEPLOY_DIR)"
echo "   2) Home directory ($HOME_DIR/phantompay)"
echo "   3) Custom location"
read -p "Select option (1-3) [default: 2]: " LOCATION_CHOICE
LOCATION_CHOICE=${LOCATION_CHOICE:-2}

case $LOCATION_CHOICE in
    1)
        DEPLOY_DIR=$(pwd)
        ;;
    2)
        DEPLOY_DIR="$HOME_DIR/phantompay"
        mkdir -p "$DEPLOY_DIR"
        ;;
    3)
        read -p "Enter custom path: " CUSTOM_PATH
        DEPLOY_DIR="$CUSTOM_PATH"
        mkdir -p "$DEPLOY_DIR"
        ;;
    *)
        echo "Invalid option, using default: $HOME_DIR/phantompay"
        DEPLOY_DIR="$HOME_DIR/phantompay"
        mkdir -p "$DEPLOY_DIR"
        ;;
esac

echo "✅ Deploying to: $DEPLOY_DIR"
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

# Try to load NVM if it exists (common on HostGator)
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    echo "   Loading NVM..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(node --version | cut -d'.' -f1 | sed 's/v//')
    echo "✅ Node.js $NODE_VERSION found"
    
    # Check Node version
    if [ "$NODE_MAJOR" -lt 16 ]; then
        echo "⚠️  Warning: Node.js version is below 16. PhantomPay requires Node 16+."
        read -p "   Continue anyway? (y/n): " CONTINUE_OLD_NODE
        if [ "$CONTINUE_OLD_NODE" != "y" ] && [ "$CONTINUE_OLD_NODE" != "Y" ]; then
            echo "   Please upgrade Node.js: nvm install 18 && nvm use 18"
            exit 1
        fi
    fi
else
    echo "❌ Node.js not found!"
    echo ""
    echo "📋 Installing Node.js via NVM:"
    
    # Check if NVM is installed
    if [ ! -d "$HOME/.nvm" ]; then
        echo "   Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    echo "   Installing Node.js 18..."
    nvm install 18
    nvm use 18
    nvm alias default 18
    
    echo "✅ Node.js installed"
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

# Navigate to deployment directory
cd "$DEPLOY_DIR"

# Check if directory has existing files
if [ -d "$DEPLOY_DIR/.git" ]; then
    echo "📦 Existing Git repository found"
    echo "   Pulling latest changes..."
    git pull origin main || {
        echo "⚠️  Git pull failed. Continuing with existing files..."
    }
else
    # Check if directory is not empty
    if [ "$(ls -A $DEPLOY_DIR 2>/dev/null | wc -l)" -gt 0 ]; then
        echo "⚠️  Warning: Directory is not empty!"
        echo "   Files may be overwritten during deployment."
        read -p "   Continue anyway? (y/n): " CONTINUE
        if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
            echo "Deployment cancelled."
            exit 0
        fi
    fi
    
    # Prompt for GitHub repo
    echo ""
    read -p "📂 Enter your GitHub repo URL (default: https://github.com/CMLKevin/phantom-pay.git): " REPO_URL
    REPO_URL=${REPO_URL:-https://github.com/CMLKevin/phantom-pay.git}
    echo ""

    # Clone repository
    echo "📥 Cloning repository..."
    TEMP_DIR=$(mktemp -d)
    git clone "$REPO_URL" "$TEMP_DIR"
    
    # Move contents to deployment directory
    shopt -s dotglob nullglob
    for item in "$TEMP_DIR"/*; do
        if [ -e "$item" ]; then
            mv "$item" "$DEPLOY_DIR/"
        fi
    done
    
    # Clean up
    rm -rf "$TEMP_DIR"
    echo "✅ Repository cloned to $DEPLOY_DIR"
fi
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
    
    echo ""
    echo "⚠️  NOTE: On HostGator, the PORT is automatically set by cPanel's Node.js App"
    echo "   The PORT environment variable will be managed by cPanel/Passenger"
    echo "   You'll configure the application path in cPanel (e.g., /app or /api)"
    echo ""
    
    cat > server/.env << EOF
# PORT will be automatically set by cPanel - do not change
# cPanel/Passenger will inject the PORT variable
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
EOF
    
    echo "✅ Environment file created"
    echo "🔒 Your JWT_SECRET: $JWT_SECRET"
    echo ""
    echo "   ⚠️  IMPORTANT: Save this JWT_SECRET!"
    echo "   You'll need to add it to cPanel's Node.js App environment variables"
    
    # Save JWT secret to a file for easy reference
    echo "$JWT_SECRET" > "$DEPLOY_DIR/JWT_SECRET.txt"
    chmod 600 "$DEPLOY_DIR/JWT_SECRET.txt"
    echo "   📄 JWT_SECRET saved to: $DEPLOY_DIR/JWT_SECRET.txt"
else
    echo "✅ Environment file already exists"
    JWT_SECRET=$(grep "^JWT_SECRET=" server/.env | cut -d'=' -f2 2>/dev/null)
    if [ -n "$JWT_SECRET" ]; then
        echo "🔒 Existing JWT_SECRET found"
        echo "$JWT_SECRET" > "$DEPLOY_DIR/JWT_SECRET.txt"
        chmod 600 "$DEPLOY_DIR/JWT_SECRET.txt"
    fi
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

# Setup public_html for web access
echo "🌐 Setting up web access..."
read -p "📁 Do you want to deploy frontend to public_html? (y/n) [default: y]: " DEPLOY_PUBLIC
DEPLOY_PUBLIC=${DEPLOY_PUBLIC:-y}

if [ "$DEPLOY_PUBLIC" = "y" ] || [ "$DEPLOY_PUBLIC" = "Y" ]; then
    if [ -d "$PUBLIC_HTML" ]; then
        echo ""
        echo "📍 Frontend Deployment Options:"
        echo "   1) Root domain (public_html/) - Access via: http://yourdomain.com"
        echo "   2) Subdirectory (public_html/app/) - Access via: http://yourdomain.com/app"
        read -p "Select option (1-2) [default: 1]: " FRONTEND_OPTION
        FRONTEND_OPTION=${FRONTEND_OPTION:-1}
        
        if [ "$FRONTEND_OPTION" = "2" ]; then
            read -p "   Enter subdirectory name (e.g., 'app', 'phantompay'): " SUBDOMAIN
            WEB_DIR="$PUBLIC_HTML/${SUBDOMAIN:-app}"
            mkdir -p "$WEB_DIR"
            APP_PATH="/${SUBDOMAIN:-app}"
        else
            WEB_DIR="$PUBLIC_HTML"
            APP_PATH=""
        fi
        
        echo "   Deploying frontend to: $WEB_DIR"
        
        # Backup existing files
        if [ -d "$WEB_DIR" ] && [ "$(ls -A $WEB_DIR 2>/dev/null | wc -l)" -gt 0 ]; then
            BACKUP_DIR="$HOME/public_html_backup_$(date +%Y%m%d_%H%M%S)"
            echo "   Creating backup at $BACKUP_DIR..."
            mkdir -p "$BACKUP_DIR"
            cp -r "$WEB_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
        fi
        
        # Copy built files
        echo "   Copying frontend files..."
        cp -r "$DEPLOY_DIR/client/dist/"* "$WEB_DIR/" 2>/dev/null || {
            echo "⚠️  Warning: Could not copy all files. Check permissions."
        }
        
        # Ask for backend application path in cPanel
        echo ""
        echo "📍 Backend API Configuration:"
        echo "   You'll set up the backend in cPanel as a Node.js App"
        read -p "   What URL path for backend API? (default: /api): " API_PATH
        API_PATH=${API_PATH:-/api}
        
        # Create .htaccess for SPA routing and API proxying to cPanel Node.js App
        cat > "$WEB_DIR/.htaccess" << EOFHTACCESS
# PhantomPay - HostGator Configuration
# Frontend: Static files served by Apache
# Backend: Node.js App via cPanel (will be configured separately)

# Enable rewrite engine
RewriteEngine On

# Don't rewrite API requests - they'll be handled by cPanel Node.js App
# You'll configure this path in cPanel: Setup Node.js App → Application URL
RewriteCond %{REQUEST_URI} ^$API_PATH/
RewriteRule ^.*$ - [L,PT]

# Handle React Router - serve index.html for all non-file, non-API requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^$API_PATH/
RewriteRule ^ index.html [L]

# Compression for better performance
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
EOFHTACCESS
        
        echo "✅ Frontend deployed to $WEB_DIR"
        echo "✅ .htaccess configured for SPA routing"
        echo ""
        if [ "$FRONTEND_OPTION" = "1" ]; then
            echo "🌐 Frontend URL: http://yourdomain.com"
        else
            echo "🌐 Frontend URL: http://yourdomain.com$APP_PATH"
        fi
        echo "🔌 Backend API: http://yourdomain.com$API_PATH (configure in cPanel)"
        
        # Save paths for later
        FRONTEND_URL="http://yourdomain.com$APP_PATH"
        BACKEND_URL="http://yourdomain.com$API_PATH"
    else
        echo "⚠️  public_html directory not found at $PUBLIC_HTML"
        echo "   You can manually copy $DEPLOY_DIR/client/dist/* to your web directory later"
        API_PATH="/api"
    fi
else
    echo "   Skipping public_html deployment"
    echo "   You can manually copy $DEPLOY_DIR/client/dist/* to your web directory later"
    API_PATH="/api"
fi
echo ""

# Skip PM2 - not needed for HostGator (cPanel manages the process)
echo "⚠️  Skipping PM2 installation"
echo "   On HostGator, cPanel's Node.js App manager handles process management"
echo "   (Auto-restart, logging, and monitoring are built into cPanel)"
echo ""

# Setup instructions for HostGator
echo "🎉 File Preparation Complete!"
echo "=============================="
echo ""
echo "📁 Files deployed to: $DEPLOY_DIR"
if [ -n "$WEB_DIR" ]; then
    echo "📁 Frontend deployed to: $WEB_DIR"
fi
echo ""

# Create logs directory
mkdir -p "$DEPLOY_DIR/server/logs"

echo "📋 Important File Locations:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Backend Source:   $DEPLOY_DIR/server/"
echo "   Startup File:     $DEPLOY_DIR/server/src/server.js"
echo "   Database:         $DEPLOY_DIR/server/database.db"
echo "   Environment:      $DEPLOY_DIR/server/.env"
echo "   JWT Secret:       $DEPLOY_DIR/JWT_SECRET.txt"
if [ -n "$WEB_DIR" ]; then
    echo "   Frontend:         $WEB_DIR"
fi
echo ""

echo "🔧 NEXT STEP: Configure Backend in cPanel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  CRITICAL: The backend MUST be set up via cPanel's 'Setup Node.js App'"
echo "   (Custom ports like 3001 are BLOCKED - only ports 22/2222 work)"
echo ""
echo "📝 Step-by-Step cPanel Setup Instructions:"
echo ""
echo "1️⃣  Login to cPanel (https://yourdomain.com:2083)"
echo ""
echo "2️⃣  Find 'Setup Node.js App' (under Software section)"
echo ""
echo "3️⃣  Click 'CREATE APPLICATION' and configure:"
echo ""
echo "    Node.js version:        18.x or higher"
echo "    Application mode:       Production"
echo "    Application root:       $(basename $DEPLOY_DIR)/server"
echo "    Application URL:        ${API_PATH:-/api}"
echo "    Application startup file: src/server.js"
echo "    Passenger log file:     (leave default)"
echo ""
echo "4️⃣  Add Environment Variables (click 'Add Variable'):"
echo ""
if [ -n "$JWT_SECRET" ]; then
    echo "    JWT_SECRET = $JWT_SECRET"
else
    echo "    JWT_SECRET = (see $DEPLOY_DIR/JWT_SECRET.txt)"
fi
echo "    NODE_ENV = production"
echo ""
echo "    ⚠️  DO NOT set PORT - cPanel sets this automatically!"
echo ""
echo "5️⃣  Click 'CREATE' and wait for cPanel to configure the app"
echo ""
echo "6️⃣  After creation, click 'START APP' or 'RESTART APP'"
echo ""
echo "7️⃣  Verify the app is running (Status should show 'Running')"
echo ""

echo "🌐 Access URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -n "$FRONTEND_URL" ]; then
    echo "   Frontend:  $FRONTEND_URL"
fi
if [ -n "$BACKEND_URL" ]; then
    echo "   Backend:   $BACKEND_URL"
fi
echo "   Health:    ${BACKEND_URL:-http://yourdomain.com/api}/health"
echo ""

echo "🔐 Security Checklist:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✓ JWT secret generated and saved"
echo "   ✓ Environment file created"
echo "   ⚠️  Important next steps:"
echo "      - Add JWT_SECRET to cPanel environment variables"
echo "      - Change admin password after first login"
echo "      - Set up regular database backups"
echo "      - Keep $DEPLOY_DIR/JWT_SECRET.txt secure"
echo ""

echo "🔍 Troubleshooting:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Backend not starting in cPanel:"
echo "   1. Check 'Application root' path is correct"
echo "   2. Verify 'Application startup file' is src/server.js"
echo "   3. Check Passenger log for errors (link in cPanel app)"
echo "   4. Ensure JWT_SECRET is added to environment variables"
echo "   5. Click 'STOP APP' then 'START APP'"
echo ""
echo "   Frontend shows 404 or errors:"
echo "   1. Verify files exist: ls -la $WEB_DIR/"
echo "   2. Check .htaccess: cat $WEB_DIR/.htaccess"
echo "   3. Clear browser cache (Ctrl+F5)"
echo "   4. Check browser console (F12 → Console)"
echo ""
echo "   API requests fail (CORS or 500 errors):"
echo "   1. Verify backend is 'Running' in cPanel"
echo "   2. Check Application URL matches ${API_PATH:-/api}"
echo "   3. View Passenger logs in cPanel"
echo "   4. Test API directly: curl ${BACKEND_URL:-http://yourdomain.com/api}/health"
echo ""
echo "   Database errors:"
echo "   1. Check permissions: chmod 644 $DEPLOY_DIR/server/database.db"
echo "   2. Directory perms: chmod 755 $DEPLOY_DIR/server/"
echo "   3. Restart app in cPanel"
echo ""

echo "🔄 Updating PhantomPay:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   1. SSH into your server"
echo "   2. Run update commands:"
echo ""
echo "      cd $DEPLOY_DIR"
echo "      git pull origin main"
echo "      cd client && npm install && npm run build && cd .."
echo "      cd server && npm install && cd .."
if [ -n "$WEB_DIR" ]; then
    echo "      cp -r client/dist/* $WEB_DIR/"
fi
echo ""
echo "   3. Go to cPanel → Setup Node.js App"
echo "   4. Click 'RESTART APP' for your PhantomPay application"
echo ""

echo "📚 Useful Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Backup database:"
echo "      cp $DEPLOY_DIR/server/database.db ~/backup-\$(date +%Y%m%d).db"
echo ""
echo "   View JWT secret:"
echo "      cat $DEPLOY_DIR/JWT_SECRET.txt"
echo ""
echo "   Check disk usage:"
echo "      du -sh $DEPLOY_DIR"
echo ""
if [ -n "$WEB_DIR" ]; then
    echo "   View frontend files:"
    echo "      ls -la $WEB_DIR/"
    echo ""
fi
echo "   Test backend API:"
echo "      curl ${BACKEND_URL:-http://yourdomain.com/api}/health"
echo ""

echo "📖 HostGator Resources:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Setup Node.js App:  https://www.hostgator.com/help/article/how-to-install-nodejs-npm-and-pm2"
echo "   SSH Access:         https://www.hostgator.com/help/article/how-to-get-ssh-access"
echo "   cPanel Guide:       https://www.hostgator.com/help/cpanel"
echo "   Support:            https://www.hostgator.com/contact"
echo ""

# Perform file verification
echo "🏥 Verifying File Deployment..."
echo ""

if [ -n "$WEB_DIR" ] && [ -f "$WEB_DIR/index.html" ]; then
    echo "✅ Frontend files deployed to $WEB_DIR"
else
    echo "⚠️  Frontend may not be deployed. Check $WEB_DIR/"
fi

if [ -f "$DEPLOY_DIR/server/src/server.js" ]; then
    echo "✅ Backend source files ready at $DEPLOY_DIR/server/"
else
    echo "⚠️  Backend files missing!"
fi

if [ -f "$DEPLOY_DIR/server/.env" ]; then
    echo "✅ Environment configuration created"
else
    echo "⚠️  Environment file missing!"
fi

if [ -f "$DEPLOY_DIR/JWT_SECRET.txt" ]; then
    echo "✅ JWT secret saved to $DEPLOY_DIR/JWT_SECRET.txt"
else
    echo "⚠️  JWT secret file not created!"
fi

echo ""
echo "⚠️  Backend is NOT running yet - you must configure it in cPanel!"
echo ""

# Create deployment summary file
SUMMARY_FILE="$DEPLOY_DIR/DEPLOYMENT_INFO.txt"
cat > "$SUMMARY_FILE" << EOFSUMMARY
PhantomPay Deployment Summary (HostGator)
==========================================
Deployed: $(date)
Deployment Directory: $DEPLOY_DIR
$([ -n "$WEB_DIR" ] && echo "Frontend Directory: $WEB_DIR" || echo "Frontend: Not deployed")
API Path: ${API_PATH:-/api}

⚠️  CRITICAL: Backend must be configured in cPanel
   Only ports 22/2222 are accessible - custom ports are BLOCKED
   Use cPanel → Setup Node.js App to run the backend

cPanel Configuration:
- Node.js version: 18.x or higher
- Application root: $(basename $DEPLOY_DIR)/server
- Application URL: ${API_PATH:-/api}
- Startup file: src/server.js
- Environment variables: JWT_SECRET, NODE_ENV=production

Important Files:
- Backend: $DEPLOY_DIR/server/
- Database: $DEPLOY_DIR/server/database.db
- Environment: $DEPLOY_DIR/server/.env
- JWT Secret: $DEPLOY_DIR/JWT_SECRET.txt
$([ -n "$WEB_DIR" ] && echo "- Frontend: $WEB_DIR" || echo "")

Access URLs:
$([ -n "$FRONTEND_URL" ] && echo "- Frontend: $FRONTEND_URL" || echo "- Frontend: http://yourdomain.com")
$([ -n "$BACKEND_URL" ] && echo "- Backend: $BACKEND_URL" || echo "- Backend: http://yourdomain.com/api")

Quick Commands:
- Backup database: cp $DEPLOY_DIR/server/database.db ~/backup-\$(date +%Y%m%d).db
- View JWT secret: cat $DEPLOY_DIR/JWT_SECRET.txt
- Update app: cd $DEPLOY_DIR && git pull && cd client && npm run build && cd ../server && npm install
$([ -n "$WEB_DIR" ] && echo "- Deploy frontend: cp -r $DEPLOY_DIR/client/dist/* $WEB_DIR/" || echo "")
- After updates: Go to cPanel → Setup Node.js App → RESTART APP

Support:
- HostGator cPanel: https://www.hostgator.com/help/cpanel
- Node.js Setup: https://www.hostgator.com/help/article/how-to-install-nodejs-npm-and-pm2
EOFSUMMARY

echo "📄 Deployment summary saved to: $SUMMARY_FILE"
echo "   (View anytime with: cat $SUMMARY_FILE)"
echo ""

# Create a quick reference card for cPanel
QUICKREF_FILE="$DEPLOY_DIR/CPANEL_QUICK_REFERENCE.txt"
cat > "$QUICKREF_FILE" << 'EOFQUICK'
╔════════════════════════════════════════════════════════════════╗
║      PHANTOMPAY - HOSTGATOR cPANEL QUICK REFERENCE             ║
╚════════════════════════════════════════════════════════════════╝

⚠️  IMPORTANT: Only ports 22/2222 work on HostGator shared hosting
   Backend MUST run through cPanel's "Setup Node.js App" feature

CPANEL BACKEND MANAGEMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check Backend Status:
  1. Login to cPanel (https://yourdomain.com:2083)
  2. Go to "Setup Node.js App"
  3. View status of your PhantomPay app

Restart Backend:
  1. cPanel → Setup Node.js App
  2. Click "RESTART APP" button

View Backend Logs:
  1. cPanel → Setup Node.js App
  2. Click on "Show log" link
  OR via SSH:
  tail -f DEPLOY_DIR_PLACEHOLDER/server/logs/passenger.log

Stop/Start Backend:
  1. cPanel → Setup Node.js App
  2. Click "STOP APP" or "START APP" button

Edit Environment Variables:
  1. cPanel → Setup Node.js App
  2. Scroll to "Environment variables"
  3. Add/Edit: JWT_SECRET, NODE_ENV

UPDATE PHANTOMPAY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Via SSH:
  cd DEPLOY_DIR_PLACEHOLDER
  git pull origin main
  cd client && npm install && npm run build && cd ..
  cd server && npm install && cd ..
  # Copy frontend to public_html
  cp -r client/dist/* WEB_DIR_PLACEHOLDER/
  
Then in cPanel:
  1. Go to Setup Node.js App
  2. Click "RESTART APP"

BACKUP & RESTORE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backup Database:
  cp DEPLOY_DIR_PLACEHOLDER/server/database.db ~/backup-$(date +%Y%m%d).db

Restore Database:
  cp ~/backup-YYYYMMDD.db DEPLOY_DIR_PLACEHOLDER/server/database.db
  # Restart app in cPanel

Automatic Daily Backup (crontab -e):
  0 2 * * * cp DEPLOY_DIR_PLACEHOLDER/server/database.db ~/backups/db-$(date +\%Y\%m\%d).db

TROUBLESHOOTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend Won't Start:
  1. Check cPanel → Setup Node.js App for errors
  2. Verify "Application root" path is correct
  3. Check "Application startup file" is src/server.js
  4. View Passenger logs (click "Show log")
  5. Ensure JWT_SECRET is in environment variables
  6. Try STOP then START

Frontend Shows 404:
  1. Verify files exist: ls -la WEB_DIR_PLACEHOLDER/
  2. Check .htaccess: cat WEB_DIR_PLACEHOLDER/.htaccess
  3. Clear browser cache (Ctrl+F5)

API Requests Fail (CORS/500 errors):
  1. Verify backend is "Running" in cPanel
  2. Check "Application URL" matches your API path (usually /api)
  3. View Passenger logs for errors
  4. Test API: curl BACKEND_URL_PLACEHOLDER/health
  5. Check JWT_SECRET is set in cPanel environment variables

Database Locked Error:
  1. Stop app in cPanel
  2. Wait 10 seconds
  3. Start app in cPanel

App Shows "Application Error":
  1. Check Passenger logs in cPanel
  2. Common issues:
     - Missing JWT_SECRET environment variable
     - Incorrect application root path
     - Node.js version too old (need 16+)
     - Missing dependencies (run: cd server && npm install)

USEFUL COMMANDS (via SSH):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View JWT Secret:
  cat DEPLOY_DIR_PLACEHOLDER/JWT_SECRET.txt

Check Disk Usage:
  du -sh DEPLOY_DIR_PLACEHOLDER
  df -h

View Frontend Files:
  ls -la WEB_DIR_PLACEHOLDER/

Test Backend API:
  curl BACKEND_URL_PLACEHOLDER/health

Check Database Permissions:
  ls -l DEPLOY_DIR_PLACEHOLDER/server/database.db

IMPORTANT FILES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend Source:   DEPLOY_DIR_PLACEHOLDER/server/
Startup File:     DEPLOY_DIR_PLACEHOLDER/server/src/server.js
Database:         DEPLOY_DIR_PLACEHOLDER/server/database.db
Environment:      DEPLOY_DIR_PLACEHOLDER/server/.env
JWT Secret:       DEPLOY_DIR_PLACEHOLDER/JWT_SECRET.txt
Frontend:         WEB_DIR_PLACEHOLDER/
Passenger Logs:   (view in cPanel → Setup Node.js App)

CPANEL CONFIGURATION (for reference):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Node.js version:        18.x or higher
Application mode:       Production
Application root:       DEPLOY_ROOT_PLACEHOLDER/server
Application URL:        API_PATH_PLACEHOLDER
Application startup:    src/server.js
Environment variables:  JWT_SECRET, NODE_ENV=production

SUPPORT RESOURCES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HostGator cPanel:    https://www.hostgator.com/help/cpanel
Node.js Setup:       https://www.hostgator.com/help/article/how-to-install-nodejs-npm-and-pm2
SSH Access:          https://www.hostgator.com/help/article/how-to-get-ssh-access
Support:             https://www.hostgator.com/contact

EOFQUICK

# Replace placeholders with actual values
sed -i.bak "s|DEPLOY_DIR_PLACEHOLDER|$DEPLOY_DIR|g" "$QUICKREF_FILE"
sed -i.bak "s|DEPLOY_ROOT_PLACEHOLDER|$(basename $DEPLOY_DIR)|g" "$QUICKREF_FILE"
sed -i.bak "s|API_PATH_PLACEHOLDER|${API_PATH:-/api}|g" "$QUICKREF_FILE"
if [ -n "$WEB_DIR" ]; then
    sed -i.bak "s|WEB_DIR_PLACEHOLDER|$WEB_DIR|g" "$QUICKREF_FILE"
else
    sed -i.bak "s|WEB_DIR_PLACEHOLDER|$PUBLIC_HTML|g" "$QUICKREF_FILE"
fi
if [ -n "$BACKEND_URL" ]; then
    sed -i.bak "s|BACKEND_URL_PLACEHOLDER|$BACKEND_URL|g" "$QUICKREF_FILE"
else
    sed -i.bak "s|BACKEND_URL_PLACEHOLDER|http://yourdomain.com/api|g" "$QUICKREF_FILE"
fi
rm -f "$QUICKREF_FILE.bak"

echo "📋 cPanel quick reference saved to: $QUICKREF_FILE"
echo "   (View anytime with: cat $QUICKREF_FILE)"
echo ""

echo "✅ Files prepared! Now configure cPanel to complete deployment."
echo ""
echo "🚀 CRITICAL NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   1️⃣  Go to cPanel → Setup Node.js App"
echo "   2️⃣  Create application with these settings:"
echo "       - Application root: $(basename $DEPLOY_DIR)/server"
echo "       - Application URL: ${API_PATH:-/api}"
echo "       - Startup file: src/server.js"
echo "       - Add JWT_SECRET environment variable"
echo "   3️⃣  Click CREATE and then START APP"
echo "   4️⃣  Visit your website to access PhantomPay"
echo "   5️⃣  Create an admin account"
echo "   6️⃣  Set up regular database backups"
echo ""
echo "📋 Reference Files Created:"
echo "   - $SUMMARY_FILE"
echo "   - $QUICKREF_FILE"
echo ""
echo "💡 Important Reminders:"
echo "   - Only ports 22/2222 work (SSH only)"
echo "   - Backend runs through cPanel, NOT on port 3001"
echo "   - JWT secret saved to: $DEPLOY_DIR/JWT_SECRET.txt"
echo "   - View cPanel quick reference anytime for help"
echo ""
echo "🎊 Good luck with your deployment!"
echo ""

