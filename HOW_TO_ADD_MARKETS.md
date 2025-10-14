# How to Add Prediction Markets - Quick Guide

## 🎯 Two Ways to Add Markets

### Method 1: Browse Polymarket API (Automatic)
If the Polymarket API is working:
1. Go to Admin Panel → Prediction Markets
2. Scroll to "Available Markets from Polymarket"
3. Browse the list of markets
4. Click "Add" button on any market
5. Done! ✅

### Method 2: Manual Entry (Always Works)
If the API is down or you want a specific market:

#### Step 1: Find the Market on Polymarket.com
1. Visit https://polymarket.com
2. Browse to find a market you want
3. Click on the market

#### Step 2: Get the Market ID
**Easy Method (from URL):**
- Some markets show the condition_id in the URL
- Example: `polymarket.com/event/will-bitcoin-reach-100k`
- The slug is: `will-bitcoin-reach-100k`

**Advanced Method (Developer Tools):**
1. Press `F12` to open Developer Tools
2. Go to "Network" tab
3. Refresh the page
4. Look for API calls to `gamma-api.polymarket.com`
5. Click on one of these requests
6. In the response, find `"condition_id": "0x..."`
7. Copy the entire condition_id (starts with `0x`)

**Even Easier Method (Page Source):**
1. Press `Ctrl+U` (or `Cmd+Option+U` on Mac) to view page source
2. Search for `condition_id`
3. Copy the value that looks like: `0x123abc456def...`

#### Step 3: Add to Your Platform
1. Go to Admin Panel → Prediction Markets
2. Find "Manually Add Market" section
3. Click "Show" if it's hidden
4. Paste the condition_id in the input field
5. Click "Add Market"
6. Wait 5-10 seconds while system fetches market details
7. Done! ✅

---

## 📊 What You'll See

### When It Works
After adding a market, you should see:
- ✅ Success message: "Market added successfully!"
- Market appears in "Whitelisted Markets" section
- Market shows up on `/prediction-markets` page for users
- Sync jobs start fetching quotes every 15 seconds

### If It Fails
Common errors and solutions:

| Error | Meaning | Solution |
|-------|---------|----------|
| "Market already whitelisted" | Market is already added | Check whitelisted markets list |
| "Market not found on Polymarket" | Invalid condition_id | Double-check the ID from Polymarket |
| "Failed to fetch market details" | API timeout | Wait 30 seconds and try again |
| "Invalid token IDs" | Market doesn't have YES/NO tokens | Choose a different market |

---

## 🔍 Example Market IDs to Try

Here are some popular market types on Polymarket:

### Presidential Elections
```
Find on: https://polymarket.com → Politics → Presidential
Look for: Recent presidential election markets
```

### Cryptocurrency
```
Find on: https://polymarket.com → Crypto
Look for: Bitcoin or Ethereum price predictions
```

### Sports
```
Find on: https://polymarket.com → Sports
Look for: NBA, NFL, or soccer match outcomes
```

### General News
```
Find on: https://polymarket.com → News
Look for: Current event predictions
```

---

## 💡 Tips

### Best Markets to Add
- High volume markets (more traders = more liquidity)
- Binary YES/NO markets (easier for users to understand)
- Clear resolution criteria (avoid ambiguous questions)
- Reasonable end dates (not too far in future)

### Markets to Avoid
- Very low volume (<$100)
- Markets with unclear questions
- Markets that have already closed
- Multi-outcome markets (only binary YES/NO supported)

### After Adding Markets
1. **Test Trading**: Try placing a small order yourself first
2. **Check Prices**: Make sure prices update every 15 seconds
3. **Monitor**: Check server logs for quote sync errors
4. **Promote**: Share the new market with your users!

---

## 🛠️ Troubleshooting

### "Manual Add" Section Not Showing
→ Click "Show" button to expand it

### Form Submits But Nothing Happens
→ Check browser console (F12) for errors
→ Check server logs for API errors
→ Verify condition_id format (should start with `0x`)

### Market Added But No Prices
→ Wait 15 seconds for first quote sync
→ Check server logs for sync errors
→ Market may have no liquidity on Polymarket
→ Try removing and re-adding the market

### Can't Find condition_id on Polymarket
→ Try a different market
→ Use markets from the homepage (usually more popular)
→ Ask in Polymarket Discord for help

---

## 📱 Mobile Instructions

If adding from mobile:

1. **Use Desktop Mode**: 
   - Mobile browsers may not show Developer Tools easily
   - Request "Desktop Site" in browser settings

2. **Use Desktop**:
   - Much easier to use Developer Tools
   - Copy condition_id and send to yourself
   - Then add via mobile admin panel

3. **Ask Someone**:
   - Have a team member with desktop find the ID
   - They can add the market directly

---

## 🎓 Video Tutorial

**Coming Soon**: Video walkthrough of both methods

For now, follow the steps above or check:
- `PREDICTION_MARKETS_ADMIN_GUIDE.md` for detailed troubleshooting
- Server logs for API debugging
- Browser console for frontend errors

---

## ✅ Success Checklist

After adding a market, verify:

- [ ] Market appears in "Whitelisted Markets"
- [ ] Status shows as "active" (green badge)
- [ ] Market shows on `/prediction-markets` page
- [ ] YES and NO prices display
- [ ] Prices update (refresh page after 15 seconds)
- [ ] Can place a test order successfully
- [ ] Order shows in portfolio

If all checked, market is working! 🎉

---

## 📞 Need Help?

1. Check verbose server logs (should show detailed API calls)
2. Read `PREDICTION_MARKETS_ADMIN_GUIDE.md` for in-depth debugging
3. Verify environment variables are set correctly
4. Check Polymarket.com is accessible from your server
5. Contact support with full error logs

---

**Last Updated**: 2025-10-14  
**Feature Version**: 2.0 with Manual Addition

