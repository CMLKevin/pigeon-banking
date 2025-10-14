import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
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
  triggerSettlement,
  repairMarketTokens
} from '../controllers/predictionAdminController.js';

const router = express.Router();

// Public/User routes (require authentication)
router.get('/markets', authenticateToken, getMarkets);
router.get('/markets/:id', authenticateToken, getMarketById);
router.post('/markets/:id/order', authenticateToken, placeOrder);
router.get('/portfolio', authenticateToken, getPortfolio);

// Admin routes
router.get('/admin/available-markets', authenticateToken, requireAdmin, getAvailableMarkets);
router.post('/admin/markets/whitelist', authenticateToken, requireAdmin, whitelistMarket);
router.put('/admin/markets/:id/status', authenticateToken, requireAdmin, updateMarketStatus);
router.delete('/admin/markets/:id', authenticateToken, requireAdmin, removeMarket);
router.post('/admin/markets/:id/settle', authenticateToken, requireAdmin, triggerSettlement);
router.post('/admin/markets/:id/repair', authenticateToken, requireAdmin, repairMarketTokens);
router.get('/admin/stats', authenticateToken, requireAdmin, getPlatformStats);

export default router;

