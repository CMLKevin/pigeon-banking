#!/bin/bash
echo "🔧 Installing PhantomPay dependencies for Replit..."
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install
cd ..

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Make sure DATABASE_URL and JWT_SECRET are set in Replit Secrets"
echo "2. Click the Run button to start the development server"
echo "3. Or deploy using the Deploy button"
