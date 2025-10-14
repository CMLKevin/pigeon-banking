# Prediction Markets Feature

## Overview

The Prediction Markets feature allows users to trade YES/NO shares on real-world events using their Agon balance. The platform uses Polymarket's API as an oracle for market data, prices, and resolutions, while maintaining an internal ledger system for all trades.

## Key Features

### Core Functionality
- ✅ **Market Discovery**: Browse curated prediction markets with live prices
- ✅ **Trading**: Buy and sell YES/NO shares at current market prices
- ✅ **Portfolio Management**: Track open positions, realized/unrealized PnL
- ✅ **Automatic Settlement**: Positions are automatically settled when markets resolve
- ✅ **Quote History Charts**: Visualize price movements over time
- ✅ **Search & Filter**: Find markets by keywords and status
- ✅ **Export Functionality**: Download trade history as CSV

### Risk Management
- ✅ **Order Size Limits**: Maximum 1,000 shares per order
- ✅ **Platform Exposure Limits**: Maximum 10,000 Agon exposure per market side
- ✅ **Trading Fees**: 1% fee on buy orders
- ✅ **Price Spreads**: 0.5% markup on ask prices, 0.5% markdown on bid prices
- ✅ **Auto-Pause**: Markets automatically pause after 5 consecutive sync failures

### Admin Controls
- ✅ **Market Whitelisting**: Admins can add/remove markets
- ✅ **Market Status Control**: Pause/resume markets manually
- ✅ **Platform Statistics**: View volume, fees, exposure by market
- ✅ **Exposure Monitoring**: Track platform risk across all markets

## Architecture

### Database Schema

#### `prediction_markets`
Stores whitelisted prediction markets from Polymarket.

