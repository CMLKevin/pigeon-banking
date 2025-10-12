import db from '../config/database.js';

// Play coin flip game
export const playCoinFlip = (req, res) => {
  const { betAmount, choice } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  if (!choice || !['heads', 'tails'].includes(choice)) {
    return res.status(400).json({ message: 'Invalid choice. Must be heads or tails' });
  }

  try {
    // Get user's wallet
    const wallet = db.prepare('SELECT stoneworks_dollar FROM wallets WHERE user_id = ?').get(userId);
    
    if (!wallet || wallet.stoneworks_dollar < betAmount) {
      return res.status(400).json({ message: 'Insufficient Game Chips balance' });
    }

    // Coin flip logic with 10% house edge
    // 45% win rate with 2x payout (1x net profit) = 10% house edge
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const guessedCorrectly = choice === flipResult;
    
    // 10% of correct guesses are converted to losses for house edge
    // This gives 45% overall win rate (50% * 90% = 45%)
    const winRoll = Math.random();
    const playerWins = guessedCorrectly && winRoll < 0.9; // 45% win rate
    
    const result = flipResult;

    let amountChange;
    let newBalance;

    if (playerWins) {
      // Player wins: 2x payout (bet back + 1x profit)
      // Net profit is 1x the bet amount
      amountChange = betAmount * 1.0;
      newBalance = wallet.stoneworks_dollar + amountChange;
      
      db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
        .run(newBalance, userId);
    } else {
      // Player loses: they lose their bet
      amountChange = -betAmount;
      newBalance = wallet.stoneworks_dollar - betAmount;
      
      db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
        .run(newBalance, userId);
    }

    // Save game history
    db.prepare(`
      INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(userId, 'coinflip', betAmount, result, choice, playerWins ? 1 : 0);

    // Record transaction (use correct columns and order)
    db.prepare(`
      INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
      VALUES (?, NULL, 'game', ?, ?, ?)
    `).run(
      userId,
      'stoneworks_dollar',
      Math.abs(amountChange),
      `Coin flip: ${choice} vs ${result} - ${playerWins ? 'Won' : 'Lost'}`
    );

    res.json({
      won: playerWins,
      result,
      choice,
      betAmount,
      amountChange,
      newBalance,
      message: playerWins ? 'Congratulations! You won!' : 'Better luck next time!'
    });

  } catch (error) {
    console.error('Error playing coin flip:', error);
    res.status(500).json({ message: 'Failed to play game' });
  }
};

// Get game history
export const getGameHistory = (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const games = db.prepare(`
      SELECT * FROM game_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);

    res.json({ games });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ message: 'Failed to fetch game history' });
  }
};

// Get game statistics
export const getGameStats = (req, res) => {
  const userId = req.user.id;

  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) as games_won,
        SUM(CASE WHEN won = 0 THEN 1 ELSE 0 END) as games_lost,
        SUM(CASE WHEN won = 1 THEN bet_amount * 1.0 ELSE -bet_amount END) as total_profit
      FROM game_history
      WHERE user_id = ?
    `).get(userId);

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({ message: 'Failed to fetch game statistics' });
  }
};


