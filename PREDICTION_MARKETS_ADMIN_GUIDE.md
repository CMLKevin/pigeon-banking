# Prediction Markets Admin Guide - Adding Markets

## Current Issue: Empty Admin Panel

If your admin panel shows:
- "No markets whitelisted yet" 
- "All available markets have been whitelisted"

This means the Polymarket API call is failing. Let's diagnose and fix it!

---

## 🔍 Step 1: Check Server Logs

After pulling the latest code with verbose logging, check your Replit logs:

### What to Look For:

#### ✅ **Successful API Call:**
```
[fetchActiveMarkets] 🚀 Starting market fetch...
[Polymarket API] 🌐 Starting request to: https://gamma-api.polymarket.com/markets...
[Polymarket API] ✓ Response received in 850ms
[Polymarket API] 📊 Status: 200 OK
[fetchActiveMarkets] ✓ Received 250 markets from API
[fetchActiveMarkets] ✓ Filtered to 45 active markets
[fetchActiveMarkets] ✅ Success! Returning 45 markets (1200ms total)
```

#### ❌ **Failed API Call (Timeout):**
```
[Polymarket API] ⏱️  Request timed out after 10000ms
[Polymarket API] ⏳ Waiting 1000ms before retry 2...
[Polymarket API] 🛑 Max retries reached, giving up
[fetchActiveMarkets] ❌ FAILED after 31500ms
[fetchActiveMarkets] 💬 Error message: Request timeout after 10000ms (tried 3 times)
```

#### ❌ **Failed API Call (Network Error):**
```
[Polymarket API] ❌ Attempt 1/3 failed after 150ms
[Polymarket API] 💬 Error message: getaddrinfo ENOTFOUND gamma-api.polymarket.com
[fetchActiveMarkets] ❌ FAILED after 450ms
```

#### ❌ **Failed API Call (HTTP Error):**
```
[Polymarket API] 📊 Status: 429 Too Many Requests
[Polymarket API] ❌ HTTP Error 429:
[Polymarket API] 📄 Response body: {"error": "Rate limit exceeded"}
```

---

## 🛠️ Step 2: Diagnose the Issue

### Issue A: Network Connectivity
**Symptoms:** `ENOTFOUND`, `ECONNREFUSED`, `Network timeout`

**Causes:**
- Replit can't reach Polymarket's API
- Firewall blocking external requests
- DNS resolution failure

**Solutions:**
1. Test manually in Replit Shell:
   ```bash
   curl -I https://gamma-api.polymarket.com/markets
   ```
   Should return: `HTTP/2 200`

2. If blocked, try using a proxy or contact Replit support

3. As a workaround, manually add markets (see Step 3)

### Issue B: Rate Limiting
**Symptoms:** `HTTP 429`, "Rate limit exceeded", "Too many requests"

**Causes:**
- Too many API requests in short time
- Multiple sync jobs running
- Shared IP rate limit on Replit

**Solutions:**
1. Wait 5-10 minutes before trying again
2. Disable sync jobs temporarily:
   ```bash
   # In Replit Secrets, add:
   PREDICTION_ENABLED=false
   ```
3. Manually add markets using Market ID (see Step 3)

### Issue C: API Changes
**Symptoms:** `HTTP 404`, `Invalid response`, Empty markets array

**Causes:**
- Polymarket changed their API endpoint
- API structure changed
- API temporarily down

**Solutions:**
1. Check Polymarket's status: https://polymarket.com
2. Verify API endpoint in browser:
   ```
   https://gamma-api.polymarket.com/markets?limit=10
   ```
3. Report issue to PhantomPay developers

### Issue D: Timeout (Most Common on Replit)
**Symptoms:** Requests taking > 10 seconds, timeout errors

**Causes:**
- Replit's serverless cold start
- Slow network connection
- API responding slowly

