import db from '../config/database.js';
import { getAssetPrice, isSupportedTradingAsset, getCombinedCurrentPricesCached } from '../services/tradingPriceService.js';

/**
 * Calculate commission fee based on leverage
 * 1x = 1%, 10x = 5%, scales linearly
 */
export function calculateCommission(leverage) {
  const minFee = 0.01; // 1%
  const maxFee = 0.05; // 5%
  const minLev = 1;
  const maxLev = 10;
  
  const feeRate = minFee + ((leverage - minLev) / (maxLev - minLev)) * (maxFee - minFee);
  return Math.max(minFee, Math.min(maxFee, feeRate));
}

/**
 * Calculate liquidation price
 */
export function calculateLiquidationPrice(entryPrice, leverage, positionType) {
  // For long positions: liquidation when price drops by (1/leverage * 100)%
  // For short positions: liquidation when price rises by (1/leverage * 100)%
  const liquidationPercentage = 1 / leverage;
  
  if (positionType === 'long') {
    return entryPrice * (1 - liquidationPercentage * 0.9); // 90% of theoretical liquidation for safety margin
  } else {
    return entryPrice * (1 + liquidationPercentage * 0.9);
  }
}

export function calculateDailyMaintenanceRate(leverage) {
  const minRate = 0.001; // 0.1%
  const maxRate = 0.01; // 1%
  const minLev = 1;
  const maxLev = 10;
  const lev = Math.min(Math.max(Number(leverage) || 1, minLev), maxLev);
  return minRate + ((lev - minLev) / (maxLev - minLev)) * (maxRate - minRate);
}

/**
 * Get current prices for all supported coins
 */
export const getCurrentPrices = async (req, res) => {
  try {
    const { getCombinedCurrentPrices } = await import('../services/tradingPriceService.js');
    const prices = await getCombinedCurrentPrices();
    const subset = ['bitcoin', 'ethereum', 'dogecoin'];
    const filtered = Object.fromEntries(Object.entries(prices).filter(([k]) => subset.includes(k)));
    
    // If we got at least some prices, return them
    if (Object.keys(filtered).length > 0) {
      return res.json({ success: true, prices: filtered });
    }
    
    // If no prices available, return empty object with success
    console.warn('No prices available from API, returning empty object');
    res.json({ success: true, prices: {} });
  } catch (error) {
    console.error('Error getting current prices:', error);
    // Return empty prices instead of error to prevent frontend crash
    res.json({ success: true, prices: {}, warning: 'Price data temporarily unavailable' });
  }
};

/**
 * Get historical price data for a specific coin
 */
export const getHistoricalPrices = async (req, res) => {
  try {
    const { coinId } = req.params;
    const { days = 7 } = req.query;
    
    // Accept both crypto coinIds and new trading assets (gold, tsla, aapl, nvda)
    if (!isSupportedTradingAsset(coinId)) {
      return res.status(400).json({ error: 'Unsupported asset' });
    }
    
    // Historical prices not implemented yet - return empty array
    // TODO: Implement historical price fetching from Yahoo Finance
    res.json({ success: true, prices: [] });
  } catch (error) {
    console.error('Error getting historical prices:', error);
    res.status(200).json({ success: true, prices: [] });
  }
};

/**
 * Get detailed coin information
 */
export const getCoinInfo = async (req, res) => {
  try {
    const { coinId } = req.params;
    
    if (!isSupportedTradingAsset(coinId)) {
      return res.status(400).json({ error: 'Unsupported coin' });
    }
    
    // Get basic price info from trading service
    const priceData = await getAssetPrice(coinId);
    
    if (!priceData) {
      return res.status(200).json({ 
        success: true, 
        info: { id: coinId, symbol: coinId.toUpperCase(), name: coinId, current_price: 0 } 
      });
    }
    
    const info = {
      id: priceData.id,
      symbol: priceData.symbol,
      name: priceData.name,
      current_price: priceData.price,
      price_change_percentage_24h: priceData.change_24h || 0
    };
    
    res.json({ success: true, info });
  } catch (error) {
    console.error('Error getting coin info:', error);
    res.status(200).json({ 
      success: true, 
      info: { id: coinId, symbol: coinId.toUpperCase(), name: coinId, current_price: 0 } 
    });
  }
};

