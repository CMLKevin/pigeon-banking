import express from 'express';
import { getWallet, swapCurrency } from '../controllers/walletController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getWallet);
router.post('/swap', authenticateToken, swapCurrency);

export default router;