**Solutions:**
1. Increase timeout in `server/src/services/polymarketService.js`:
   ```javascript
   const FETCH_TIMEOUT = 30000; // Increase from 10s to 30s
   ```
2. Use manual market addition (see Step 3)

---

## 📝 Step 3: Manually Add Markets

Since the Polymarket API might be unreliable on Replit, you can manually add markets using their Market ID.

### How to Find Market IDs:

1. **Go to Polymarket.com:**
   - Visit https://polymarket.com
   - Browse markets
   - Click on a market you want

2. **Get the Market ID from URL:**
   ```
   Example URL:
   https://polymarket.com/event/will-bitcoin-reach-100k-in-2025
                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                  This is the market slug

   Or look for condition_id in the page source
   ```

3. **Use the Manual Add Feature:**
   - Go to Admin Panel → Prediction Markets
   - Look for "Manually Add Market" section (coming in next update)
   - Enter the market's `condition_id`
   - Click "Add Market"

### Popular Market IDs to Try:

```javascript
// Presidential Election 2024
"0x..." // Check Polymarket for current condition_id

// Bitcoin Price Markets
"0x..." // Check Polymarket for current condition_id

// Sports Markets
"0x..." // Check Polymarket for current condition_id
```

### Add Market via API (Advanced):

Using Replit Shell or a tool like Postman:

```bash
curl -X POST https://your-app.replit.app/api/prediction/admin/markets/whitelist \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pm_market_id": "0x12345..."}'
```

---

## 🔧 Step 4: Temporary Solutions

### Solution 1: Reduce Volume Filter
Lower the minimum volume requirement to see more markets:

**File:** `server/src/services/polymarketService.js`
```javascript
// Change from:
const hasVolume = parseFloat(m.volume || 0) > 100;

// To:
const hasVolume = parseFloat(m.volume || 0) > 10; // Lower threshold
```

### Solution 2: Disable Filtering
See ALL markets from Polymarket:

```javascript
// Comment out filters:
const activeMarkets = markets; // Show everything

// Or just filter closed/archived:
const activeMarkets = markets.filter(m => 
  m.archived === false && m.closed === false
);
```

### Solution 3: Use Sample Markets
Add hardcoded markets for testing:

**File:** `server/src/controllers/predictionAdminController.js`
```javascript
// In getAvailableMarkets, add fallback:
if (markets.length === 0) {
  markets = [
    {
      pm_market_id: "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
      question: "Will Bitcoin reach $100,000 in 2025?",
      volume: "1000000",
      liquidity: "500000",
      end_date: "2025-12-31T23:59:59Z",
      outcomes: ["No", "Yes"],
      tokens: [
        { token_id: "123..." },
        { token_id: "456..." }
      ],
      metadata: {
        description: "Sample market for testing",
        category: "Crypto"
      }
    }
  ];
}
```

---

## ✅ Step 5: Verify Markets are Working

After adding markets:

### 1. Check Database
In Replit Shell:
```sql
# Connect to database
psql $DATABASE_URL

# List markets
SELECT id, question, status FROM prediction_markets;

# Check quotes
SELECT market_id, yes_ask, no_ask, created_at 
FROM prediction_quotes 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Test Frontend
- Go to `/prediction-markets`
- Should see the market listed
- Click on market
- Should see YES/NO prices
- Try placing a small order

### 3. Check Sync Jobs
Look for in server logs:
```
[syncQuotes] Syncing quotes for 1 active markets...
[syncQuotes] Quote sync complete: 1 succeeded, 0 failed
```

---

## 🚀 Step 6: Production Best Practices

### Option A: Pre-seed Markets
For production, don't rely on live Polymarket API during admin panel loads.

Instead, pre-seed popular markets:

```bash
# Create seed script: server/scripts/seed-markets.js
import db from '../src/config/database.js';

