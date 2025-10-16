import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getCombinedCurrentPrices } from '../services/tradingPriceService.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/prices', async (req, res) => {
  try {
    const prices = await getCombinedCurrentPrices();
    res.json({ success: true, prices });
  } catch (e) {
    console.error('Error fetching trading prices:', e);
    res.status(500).json({ error: 'Failed to fetch trading prices' });
  }
});

export default router;


