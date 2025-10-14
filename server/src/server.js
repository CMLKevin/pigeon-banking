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
import { startSyncJobs, stopSyncJobs } from './jobs/predictionSync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

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

// Start prediction market sync jobs (only in production or if enabled)
if (process.env.PREDICTION_ENABLED !== 'false') {
  startSyncJobs();
  console.log('Prediction market sync jobs enabled');
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping sync jobs...');
  stopSyncJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping sync jobs...');
  stopSyncJobs();
  process.exit(0);
});

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

