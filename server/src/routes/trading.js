import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getCombinedCurrentPrices } from '../services/tradingPriceService.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/prices', async (req, res) => {
  try {
    const prices = await getCombinedCurrentPrices();
    
    // If we got at least some prices, return them
    if (Object.keys(prices).length > 0) {
      return res.json({ success: true, prices });
    }
    
    // If no prices available, return empty object with success
    console.warn('No prices available from API, returning empty object');
    res.json({ success: true, prices: {} });
  } catch (e) {
    console.error('Error fetching trading prices:', e);
    // Return empty prices instead of error to prevent frontend crash
    res.json({ success: true, prices: {}, warning: 'Price data temporarily unavailable' });
  }
});

export default router;


