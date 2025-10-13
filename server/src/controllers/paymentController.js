import db from '../config/database.js';

export const sendPayment = async (req, res) => {
  try {
    const { recipientUsername, currency, amount, description } = req.body;

    // Validate input
    if (!recipientUsername || !currency || !amount) {
      return res.status(400).json({ error: 'Recipient, currency, and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const validCurrencies = ['agon', 'stoneworks_dollar'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency type' });
    }

    // Get sender's wallet
    const senderWallet = await db.queryOne('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    
    if (!senderWallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Check if sender has enough balance
    if (senderWallet[currency] < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get recipient
    const recipient = await db.queryOne('SELECT id, username FROM users WHERE username = $1', [recipientUsername]);
    
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (recipient.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot send payment to yourself' });
    }

    // Get recipient's wallet
    const recipientWallet = await db.queryOne('SELECT * FROM wallets WHERE user_id = $1', [recipient.id]);
    
    if (!recipientWallet) {
      return res.status(404).json({ error: 'Recipient wallet not found' });
    }

    // Perform transaction atomically
    const txResult = await db.tx(async (q) => {
      await q.exec(`UPDATE wallets SET ${currency} = ${currency} - $1 WHERE user_id = $2`, [amount, req.user.id]);
      await q.exec(`UPDATE wallets SET ${currency} = ${currency} + $1 WHERE user_id = $2`, [amount, recipient.id]);
      const inserted = await q.queryOne(
        `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
         VALUES ($1, $2, 'payment', $3, $4, $5) RETURNING id`,
        [req.user.id, recipient.id, currency, amount, description || `Payment to ${recipientUsername}`]
      );
      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)', [
        req.user.id, 'payment_sent', JSON.stringify({ to: recipient.username, currency, amount, description })
      ]);
      await q.exec('INSERT INTO activity_logs (user_id, action, metadata) VALUES ($1, $2, $3::jsonb)', [
        recipient.id, 'payment_received', JSON.stringify({ from: req.user.username, currency, amount, description })
      ]);
      return inserted.id;
    });

    // Get updated wallet
    const updatedWallet = await db.queryOne('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);

    res.json({
      message: 'Payment sent successfully',
      transaction: {
        id: txResult,
        recipient: recipientUsername,
        currency,
        amount
      },
      wallet: updatedWallet
    });
  } catch (error) {
    console.error('Send payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const transactions = await db.query(
      `SELECT 
        t.*,
        u_from.username as from_username,
        u_to.username as to_username
       FROM transactions t
       LEFT JOIN users u_from ON t.from_user_id = u_from.id
       LEFT JOIN users u_to ON t.to_user_id = u_to.id
       WHERE t.from_user_id = $1 OR t.to_user_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

