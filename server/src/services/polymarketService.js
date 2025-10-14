import fetch from 'node-fetch';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';

// Fetch active markets from Polymarket
export const fetchActiveMarkets = async () => {
  try {
    const response = await fetch(`${POLYMARKET_API_BASE}/markets`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const markets = await response.json();
    
    // Filter for active, non-archived markets with liquidity
    const activeMarkets = markets.filter(m => 
      m.active === true && 
      m.archived === false && 
      m.closed === false &&
      parseFloat(m.volume || 0) > 100 // Minimum volume filter
    );

    return activeMarkets.map(m => ({
      pm_market_id: m.condition_id || m.id,
      question: m.question,
      end_date: m.end_date_iso,
      outcomes: m.outcomes,
      tokens: m.tokens,
      volume: m.volume,
      liquidity: m.liquidity,
      metadata: {
        description: m.description,
        market_slug: m.market_slug,
        image: m.image,
        icon: m.icon,
        category: m.category,
        tags: m.tags || []
      }
    }));
  } catch (error) {
    console.error('Error fetching markets from Polymarket:', error);
    throw error;
  }
};

// Fetch market details by condition_id
export const fetchMarketDetails = async (conditionId) => {
  try {
    const response = await fetch(`${POLYMARKET_API_BASE}/markets/${conditionId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching market details from Polymarket:', error);
    throw error;
  }
};

// Fetch order book for a token
export const fetchOrderBook = async (tokenId) => {
  try {
    const response = await fetch(`${CLOB_API_BASE}/book?token_id=${tokenId}`, {
      headers: {
        'Accept': 'application/json'
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

    // Best prices (highest bid, lowest ask)
    const yesBid = yesBids.length > 0 ? parseFloat(yesBids[0].price) : 0;
    const yesAsk = yesAsks.length > 0 ? parseFloat(yesAsks[0].price) : 1;
    const noBid = noBids.length > 0 ? parseFloat(noBids[0].price) : 0;
    const noAsk = noAsks.length > 0 ? parseFloat(noAsks[0].price) : 1;

    // Apply spread markup (0.5% on each side)
    const MARKUP = 0.005;
    
    return {
      yes_bid: Math.max(0, yesBid * (1 - MARKUP)),
      yes_ask: Math.min(1, yesAsk * (1 + MARKUP)),
      no_bid: Math.max(0, noBid * (1 - MARKUP)),
      no_ask: Math.min(1, noAsk * (1 + MARKUP)),
      src_timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching quotes:', error);
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
      // Polymarket returns payout_numerators array where winning outcome has value 1
      const payoutNumerators = market.payout_numerators || [];
      
      if (payoutNumerators.length >= 2) {
        // Index 0 is typically NO, index 1 is YES
        if (payoutNumerators[1] === '1') {
          return { resolved: true, outcome: 'yes' };
        } else if (payoutNumerators[0] === '1') {
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
    const response = await fetch(`${POLYMARKET_API_BASE}/markets?closed=true&resolved=true&limit=50`, {
      headers: {
        'Accept': 'application/json'
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
  if (!payoutNumerators || payoutNumerators.length < 2) return null;
  
  if (payoutNumerators[1] === '1') return 'yes';
  if (payoutNumerators[0] === '1') return 'no';
  return 'invalid';
};