/**
 * Open a new crypto position
 */
export const openPosition = async (req, res) => {
  const { coinId, positionType, leverage } = req.body;
  const marginAgon = req.body.marginAgon ?? req.body.marginAmon; // accept both
  const userId = req.user.id;
  
  try {
    // Validate inputs
    if (!isSupportedTradingAsset(coinId)) {
      return res.status(400).json({ error: 'Unsupported coin' });
    }
    
    if (!['long', 'short'].includes(positionType)) {
      return res.status(400).json({ error: 'Position type must be "long" or "short"' });
    }
    
    const leverageNum = parseFloat(leverage);
    if (leverageNum < 1 || leverageNum > 10 || !isFinite(leverageNum)) {
      return res.status(400).json({ error: 'Leverage must be between 1x and 10x' });
    }
    
    const marginAgonNum = parseFloat(marginAgon);
    if (marginAgonNum <= 0 || !isFinite(marginAgonNum)) {
      return res.status(400).json({ error: 'Margin must be positive' });
    }
    
    // Calculate commission
    const commissionRate = calculateCommission(leverageNum);
    const commissionAmount = marginAgonNum * commissionRate;
    const netMargin = marginAgonNum - commissionAmount;
    
    await db.tx(async (t) => {
      // Check user balance
      const wallet = await t.queryOne('SELECT agon FROM wallets WHERE user_id = $1', [userId]);
      // Round to 2 decimal places to handle floating point precision
      const walletBalance = Math.round(parseFloat(wallet?.agon || 0) * 100) / 100;
      const requiredMargin = Math.round(marginAgonNum * 100) / 100;
      if (!wallet || walletBalance < requiredMargin) {
        throw new Error('Insufficient Stoneworks Dollars balance');
      }
      
      // Get current price
      const currentPrice = await getAssetPrice(coinId);
      if (!currentPrice) {
        throw new Error('Failed to fetch current price');
      }
      
      const entryPrice = currentPrice.price;
      
      // Calculate position size (quantity)
      const positionValue = netMargin * leverageNum;
      const quantity = positionValue / entryPrice;
      
      // Calculate liquidation price
      const liquidationPrice = calculateLiquidationPrice(entryPrice, leverageNum, positionType);
      
      // Deduct margin from user's wallet
      await t.exec(
        'UPDATE wallets SET agon = agon - $1 WHERE user_id = $2',
        [marginAgonNum, userId]
      );
      
      // Create position
      const position = await t.queryOne(
        `INSERT INTO crypto_positions (
          user_id, coin_id, position_type, leverage, quantity, 
          entry_price, liquidation_price, margin_agon, commission_agon, status, last_maintenance_fee_at, total_maintenance_fees
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', NOW(), 0)
        RETURNING *`,
        [userId, coinId, positionType, leverageNum, quantity, entryPrice, liquidationPrice, netMargin, commissionAmount]
      );
      
      // Record transaction
      await t.exec(
        `INSERT INTO transactions (from_user_id, transaction_type, currency, amount, description)
         VALUES ($1, 'crypto_trade', 'agon', $2, $3)`,
        [userId, marginAgonNum, `Opened ${positionType} position on ${coinId} with ${leverageNum}x leverage`]
      );
      
      // Log activity
      await t.exec(
        `INSERT INTO activity_logs (user_id, action, metadata)
         VALUES ($1, 'crypto_position_opened', $2)`,
        [userId, JSON.stringify({ coinId, positionType, leverage: leverageNum, margin: marginAgonNum })]
      );
      
      return position;
    }).then(position => {
      res.json({
        success: true,
        position: {
          ...position,
          commission: commissionAmount,
          commission_rate: commissionRate
        }
      });
    });
    
  } catch (error) {
    console.error('Error opening position:', error);
    res.status(500).json({ error: error.message || 'Failed to open position' });
  }
};