```sql
CREATE TABLE prediction_markets (
  id SERIAL PRIMARY KEY,
  pm_market_id TEXT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'resolved')),
  resolution TEXT CHECK (resolution IN ('yes', 'no', 'invalid')),
  yes_token_id TEXT,
  no_token_id TEXT,
  end_date TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `prediction_quotes`
Stores historical price quotes synced from Polymarket every 15 seconds.

```sql
CREATE TABLE prediction_quotes (
  id SERIAL PRIMARY KEY,
  market_id INTEGER REFERENCES prediction_markets(id) ON DELETE CASCADE,
  yes_bid NUMERIC(18,6) NOT NULL,
  yes_ask NUMERIC(18,6) NOT NULL,
  no_bid NUMERIC(18,6) NOT NULL,
  no_ask NUMERIC(18,6) NOT NULL,
  src_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `prediction_positions`
Tracks user positions (holdings) in each market.

```sql
CREATE TABLE prediction_positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  market_id INTEGER REFERENCES prediction_markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  quantity NUMERIC(18,6) NOT NULL DEFAULT 0,
  avg_price NUMERIC(18,6) NOT NULL,
  realized_pnl NUMERIC(18,6) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, market_id, side)
);
```

#### `prediction_orders`
Records all order placements (buy/sell).

```sql
CREATE TABLE prediction_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  market_id INTEGER REFERENCES prediction_markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  quantity NUMERIC(18,6) NOT NULL,
  exec_price NUMERIC(18,6) NOT NULL,
  cost_agon NUMERIC(18,6) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('filled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `prediction_trades`
Records executed trades (one-to-one with filled orders).

```sql
CREATE TABLE prediction_trades (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES prediction_orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  market_id INTEGER REFERENCES prediction_markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  quantity NUMERIC(18,6) NOT NULL,
  exec_price NUMERIC(18,6) NOT NULL,
  cost_agon NUMERIC(18,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `prediction_settlements`
Records market settlements after resolution.

```sql
CREATE TABLE prediction_settlements (
  id SERIAL PRIMARY KEY,
  market_id INTEGER REFERENCES prediction_markets(id) ON DELETE CASCADE,
  resolved_outcome TEXT NOT NULL CHECK (resolved_outcome IN ('yes', 'no', 'invalid')),
  settled_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Backend Services

#### Polymarket Service (`server/src/services/polymarketService.js`)
Interfaces with Polymarket's APIs:
- `fetchActiveMarkets()`: Get tradeable markets with metadata
- `fetchQuotes(yesTokenId, noTokenId)`: Get current bid/ask prices
- `checkMarketResolution(marketId)`: Check if market has resolved

#### Sync Jobs (`server/src/jobs/predictionSync.js`)
Background tasks that keep data current:
- **Quote Sync**: Runs every 15 seconds, updates prices for all active markets
- **Resolution Check**: Runs every 2 minutes, checks for resolved markets and triggers settlement
- **Error Tracking**: Auto-pauses markets after 5 consecutive failures

#### Controllers
- **predictionController.js**: User-facing trading endpoints
- **predictionAdminController.js**: Admin management endpoints

### Frontend Components

#### Pages
- **PredictionMarkets.jsx**: Browse all markets, search, filter by status
- **PredictionMarketDetail.jsx**: Market details, quote chart, trading interface
- **PredictionPortfolio.jsx**: User positions, PnL tracking, trade history, CSV export
- **PredictionAdmin.jsx**: Admin panel for market management

#### Components
- **QuoteChart.jsx**: SVG-based price history chart with bid/ask lines

## API Endpoints

### User Endpoints

#### `GET /api/prediction/markets`
List all markets with last quote.

**Response:**
```json
{
  "markets": [
    {
      "id": 1,
      "question": "Will Bitcoin reach $100K in 2025?",
      "status": "active",
      "lastQuote": {
        "yes_bid": 0.52,
        "yes_ask": 0.54,
        "no_bid": 0.46,
        "no_ask": 0.48
      }
    }
  ]
}
```

#### `GET /api/prediction/markets/:id`
Get market detail with quote history.

**Response:**
```json
{
  "market": { /* market details */ },
  "quotes": [ /* last 100 quotes */ ],
  "lastQuote": { /* current prices */ }
}
```

#### `POST /api/prediction/markets/:id/order`
Place a buy or sell order.

**Request:**
```json
{
  "side": "yes",      // "yes" or "no"
  "action": "buy",    // "buy" or "sell"
  "quantity": 10      // number of shares
}
```

**Response:**
```json
{
  "filled": true,
  "avgPrice": 0.54,
  "costAgon": 5.454,  // includes 1% fee for buys
  "newBalance": 994.546,
  "position": {
    "quantity": 10,
    "avg_price": 0.54
  }
}
```

#### `GET /api/prediction/portfolio`
Get user's portfolio.

**Response:**
```json
{
  "positions": [
    {
      "id": 1,
      "market_question": "Will Bitcoin reach $100K in 2025?",
      "side": "yes",
      "quantity": 10,
      "avg_price": 0.54,
      "current_price": 0.56,
      "unrealized_pnl": 0.2,
      "realized_pnl": 0
    }
  ],
  "trades": [ /* trade history */ ],
  "totals": {
    "equity": 1000.20,
    "cash": 994.546,
    "unrealizedPnl": 0.2,
    "realizedPnl": 0
  }
}
```

### Admin Endpoints

#### `POST /api/admin/prediction/markets/whitelist`
Add a market to the whitelist.

**Request:**
```json
{
  "pm_market_id": "0x123...",
  "yes_token_id": "0xabc...",
  "no_token_id": "0xdef..."
}
```

#### `PUT /api/admin/prediction/markets/:id/status`
Change market status.

**Request:**
```json
{
  "status": "paused"  // "active" or "paused"
}
```

#### `GET /api/admin/prediction/stats`
Get platform statistics.

**Response:**
```json
{
  "stats": {
    "totalMarkets": 25,
    "activePositions": 150,
    "totalVolume": 50000,
    "activeUsers": 75,
    "totalFees": 500,
    "platformExposure": {
      "maxExposure": 8500,
      "yesExposure": 8500,
      "noExposure": 6200
    }
  },
  "topMarkets": [ /* markets by volume */ ],
  "exposureByMarket": [ /* risk breakdown */ ]
}
```

## Trading Mechanics

### Pricing Model

Shares are priced between 0 and 1 Agon:
- **1 share pays 1 Agon** if your outcome wins, 0 if it loses
- Price represents implied probability (0.60 = 60% chance)
- Buy at ask price, sell at bid price
- Platform adds 0.5% spread on each side
- 1% fee applied to buy orders only

### Example Trade

**Market:** "Will it rain tomorrow?"  
**Current Price:** YES at 60¢ (ask), 58¢ (bid)

**User buys 100 YES shares:**
- Cost: 100 × 0.60 = 60 Agon
- Fee: 60 × 0.01 = 0.60 Agon
- Total: 60.60 Agon deducted from wallet
- Position: 100 shares @ 0.60 avg price

**Later, user sells 50 shares when YES is at 70¢ (bid):**
- Proceeds: 50 × 0.70 = 35 Agon
- Realized PnL: 50 × (0.70 - 0.60) = 5 Agon profit
- Remaining: 50 shares @ 0.60 avg price

**Market resolves YES:**
- Payout: 50 × 1.00 = 50 Agon
- Final PnL: 50 × (1.00 - 0.60) = 20 Agon profit
- Total profit: 5 + 20 = 25 Agon (before fees)

### Position Management

- **Long Only**: Users can only buy YES or NO, no shorting
- **FIFO Not Required**: Average price used for all shares
- **Partial Sells**: Can sell any quantity up to current holdings
- **Auto-Settlement**: Positions close automatically when market resolves

## Configuration

### Environment Variables

```env
# Risk Management
MAX_ORDER_SIZE=1000              # Max shares per order
TRADE_FEE_RATE=0.01             # 1% fee on buys
MAX_PLATFORM_EXPOSURE=10000     # Max exposure per market side

# Sync Settings
QUOTE_SYNC_INTERVAL=15000       # Quote sync every 15s
RESOLUTION_CHECK_INTERVAL=120000 # Resolution check every 2m
MAX_SYNC_FAILURES=5             # Auto-pause after 5 failures

# Polymarket API
POLYMARKET_API_BASE=https://gamma-api.polymarket.com
CLOB_API_BASE=https://clob.polymarket.com
```

### Adjusting Risk Limits

Edit `server/src/controllers/predictionController.js`:

```javascript
const MAX_ORDER_SIZE = 1000;           // Increase for larger orders
const TRADE_FEE_RATE = 0.01;          // Adjust fee percentage
const MAX_PLATFORM_EXPOSURE = 10000;   // Increase exposure limit
```

## Admin Guide

### Adding a New Market

1. Go to Admin Panel → Prediction Markets
2. Click "Whitelist Market"
3. Find the market on Polymarket and copy its `condition_id`
4. Enter the `condition_id` in the form
5. The system will automatically fetch token IDs and metadata
6. Market will be active and start syncing quotes

### Monitoring Platform Risk

The exposure metric shows maximum platform loss if one outcome wins:
- **YES Exposure**: Sum of (quantity × (1 - avg_price)) for all YES positions
- **NO Exposure**: Sum of (quantity × (1 - avg_price)) for all NO positions
- **Max Exposure**: The higher of the two

**Example:**
- Users hold 5,000 YES shares @ avg price 0.40
- Users hold 3,000 NO shares @ avg price 0.35
- YES exposure: 5,000 × (1 - 0.40) = 3,000 Agon
- NO exposure: 3,000 × (1 - 0.35) = 1,950 Agon
- Max exposure: 3,000 Agon (platform loses if YES wins)

### Pausing a Market

Markets should be paused when:
- Liquidity on Polymarket dries up
- Sync jobs repeatedly fail
- Unusual trading activity detected
- Market outcome becomes known before official resolution

### Handling Invalid Resolutions

If Polymarket resolves a market as "invalid":
1. All positions are refunded at their cost basis
2. Users receive: quantity × avg_price in Agon
3. No profit or loss is realized

## Testing

### Manual Testing Checklist

#### Basic Trading
- [ ] Browse markets list
- [ ] Search for specific market
- [ ] Filter by active/resolved
- [ ] View market detail
- [ ] Place buy order (YES)
- [ ] Place buy order (NO)
- [ ] Sell partial position
- [ ] Sell full position
- [ ] Check portfolio updates
- [ ] Export trade history

#### Edge Cases
- [ ] Try buying with insufficient balance
- [ ] Try selling more than position size
- [ ] Try buying over MAX_ORDER_SIZE
- [ ] Try trading on paused market
- [ ] Check exposure limit enforcement

#### Admin Functions
- [ ] Whitelist new market
- [ ] Pause market manually
- [ ] Resume market
- [ ] View platform stats
- [ ] Check exposure breakdown

### Automated Testing

Run the test suite:
```bash
cd server
npm test -- prediction
```

Key test cases:
- Position average price calculation
- Settlement PnL computation
- Exposure limit enforcement
- Fee calculation accuracy

## Troubleshooting

### Markets Not Syncing

**Symptoms:** Quote sync logs show repeated errors

**Solutions:**
1. Check Polymarket API status
2. Verify token IDs are correct in database
3. Check network connectivity
4. Markets may auto-pause after 5 failures

### Positions Not Settling

**Symptoms:** Market resolved but positions still open

**Solutions:**
1. Check resolution sync job logs
2. Verify market status is 'resolved' in database
3. Manually trigger settlement: `await settleMarket(marketId, outcome)`

### Exposure Limit False Positives

**Symptoms:** Orders rejected due to exposure when limit not reached

**Solutions:**
1. Check calculation in SQL query
2. Verify MAX_PLATFORM_EXPOSURE constant
3. Account for pending orders in calculation

## Future Enhancements

Potential features to add:
- **Limit Orders**: Place orders at specific prices
- **Stop Loss**: Auto-sell when price drops
- **Market Creation**: Users can propose new markets
- **Social Features**: Follow other traders, leaderboards
- **Portfolio Charts**: Visualize equity over time
- **Notifications**: Alert when positions settle or prices move
- **Mobile App**: Native iOS/Android apps
- **API Keys**: Allow algorithmic trading

## Security Considerations

- All trades are atomic (database transactions)
- Exposure limits prevent platform insolvency
- Prices sourced from external oracle (Polymarket)
- User balances validated before every trade
- Admin actions logged in activity_logs
- No direct on-chain interactions (internal ledger only)

## Performance Optimization

- Quote sync runs in background, doesn't block API
- Old quotes auto-deleted (keep last 1,000 per market)
- Database indexes on frequently queried columns
- PostgreSQL connection pooling enabled
- Frontend uses React.memo for expensive components
- Charts rendered with lightweight SVG (no external libs)

## Support

For issues or questions:
1. Check server logs: `docker logs phantompay-server`
2. Check sync job logs for market-specific issues
3. Verify Polymarket API status
4. Review database queries for slow performance
5. Check frontend console for errors

## License

This feature is part of PhantomPay and uses the same license as the main project.

