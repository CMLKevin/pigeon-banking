import fetch from 'node-fetch';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';
const FETCH_TIMEOUT = 10000; // 10 seconds timeout
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to fetch with timeout and retry with verbose logging
const fetchWithTimeout = async (url, options = {}, retries = MAX_RETRIES) => {
  const startTime = Date.now();
  console.log(`[Polymarket API] 🌐 Starting request to: ${url}`);
  console.log(`[Polymarket API] ⚙️  Max retries: ${retries}, Timeout: ${FETCH_TIMEOUT}ms`);

  for (let attempt = 0; attempt < retries; attempt++) {
    const attemptStart = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      console.log(`[Polymarket API] 🔄 Attempt ${attempt + 1}/${retries} for ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      const duration = Date.now() - attemptStart;
      
      console.log(`[Polymarket API] ✓ Response received in ${duration}ms`);
      console.log(`[Polymarket API] 📊 Status: ${response.status} ${response.statusText}`);
      console.log(`[Polymarket API] 📋 Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[Polymarket API] ❌ HTTP Error ${response.status}:`);
        console.error(`[Polymarket API] 📄 Response body: ${errorBody.substring(0, 500)}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeout);
      const duration = Date.now() - attemptStart;
      
      console.error(`[Polymarket API] ❌ Attempt ${attempt + 1}/${retries} failed after ${duration}ms`);
      console.error(`[Polymarket API] 🔍 Error type: ${error.name}`);
      console.error(`[Polymarket API] 💬 Error message: ${error.message}`);
      
      if (error.stack) {
        console.error(`[Polymarket API] 📚 Stack trace: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
      
      // Don't retry on abort (timeout) or if it's the last attempt
      if (error.name === 'AbortError') {
        console.error(`[Polymarket API] ⏱️  Request timed out after ${FETCH_TIMEOUT}ms`);
        if (attempt === retries - 1) {
          console.error(`[Polymarket API] 🛑 Max retries reached, giving up`);
          throw new Error(`Request timeout after ${FETCH_TIMEOUT}ms (tried ${retries} times)`);
        }
      } else if (attempt === retries - 1) {
        console.error(`[Polymarket API] 🛑 Max retries reached, giving up`);
        throw error;
      }
      
      // Wait before retrying
      const retryDelay = RETRY_DELAY * (attempt + 1);
      console.log(`[Polymarket API] ⏳ Waiting ${retryDelay}ms before retry ${attempt + 2}...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  const totalDuration = Date.now() - startTime;
  console.log(`[Polymarket API] ⏱️  Total request time: ${totalDuration}ms`);
};

// Fetch active markets from Polymarket
export const fetchActiveMarkets = async () => {
  const functionStart = Date.now();
  console.log(`\n[fetchActiveMarkets] 🚀 Starting market fetch...`);
  
  try {
    const url = `${POLYMARKET_API_BASE}/markets?active=true&closed=false&limit=100`;
    console.log(`[fetchActiveMarkets] 🔗 URL: ${url}`);
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhantomPay/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchActiveMarkets] ❌ API returned error ${response.status}`);
      console.error(`[fetchActiveMarkets] 📄 Response: ${errorText.substring(0, 500)}`);
      throw new Error(`Polymarket API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    console.log(`[fetchActiveMarkets] 📦 Parsing JSON response...`);
    const markets = await response.json();
    console.log(`[fetchActiveMarkets] ✓ Received ${markets.length} markets from API`);
    
    // Log sample market structure
    if (markets.length > 0) {
      console.log(`[fetchActiveMarkets] 📋 Sample market structure:`, {
        id: markets[0].id,
        condition_id: markets[0].condition_id,
        question: markets[0].question?.substring(0, 50) + '...',
        active: markets[0].active,
        closed: markets[0].closed,
        archived: markets[0].archived,
        volume: markets[0].volume,
        liquidity: markets[0].liquidity
      });
    }
    
    // Filter for active, non-archived markets with liquidity
    // IMPORTANT: Only include non-negRisk markets as they have clobTokenIds
    console.log(`[fetchActiveMarkets] 🔍 Filtering markets...`);
    const activeMarkets = markets.filter(m => {
      const isActive = m.active === true;
      const isNotArchived = m.archived === false;
      const isNotClosed = m.closed === false;
      const hasVolume = parseFloat(m.volume || m.volumeClob || 0) > 10; // Lower threshold
      const isNotNegRisk = m.negRisk !== true; // Exclude negRisk markets (they don't have clobTokenIds)
      const hasConditionId = m.conditionId && m.conditionId.length > 0; // Must have valid conditionId
      
      return isActive && isNotArchived && isNotClosed && hasVolume && isNotNegRisk && hasConditionId;
    });
    
    console.log(`[fetchActiveMarkets] ✓ Filtered to ${activeMarkets.length} active markets`);
    console.log(`[fetchActiveMarkets] 📊 Filter stats:`, {
      total: markets.length,
      active: markets.filter(m => m.active === true).length,
      notArchived: markets.filter(m => m.archived === false).length,
      notClosed: markets.filter(m => m.closed === false).length,
      withVolume: markets.filter(m => parseFloat(m.volume || m.volumeClob || 0) > 10).length,
      notNegRisk: markets.filter(m => m.negRisk !== true).length,
      withConditionId: markets.filter(m => m.conditionId && m.conditionId.length > 0).length,
      final: activeMarkets.length
    });

    const mappedMarkets = activeMarkets.map(m => {
      // Parse outcomes and clobTokenIds from JSON strings
      let outcomes = [];
      let clobTokenIds = [];
      
      try {
        outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes || [];
      } catch (e) {
        console.warn(`Failed to parse outcomes for market ${m.id}:`, e.message);
        outcomes = ['No', 'Yes']; // Default fallback
      }
      
      try {
        clobTokenIds = typeof m.clobTokenIds === 'string' ? JSON.parse(m.clobTokenIds) : m.clobTokenIds || [];
      } catch (e) {
        console.warn(`Failed to parse clobTokenIds for market ${m.id}:`, e.message);
        clobTokenIds = [];
      }
      
      // Build tokens array from clobTokenIds
      const tokens = clobTokenIds.map((tokenId, index) => ({
        token_id: tokenId,
        outcome: outcomes[index] || (index === 0 ? 'No' : 'Yes')
      }));
      
      return {
        pm_market_id: m.conditionId || m.condition_id || m.id,
        question: m.question,
        end_date: m.endDateIso || m.end_date_iso,
        outcomes,
        tokens,
        clobTokenIds,
        volume: m.volume,
        liquidity: m.liquidity,
        enableOrderBook: m.enableOrderBook !== false, // Assume true unless explicitly false
        metadata: {
          description: m.description,
          market_slug: m.slug || m.market_slug,
          image: m.image,
          icon: m.icon,
          category: m.category,
          tags: m.tags || []
        }
      };
    });
    
    const duration = Date.now() - functionStart;
    console.log(`[fetchActiveMarkets] ✅ Success! Returning ${mappedMarkets.length} markets (${duration}ms total)\n`);
    return mappedMarkets;
  } catch (error) {
    const duration = Date.now() - functionStart;
    console.error(`[fetchActiveMarkets] ❌ FAILED after ${duration}ms`);
    console.error(`[fetchActiveMarkets] 🔴 Error type: ${error.constructor.name}`);
    console.error(`[fetchActiveMarkets] 💬 Error message: ${error.message}`);
    console.error(`[fetchActiveMarkets] 📚 Stack trace:`, error.stack);
    console.error(`[fetchActiveMarkets] 🌐 API Base: ${POLYMARKET_API_BASE}`);
    console.error(`[fetchActiveMarkets] ⚙️  Timeout: ${FETCH_TIMEOUT}ms, Retries: ${MAX_RETRIES}\n`);
    throw error;
  }
};

// Fetch market details by condition_id
export const fetchMarketDetails = async (conditionId) => {
  const functionStart = Date.now();
  console.log(`\n[fetchMarketDetails] 🚀 Fetching details for market: ${conditionId}`);
  
  try {
    const url = `${POLYMARKET_API_BASE}/markets/${conditionId}`;
    console.log(`[fetchMarketDetails] 🔗 URL: ${url}`);
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhantomPay/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchMarketDetails] ❌ API error ${response.status}: ${errorText.substring(0, 200)}`);
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const marketData = await response.json();
    const duration = Date.now() - functionStart;
    
    // Parse outcomes and clobTokenIds from JSON strings
    let outcomes = [];
    let clobTokenIds = [];
    
    try {
      outcomes = typeof marketData.outcomes === 'string' ? JSON.parse(marketData.outcomes) : marketData.outcomes || [];
    } catch (e) {
      console.warn(`Failed to parse outcomes:`, e.message);
      outcomes = ['No', 'Yes'];
    }
    
    try {
      clobTokenIds = typeof marketData.clobTokenIds === 'string' ? JSON.parse(marketData.clobTokenIds) : marketData.clobTokenIds || [];
    } catch (e) {
      console.warn(`Failed to parse clobTokenIds:`, e.message);
      clobTokenIds = [];
    }
    
    // Build tokens array from clobTokenIds
    const tokens = clobTokenIds.map((tokenId, index) => ({
      token_id: tokenId,
      outcome: outcomes[index] || (index === 0 ? 'No' : 'Yes')
    }));
    
    console.log(`[fetchMarketDetails] ✓ Market data received (${duration}ms)`);
    console.log(`[fetchMarketDetails] 📋 Market structure:`, {
      id: marketData.id,
      conditionId: marketData.conditionId || marketData.condition_id,
      question: marketData.question?.substring(0, 60) + '...',
      clobTokenIds: clobTokenIds.length,
      outcomes: outcomes,
      hasTokens: tokens.length > 0,
      tokenStructure: tokens.map(t => ({ 
        token_id: t.token_id?.substring(0, 20) + '...', 
        outcome: t.outcome
      }))
    });

    // Return normalized market data
    return {
      ...marketData,
      outcomes,
      tokens,
      clobTokenIds,
      condition_id: marketData.conditionId || marketData.condition_id,
      end_date_iso: marketData.endDateIso || marketData.end_date_iso,
      market_slug: marketData.slug || marketData.market_slug
    };
  } catch (error) {
    const duration = Date.now() - functionStart;
    console.error(`[fetchMarketDetails] ❌ FAILED after ${duration}ms`);
    console.error(`[fetchMarketDetails] Error:`, error.message);
    throw error;
  }
};

// Fetch order book for a token
export const fetchOrderBook = async (tokenId) => {
  try {
    const response = await fetchWithTimeout(`${CLOB_API_BASE}/book?token_id=${tokenId}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhantomPay/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`CLOB API error: ${response.status}`);
    }

    const book = await response.json();
    return book;
  } catch (error) {
    console.error('Error fetching order book from Polymarket:', error);
    return { bids: [], asks: [] };
  }
};

