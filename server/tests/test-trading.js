import assert from 'assert';
import { calculateCommission, calculateLiquidationPrice, calculateDailyMaintenanceRate } from '../src/utils/tradingMath.js';
import { isSupportedTradingAsset } from '../src/services/tradingPriceService.js';

// Commission tests
assert.strictEqual(Number(calculateCommission(1).toFixed(4)), 0.0100, '1x commission should be 1%');
assert.strictEqual(Number(calculateCommission(10).toFixed(4)), 0.0500, '10x commission should be 5%');
assert.strictEqual(Number(calculateCommission(5).toFixed(4)), Number((0.01 + (4/9)*0.04).toFixed(4)), '5x commission linear scale');

// Liquidation tests
assert.strictEqual(Number(calculateLiquidationPrice(100, 5, 'long').toFixed(2)), 82.00, 'Long liq price at 5x');
assert.strictEqual(Number(calculateLiquidationPrice(100, 5, 'short').toFixed(2)), 118.00, 'Short liq price at 5x');

// Maintenance rate tests
assert.strictEqual(Number(calculateDailyMaintenanceRate(1).toFixed(4)), 0.0010, '1x daily maintenance');
assert.strictEqual(Number(calculateDailyMaintenanceRate(10).toFixed(4)), 0.0100, '10x daily maintenance');
assert.strictEqual(Number(calculateDailyMaintenanceRate(5).toFixed(4)), Number((0.001 + (4/9)*0.009).toFixed(4)), '5x daily maintenance linear');

// Supported assets
assert.strictEqual(isSupportedTradingAsset('bitcoin'), true, 'bitcoin supported');
assert.strictEqual(isSupportedTradingAsset('tsla'), true, 'tsla supported');
assert.strictEqual(isSupportedTradingAsset('bogus'), false, 'bogus not supported');

console.log('All trading unit tests passed.');
