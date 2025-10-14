import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import {
  getMarkets,
  getMarketById,
  placeOrder,
  getPortfolio
} from '../controllers/predictionController.js';
import {
  getAvailableMarkets,
  whitelistMarket,
  updateMarketStatus,
  getPlatformStats,
  removeMarket,
  triggerSettlement
} from '../controllers/predictionAdminController.js';

const router = express.Router();

// Public/User routes (require authentication)
router.get('/markets', authenticateToken, getMarkets);
router.get('/markets/:id', authenticateToken, getMarketById);
router.post('/markets/:id/order', authenticateToken, placeOrder);
router.get('/portfolio', authenticateToken, getPortfolio);

// Admin routes
router.get('/admin/available-markets', authenticateToken, isAdmin, getAvailableMarkets);
router.post('/admin/markets/whitelist', authenticateToken, isAdmin, whitelistMarket);
router.put('/admin/markets/:id/status', authenticateToken, isAdmin, updateMarketStatus);
router.delete('/admin/markets/:id', authenticateToken, isAdmin, removeMarket);
router.post('/admin/markets/:id/settle', authenticateToken, isAdmin, triggerSettlement);
router.get('/admin/stats', authenticateToken, isAdmin, getPlatformStats);

export default router;

