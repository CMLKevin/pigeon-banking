#!/usr/bin/env node

/**
 * Integration test for trading functionality with Yahoo Finance
 */

import { getCombinedCurrentPrices, warmPricesIfNeeded } from './server/src/services/tradingPriceService.js';

console.log('🧪 Testing Trading Integration with Yahoo Finance\n');
console.log('=' .repeat(60));

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Warm prices
  console.log('\n📊 Test 1: Warming price cache...');
  try {
    const warmed = await warmPricesIfNeeded();
    console.log(`✅ Price warming ${warmed ? 'completed' : 'skipped (already warm)'}`);
    passed++;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    failed++;
  }

  // Test 2: Get combined prices
  console.log('\n📊 Test 2: Fetching combined prices...');
  try {
    const prices = await getCombinedCurrentPrices();
    const assetCount = Object.keys(prices).length;
    
    if (assetCount === 0) {
      throw new Error('No prices returned');
    }
    
    console.log(`✅ Retrieved ${assetCount} asset prices`);
    
    // Display sample prices
    console.log('\n   Sample prices:');
    Object.entries(prices).slice(0, 3).forEach(([id, data]) => {
      console.log(`   - ${data.name}: $${data.price.toFixed(2)} (${data.change_24h >= 0 ? '+' : ''}${data.change_24h.toFixed(2)}%)`);
    });
    
    passed++;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    failed++;
  }

  // Test 3: Verify all expected assets
  console.log('\n📊 Test 3: Verifying all expected assets...');
  try {
    const prices = await getCombinedCurrentPrices();
    const expectedAssets = ['bitcoin', 'ethereum', 'dogecoin', 'gold', 'tsla', 'aapl', 'nvda'];
    const missing = expectedAssets.filter(id => !prices[id]);
    
    if (missing.length > 0) {
      throw new Error(`Missing assets: ${missing.join(', ')}`);
    }
    
    console.log('✅ All 7 expected assets present');
    console.log('   Assets: bitcoin, ethereum, dogecoin, gold, tsla, aapl, nvda');
    passed++;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    failed++;
  }

  // Test 4: Verify price data structure
  console.log('\n📊 Test 4: Verifying price data structure...');
  try {
    const prices = await getCombinedCurrentPrices();
    const sampleAsset = prices['bitcoin'];
    
    const requiredFields = ['id', 'symbol', 'name', 'price', 'change_24h', 'last_updated', 'asset_type'];
    const missingFields = requiredFields.filter(field => !(field in sampleAsset));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    if (typeof sampleAsset.price !== 'number' || sampleAsset.price <= 0) {
      throw new Error('Invalid price value');
    }
    
    console.log('✅ Price data structure is valid');
    console.log(`   Fields: ${requiredFields.join(', ')}`);
    passed++;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`\n📋 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Yahoo Finance integration is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
