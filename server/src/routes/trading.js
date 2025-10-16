import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getCombinedCurrentPricesCached, warmPricesIfNeeded } from '../services/tradingPriceService.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/prices', async (req, res) => {
  try {
    // Return cached immediately to avoid blocking on rate-limited API
    const cached = await getCombinedCurrentPricesCached();
    if (Object.keys(cached).length > 0) {
      // Warm missing assets in background (do not await)
      Promise.resolve(warmPricesIfNeeded()).catch(() => {});
      return res.json({ success: true, prices: cached });
    }

    // No cache yet: trigger background warm and return empty
    console.warn('No prices in cache yet. Triggering background warm.');
    Promise.resolve(warmPricesIfNeeded()).catch(() => {});
    return res.json({ success: true, prices: {}, warning: 'Warming price cache' });
  } catch (e) {
    console.error('Error fetching trading prices:', e);
    // Return empty prices instead of error to prevent frontend crash
    res.json({ success: true, prices: {}, warning: 'Price data temporarily unavailable' });
  }
});

export default router;


