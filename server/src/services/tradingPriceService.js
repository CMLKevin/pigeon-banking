import { getSupportedAssetPrices, SUPPORTED_STOCKS_AND_ASSETS, getPriceForSymbol, getSupportedCryptoPrices, SUPPORTED_CRYPTO, getCachedPriceForSymbol } from './polygonService.js';

export const SUPPORTED_TRADING_ASSETS = {
  // Crypto (ids align with existing crypto UI/backend)
  bitcoin: { type: 'crypto' },
  ethereum: { type: 'crypto' },
  dogecoin: { type: 'crypto' },
  // Non-crypto via Polygon
  gold: { type: 'equity' },
  tsla: { type: 'equity' },
  aapl: { type: 'equity' },
  nvda: { type: 'equity' }
};

export async function getCombinedCurrentPricesCached() {
  const combined = {};
  // crypto
  for (const [id, meta] of Object.entries(SUPPORTED_CRYPTO)) {
    const cached = getCachedPriceForSymbol(meta.symbol);
    if (cached) {
      combined[id] = {
        id,
        symbol: meta.symbol,
        name: meta.name,
        price: cached.price,
        change_24h: cached.change_24h,
        last_updated: cached.last_updated,
        asset_type: 'crypto'
      };
    }
  }
  // equities & metals
  for (const [id, meta] of Object.entries(SUPPORTED_STOCKS_AND_ASSETS)) {
    const cached = getCachedPriceForSymbol(meta.symbol);
    if (cached) {
      combined[id] = {
        id,
        symbol: meta.symbol,
        name: meta.name,
        price: cached.price,
        change_24h: cached.change_24h,
        last_updated: cached.last_updated,
        asset_type: 'equity'
      };
    }
  }
  return combined;
}

export async function getCombinedCurrentPrices() {
  const [crypto, equities] = await Promise.all([
    getSupportedCryptoPrices(),
    getSupportedAssetPrices()
  ]);

  // Normalize: return a single object keyed by asset id with common fields
  const combined = {};
  // crypto already contains { id, symbol, name, price, change_24h, ... }
  for (const [id, data] of Object.entries(crypto)) {
    combined[id] = { ...data, asset_type: 'crypto' };
  }
  for (const [id, data] of Object.entries(equities)) {
    combined[id] = { ...data, asset_type: 'equity' };
  }
  return combined;
}

export function isSupportedTradingAsset(id) {
  return Boolean(SUPPORTED_TRADING_ASSETS[id]);
}

export async function getAssetPrice(assetId) {
  if (!isSupportedTradingAsset(assetId)) return null;
  if (SUPPORTED_CRYPTO[assetId]) {
    const sym = SUPPORTED_CRYPTO[assetId].symbol;
    const data = await getPriceForSymbol(sym);
    return {
      id: assetId,
      symbol: sym,
      name: SUPPORTED_CRYPTO[assetId].name,
      price: data.price,
      change_24h: data.change_24h,
      last_updated: data.last_updated
    };
  }
  const asset = SUPPORTED_STOCKS_AND_ASSETS[assetId];
  if (!asset) return null;
  const data = await getPriceForSymbol(asset.symbol);
  return {
    id: assetId,
    symbol: asset.symbol,
    name: asset.name,
    price: data.price,
    change_24h: data.change_24h,
    last_updated: data.last_updated
  };
}