// Fetch quotes for a market (YES and NO tokens)
export const fetchQuotes = async (yesTokenId, noTokenId) => {
  console.log(`[fetchQuotes] 📊 Fetching quotes for YES: ${yesTokenId}, NO: ${noTokenId}`);
  
  try {
    const [yesBook, noBook] = await Promise.all([
      fetchOrderBook(yesTokenId),
      fetchOrderBook(noTokenId)
    ]);

    // Get best bid/ask from order books
    const yesBids = yesBook.bids || [];
    const yesAsks = yesBook.asks || [];
    const noBids = noBook.bids || [];
    const noAsks = noBook.asks || [];

    console.log(`[fetchQuotes] 📈 Order book sizes - YES bids: ${yesBids.length}, asks: ${yesAsks.length}`);
    console.log(`[fetchQuotes] 📉 Order book sizes - NO bids: ${noBids.length}, asks: ${noAsks.length}`);

    // Best prices (highest bid, lowest ask)
    const yesBid = yesBids.length > 0 ? parseFloat(yesBids[0].price) : 0;
    const yesAsk = yesAsks.length > 0 ? parseFloat(yesAsks[0].price) : 1;
    const noBid = noBids.length > 0 ? parseFloat(noBids[0].price) : 0;
    const noAsk = noAsks.length > 0 ? parseFloat(noAsks[0].price) : 1;

    console.log(`[fetchQuotes] 💰 Raw prices - YES: ${yesBid}/${yesAsk}, NO: ${noBid}/${noAsk}`);

    // Apply spread markup (0.5% on each side)
    const MARKUP = 0.005;
    
    const quotes = {
      yes_bid: Math.max(0, yesBid * (1 - MARKUP)),
      yes_ask: Math.min(1, yesAsk * (1 + MARKUP)),
      no_bid: Math.max(0, noBid * (1 - MARKUP)),
      no_ask: Math.min(1, noAsk * (1 + MARKUP)),
      src_timestamp: new Date().toISOString()
    };
    
    console.log(`[fetchQuotes] ✓ Final quotes with markup:`, quotes);
    return quotes;
  } catch (error) {
    console.error(`[fetchQuotes] ❌ Error fetching quotes: ${error.message}`);
    console.error(`[fetchQuotes] 🔄 Using fallback mid-prices`);
    
    // Fallback to mid-price if order book fails
    return {
      yes_bid: 0.48,
      yes_ask: 0.52,
      no_bid: 0.48,
      no_ask: 0.52,
      src_timestamp: new Date().toISOString()
    };
  }
};

