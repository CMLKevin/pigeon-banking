import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import paymentRoutes from './routes/payment.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import auctionRoutes from './routes/auction.js';
import gameRoutes from './routes/games.js';
import cryptoRoutes from './routes/crypto.js';
import tradingRoutes from './routes/trading.js';
import db from './config/database.js';
import { startMaintenanceFeeScheduler } from './jobs/maintenanceFees.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

console.log(`🚀 Starting server in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`🔧 isProduction: ${isProduction}`);

// Validate required environment variables for Replit
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please configure these in Replit Secrets or your .env file');
  process.exit(1);
}

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true); // Allow same-origin and curl
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Agon server is running', environment: process.env.NODE_ENV || 'development' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/games', gameRoutes);

// Price fetching now handled by Polygon.io API via tradingPriceService

// Start maintenance fee scheduler
console.log('Starting maintenance fee scheduler...');
startMaintenanceFeeScheduler();

// Handle graceful shutdown (important for Replit deployments)
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  
  try {
    // Close database connection
    if (db && db.shutdown) {
      await db.shutdown();
      console.log('✓ Database connection closed');
    }
    
    console.log('✓ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Serve static files in production
if (isProduction) {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  console.log(`📁 Serving static files from: ${clientDistPath}`);
  console.log(`📁 Current directory (__dirname): ${__dirname}`);
  
  app.use(express.static(clientDistPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    console.log(`📄 Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath);
  });
} else {
  console.log('🔧 Running in development mode - not serving static files');
  // Development 404 handler for non-API routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agon server is running on port ${PORT}`);
});

