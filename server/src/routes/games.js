import express from 'express';
import { playCoinFlip, getGameHistory, getGameStats } from '../controllers/gameController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Play coin flip
router.post('/coinflip', playCoinFlip);

// Get game history
router.get('/history', getGameHistory);

// Get game statistics
router.get('/stats', getGameStats);

export default router;

