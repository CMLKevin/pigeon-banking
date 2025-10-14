import db from '../config/database.js';

const MAX_ORDER_SIZE = 1000; // Maximum shares per order
const TRADE_FEE_RATE = 0.01; // 1% fee
const MAX_PLATFORM_EXPOSURE = 10000; // Maximum platform exposure per market side in Agon

// Get all whitelisted markets with last quote
export const getMarkets = async (req, res) => {
  try {
    const markets = await db.query(`
      SELECT 
        m.id,
        m.pm_market_id,
        m.question,
        m.status,
        m.end_date,
        m.metadata,
        m.created_at
      FROM prediction_markets m
      ORDER BY m.created_at DESC
    `);

    // Get last quote for each market
    const marketsWithQuotes = await Promise.all(
      markets.map(async (market) => {
        const lastQuote = await db.queryOne(`
          SELECT yes_bid, yes_ask, no_bid, no_ask, created_at
          FROM prediction_quotes
          WHERE market_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `, [market.id]);

        return {
          ...market,
          lastQuote: lastQuote || null
        };
      })
    );

    res.json({ markets: marketsWithQuotes });
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
};

// Get market details with quotes history (supports range via ?days=10)
export const getMarketById = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.query;

    const market = await db.queryOne(`
      SELECT *
      FROM prediction_markets
      WHERE id = $1
    `, [id]);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // Get quotes history
    let quotes;
    if (days && !isNaN(parseInt(days, 10))) {
      const interval = `${parseInt(days, 10)} days`;
      quotes = await db.query(`
        SELECT yes_bid, yes_ask, no_bid, no_ask, created_at
        FROM prediction_quotes
        WHERE market_id = $1 AND created_at >= NOW() - $2::interval
        ORDER BY created_at ASC
        LIMIT 5000
      `, [id, interval]);
    } else {
      quotes = await db.query(`
        SELECT yes_bid, yes_ask, no_bid, no_ask, created_at
        FROM prediction_quotes
        WHERE market_id = $1
        ORDER BY created_at DESC
        LIMIT 100
      `, [id]);
      quotes = quotes.reverse();
    }

    // Get last quote
    const lastQuote = quotes.length > 0 ? quotes[quotes.length - 1] : null;

    res.json({ market, quotes, lastQuote });
  } catch (error) {
    console.error('Get market error:', error);
    res.status(500).json({ error: 'Failed to fetch market' });
  }
};

