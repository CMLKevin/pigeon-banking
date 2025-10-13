// Plinko Expected Returns Calculator
// Based on binomial distribution probabilities

const multipliers = {
  low: {
    8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110]
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

// Calculate binomial coefficient C(n, k) = n! / (k! * (n-k)!)
function binomialCoefficient(n, k) {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i);
    result /= (i + 1);
  }
  return result;
}

// Calculate probability of landing in slot k with n rows
function slotProbability(n, k) {
  return binomialCoefficient(n, k) / Math.pow(2, n);
}

// Calculate expected value for a configuration
function calculateExpectedValue(rows, mults) {
  const n = rows;
  let expectedValue = 0;
  
  for (let i = 0; i < mults.length; i++) {
    const prob = slotProbability(n, i);
    const multiplier = mults[i];
    expectedValue += prob * multiplier;
  }
  
  return expectedValue;
}

// House edge factor (5% house edge = 0.95 multiplier)
const HOUSE_EDGE = 0.95;

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║        PLINKO EXPECTED RETURNS ANALYSIS                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const results = [];

Object.keys(multipliers).forEach(risk => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${risk.toUpperCase()} RISK`);
  console.log('='.repeat(60));
  
  Object.keys(multipliers[risk]).forEach(rows => {
    const mults = multipliers[risk][rows];
    const rawEV = calculateExpectedValue(parseInt(rows), mults);
    const finalEV = rawEV * HOUSE_EDGE; // Apply 1% house edge
    const rtp = (finalEV * 100).toFixed(4);
    const houseEdge = ((1 - finalEV) * 100).toFixed(4);
    
    console.log(`\n  ${rows} Rows:`);
    console.log(`    Raw Expected Value:    ${rawEV.toFixed(6)}x`);
    console.log(`    After House Edge (1%): ${finalEV.toFixed(6)}x`);
    console.log(`    RTP (Return to Player): ${rtp}%`);
    console.log(`    Effective House Edge:   ${houseEdge}%`);
    
    // Show probability distribution
    console.log(`\n    Probability Distribution:`);
    for (let i = 0; i < mults.length; i++) {
      const prob = slotProbability(parseInt(rows), i);
      const percentage = (prob * 100).toFixed(4);
      console.log(`      Slot ${i} (${mults[i]}x): ${percentage}%`);
    }
    
    results.push({
      risk,
      rows: parseInt(rows),
      rawEV,
      finalEV,
      rtp: parseFloat(rtp),
      houseEdge: parseFloat(houseEdge)
    });
  });
});

console.log('\n\n' + '═'.repeat(60));
console.log('  SUMMARY TABLE');
console.log('═'.repeat(60));
console.log('\n┌─────────┬──────┬──────────────┬─────────────┬─────────────┐');
console.log('│  Risk   │ Rows │   Raw EV     │   Final EV  │     RTP     │');
console.log('├─────────┼──────┼──────────────┼─────────────┼─────────────┤');

results.forEach(r => {
  const risk = r.risk.padEnd(7);
  const rows = r.rows.toString().padStart(4);
  const rawEV = r.rawEV.toFixed(6).padStart(12);
  const finalEV = r.finalEV.toFixed(6).padStart(11);
  const rtp = r.rtp.toFixed(2).padStart(10) + '%';
  console.log(`│ ${risk} │ ${rows} │ ${rawEV} │ ${finalEV} │ ${rtp} │`);
});

console.log('└─────────┴──────┴──────────────┴─────────────┴─────────────┘');

console.log('\n\n' + '═'.repeat(60));
console.log('  KEY FINDINGS');
console.log('═'.repeat(60));

console.log('\n1. Expected Return Analysis:');
results.forEach(r => {
  const expReturn = ((r.finalEV - 1) * 100).toFixed(2);
  const sign = r.finalEV >= 1 ? '+' : '';
  console.log(`   ${r.risk.toUpperCase()} ${r.rows} rows: ${sign}${expReturn}% expected return per game`);
});

console.log('\n2. House Advantage:');
console.log('   All configurations have a 5% house edge applied');
console.log('   This means the casino expects to profit 5% of all bets');

console.log('\n3. Volatility:');
console.log('   LOW RISK: Lower variance, more consistent returns');
console.log('   MEDIUM RISK: Balanced variance and potential');
console.log('   HIGH RISK: High variance, rare but massive wins');

console.log('\n4. Player Strategy:');
console.log('   - All configurations have negative expected value');
console.log('   - Higher risk = higher max multiplier but lower RTP');
console.log('   - Low risk configurations offer the best RTP');
console.log('   - The game is designed for entertainment, not profit');

// Find best and worst RTP
const bestRTP = results.reduce((max, r) => r.rtp > max.rtp ? r : max);
const worstRTP = results.reduce((min, r) => r.rtp < min.rtp ? r : min);

console.log('\n5. Best/Worst Configurations:');
console.log(`   Best RTP:  ${bestRTP.risk.toUpperCase()} ${bestRTP.rows} rows (${bestRTP.rtp.toFixed(2)}%)`);
console.log(`   Worst RTP: ${worstRTP.risk.toUpperCase()} ${worstRTP.rows} rows (${worstRTP.rtp.toFixed(2)}%)`);

console.log('\n' + '═'.repeat(60) + '\n');
