import db from '../config/database.js';

function calculateDailyMaintenanceRate(leverage) {
  const minRate = 0.001; // 0.1%
  const maxRate = 0.01; // 1%
  const minLev = 1;
  const maxLev = 10;
  const lev = Math.min(Math.max(Number(leverage) || 1, minLev), maxLev);
  return minRate + ((lev - minLev) / (maxLev - minLev)) * (maxRate - minRate);
}

export async function applyDailyMaintenanceFees() {
  // Select open positions where last_maintenance_fee_at is null or older than 24 hours
  const positions = await db.query(
    `SELECT id, user_id, margin_agon, leverage, last_maintenance_fee_at
     FROM crypto_positions
     WHERE status = 'open'
       AND (last_maintenance_fee_at IS NULL OR last_maintenance_fee_at <= NOW() - INTERVAL '24 hours')`
  );

  for (const pos of positions) {
    const rate = calculateDailyMaintenanceRate(pos.leverage);
    const margin = Number(pos.margin_agon);
    const fee = margin * rate;
    const newMargin = Math.max(0, margin - fee);

    await db.tx(async (t) => {
      // Update position margin and fee trackers
      await t.exec(
        `UPDATE crypto_positions
         SET margin_agon = $1,
             total_maintenance_fees = COALESCE(total_maintenance_fees, 0) + $2,
             last_maintenance_fee_at = NOW()
         WHERE id = $3`,
        [newMargin, fee, pos.id]
      );

      // Record transaction entry for fee deduction
      await t.exec(
        `INSERT INTO transactions (from_user_id, transaction_type, currency, amount, description)
         VALUES ($1, 'maintenance_fee', 'agon', $2, $3)`,
        [pos.user_id, fee, `Daily maintenance fee applied on position ${pos.id}`]
      );
    });
  }
}

export function startMaintenanceFeeScheduler() {
  // Run once on startup, then every hour to catch positions crossing the 24h threshold
  applyDailyMaintenanceFees().catch(() => {});
  setInterval(() => {
    applyDailyMaintenanceFees().catch(() => {});
  }, 60 * 60 * 1000);
}


