import express from 'express';
import cors from 'cors';
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
import predictionRoutes from './routes/prediction.js';
import db from './config/database.js';
import { startSyncJobs, stopSyncJobs } from './jobs/predictionSync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables for Replit
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please configure these in Replit Secrets or your .env file');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/games', gameRoutes);
app.use('/api/prediction', predictionRoutes);

// Start prediction market sync jobs after a delay to ensure database is ready
// This is especially important for Replit's serverless PostgreSQL
if (process.env.PREDICTION_ENABLED !== 'false') {
  // Wait 5 seconds before starting sync jobs to ensure database is fully initialized
  setTimeout(() => {
    try {
      startSyncJobs();
      console.log('✓ Prediction market sync jobs started');
    } catch (error) {
      console.error('❌ Failed to start prediction sync jobs:', error);
      console.error('Sync jobs will not run, but API endpoints will still work');
    }
  }, 5000);
} else {
  console.log('ℹ Prediction market sync jobs disabled (PREDICTION_ENABLED=false)');
}

// Handle graceful shutdown (important for Replit deployments)
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  
  try {
    // Stop sync jobs first
    stopSyncJobs();
    console.log('✓ Sync jobs stopped');
    
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
  app.use(express.static(clientDistPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
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

