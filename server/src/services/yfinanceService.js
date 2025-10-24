import yahooFinance from 'yahoo-finance2';

// Map supported assets to Yahoo Finance symbols
export const SUPPORTED_STOCKS_AND_ASSETS = {
  gold: { id: 'gold', symbol: 'GC=F', name: 'Gold' }, // Gold Futures
  tsla: { id: 'tsla', symbol: 'TSLA', name: 'Tesla, Inc.' },
  aapl: { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.' },
  nvda: { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corporation' }
};

// Crypto supported via Yahoo Finance (USD pairs)
export const SUPPORTED_CRYPTO = {
  bitcoin: { id: 'bitcoin', symbol: 'BTC-USD', name: 'Bitcoin' },
  ethereum: { id: 'ethereum', symbol: 'ETH-USD', name: 'Ethereum' },
  dogecoin: { id: 'dogecoin', symbol: 'DOGE-USD', name: 'Dogecoin' }
};

// Per-symbol cache to ensure reasonable refresh intervals
const symbolCache = new Map(); // key: symbol, value: { price, change_24h, last_updated, last_fetch_ms }
const MIN_REFRESH_MS = 15000; // 15 seconds

/**
 * Fetch latest price for a Yahoo Finance symbol
 * @param {string} symbol - Yahoo Finance symbol (e.g., 'AAPL', 'BTC-USD', 'GC=F')
 * @returns {Promise<{price: number, change_24h: number, last_updated: Date}>}
 */
async function fetchLatestForSymbol(symbol) {
  try {
    // Fetch quote data from Yahoo Finance
    const quote = await yahooFinance.quote(symbol);
    
    if (!quote || !quote.regularMarketPrice) {
      throw new Error(`No price data available for ${symbol}`);
    }

    const price = quote.regularMarketPrice;
    
    // Calculate 24h change percentage
    // Yahoo provides regularMarketChangePercent which is the change from previous close
    const changePercent = quote.regularMarketChangePercent || 0;
    
    return {
      price: price,
      change_24h: changePercent,
      last_updated: new Date()
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Get price for a symbol with caching
 * @param {string} symbol - Yahoo Finance symbol
 * @returns {Promise<{price: number, change_24h: number, last_updated: Date, last_fetch_ms: number}>}
 */
export async function getPriceForSymbol(symbol) {
  const cache = symbolCache.get(symbol);
  const now = Date.now();
  
  // Return cached data if it's fresh enough
  if (cache && now - cache.last_fetch_ms < MIN_REFRESH_MS) {
    return cache;
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

/**
 * Return cached price entry if available; does not perform any network call
 * @param {string} symbol - Yahoo Finance symbol
 * @returns {object|null}
 */
export function getCachedPriceForSymbol(symbol) {
  return symbolCache.get(symbol) || null;
}

/**
 * Get prices for all supported stocks and assets
 * @returns {Promise<Object>} Object with asset IDs as keys
 */
export async function getSupportedAssetPrices() {
  const result = {};
  
  // Fetch all symbols in parallel for better performance
  const promises = Object.values(SUPPORTED_STOCKS_AND_ASSETS).map(async (asset) => {
    try {
      const data = await getPriceForSymbol(asset.symbol);
      return {
        id: asset.id,
        data: {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          price: data.price,
          change_24h: data.change_24h,
          last_updated: data.last_updated
        }
      };
    } catch (e) {
      console.warn(`Failed to get price for ${asset.id}:`, e.message);
      const cache = symbolCache.get(asset.symbol);
      if (cache) {
        console.log(`Using cached data for ${asset.id}`);
        return {
          id: asset.id,
          data: {
            id: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            price: cache.price,
            change_24h: cache.change_24h,
            last_updated: cache.last_updated
          }
        };
      }
      return null;
    }
  });

  const results = await Promise.all(promises);
  results.forEach(item => {
    if (item) {
      result[item.id] = item.data;
    }
  });
  
  return result;
}

/**
 * Get prices for all supported cryptocurrencies
 * @returns {Promise<Object>} Object with crypto IDs as keys
 */
export async function getSupportedCryptoPrices() {
  const result = {};
  
  // Fetch all symbols in parallel for better performance
  const promises = Object.values(SUPPORTED_CRYPTO).map(async (asset) => {
    try {
      const data = await getPriceForSymbol(asset.symbol);
      return {
        id: asset.id,
        data: {
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          price: data.price,
          change_24h: data.change_24h,
          last_updated: data.last_updated
        }
      };
    } catch (e) {
      console.warn(`Failed to get price for ${asset.id}:`, e.message);
      const cache = symbolCache.get(asset.symbol);
      if (cache) {
        console.log(`Using cached data for ${asset.id}`);
        return {
          id: asset.id,
          data: {
            id: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            price: cache.price,
            change_24h: cache.change_24h,
            last_updated: cache.last_updated
          }
        };
      }
      return null;
    }
  });

  const results = await Promise.all(promises);
  results.forEach(item => {
    if (item) {
      result[item.id] = item.data;
    }
  });
  
  return result;
}
