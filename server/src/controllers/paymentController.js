import db from '../config/database.js';

export const sendPayment = (req, res) => {
  try {
    const { recipientUsername, currency, amount, description } = req.body;

    // Validate input
    if (!recipientUsername || !currency || !amount) {
      return res.status(400).json({ error: 'Recipient, currency, and amount are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const validCurrencies = ['phantom_coin', 'stoneworks_dollar'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency type' });
    }

    // Get sender's wallet
    const senderWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id);
    
    if (!senderWallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Check if sender has enough balance
    if (senderWallet[currency] < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get recipient
    const recipient = db.prepare('SELECT id, username FROM users WHERE username = ?').get(recipientUsername);
    
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (recipient.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot send payment to yourself' });
    }

    // Get recipient's wallet
    const recipientWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(recipient.id);
    
    if (!recipientWallet) {
      return res.status(404).json({ error: 'Recipient wallet not found' });
    }

    // Perform transaction using a database transaction
    const transaction = db.transaction(() => {
      // Deduct from sender
      const updateSender = db.prepare(`
        UPDATE wallets 
        SET ${currency} = ${currency} - ?
        WHERE user_id = ?
      `);
      updateSender.run(amount, req.user.id);

      // Add to recipient
      const updateRecipient = db.prepare(`
        UPDATE wallets 
        SET ${currency} = ${currency} + ?
        WHERE user_id = ?
      `);
      updateRecipient.run(amount, recipient.id);

      // Record transaction
      const insertTransaction = db.prepare(`
        INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
        VALUES (?, ?, 'payment', ?, ?, ?)
      `);
      
      return insertTransaction.run(
        req.user.id,
        recipient.id,
        currency,
        amount,
        description || `Payment to ${recipientUsername}`
      );
    });

    const result = transaction();

    // Log activity for both users
    const log = db.prepare('INSERT INTO activity_logs (user_id, action, metadata) VALUES (?, ?, ?)');
    log.run(req.user.id, 'payment_sent', JSON.stringify({ to: recipient.username, currency, amount, description }));
    log.run(recipient.id, 'payment_received', JSON.stringify({ from: req.user.username, currency, amount, description }));

    // Get updated wallet
    const updatedWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.user.id);

    res.json({
      message: 'Payment sent successfully',
      transaction: {
        id: result.lastInsertRowid,
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

export const getTransactions = (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const transactions = db.prepare(`
      SELECT 
        t.*,
        u_from.username as from_username,
        u_to.username as to_username
      FROM transactions t
      LEFT JOIN users u_from ON t.from_user_id = u_from.id
      LEFT JOIN users u_to ON t.to_user_id = u_to.id
      WHERE t.from_user_id = ? OR t.to_user_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, req.user.id, parseInt(limit), parseInt(offset));

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