/**
 * Close a crypto position
 */
export const closePosition = async (req, res) => {
  const { positionId } = req.params;
  const userId = req.user.id;
  
  try {
    await db.tx(async (t) => {
      // Get position
      const position = await t.queryOne(
        'SELECT * FROM crypto_positions WHERE id = $1 AND user_id = $2 AND status = $3',
        [positionId, userId, 'open']
      );
      
      if (!position) {
        throw new Error('Position not found or already closed');
      }
      
      // Get current price
      const currentPrice = await getAssetPrice(position.coin_id);
      if (!currentPrice) {
        throw new Error('Failed to fetch current price');
      }
      
      const closePrice = currentPrice.price;
      const entryPrice = parseFloat(position.entry_price);
      const quantity = parseFloat(position.quantity);
      const leverage = parseFloat(position.leverage);
      const margin = parseFloat(position.margin_agon);
      
      // Calculate PnL
      let priceDiff, realizedPnl;
      if (position.position_type === 'long') {
        priceDiff = closePrice - entryPrice;
        realizedPnl = (priceDiff / entryPrice) * margin * leverage;
      } else { // short
        priceDiff = entryPrice - closePrice;
        realizedPnl = (priceDiff / entryPrice) * margin * leverage;
      }
      
      // Total return = margin + PnL
      const totalReturn = margin + realizedPnl;
      const finalReturn = Math.max(0, totalReturn); // Can't go below 0 (complete loss)
      
      // Close position
      await t.exec(
        `UPDATE crypto_positions 
         SET status = 'closed', closed_at = NOW(), closed_price = $1, realized_pnl = $2
         WHERE id = $3`,
        [closePrice, realizedPnl, positionId]
      );
      
      // Return funds to user
      if (finalReturn > 0) {
        await t.exec(
          'UPDATE wallets SET agon = agon + $1 WHERE user_id = $2',
          [finalReturn, userId]
        );
      }
      
      // Record transaction
      await t.exec(
        `INSERT INTO transactions (from_user_id, transaction_type, currency, amount, description)
         VALUES ($1, 'crypto_trade', 'agon', $2, $3)`,
        [
          userId,
          finalReturn,
          `Closed ${position.position_type} position on ${position.coin_id}: ${realizedPnl >= 0 ? 'Profit' : 'Loss'} ${Math.abs(realizedPnl).toFixed(2)} Ⱥ`
        ]
      );
      
      // Log activity
      await t.exec(
        `INSERT INTO activity_logs (user_id, action, metadata)
         VALUES ($1, 'crypto_position_closed', $2)`,
        [userId, JSON.stringify({ 
          positionId, 
          coinId: position.coin_id, 
          pnl: realizedPnl,
          return: finalReturn
        })]
      );
      
      return {
        position,
        closePrice,
        realizedPnl,
        finalReturn
      };
    }).then(result => {
      res.json({
        success: true,
        ...result
      });
    });
    
  } catch (error) {
    console.error('Error closing position:', error);
    res.status(500).json({ error: error.message || 'Failed to close position' });
  }
};

/**
 * Get user's positions
 */
