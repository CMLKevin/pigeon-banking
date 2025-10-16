import fetch from 'node-fetch';

// Polygon API config
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'quOm95IrOskctPxm8Qa_luWT8thYX3Gc';
const POLYGON_BASE_URL = 'https://api.polygon.io';

// Map supported non-crypto assets to Polygon symbols
// Gold uses Forex-like metal pair XAUUSD on Polygon (prefixed with X:)
export const SUPPORTED_STOCKS_AND_ASSETS = {
  gold: { id: 'gold', symbol: 'X:XAUUSD', name: 'Gold' },
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

async function polygonJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Polygon API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Fetch latest price for a Polygon symbol using aggregates (previous close + last trade)
async function fetchLatestForSymbol(symbol) {
  // Try last trade endpoint first
  const lastTradeUrl = `${POLYGON_BASE_URL}/v2/last/trade/${encodeURIComponent(symbol)}?apiKey=${POLYGON_API_KEY}`;
  const prevCloseUrl = `${POLYGON_BASE_URL}/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;

  let lastPrice = null;
  let changePct = 0;

  try {
    const [lastTrade, prevClose] = await Promise.all([
      polygonJson(lastTradeUrl),
      polygonJson(prevCloseUrl)
    ]);

    if (lastTrade && lastTrade.results && lastTrade.results.price) {
      lastPrice = Number(lastTrade.results.price);
    } else if (lastTrade && lastTrade.results && lastTrade.results.p) {
      lastPrice = Number(lastTrade.results.p);
    }

    const prevClosePrice = (prevClose && prevClose.results && prevClose.results[0] && prevClose.results[0].c)
      ? Number(prevClose.results[0].c)
      : null;

    if (lastPrice != null && prevClosePrice != null && prevClosePrice > 0) {
      changePct = ((lastPrice - prevClosePrice) / prevClosePrice) * 100;
    }
  } catch (e) {
    // Bubble up after allowing cached fallback by caller
    throw e;
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

  const fresh = await fetchLatestForSymbol(symbol);
  const entry = {
    ...fresh,
    last_fetch_ms: now
  };
  symbolCache.set(symbol, entry);
  return entry;
}

export async function getSupportedAssetPrices() {
  const entries = await Promise.all(
    Object.values(SUPPORTED_STOCKS_AND_ASSETS).map(async (asset) => {
      try {
        const data = await getPriceForSymbol(asset.symbol);
        return [asset.id, { id: asset.id, symbol: asset.symbol, name: asset.name, price: data.price, change_24h: data.change_24h, last_updated: data.last_updated }];
      } catch (e) {
        const cache = symbolCache.get(asset.symbol);
        if (cache) {
          return [asset.id, { id: asset.id, symbol: asset.symbol, name: asset.name, price: cache.price, change_24h: cache.change_24h, last_updated: cache.last_updated }];
        }
        return [asset.id, null];
      }
    })
  );

  const result = {};
  for (const [id, value] of entries) {
    if (value) result[id] = value;
  }
  return result;
}

export async function getSupportedCryptoPrices() {
  const entries = await Promise.all(
    Object.values(SUPPORTED_CRYPTO).map(async (asset) => {
      try {
        const data = await getPriceForSymbol(asset.symbol);
        return [asset.id, { id: asset.id, symbol: asset.symbol, name: asset.name, price: data.price, change_24h: data.change_24h, last_updated: data.last_updated }];
      } catch (e) {
        const cache = symbolCache.get(asset.symbol);
        if (cache) {
          return [asset.id, { id: asset.id, symbol: asset.symbol, name: asset.name, price: cache.price, change_24h: cache.change_24h, last_updated: cache.last_updated }];
        }
        return [asset.id, null];
      }
    })
  );

  const result = {};
  for (const [id, value] of entries) {
    if (value) result[id] = value;
  }
  return result;
}


