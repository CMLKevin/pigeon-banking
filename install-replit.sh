#!/bin/bash
echo "🔧 Installing Pigeon Banking dependencies for Replit..."
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies with clean slate (fixes yahoo-finance2 version)
echo "📦 Installing server dependencies..."
echo "   Ensuring yahoo-finance2 v2.12.6 for Node 20.x compatibility..."
cd server && npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install
cd ..

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📊 Installed Versions:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo ""
echo "Next steps:"
echo "1. Make sure DATABASE_URL and JWT_SECRET are set in Replit Secrets"
echo "2. Click the Run button to start the development server"
echo "3. Trading Panel will now fetch live prices (yahoo-finance2 v2.12.6)"
echo "4. Or deploy using the Deploy button"
