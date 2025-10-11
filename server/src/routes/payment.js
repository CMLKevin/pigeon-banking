import express from 'express';
import { sendPayment, getTransactions } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/send', authenticateToken, sendPayment);
router.get('/transactions', authenticateToken, getTransactions);

export default router;

