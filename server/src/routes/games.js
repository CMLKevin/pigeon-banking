import express from 'express';
import { playCoinFlip, playBlackjack, playPlinko, getGameHistory, getGameStats, startCrashRound, placeCrashBet, cashoutCrash, finalizeCrashRound } from '../controllers/gameController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Play coin flip
router.post('/coinflip', playCoinFlip);

// Play blackjack
router.post('/blackjack', playBlackjack);

// Play plinko
router.post('/plinko', playPlinko);

// Crash game routes
router.post('/crash/start', startCrashRound);
router.post('/crash/bet', placeCrashBet);
router.post('/crash/cashout', cashoutCrash);
router.post('/crash/finalize', finalizeCrashRound);

// Get game history
router.get('/history', getGameHistory);

// Get game statistics
router.get('/stats', getGameStats);

export default router;

