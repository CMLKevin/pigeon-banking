import fetch from 'node-fetch';

// Polygon API config
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'quOm95IrOskctPxm8Qa_luWT8thYX3Gc';
const POLYGON_BASE_URL = 'https://api.polygon.io';
const POLYGON_ENABLE_LAST = (process.env.POLYGON_ENABLE_LAST || 'false').toLowerCase() === 'true';

// Map supported non-crypto assets to Polygon symbols
// Gold uses currency-like metal pair XAUUSD on Polygon (prefixed with C:)
export const SUPPORTED_STOCKS_AND_ASSETS = {
  gold: { id: 'gold', symbol: 'C:XAUUSD', name: 'Gold' },
  tsla: { id: 'tsla', symbol: 'TSLA', name: 'Tesla, Inc.' },
  aapl: { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.' },
  nvda: { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corporation' }
};

// Crypto supported via Polygon (USD pairs)
export const SUPPORTED_CRYPTO = {
  bitcoin: { id: 'bitcoin', symbol: 'X:BTCUSD', name: 'Bitcoin' },
  ethereum: { id: 'ethereum', symbol: 'X:ETHUSD', name: 'Ethereum' },
  dogecoin: { id: 'dogecoin', symbol: 'X:DOGEUSD', name: 'Dogecoin' }
};

// Per-symbol cache to ensure at least 15s between REST calls
const symbolCache = new Map(); // key: symbol, value: { price, change_24h, last_updated, last_fetch_ms }
const MIN_REFRESH_MS = 15000; // 15 seconds

// Global rate limiting to prevent hitting API limits
let lastApiCallTime = 0;
const API_CALL_DELAY_MS = 15000; // 15 seconds between API calls (free plan ~5 req/min)

// Helper to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ensure minimum delay between API calls globally
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;
  
  if (timeSinceLastCall < API_CALL_DELAY_MS) {
    const waitTime = API_CALL_DELAY_MS - timeSinceLastCall;
    console.log(`Rate limiting: target ${Math.round(API_CALL_DELAY_MS / 1000)}s, waiting ${Math.round(waitTime / 1000)}s before next API call`);
    await delay(waitTime);
  }
  
  lastApiCallTime = Date.now();
}

async function polygonJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const errorMsg = `Polygon API error: ${res.status} ${res.statusText}`;
    if (res.status === 403) {
      throw new Error(`API access forbidden (403) - may be rate limited or API key issue`);
    }
    if (res.status === 429) {
      throw new Error(`Rate limit exceeded (429) - too many requests`);
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

// Fetch latest price for a Polygon symbol using aggregates (previous close + last trade)
async function fetchLatestForSymbol(symbol) {
  // Build endpoints
  const isCurrency = symbol.startsWith('C:');
  const isCrypto = symbol.startsWith('X:');
  let lastUrl = null;
  if (POLYGON_ENABLE_LAST) {
    if (isCrypto) {
      const pair = symbol.slice(2);
      const from = pair.slice(0, 3);
      const to = pair.slice(3);
      lastUrl = `${POLYGON_BASE_URL}/v2/last/trade/crypto/${encodeURIComponent(from)}/${encodeURIComponent(to)}?apiKey=${POLYGON_API_KEY}`;
    } else if (isCurrency) {
      const pair = symbol.slice(2);
      const from = pair.slice(0, 3);
      const to = pair.slice(3);
      lastUrl = `${POLYGON_BASE_URL}/v1/last_quote/currencies/${encodeURIComponent(from)}/${encodeURIComponent(to)}?apiKey=${POLYGON_API_KEY}`;
    } else {
      lastUrl = `${POLYGON_BASE_URL}/v2/last/trade/${encodeURIComponent(symbol)}?apiKey=${POLYGON_API_KEY}`;
    }
  }
  const prevCloseUrl = `${POLYGON_BASE_URL}/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;

  let lastPrice = null;
  let changePct = 0;
  let prevClosePrice = null;

  try {
    // Apply rate limiting and fetch data based on plan
    let lastAny = null;
    if (POLYGON_ENABLE_LAST && lastUrl) {
      await waitForRateLimit();
      lastAny = await polygonJson(lastUrl).catch(err => {
        console.warn(`Failed to fetch last ${isCurrency ? 'quote' : 'trade'} for ${symbol}:`, err.message);
        return null;
      });
    }

    await waitForRateLimit();
    const prevClose = await polygonJson(prevCloseUrl).catch(err => {
      console.warn(`Failed to fetch prev close for ${symbol}:`, err.message);
      return null;
    });

    if (lastAny) {
      // Trade responses often have results.price or results.p
      const r = lastAny.last || lastAny.results || lastAny;
      const tradePrice = r && (r.price ?? r.p);
      if (tradePrice != null) {
        lastPrice = Number(tradePrice);
      }
      // Quote responses may have bid/ask fields: bid, ask or bp/ap
      if (lastPrice == null) {
        const bid = r && (r.bid ?? r.bp ?? r.bid_price);
        const ask = r && (r.ask ?? r.ap ?? r.ask_price);
        if (bid != null && ask != null) {
          lastPrice = (Number(bid) + Number(ask)) / 2;
        } else if (ask != null) {
          lastPrice = Number(ask);
        } else if (bid != null) {
          lastPrice = Number(bid);
        }
      }
    }

    prevClosePrice = (prevClose && prevClose.results && prevClose.results[0] && (prevClose.results[0].c ?? prevClose.results[0].close))
      ? Number(prevClose.results[0].c ?? prevClose.results[0].close)
      : null;

    if (lastPrice != null && prevClosePrice != null && prevClosePrice > 0) {
      changePct = ((lastPrice - prevClosePrice) / prevClosePrice) * 100;
    }
  } catch (e) {
    console.error(`Error processing price data for ${symbol}:`, e.message);
    throw e;
  }

  // Fallback: if we couldn't get a last price but we have prev close, use it
  if (lastPrice == null && prevClosePrice != null) {
    lastPrice = prevClosePrice;
    changePct = 0;
  }

  if (lastPrice == null) {
    throw new Error(`No price data for ${symbol}`);
  }

  return {
    price: lastPrice,
    change_24h: changePct,
    last_updated: new Date()
  };
}

export async function getPriceForSymbol(symbol) {
  const cache = symbolCache.get(symbol);
  const now = Date.now();
  if (cache && now - cache.last_fetch_ms < MIN_REFRESH_MS) {
    return cache; // serve cached within 15s window
  }

  try {
    const fresh = await fetchLatestForSymbol(symbol);
    const entry = {
      ...fresh,
      last_fetch_ms: now
    };
    symbolCache.set(symbol, entry);
    return entry;
  } catch (error) {
    console.warn(`Failed to fetch fresh price for ${symbol}, using cache if available:`, error.message);
    if (cache) {
      console.log(`Returning stale cache for ${symbol}`);
      return cache;
    }
    throw error;
  }
}

// Return cached price entry if available; does not perform any network call
export function getCachedPriceForSymbol(symbol) {
  return symbolCache.get(symbol) || null;
}

export async function getSupportedAssetPrices() {
  const result = {};
  
  // Fetch sequentially to avoid rate limits
  for (const asset of Object.values(SUPPORTED_STOCKS_AND_ASSETS)) {
    try {
      const data = await getPriceForSymbol(asset.symbol);
      result[asset.id] = { 
        id: asset.id, 
        symbol: asset.symbol, 
        name: asset.name, 
        price: data.price, 
        change_24h: data.change_24h, 
        last_updated: data.last_updated 
      };
    } catch (e) {
      console.warn(`Failed to get price for ${asset.id}:`, e.message);
      const cache = symbolCache.get(asset.symbol);
      if (cache) {
        console.log(`Using cached data for ${asset.id}`);
        result[asset.id] = { 
          id: asset.id, 
          symbol: asset.symbol, 
          name: asset.name, 
          price: cache.price, 
          change_24h: cache.change_24h, 
          last_updated: cache.last_updated 
        };
      }
      // Skip this asset if no cache available
    }
  }
  
  return result;
}

export async function getSupportedCryptoPrices() {
  const result = {};
  
  // Fetch sequentially to avoid rate limits
  for (const asset of Object.values(SUPPORTED_CRYPTO)) {
    try {
      const data = await getPriceForSymbol(asset.symbol);
      result[asset.id] = { 
        id: asset.id, 
        symbol: asset.symbol, 
        name: asset.name, 
        price: data.price, 
        change_24h: data.change_24h, 
        last_updated: data.last_updated 
      };
    } catch (e) {
      console.warn(`Failed to get price for ${asset.id}:`, e.message);
      const cache = symbolCache.get(asset.symbol);
      if (cache) {
        console.log(`Using cached data for ${asset.id}`);
        result[asset.id] = { 
          id: asset.id, 
          symbol: asset.symbol, 
          name: asset.name, 
          price: cache.price, 
          change_24h: cache.change_24h, 
          last_updated: cache.last_updated 
        };
      }
      // Skip this asset if no cache available
    }
  }
  
  return result;
}