// Place an order (buy or sell)
export const placeOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { side, action, quantity } = req.body;
    const userId = req.user.id;

    // Validation
    if (!['yes', 'no'].includes(side)) {
      return res.status(400).json({ error: 'Invalid side. Must be yes or no' });
    }

    if (!['buy', 'sell'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be buy or sell' });
    }

    const qty = parseFloat(quantity);
    if (!qty || qty <= 0 || qty > MAX_ORDER_SIZE) {
      return res.status(400).json({ error: `Invalid quantity. Must be between 0 and ${MAX_ORDER_SIZE}` });
    }

    // Execute order in transaction
    const result = await db.tx(async (q) => {
      // Get market
      const market = await q.queryOne('SELECT * FROM prediction_markets WHERE id = $1', [id]);
      
      if (!market) {
        throw new Error('Market not found');
      }

      if (market.status !== 'active') {
        throw new Error('Market is not active');
      }

      // Get latest quote
      const quote = await q.queryOne(`
        SELECT yes_bid, yes_ask, no_bid, no_ask
        FROM prediction_quotes
        WHERE market_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [id]);

      if (!quote) {
        throw new Error('No quotes available for this market');
      }

      // Determine execution price
      let execPrice;
      if (action === 'buy') {
        execPrice = side === 'yes' ? parseFloat(quote.yes_ask) : parseFloat(quote.no_ask);
      } else {
        execPrice = side === 'yes' ? parseFloat(quote.yes_bid) : parseFloat(quote.no_bid);
      }

      // Calculate cost (with fee for buys)
      const baseCost = qty * execPrice;
      const fee = action === 'buy' ? baseCost * TRADE_FEE_RATE : 0;
      const totalCost = action === 'buy' ? baseCost + fee : baseCost;

      // Get wallet
      const wallet = await q.queryOne('SELECT agon FROM wallets WHERE user_id = $1', [userId]);
      const balance = parseFloat(wallet.agon) || 0;

      if (action === 'buy') {
        // Check balance
        if (balance < totalCost) {
          throw new Error('Insufficient Agon balance');
        }

        // Check platform exposure limit
        const currentExposure = await q.queryOne(`
          SELECT 
            SUM(CASE WHEN side = $1 THEN quantity * (1 - avg_price) ELSE 0 END) as side_exposure
          FROM prediction_positions
          WHERE market_id = $2 AND quantity > 0
        `, [side, id]);

        const exposure = parseFloat(currentExposure.side_exposure || 0);
        const newExposure = exposure + (qty * (1 - execPrice));

        if (newExposure > MAX_PLATFORM_EXPOSURE) {
          throw new Error(`Order would exceed platform exposure limit. Current ${side.toUpperCase()} exposure: ${exposure.toFixed(2)} Agon`);
        }

        // Debit wallet
        await q.exec('UPDATE wallets SET agon = agon - $1 WHERE user_id = $2', [totalCost, userId]);

        // Get or create position
        const existingPosition = await q.queryOne(`
          SELECT * FROM prediction_positions
          WHERE user_id = $1 AND market_id = $2 AND side = $3
        `, [userId, id, side]);

        if (existingPosition) {
          // Update position with weighted average price
          const oldQty = parseFloat(existingPosition.quantity);
          const oldAvg = parseFloat(existingPosition.avg_price);
          const newQty = oldQty + qty;
          const newAvg = (oldQty * oldAvg + qty * execPrice) / newQty;

          await q.exec(`
            UPDATE prediction_positions
            SET quantity = $1, avg_price = $2, updated_at = NOW()
            WHERE id = $3
          `, [newQty, newAvg, existingPosition.id]);
        } else {
          // Create new position
          await q.exec(`
            INSERT INTO prediction_positions (user_id, market_id, side, quantity, avg_price)
            VALUES ($1, $2, $3, $4, $5)
          `, [userId, id, side, qty, execPrice]);
        }
      } else {
        // Sell: check position
        const position = await q.queryOne(`
          SELECT * FROM prediction_positions
          WHERE user_id = $1 AND market_id = $2 AND side = $3
        `, [userId, id, side]);

        if (!position) {
          throw new Error('No position to sell');
        }

        const posQty = parseFloat(position.quantity);
        if (posQty < qty) {
          throw new Error(`Insufficient position. You have ${posQty} shares`);
        }

        // Credit wallet
        await q.exec('UPDATE wallets SET agon = agon + $1 WHERE user_id = $2', [totalCost, userId]);

        // Update position
        const newQty = posQty - qty;
        const avgPrice = parseFloat(position.avg_price);
        const realizedPnl = qty * (execPrice - avgPrice);

        await q.exec(`
          UPDATE prediction_positions
          SET quantity = $1, realized_pnl = realized_pnl + $2, updated_at = NOW()
          WHERE id = $3
        `, [newQty, realizedPnl, position.id]);
      }

      // Create order record
      const orderResult = await q.queryOne(`
        INSERT INTO prediction_orders (user_id, market_id, side, action, quantity, exec_price, cost_agon, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'filled')
        RETURNING id
      `, [userId, id, side, action, qty, execPrice, totalCost]);

      // Create trade record
      await q.exec(`
        INSERT INTO prediction_trades (order_id, user_id, market_id, side, quantity, exec_price, cost_agon)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [orderResult.id, userId, id, side, qty, execPrice, totalCost]);

      // Log activity
      await q.exec(`
        INSERT INTO activity_logs (user_id, action, metadata)
        VALUES ($1, $2, $3::jsonb)
      `, [
        userId,
        `prediction_${action}`,
        JSON.stringify({
          marketId: id,
          side,
          quantity: qty,
          price: execPrice,
          cost: totalCost,
          fee
        })
      ]);

      // If buy with fee, create fee transaction for admin
      if (fee > 0) {
        const admin = await q.queryOne('SELECT id FROM users WHERE is_admin = TRUE ORDER BY id ASC LIMIT 1');
        if (admin) {
          await q.exec(`
            INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
            VALUES ($1, $2, 'fee', 'agon', $3, 'Prediction market trading fee')
          `, [userId, admin.id, fee]);
        }
      }

      // Get updated wallet balance
      const updatedWallet = await q.queryOne('SELECT agon FROM wallets WHERE user_id = $1', [userId]);

      // Get updated position
      const updatedPosition = await q.queryOne(`
        SELECT * FROM prediction_positions
        WHERE user_id = $1 AND market_id = $2 AND side = $3
      `, [userId, id, side]);

      return {
        filled: true,
        orderId: orderResult.id,
        side,
        action,
        quantity: qty,
        avgPrice: execPrice,
        costAgon: totalCost,
        fee,
        newBalance: parseFloat(updatedWallet.agon),
        position: updatedPosition
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Place order error:', error);
    res.status(400).json({ error: error.message || 'Failed to place order' });
  }
};

// Get user's portfolio
export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get wallet balance
    const wallet = await db.queryOne('SELECT agon FROM wallets WHERE user_id = $1', [userId]);
    const cash = parseFloat(wallet.agon) || 0;

    // Get all positions with latest quotes in a single query (optimized for Replit/serverless)
    const positions = await db.query(`
      SELECT 
        p.*,
        m.question,
        m.status,
        m.pm_market_id,
        m.end_date,
        q.yes_bid,
        q.yes_ask,
        q.no_bid,
        q.no_ask
      FROM prediction_positions p
      JOIN prediction_markets m ON p.market_id = m.id
      LEFT JOIN LATERAL (
        SELECT yes_bid, yes_ask, no_bid, no_ask
        FROM prediction_quotes
        WHERE market_id = p.market_id
        ORDER BY created_at DESC
        LIMIT 1
      ) q ON true
      WHERE p.user_id = $1
      ORDER BY p.updated_at DESC
    `, [userId]);

    // Calculate mark-to-market values
    const positionsWithMtM = positions.map((pos) => {
      let currentPrice = 0.5; // Default mid-price
      
      if (pos.yes_bid && pos.yes_ask && pos.no_bid && pos.no_ask) {
        currentPrice = pos.side === 'yes' 
          ? (parseFloat(pos.yes_bid) + parseFloat(pos.yes_ask)) / 2
          : (parseFloat(pos.no_bid) + parseFloat(pos.no_ask)) / 2;
      }

      const qty = parseFloat(pos.quantity);
      const avgPrice = parseFloat(pos.avg_price);
      const marketValue = qty * currentPrice;
      const cost = qty * avgPrice;
      const unrealizedPnl = marketValue - cost;

      // Remove quote fields from response
      const { yes_bid, yes_ask, no_bid, no_ask, ...posData } = pos;

      return {
        ...posData,
        currentPrice,
        marketValue,
        cost,
        unrealizedPnl,
        quantity: qty,
        avg_price: avgPrice,
        realized_pnl: parseFloat(pos.realized_pnl)
      };
    });

    // Calculate totals
    const totalUnrealizedPnl = positionsWithMtM.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const totalRealizedPnl = positionsWithMtM.reduce((sum, p) => sum + p.realized_pnl, 0);
    const totalMarketValue = positionsWithMtM.reduce((sum, p) => sum + p.marketValue, 0);
    const equity = cash + totalMarketValue;

    // Get recent trades (with proper aliasing to avoid confusion)
    const trades = await db.query(`
      SELECT 
        t.id,
        t.order_id,
        t.user_id,
        t.market_id,
        t.side,
        t.quantity,
        t.exec_price,
        t.cost_agon,
        t.created_at,
        m.question as market_question,
        o.action,
        o.status
      FROM prediction_trades t
      JOIN prediction_orders o ON t.order_id = o.id
      JOIN prediction_markets m ON t.market_id = m.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [userId]);

    res.json({
      positions: positionsWithMtM,
      trades,
      totals: {
        cash,
        marketValue: totalMarketValue,
        equity,
        unrealizedPnl: totalUnrealizedPnl,
        realizedPnl: totalRealizedPnl,
        totalPnl: totalUnrealizedPnl + totalRealizedPnl
      }
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
};