// Check if a market has been resolved
export const checkMarketResolution = async (conditionId) => {
  try {
    const market = await fetchMarketDetails(conditionId);
    
    if (market.closed && market.resolved) {
      // Determine which outcome won
      // Polymarket returns payoutNumerators array where winning outcome has value 1
      let payoutNumerators = [];
      
      try {
        payoutNumerators = typeof market.payoutNumerators === 'string' 
          ? JSON.parse(market.payoutNumerators) 
          : market.payoutNumerators || market.payout_numerators || [];
      } catch (e) {
        console.warn('Failed to parse payoutNumerators:', e.message);
        return { resolved: false, outcome: null };
      }
      
      if (payoutNumerators.length >= 2) {
        // Index 0 is typically NO, index 1 is YES
        if (payoutNumerators[1] === '1' || payoutNumerators[1] === 1) {
          return { resolved: true, outcome: 'yes' };
        } else if (payoutNumerators[0] === '1' || payoutNumerators[0] === 1) {
          return { resolved: true, outcome: 'no' };
        } else {
          return { resolved: true, outcome: 'invalid' };
        }
      }
    }

    return { resolved: false, outcome: null };
  } catch (error) {
    console.error('Error checking market resolution:', error);
    return { resolved: false, outcome: null };
  }
};

// Fetch multiple resolved markets
export const fetchResolutions = async () => {
  try {
    const response = await fetchWithTimeout(`${POLYMARKET_API_BASE}/markets?closed=true&resolved=true&limit=50`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhantomPay/1.0'
      }
    });

    if (!response.ok) {
      return [];
    }

    const markets = await response.json();
    
    return markets.map(m => ({
      pm_market_id: m.condition_id || m.id,
      resolved: true,
      outcome: determineOutcome(m.payout_numerators)
    })).filter(m => m.outcome !== null);
  } catch (error) {
    console.error('Error fetching resolutions:', error);
    return [];
  }
};

// Helper to determine outcome from payout numerators
const determineOutcome = (payoutNumerators) => {
  if (!payoutNumerators) return null;
  
  let parsed = [];
  try {
    parsed = typeof payoutNumerators === 'string' ? JSON.parse(payoutNumerators) : payoutNumerators;
  } catch (e) {
    return null;
  }
  
  if (parsed.length < 2) return null;
  
  if (parsed[1] === '1' || parsed[1] === 1) return 'yes';
  if (parsed[0] === '1' || parsed[0] === 1) return 'no';
  return 'invalid';
};

