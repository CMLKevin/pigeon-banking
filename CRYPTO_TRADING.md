# Crypto Trading Feature

## Overview

The Crypto Trading feature allows users to trade Bitcoin (BTC), Ethereum (ETH), and Dogecoin (DOGE) with leverage using the platform's Agon currency. Users can open long or short positions with leverage ranging from 1x to 10x.

## Features

- **Live Price Data**: Real-time cryptocurrency prices from CoinGecko API, updated every 30 seconds
- **Leveraged Trading**: Trade with 1x to 10x leverage
- **Long & Short Positions**: Bet on both rising and falling prices
- **Dynamic Commission**: Commission scales from 1% (1x leverage) to 5% (10x leverage)
- **Historical Charts**: View price history for 1, 7, or 30 days
- **Position Management**: View open positions with real-time P&L tracking
- **Trading Statistics**: Track win rate, total P&L, and trading history

## Setup

### 1. Environment Variable

Add your CoinGecko API key to your environment variables:

**For Replit:**
1. Go to the "Secrets" tab (lock icon) in Replit
2. Add a new secret:
   - Key: `COINGECKO_API_KEY`
   - Value: `CG-DZE6q6KdGmN9kUqoaJCoWHEq`

**For Local Development:**
Add to your `server/.env` file:
```
COINGECKO_API_KEY=CG-DZE6q6KdGmN9kUqoaJCoWHEq
```

### 2. Database Schema

The database schema is automatically created when you start the server. Two new tables are added:

- `crypto_positions`: Stores user trading positions
- `crypto_price_history`: Stores historical price data

### 3. Supported Cryptocurrencies

- **Bitcoin (BTC)**
- **Ethereum (ETH)**
- **Dogecoin (DOGE)**

## How It Works

### Opening a Position

1. Select a cryptocurrency (BTC, ETH, or DOGE)
2. Choose position type (Long or Short)
   - **Long**: Profit when price goes up
   - **Short**: Profit when price goes down
3. Select leverage (1x to 10x)
4. Enter margin amount in Agon (Ⱥ)
5. Review commission and position value
6. Click "Open Position"

### Commission Structure

Commission is calculated based on leverage:
- **1x leverage**: 1% commission
- **2x leverage**: 1.44% commission
- **5x leverage**: 2.78% commission
- **10x leverage**: 5% commission

Formula: `1% + ((leverage - 1) / 9) * 4%`

### Position Value Calculation

```
Net Margin = Margin Amount - Commission
Position Value = Net Margin × Leverage
```

Example:
- Margin: 100 Ⱥ
- Leverage: 5x
- Commission (2.78%): 2.78 Ⱥ
- Net Margin: 97.22 Ⱥ
- Position Value: 486.10 Ⱥ

### Profit/Loss Calculation

**For Long Positions:**
```
P&L = ((Current Price - Entry Price) / Entry Price) × Net Margin × Leverage
```

**For Short Positions:**
```
P&L = ((Entry Price - Current Price) / Entry Price) × Net Margin × Leverage
```

### Liquidation

Positions are automatically liquidated when:
- **Long positions**: Price drops by `1/leverage × 90%`
- **Short positions**: Price rises by `1/leverage × 90%`

Example with 10x leverage:
- Long position liquidates at ~9% price drop
- Short position liquidates at ~9% price rise

### Closing a Position

1. Navigate to your open positions
2. Click "Close Position" on the position you want to close
3. Confirm the action
4. Your margin + P&L (if any) is returned to your Agon balance

## API Endpoints

### Get Current Prices
```
GET /api/crypto/prices
```

### Get Historical Prices
```
GET /api/crypto/prices/:coinId/history?days=7
```

### Open Position
```
POST /api/crypto/positions
Body: {
  coinId: "bitcoin",
  positionType: "long",
  leverage: 5,
  marginAmon: 100
}
```

### Get User Positions
```
GET /api/crypto/positions?status=open
```

### Close Position
```
POST /api/crypto/positions/:positionId/close
```

### Get Trading Stats
```
GET /api/crypto/stats
```

## Frontend Navigation

Access the Crypto Trading feature via:
1. Click "Markets" in the main navigation
2. Select "Crypto Trading" from the dropdown

## Technical Implementation

### Backend
- **Service**: `server/src/services/coinGeckoService.js`
- **Controller**: `server/src/controllers/cryptoController.js`
- **Routes**: `server/src/routes/crypto.js`
- **Database**: PostgreSQL with automatic schema creation

### Frontend
- **Page**: `client/src/pages/Crypto.jsx`
- **API**: `client/src/services/api.js` (cryptoAPI)
- **Navigation**: Updated in `client/src/components/Navbar.jsx`

### Price Fetching
- Prices are fetched every 30 seconds using the CoinGecko SDK
- Cached on the server to reduce API calls
- Automatically distributed to all active users

## Security Considerations

1. **API Key**: Store securely in environment variables, never in code
2. **Transaction Validation**: All trades are validated server-side
3. **Balance Checks**: User balance is verified before opening positions
4. **SQL Injection**: Parameterized queries used throughout
5. **Authentication**: All endpoints require JWT authentication

## Troubleshooting

### Prices Not Updating
- Check that COINGECKO_API_KEY is set correctly
- Verify the CoinGecko service is running (check server logs)
- Ensure the API key has sufficient quota

### Cannot Open Position
- Verify sufficient Agon balance
- Check that leverage is between 1 and 10
- Ensure margin amount is positive
- Check server logs for detailed error messages

### Database Errors
- Run the server to auto-create tables
- Check PostgreSQL connection
- Verify DATABASE_URL environment variable

## Future Enhancements

Potential improvements:
- Add more cryptocurrencies
- Implement take-profit and stop-loss orders
- Add trading indicators and technical analysis
- Implement order types (market, limit, stop)
- Add leverage level indicators
- Implement risk management tools
- Add notification system for position changes

