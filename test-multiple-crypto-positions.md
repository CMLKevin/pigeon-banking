# Test Plan: Multiple Cryptocurrency Positions

## Overview
This document verifies that users can open multiple cryptocurrency positions simultaneously.

## Test Cases

### Test Case 1: Open Multiple Positions on Same Coin
**Objective**: Verify users can open multiple positions on the same cryptocurrency

**Steps**:
1. Navigate to Crypto Trading page
2. Select Bitcoin (BTC)
3. Open a LONG position with 100 Ⱥ margin and 5x leverage
4. Wait for success message
5. Without closing the first position, select Bitcoin (BTC) again
6. Open another LONG position with 50 Ⱥ margin and 2x leverage
7. Verify both positions appear in the "Open Positions" section

**Expected Result**: 
- Both positions are created successfully
- Position counter shows "2 positions"
- Position summary shows "2 LONG" under Bitcoin
- Each position is tracked independently with its own P&L

### Test Case 2: Open Long and Short on Same Coin
**Objective**: Verify users can hedge by opening opposite positions

**Steps**:
1. Select Ethereum (ETH)
2. Open a LONG position with 100 Ⱥ
3. Open a SHORT position on Ethereum with 100 Ⱥ
4. Verify both positions are visible

**Expected Result**:
- Both LONG and SHORT positions coexist
- Position summary shows "1 LONG 1 SHORT" under Ethereum
- P&L is calculated independently for each position

### Test Case 3: Open Positions on Different Coins
**Objective**: Verify users can diversify across multiple cryptocurrencies

**Steps**:
1. Open a position on Bitcoin
2. Open a position on Ethereum
3. Open a position on Dogecoin
4. Verify all three positions are tracked

**Expected Result**:
- All three positions appear in open positions
- Position summary shows one card for each coin
- Total position counter reflects all positions

### Test Case 4: Close One of Multiple Positions
**Objective**: Verify closing one position doesn't affect others

**Steps**:
1. Open 3 positions on Bitcoin
2. Close the middle position (by timestamp)
3. Verify the other two positions remain open

**Expected Result**:
- Only the selected position is closed
- Other positions remain open and continue tracking
- Closed position's funds are returned to wallet
- Position counter decrements by 1

### Test Case 5: Balance Check with Multiple Positions
**Objective**: Verify balance is properly deducted for each position

**Steps**:
1. Note starting balance: X Ⱥ
2. Open position 1 with 100 Ⱥ margin
3. Balance should be X - 100 Ⱥ
4. Open position 2 with 50 Ⱥ margin
5. Balance should be X - 150 Ⱥ
6. Open position 3 with 200 Ⱥ margin
7. Balance should be X - 350 Ⱥ

**Expected Result**:
- Each position deducts margin from available balance
- User cannot open position if insufficient balance
- Total margin shown in stats matches sum of all position margins

## Database Verification

### Query to Check Multiple Positions
```sql
SELECT 
  u.username,
  cp.coin_id,
  cp.position_type,
  cp.leverage,
  cp.margin_agon,
  cp.status,
  cp.opened_at
FROM crypto_positions cp
JOIN users u ON cp.user_id = u.id
WHERE u.id = [USER_ID]
  AND cp.status = 'open'
ORDER BY cp.opened_at DESC;
```

## UI Verification Checklist

- [ ] Header shows "Open New Position" (not "Open Position")
- [ ] Help text states "You can open multiple positions simultaneously"
- [ ] Position counter badge shows correct number
- [ ] Position summary groups positions by coin
- [ ] Each coin card shows breakdown of LONG/SHORT positions
- [ ] All individual positions display in the list below
- [ ] Each position has its own "Close Position" button
- [ ] Empty state mentions opening multiple positions

## API Endpoint Tests

### POST /api/crypto/positions (Multiple Times)
```bash
# Open first position
curl -X POST http://localhost:5000/api/crypto/positions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"coinId": "bitcoin", "positionType": "long", "leverage": 5, "marginAmon": 100}'

# Open second position (same coin)
curl -X POST http://localhost:5000/api/crypto/positions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"coinId": "bitcoin", "positionType": "short", "leverage": 3, "marginAmon": 75}'

# Verify both positions exist
curl -X GET http://localhost:5000/api/crypto/positions?status=open \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Known Behaviors

1. **No Limit on Position Count**: Users can open as many positions as their balance allows
2. **Independent P&L**: Each position's P&L is calculated independently
3. **Same Entry Price**: Positions opened at the same time on the same coin may have different entry prices due to API timing
4. **Commission Applied Per Position**: Each position incurs its own commission based on leverage

## Success Criteria

✅ All test cases pass
✅ UI clearly indicates multiple position support
✅ Documentation updated
✅ No database constraints prevent multiple positions
✅ Backend allows multiple position creation
✅ Frontend displays all positions correctly

