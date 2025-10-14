import fetch from 'node-fetch';

// CoinGecko API configuration
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || 'CG-DZE6q6KdGmN9kUqoaJCoWHEq';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Helper function to make CoinGecko API calls
async function callCoinGeckoAPI(endpoint, params = {}) {
  const queryParams = new URLSearchParams(params);
  const url = `${COINGECKO_BASE_URL}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const headers = {
    'Accept': 'application/json'
  };
  
  if (COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Map of supported coins
const SUPPORTED_COINS = {
  bitcoin: { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  dogecoin: { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' }
};

// Cache for prices (refreshed every 30 seconds)
let priceCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch current prices for all supported cryptocurrencies
 */
async function fetchCurrentPrices() {
  try {
    const coinIds = Object.keys(SUPPORTED_COINS).join(',');
    
    const data = await callCoinGeckoAPI('/simple/price', {
      ids: coinIds,
      vs_currencies: 'usd',
      include_24hr_change: 'true',
      include_24hr_vol: 'true',
      include_market_cap: 'true'
    });

    // Transform the response
    const prices = {};
    for (const [coinId, coinData] of Object.entries(data)) {
      if (coinData && coinData.usd) {
        prices[coinId] = {
          ...SUPPORTED_COINS[coinId],
          price: Number(coinData.usd),
          change_24h: Number(coinData.usd_24h_change || 0),
          volume_24h: Number(coinData.usd_24h_vol || 0),
          market_cap: Number(coinData.usd_market_cap || 0),
          last_updated: new Date()
        };
      }
    }

    // Only update cache if we got valid prices
    if (Object.keys(prices).length > 0) {
      priceCache = prices;
      lastFetchTime = Date.now();
    }
    
    return prices;
  } catch (error) {
    console.error('Error fetching CoinGecko prices:', error);
    // Return cached prices if available
    if (Object.keys(priceCache).length > 0) {
      console.log('Returning cached prices due to API error');
      return priceCache;
    }
    throw error;
  }
}

/**
 * Get current prices (from cache if recent, otherwise fetch)
 */
async function getCurrentPrices() {
  const now = Date.now();
  if (now - lastFetchTime > CACHE_DURATION || Object.keys(priceCache).length === 0) {
    return await fetchCurrentPrices();
  }
  return priceCache;
}

/**
 * Get price for a specific coin
 */
async function getCoinPrice(coinId) {
  const prices = await getCurrentPrices();
  return prices[coinId];
}

/**
 * Fetch historical price data for charts
 */
async function getHistoricalPrices(coinId, days = 7) {
  try {
    const data = await callCoinGeckoAPI(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: days.toString(),
      interval: days > 1 ? 'hourly' : 'minutely'
    });

    // Transform to simpler format
    const prices = data.prices.map(([timestamp, price]) => ({
      timestamp: new Date(timestamp),
      price: Number(price)
    }));

    return prices;
  } catch (error) {
    console.error(`Error fetching historical prices for ${coinId}:`, error);
    throw error;
  }
}

/**
 * Get detailed coin information
 */
async function getCoinInfo(coinId) {
  try {
    const data = await callCoinGeckoAPI(`/coins/${coinId}`, {
      localization: 'false',
      tickers: 'false',
      community_data: 'false',
      developer_data: 'false'
    });

    return {
      id: data.id,
      symbol: data.symbol?.toUpperCase() || '',
      name: data.name,
      description: data.description?.en || '',
      image: data.image?.large || '',
      market_cap_rank: data.market_cap_rank || 0,
      current_price: Number(data.market_data?.current_price?.usd || 0),
      market_cap: Number(data.market_data?.market_cap?.usd || 0),
      total_volume: Number(data.market_data?.total_volume?.usd || 0),
      high_24h: Number(data.market_data?.high_24h?.usd || 0),
      low_24h: Number(data.market_data?.low_24h?.usd || 0),
      price_change_24h: Number(data.market_data?.price_change_24h || 0),
      price_change_percentage_24h: Number(data.market_data?.price_change_percentage_24h || 0),
      circulating_supply: Number(data.market_data?.circulating_supply || 0),
      total_supply: Number(data.market_data?.total_supply || 0),
      ath: Number(data.market_data?.ath?.usd || 0),
      atl: Number(data.market_data?.atl?.usd || 0)
    };
  } catch (error) {
    console.error(`Error fetching coin info for ${coinId}:`, error);
    throw error;
  }
}

/**
 * Initialize price fetching interval
 */
function startPriceFetching() {
  // Fetch immediately
  fetchCurrentPrices().catch(err => console.error('Initial price fetch failed:', err));
  
  // Then fetch every 30 seconds
  setInterval(() => {
    fetchCurrentPrices().catch(err => console.error('Price fetch failed:', err));
  }, CACHE_DURATION);
}

export {
  SUPPORTED_COINS,
  getCurrentPrices,
  getCoinPrice,
  getHistoricalPrices,
  getCoinInfo,
  startPriceFetching
};