const popularMarkets = [
  {
    pm_market_id: "0x...",
    question: "Will Bitcoin reach $100K in 2025?",
    yes_token_id: "...",
    no_token_id: "...",
    // ... other fields
  },
  // Add more
];

for (const market of popularMarkets) {
  await db.exec(`
    INSERT INTO prediction_markets (...)
    VALUES (...)
    ON CONFLICT (pm_market_id) DO NOTHING
  `, [...]);
}
```

Run once: `node server/scripts/seed-markets.js`

### Option B: Cache API Results
Cache Polymarket API responses for 1 hour:

```javascript
// Add to server/src/services/polymarketService.js
let marketsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour

export const fetchActiveMarkets = async () => {
  const now = Date.now();
  if (marketsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('[fetchActiveMarkets] ✓ Using cached markets');
    return marketsCache;
  }
  
  // ... fetch from API ...
  marketsCache = mappedMarkets;
  cacheTimestamp = now;
  return marketsCache;
};
```

### Option C: Background Sync
Don't fetch during page load. Use background job:

1. Admin panel shows only whitelisted markets
2. Separate cron job fetches new markets every hour
3. Admin reviews and approves new markets
4. No blocking API calls during page loads

---

## 📊 Understanding the Logs

With verbose logging enabled, here's what each emoji means:

| Emoji | Meaning | Example |
|-------|---------|---------|
| 🚀 | Starting operation | `[fetchActiveMarkets] 🚀 Starting market fetch...` |
| 🌐 | Network request | `[Polymarket API] 🌐 Starting request to...` |
| ✓ | Success | `[Polymarket API] ✓ Response received in 850ms` |
| ❌ | Error | `[Polymarket API] ❌ Attempt 1/3 failed` |
| 🔄 | Retry | `[Polymarket API] 🔄 Attempt 2/3` |
| ⏱️ | Timeout | `[Polymarket API] ⏱️  Request timed out` |
| 🛑 | Giving up | `[Polymarket API] 🛑 Max retries reached` |
| 📊 | Statistics | `[fetchActiveMarkets] 📊 Filter stats:` |
| 💬 | Message | `[Polymarket API] 💬 Error message:` |
| 📋 | Data structure | `[fetchActiveMarkets] 📋 Sample market structure:` |
| 📈 📉 | Prices/quotes | `[fetchQuotes] 📈 Order book sizes` |
| 💰 | Money/pricing | `[fetchQuotes] 💰 Raw prices` |
| ⚙️ | Configuration | `[Polymarket API] ⚙️  Max retries: 3` |
| ⏳ | Waiting | `[Polymarket API] ⏳ Waiting 1000ms before retry` |
| 🔍 | Debugging | `[Polymarket API] 🔍 Error type:` |
| 📚 | Stack trace | `[Polymarket API] 📚 Stack trace:` |

---

## 🆘 Still Having Issues?

1. **Share your logs:**
   - Copy the entire server log output
   - Look for lines with `[fetchActiveMarkets]` or `[Polymarket API]`
   - Share with developer/support

2. **Check System Status:**
   - Polymarket: https://polymarket.com
   - Replit: https://status.replit.com
   - Your app: `/health` endpoint

3. **Disable Prediction Markets Temporarily:**
   ```bash
   # In Replit Secrets:
   PREDICTION_ENABLED=false
   ```
   This will disable sync jobs but keep the feature accessible

4. **Use Alternative Data Source:**
   - Manually add markets via admin panel
   - Import from CSV/JSON file
   - Use cached market data

---

## 📖 Related Documentation

- `PREDICTION_MARKETS.md` - Feature overview
- `PREDICTION_MARKETS_BUGFIXES.md` - Bug fixes and optimizations
- `REPLIT_DEPLOYMENT_FIX.md` - Deployment issues
- `REPLIT_QUICK_FIX.md` - Common problems

---

**Status**: Enhanced with verbose logging  
**Last Updated**: 2025-10-14  
**Version**: 2.0 with comprehensive debugging

