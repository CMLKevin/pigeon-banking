import db from '../config/database.js';
import * as polymarket from '../services/polymarketService.js';

// Track consecutive failures
const syncFailures = new Map();
const MAX_FAILURES = 5;

// Sync quotes for all active markets
export const syncQuotes = async () => {
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;

  try {
    // Get all active markets from our database
    const markets = await db.query(`
      SELECT id, pm_market_id, yes_token_id, no_token_id, question
      FROM prediction_markets
      WHERE status = 'active'
    `);

    console.log(`[${new Date().toISOString()}] Syncing quotes for ${markets.length} active markets...`);

    for (const market of markets) {
      try {
        if (!market.yes_token_id || !market.no_token_id) {
          console.warn(`Market ${market.id} (${market.question}) missing token IDs, skipping`);
          continue;
        }

        const quotes = await polymarket.fetchQuotes(market.yes_token_id, market.no_token_id);

        // Validate quotes
        if (!quotes || typeof quotes.yes_bid === 'undefined') {
          throw new Error('Invalid quote data received');
        }

        // Insert new quote
        await db.exec(`
          INSERT INTO prediction_quotes (market_id, yes_bid, yes_ask, no_bid, no_ask, src_timestamp)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          market.id,
          quotes.yes_bid,
          quotes.yes_ask,
          quotes.no_bid,
          quotes.no_ask,
          quotes.src_timestamp
        ]);

        // Clean up old quotes (keep last 1000 per market)
        await db.exec(`
          DELETE FROM prediction_quotes
          WHERE market_id = $1
          AND id NOT IN (
            SELECT id FROM prediction_quotes
            WHERE market_id = $1
            ORDER BY created_at DESC
            LIMIT 1000
          )
        `, [market.id]);

        successCount++;
        // Reset failure count on success
        syncFailures.set(market.id, 0);

      } catch (error) {
        failureCount++;
        const failures = (syncFailures.get(market.id) || 0) + 1;
        syncFailures.set(market.id, failures);

        console.error(`Error syncing quotes for market ${market.id} (${market.question}):`, error.message);

        // Pause market if too many consecutive failures
        if (failures >= MAX_FAILURES) {
          console.error(`Market ${market.id} has failed ${failures} times, pausing market`);
          try {
            await db.exec(`
              UPDATE prediction_markets
              SET status = 'paused'
              WHERE id = $1
            `, [market.id]);
          } catch (pauseError) {
            console.error(`Failed to pause market ${market.id}:`, pauseError);
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Quote sync complete: ${successCount} succeeded, ${failureCount} failed (${duration}ms)`);
  } catch (error) {
    console.error('Error in syncQuotes:', error);
  }
};

// Check for market resolutions and settle positions
export const checkResolutions = async () => {
  try {
    // Get all active markets
    const markets = await db.query(`
      SELECT id, pm_market_id, question
      FROM prediction_markets
      WHERE status = 'active'
    `);

    console.log(`Checking resolutions for ${markets.length} markets...`);

    for (const market of markets) {
      try {
        const resolution = await polymarket.checkMarketResolution(market.pm_market_id);

        if (resolution.resolved && resolution.outcome) {
          console.log(`Market ${market.id} resolved: ${resolution.outcome}`);
          await settleMarket(market.id, resolution.outcome);
        }
      } catch (error) {
        console.error(`Error checking resolution for market ${market.id}:`, error);
      }
    }

    console.log('Resolution check complete');
  } catch (error) {
    console.error('Error in checkResolutions:', error);
  }
};

// Settle a market after resolution
const settleMarket = async (marketId, outcome) => {
  try {
    await db.tx(async (q) => {
      // Update market status
      await q.exec(`
        UPDATE prediction_markets
        SET status = 'resolved', resolution = $1, updated_at = NOW()
        WHERE id = $2
      `, [outcome, marketId]);

      // Get all positions for this market
      const positions = await q.query(`
        SELECT p.*, u.username
        FROM prediction_positions p
        JOIN users u ON p.user_id = u.id
        WHERE p.market_id = $1 AND p.quantity > 0
      `, [marketId]);

      console.log(`Settling ${positions.length} positions for market ${marketId}`);

      for (const position of positions) {
        const isWinner = position.side === outcome;
        const payout = isWinner ? parseFloat(position.quantity) : 0;
        const cost = parseFloat(position.quantity) * parseFloat(position.avg_price);
        const profit = payout - cost;

        // Credit wallet if winner
        if (payout > 0) {
          await q.exec(`
            UPDATE wallets
            SET agon = agon + $1
            WHERE user_id = $2
          `, [payout, position.user_id]);
        }

        // Update position
        await q.exec(`
          UPDATE prediction_positions
          SET realized_pnl = realized_pnl + $1, quantity = 0, updated_at = NOW()
          WHERE id = $2
        `, [profit, position.id]);

        // Log activity
        await q.exec(`
          INSERT INTO activity_logs (user_id, action, metadata)
          VALUES ($1, $2, $3::jsonb)
        `, [
          position.user_id,
          'prediction_settled',
          JSON.stringify({
            marketId,
            side: position.side,
            outcome,
            payout,
            profit
          })
        ]);

        // Create transaction record
        if (payout > 0) {
          await q.exec(`
            INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
            VALUES ($1, NULL, 'prediction_payout', 'agon', $2, $3)
          `, [
            position.user_id,
            payout,
            `Prediction market payout (${position.side.toUpperCase()})`
          ]);
        }
      }

      // Record settlement
      await q.exec(`
        INSERT INTO prediction_settlements (market_id, resolved_outcome)
        VALUES ($1, $2)
      `, [marketId, outcome]);
    });

    console.log(`Market ${marketId} settled successfully`);
  } catch (error) {
    console.error(`Error settling market ${marketId}:`, error);
    throw error;
  }
};

// Start sync intervals
let quoteInterval = null;
let resolutionInterval = null;

export const startSyncJobs = () => {
  // Run immediately
  syncQuotes();
  checkResolutions();

  // Sync quotes every 15 seconds
  quoteInterval = setInterval(syncQuotes, 15000);

  // Check resolutions every 2 minutes
  resolutionInterval = setInterval(checkResolutions, 120000);

  console.log('Prediction sync jobs started');
};

export const stopSyncJobs = () => {
  if (quoteInterval) {
    clearInterval(quoteInterval);
    quoteInterval = null;
  }
  if (resolutionInterval) {
    clearInterval(resolutionInterval);
    resolutionInterval = null;
  }
  console.log('Prediction sync jobs stopped');
};

