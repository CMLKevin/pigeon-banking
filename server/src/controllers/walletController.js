import db from '../config/database.js';

export const getWallet = (req, res) => {
  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ wallet });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const swapCurrency = (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;

    // Validate input
    if (!fromCurrency || !toCurrency || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const validCurrencies = ['phantom_coin', 'stoneworks_dollar'];
    if (!validCurrencies.includes(fromCurrency) || !validCurrencies.includes(toCurrency)) {
      return res.status(400).json({ error: 'Invalid currency type' });
    }

    if (fromCurrency === toCurrency) {
      return res.status(400).json({ error: 'Cannot swap to the same currency' });
    }

    // Get current wallet
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Check if user has enough balance
    if (wallet[fromCurrency] < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Perform swap (1:1 ratio)
    const updateWallet = db.prepare(`
      UPDATE wallets 
      SET ${fromCurrency} = ${fromCurrency} - ?, 
          ${toCurrency} = ${toCurrency} + ?
      WHERE user_id = ?
    `);
    
    updateWallet.run(amount, amount, req.user.id);

    // Record transaction
    const insertTransaction = db.prepare(`
      INSERT INTO transactions (from_user_id, transaction_type, currency, amount, description)
      VALUES (?, 'swap', ?, ?, ?)
    `);
    
    insertTransaction.run(
      req.user.id,
      fromCurrency,
      amount,
      `Swapped ${amount} ${fromCurrency} to ${toCurrency}`
    );

    // Log activity
    const log = db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)');
    log.run(req.user.id, 'swap', JSON.stringify({ fromCurrency, toCurrency, amount }));

    // Get updated wallet
    const updatedWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id);

    res.json({
      message: 'Swap successful',
      wallet: updatedWallet
    });
  } catch (error) {
    console.error('Swap currency error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

