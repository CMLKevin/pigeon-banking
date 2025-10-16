export function calculateCommission(leverage) {
  const minFee = 0.01; // 1%
  const maxFee = 0.05; // 5%
  const minLev = 1;
  const maxLev = 10;
  const feeRate = minFee + ((leverage - minLev) / (maxLev - minLev)) * (maxFee - minFee);
  return Math.max(minFee, Math.min(maxFee, feeRate));
}

export function calculateLiquidationPrice(entryPrice, leverage, positionType) {
  const liquidationPercentage = 1 / leverage;
  if (positionType === 'long') {
    return entryPrice * (1 - liquidationPercentage * 0.9);
  } else {
    return entryPrice * (1 + liquidationPercentage * 0.9);
  }
}

export function calculateDailyMaintenanceRate(leverage) {
  const minRate = 0.001; // 0.1%
  const maxRate = 0.01; // 1%
  const minLev = 1;
  const maxLev = 10;
  const lev = Math.min(Math.max(Number(leverage) || 1, minLev), maxLev);
  return minRate + ((lev - minLev) / (maxLev - minLev)) * (maxRate - minRate);
}
