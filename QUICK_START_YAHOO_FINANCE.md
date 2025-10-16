# Quick Start Guide - Yahoo Finance Integration

## What Changed?

✅ **Migrated from Polygon.io to Yahoo Finance**  
✅ **Added TradingView Advanced Charts**  
✅ **No API keys required**  
✅ **All 7 assets supported:** Bitcoin, Ethereum, Dogecoin, Gold, Tesla, Apple, NVIDIA

## Installation

### 1. Install Dependencies

```bash
# Server dependencies
cd server
npm install

# Client dependencies (if needed)
cd ../client
npm install
```

### 2. Start the Application

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

### 3. Access the Application

- **Client:** http://localhost:5173
- **Server:** http://localhost:3001
- **Trading Page:** http://localhost:5173/trading

## Testing

### Run Integration Tests

```bash
# From project root
node test-trading-integration.js
```

Expected output:
```
✅ Test 1: Warming price cache
✅ Test 2: Fetching combined prices (7 assets)
✅ Test 3: Verifying all expected assets present
✅ Test 4: Verifying price data structure

🎉 All tests passed!
```

### Manual Testing

1. **Navigate to Trading Page**
   - Go to http://localhost:5173/trading
   - You should see the TradingView chart at the top

2. **Check Price Updates**
   - Prices should load within a few seconds
   - All 7 assets should show current prices

3. **Test Chart Interaction**
   - Click different assets (BTC, ETH, DOGE, Gold, TSLA, AAPL, NVDA)
   - Chart should update to show the selected asset
   - Chart is fully interactive with TradingView tools

4. **Test Trading Functions**
   - Select an asset
   - Choose position type (Long/Short)
   - Set leverage (1x-10x)
   - Enter margin amount
   - Open a position
   - Close the position

## Key Features

### 1. Real-Time Price Data
- Powered by Yahoo Finance
- Updates every 15 seconds
- Cached for performance
- 7 supported assets

### 2. Professional Charts
- TradingView Advanced Chart widget
- Multiple timeframes (1m, 5m, 15m, 1h, 4h, 1D, 1W, 1M)
- Technical indicators
- Drawing tools
- Full-screen mode

### 3. Trading Features
- Long/Short positions
- 1x-10x leverage
- Commission: 1%-5% (scales with leverage)
- Daily maintenance fees
- Real-time P&L calculation

## Troubleshooting

### Prices Not Loading

**Symptom:** Empty price cards or "Price unavailable"

**Solutions:**
1. Check internet connection
2. Wait 15-30 seconds for initial load
3. Click "Refresh" button
4. Check browser console for errors

### Chart Not Displaying

**Symptom:** Empty chart area or loading forever

**Solutions:**
1. Check browser console for script loading errors
2. Ensure TradingView CDN is accessible
3. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Disable ad blockers temporarily

### Server Errors

**Symptom:** 500 errors or connection refused

**Solutions:**
1. Ensure server is running on port 3001
2. Check server logs for errors
3. Verify database connection
4. Restart server: `npm run dev`

## API Endpoints

All existing endpoints remain unchanged:

```
GET  /api/trading/prices          - Get all asset prices
GET  /api/crypto/prices            - Get crypto prices (legacy)
GET  /api/crypto/info/:coinId      - Get asset info
POST /api/crypto/positions         - Open position
GET  /api/crypto/positions         - Get user positions
DELETE /api/crypto/positions/:id   - Close position
```

## Environment Variables

### Required
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

### Not Required Anymore
```env
# POLYGON_API_KEY - No longer needed!
```

## Performance

### Caching Strategy
- **Cache Duration:** 15 seconds per symbol
- **Parallel Fetching:** All 7 assets fetched simultaneously
- **Fallback:** Stale cache used if API fails
- **No Rate Limits:** Yahoo Finance is generous with free tier

### Expected Load Times
- **Initial Load:** 2-3 seconds
- **Subsequent Loads:** < 1 second (cached)
- **Chart Load:** 1-2 seconds
- **Price Updates:** Real-time (15s refresh)

## Supported Assets

| Asset    | Symbol | Type   | Exchange     |
|----------|--------|--------|--------------|
| Bitcoin  | BTC    | Crypto | -            |
| Ethereum | ETH    | Crypto | -            |
| Dogecoin | DOGE   | Crypto | -            |
| Gold     | XAU    | Metal  | Futures      |
| Tesla    | TSLA   | Stock  | NASDAQ       |
| Apple    | AAPL   | Stock  | NASDAQ       |
| NVIDIA   | NVDA   | Stock  | NASDAQ       |

## Next Steps

### Add More Assets

Edit `server/src/services/yfinanceService.js`:

```javascript
export const SUPPORTED_STOCKS_AND_ASSETS = {
  // ... existing assets ...
  spy: { id: 'spy', symbol: 'SPY', name: 'S&P 500 ETF' },
  // Add more here
};
```

Then update `client/src/pages/Trading.jsx` to include the new asset in the `ASSETS` array.

### Implement Historical Data

```javascript
import yahooFinance from 'yahoo-finance2';

const history = await yahooFinance.historical('AAPL', {
  period1: '2024-01-01',
  period2: '2024-12-31',
  interval: '1d'
});
```

### Customize TradingView Chart

Edit `client/src/components/TradingViewChart.jsx` to change:
- Theme (light/dark)
- Interval (1m, 5m, 1h, 1D, etc.)
- Studies/Indicators
- Toolbar visibility
- And more...

## Resources

- [Yahoo Finance 2 Documentation](https://github.com/gadicc/yahoo-finance2)
- [TradingView Widget Docs](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/)
- [Migration Summary](./YAHOO_FINANCE_MIGRATION.md)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for errors
3. Check browser console for frontend errors
4. Verify all dependencies are installed
5. Ensure ports 3001 and 5173 are available

---

**Happy Trading! 📈**
