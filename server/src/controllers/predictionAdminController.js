import db from '../config/database.js';
import * as polymarket from '../services/polymarketService.js';

// Get all available Polymarket markets (for selection)
export const getAvailableMarkets = async (req, res) => {
  try {
    const markets = await polymarket.fetchActiveMarkets();
    
    // Get already whitelisted IDs
    const whitelisted = await db.query('SELECT pm_market_id FROM prediction_markets');
    const whitelistedIds = new Set(whitelisted.map(m => m.pm_market_id));

    // Mark which ones are already added
    const marketsWithStatus = markets.map(m => ({
      ...m,
      isWhitelisted: whitelistedIds.has(m.pm_market_id)
    }));

    res.json({ markets: marketsWithStatus });
  } catch (error) {
    console.error('Get available markets error:', error);
    res.status(500).json({ error: 'Failed to fetch available markets' });
  }
};

// Whitelist a market (add to platform)
export const whitelistMarket = async (req, res) => {
  try {
    const { pm_market_id } = req.body;

    if (!pm_market_id) {
      return res.status(400).json({ error: 'pm_market_id is required' });
    }

    // Check if already exists
    const existing = await db.queryOne('SELECT id FROM prediction_markets WHERE pm_market_id = $1', [pm_market_id]);
    if (existing) {
      return res.status(400).json({ error: 'Market already whitelisted' });
    }

    // Fetch market details from Polymarket
    const marketData = await polymarket.fetchMarketDetails(pm_market_id);

    if (!marketData) {
      return res.status(404).json({ error: 'Market not found on Polymarket' });
    }

    // Extract token IDs for YES and NO
    const tokens = marketData.tokens || [];
    const outcomes = marketData.outcomes || ['No', 'Yes'];
    
    // Find YES and NO tokens
    let yesTokenId = null;
    let noTokenId = null;

    if (tokens.length >= 2) {
      // Typically index 1 is YES, index 0 is NO
      noTokenId = tokens[0]?.token_id;
      yesTokenId = tokens[1]?.token_id;
    }

    // Insert market
    const result = await db.queryOne(`
      INSERT INTO prediction_markets (
        pm_market_id, question, status, yes_token_id, no_token_id, end_date, metadata
      ) VALUES ($1, $2, 'active', $3, $4, $5, $6::jsonb)
      RETURNING *
    `, [
      pm_market_id,
      marketData.question,
      yesTokenId,
      noTokenId,
      marketData.end_date_iso || null,
      JSON.stringify({
        description: marketData.description,
        market_slug: marketData.market_slug,
        image: marketData.image,
        icon: marketData.icon,
        category: marketData.category,
        tags: marketData.tags || [],
        outcomes: outcomes
      })
    ]);

    // Fetch initial quote
    if (yesTokenId && noTokenId) {
      try {
        const quotes = await polymarket.fetchQuotes(yesTokenId, noTokenId);
        await db.exec(`
          INSERT INTO prediction_quotes (market_id, yes_bid, yes_ask, no_bid, no_ask, src_timestamp)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          result.id,
          quotes.yes_bid,
          quotes.yes_ask,
          quotes.no_bid,
          quotes.no_ask,
          quotes.src_timestamp
        ]);
      } catch (error) {
        console.error('Error fetching initial quote:', error);
      }
    }

    res.json({ market: result, message: 'Market whitelisted successfully' });
  } catch (error) {
    console.error('Whitelist market error:', error);
    res.status(500).json({ error: 'Failed to whitelist market' });
  }
};

// Update market status (pause/resume)
export const updateMarketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or paused' });
    }

    await db.exec(`
      UPDATE prediction_markets
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, [status, id]);

    res.json({ message: 'Market status updated successfully' });
  } catch (error) {
    console.error('Update market status error:', error);
    res.status(500).json({ error: 'Failed to update market status' });
  }
};

// Get platform statistics
export const getPlatformStats = async (req, res) => {
  try {
    // Total markets
    const marketCount = await db.queryOne('SELECT COUNT(*) as count FROM prediction_markets');

    // Total positions
    const positionCount = await db.queryOne('SELECT COUNT(*) as count FROM prediction_positions WHERE quantity > 0');

    // Total volume
    const volumeData = await db.queryOne('SELECT SUM(cost_agon) as total FROM prediction_trades');

    // Active users
    const activeUsers = await db.queryOne(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM prediction_orders
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    // Total fees collected
    const feesData = await db.queryOne(`
      SELECT SUM(amount) as total
      FROM transactions
      WHERE transaction_type = 'fee' AND description LIKE '%Prediction market%'
    `);

    // Get markets with most volume
    const topMarkets = await db.query(`
      SELECT 
        m.id,
        m.question,
        m.status,
        SUM(t.cost_agon) as volume,
        COUNT(DISTINCT t.user_id) as unique_traders
      FROM prediction_markets m
      LEFT JOIN prediction_trades t ON m.id = t.market_id
      GROUP BY m.id, m.question, m.status
      ORDER BY volume DESC
      LIMIT 10
    `);

    // Calculate platform exposure per market
    const exposureData = await db.query(`
      SELECT 
        m.id,
        m.question,
        m.status,
        SUM(CASE WHEN p.side = 'yes' THEN p.quantity * (1 - p.avg_price) ELSE 0 END) as yes_exposure,
        SUM(CASE WHEN p.side = 'no' THEN p.quantity * (1 - p.avg_price) ELSE 0 END) as no_exposure,
        SUM(CASE WHEN p.side = 'yes' THEN p.quantity ELSE 0 END) as yes_quantity,
        SUM(CASE WHEN p.side = 'no' THEN p.quantity ELSE 0 END) as no_quantity
      FROM prediction_markets m
      LEFT JOIN prediction_positions p ON m.id = p.market_id AND p.quantity > 0
      WHERE m.status = 'active'
      GROUP BY m.id, m.question, m.status
      HAVING SUM(p.quantity) > 0
      ORDER BY GREATEST(
        SUM(CASE WHEN p.side = 'yes' THEN p.quantity * (1 - p.avg_price) ELSE 0 END),
        SUM(CASE WHEN p.side = 'no' THEN p.quantity * (1 - p.avg_price) ELSE 0 END)
      ) DESC
    `);

    // Calculate total platform exposure
    const totalYesExposure = exposureData.reduce((sum, m) => sum + parseFloat(m.yes_exposure || 0), 0);
    const totalNoExposure = exposureData.reduce((sum, m) => sum + parseFloat(m.no_exposure || 0), 0);
    const maxExposure = Math.max(totalYesExposure, totalNoExposure);

    res.json({
      stats: {
        totalMarkets: parseInt(marketCount.count),
        activePositions: parseInt(positionCount.count),
        totalVolume: parseFloat(volumeData.total || 0),
        activeUsers: parseInt(activeUsers.count),
        totalFees: parseFloat(feesData.total || 0),
        platformExposure: {
          maxExposure,
          yesExposure: totalYesExposure,
          noExposure: totalNoExposure
        }
      },
      topMarkets,
      exposureByMarket: exposureData.map(m => ({
        ...m,
        yes_exposure: parseFloat(m.yes_exposure || 0),
        no_exposure: parseFloat(m.no_exposure || 0),
        yes_quantity: parseFloat(m.yes_quantity || 0),
        no_quantity: parseFloat(m.no_quantity || 0),
        max_exposure: Math.max(parseFloat(m.yes_exposure || 0), parseFloat(m.no_exposure || 0))
      }))
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
};

// Remove market from whitelist (soft delete - set to paused)
export const removeMarket = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are open positions
    const openPositions = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM prediction_positions
      WHERE market_id = $1 AND quantity > 0
    `, [id]);

    if (parseInt(openPositions.count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot remove market with open positions. Pause it instead or wait for settlement.' 
      });
    }

    // Set to paused instead of deleting
    await db.exec(`
      UPDATE prediction_markets
      SET status = 'paused', updated_at = NOW()
      WHERE id = $1
    `, [id]);

    res.json({ message: 'Market removed from active listings' });
  } catch (error) {
    console.error('Remove market error:', error);
    res.status(500).json({ error: 'Failed to remove market' });
  }
};

// Manually trigger settlement (for admin use)
export const triggerSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { outcome } = req.body;

    if (!['yes', 'no', 'invalid'].includes(outcome)) {
      return res.status(400).json({ error: 'Invalid outcome. Must be yes, no, or invalid' });
    }

    const market = await db.queryOne('SELECT * FROM prediction_markets WHERE id = $1', [id]);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    if (market.status === 'resolved') {
      return res.status(400).json({ error: 'Market already resolved' });
    }

    // Import settlement function
    const { settleMarket } = await import('../jobs/predictionSync.js');
    await settleMarket(id, outcome);

    res.json({ message: 'Market settled successfully' });
  } catch (error) {
    console.error('Trigger settlement error:', error);
    res.status(500).json({ error: 'Failed to trigger settlement' });
  }
};

