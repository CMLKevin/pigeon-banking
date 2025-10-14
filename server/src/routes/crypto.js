import express from 'express';
import * as cryptoController from '../controllers/cryptoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get current prices for all supported coins
router.get('/prices', cryptoController.getCurrentPrices);

// Get historical prices for a specific coin
router.get('/prices/:coinId/history', cryptoController.getHistoricalPrices);

// Get detailed coin information
router.get('/coins/:coinId', cryptoController.getCoinInfo);

// Open a new position
router.post('/positions', cryptoController.openPosition);

// Get user's positions
router.get('/positions', cryptoController.getUserPositions);

// Get specific position details
router.get('/positions/:positionId', cryptoController.getPositionDetails);

// Close a position
router.post('/positions/:positionId/close', cryptoController.closePosition);

// Get user's trading statistics
router.get('/stats', cryptoController.getUserStats);

export default router;
