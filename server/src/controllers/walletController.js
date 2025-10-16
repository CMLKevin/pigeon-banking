import db from '../config/database.js';

// Helper function to normalize wallet data (convert NUMERIC strings to numbers)
const normalizeWallet = (wallet) => {
  if (!wallet) return null;
  return {
    ...wallet,
    agon: parseFloat(wallet.agon) || 0,
    stoneworks_dollar: parseFloat(wallet.stoneworks_dollar) || 0,
    agon_escrow: parseFloat(wallet.agon_escrow) || 0
  };
};

export const getWallet = async (req, res) => {
  try {
    const wallet = await db.queryOne('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ wallet: normalizeWallet(wallet) });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const swapCurrency = async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;

    // Validate input
    if (!fromCurrency || !toCurrency || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const validCurrencies = ['agon', 'stoneworks_dollar'];
    if (!validCurrencies.includes(fromCurrency) || !validCurrencies.includes(toCurrency)) {
      return res.status(400).json({ error: 'Invalid currency type' });
    }

    if (fromCurrency === toCurrency) {
      return res.status(400).json({ error: 'Cannot swap to the same currency' });
    }

    // Get current wallet
    const wallet = await db.queryOne('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Check if user has enough balance
    if (wallet[fromCurrency] < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Perform swap (1:1 ratio)
    // Update balances
    await db.exec(
      `UPDATE wallets 
       SET ${fromCurrency} = ${fromCurrency} - $1, 
           ${toCurrency} = ${toCurrency} + $2
       WHERE user_id = $3`,
      [amount, amount, req.user.id]
    );

    // Record transaction
    await db.exec(
      `INSERT INTO transactions (from_user_id, transaction_type, currency, amount, description)
       VALUES ($1, 'swap', $2, $3, $4)`,
      [req.user.id, fromCurrency, amount, `Swapped ${amount} ${fromCurrency} to ${toCurrency}`]
    );

    // Log activity
    await db.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)', [
      req.user.id,
      'swap',
      JSON.stringify({ fromCurrency, toCurrency, amount })
    ]);

    // Get updated wallet
    const updatedWallet = await db.queryOne('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);

    res.json({
      message: 'Swap successful',
      wallet: normalizeWallet(updatedWallet)
    });
  } catch (error) {
    console.error('Swap currency error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