export const getUserPositions = async (req, res) => {
  const userId = req.user.id;
  const { status = 'open' } = req.query;
  
  try {
    const positions = await db.query(
      `SELECT 
        cp.*,
        u.username
       FROM crypto_positions cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.user_id = $1 
       ${status !== 'all' ? 'AND cp.status = $2' : ''}
       ORDER BY cp.opened_at DESC`,
      status !== 'all' ? [userId, status] : [userId]
    );
    
    // Get current prices from cache and calculate unrealized PnL for open positions (non-blocking)
    if (status === 'open' || status === 'all') {
      try {
        const prices = await getCombinedCurrentPricesCached();
        positions.forEach(pos => {
          const priceObj = prices[pos.coin_id];
          if (pos.status === 'open' && priceObj && priceObj.price != null) {
            const currentPrice = Number(priceObj.price);
            const entryPrice = parseFloat(pos.entry_price);
            const margin = parseFloat(pos.margin_agon);
            const leverage = parseFloat(pos.leverage);
            if (isFinite(currentPrice) && isFinite(entryPrice) && entryPrice > 0 && isFinite(margin) && isFinite(leverage)) {
              let unrealizedPnl;
              if (pos.position_type === 'long') {
                const priceDiff = currentPrice - entryPrice;
                unrealizedPnl = (priceDiff / entryPrice) * margin * leverage;
              } else {
                const priceDiff = entryPrice - currentPrice;
                unrealizedPnl = (priceDiff / entryPrice) * margin * leverage;
              }
              pos.current_price = currentPrice;
              pos.unrealized_pnl = unrealizedPnl;
              pos.total_value = margin + unrealizedPnl;
              pos.pnl_percentage = (unrealizedPnl / margin) * 100;
            }
          }
        });
      } catch (priceError) {
        console.error('Error enriching positions with cached prices:', priceError);
        // Continue without price updates if cache is empty
      }
    }
    
    res.json({ success: true, positions });
  } catch (error) {
    console.error('Error getting user positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
};

/**
 * Get position details
 */
export const getPositionDetails = async (req, res) => {
  const { positionId } = req.params;
  const userId = req.user.id;
  
  try {
    const position = await db.queryOne(
      'SELECT * FROM crypto_positions WHERE id = $1 AND user_id = $2',
      [positionId, userId]
    );
    
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    // Get current price if position is open
    if (position.status === 'open') {
      const currentPrice = await getAssetPrice(position.coin_id);
      if (currentPrice) {
        const entryPrice = parseFloat(position.entry_price);
        const margin = parseFloat(position.margin_agon);
        const leverage = parseFloat(position.leverage);
        
        let unrealizedPnl;
        if (position.position_type === 'long') {
          const priceDiff = currentPrice.price - entryPrice;
          unrealizedPnl = (priceDiff / entryPrice) * margin * leverage;
        } else {
          const priceDiff = entryPrice - currentPrice.price;
          unrealizedPnl = (priceDiff / entryPrice) * margin * leverage;
        }
        
        position.current_price = currentPrice.price;
        position.unrealized_pnl = unrealizedPnl;
        position.total_value = margin + unrealizedPnl;
        position.pnl_percentage = (unrealizedPnl / margin) * 100;
      }
    }
    
    res.json({ success: true, position });
  } catch (error) {
    console.error('Error getting position details:', error);
    res.status(500).json({ error: 'Failed to fetch position details' });
  }
};

/**
 * Get user's trading statistics
 */
export const getUserStats = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const stats = await db.queryOne(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'open') as open_positions,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_positions,
        COALESCE(SUM(margin_agon) FILTER (WHERE status = 'open'), 0) as total_margin,
        COALESCE(SUM(realized_pnl) FILTER (WHERE status = 'closed' AND realized_pnl > 0), 0) as total_profit,
        COALESCE(ABS(SUM(realized_pnl) FILTER (WHERE status = 'closed' AND realized_pnl < 0)), 0) as total_loss,
        COALESCE(SUM(realized_pnl) FILTER (WHERE status = 'closed'), 0) as net_pnl,
        COUNT(*) FILTER (WHERE status = 'closed' AND realized_pnl > 0) as winning_trades,
        COUNT(*) FILTER (WHERE status = 'closed' AND realized_pnl < 0) as losing_trades
       FROM crypto_positions
       WHERE user_id = $1`,
      [userId]
    );
    
    const totalTrades = parseInt(stats.closed_positions) || 0;
    const winRate = totalTrades > 0 
      ? ((parseInt(stats.winning_trades) || 0) / totalTrades * 100).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      stats: {
        ...stats,
        win_rate: winRate
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
