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

// Blackjack helper functions
const createDeck = () => {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  
  return deck;
};

const shuffleDeck = (deck) => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getCardValue = (card) => {
  if (card.value === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  return parseInt(card.value);
};

const calculateHandValue = (hand) => {
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    const cardVal = getCardValue(card);
    value += cardVal;
    if (card.value === 'A') aces++;
  }
  
  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
};

const isBlackjack = (hand) => {
  return hand.length === 2 && calculateHandValue(hand) === 21;
};

// Play blackjack game
export const playBlackjack = (req, res) => {
  const { betAmount, action, gameState } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  try {
    const wallet = db.prepare('SELECT stoneworks_dollar FROM wallets WHERE user_id = ?').get(userId);
    
    if (!wallet || wallet.stoneworks_dollar < betAmount) {
      return res.status(400).json({ message: 'Insufficient Game Chips balance' });
    }

    // Initialize new game
    if (!action || action === 'deal') {
      const deck = shuffleDeck(createDeck());
      const playerHand = [deck[0], deck[2]];
      const dealerHand = [deck[1], deck[3]];
      const remainingDeck = deck.slice(4);

      const playerValue = calculateHandValue(playerHand);
      const dealerValue = calculateHandValue(dealerHand);
      const playerBlackjack = isBlackjack(playerHand);
      const dealerBlackjack = isBlackjack(dealerHand);

      // Deduct bet immediately
      const newBalance = wallet.stoneworks_dollar - betAmount;
      db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
        .run(newBalance, userId);

      // Check for immediate blackjack
      if (playerBlackjack || dealerBlackjack) {
        let result, amountChange, won;
        
        if (playerBlackjack && dealerBlackjack) {
          result = 'push';
          amountChange = 0;
          won = 0;
          // Return bet
          db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
            .run(newBalance + betAmount, userId);
        } else if (playerBlackjack) {
          result = 'blackjack';
          amountChange = betAmount * 1.5; // 3:2 payout
          won = 1;
          db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
            .run(newBalance + betAmount + amountChange, userId);
        } else {
          result = 'dealer_blackjack';
          amountChange = -betAmount;
          won = 0;
        }

        // Record game
        db.prepare(`
          INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(userId, 'blackjack', betAmount, result, JSON.stringify({ playerValue, dealerValue }), won);

        db.prepare(`
          INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
          VALUES (?, NULL, 'game', ?, ?, ?)
        `).run(userId, 'stoneworks_dollar', Math.abs(amountChange), `Blackjack: ${result}`);

        return res.json({
          gameOver: true,
          result,
          won,
          playerHand,
          dealerHand,
          playerValue,
          dealerValue,
          amountChange,
          betAmount,
          newBalance: newBalance + (result === 'push' ? betAmount : (won ? betAmount + amountChange : 0))
        });
      }

      return res.json({
        gameOver: false,
        playerHand,
        dealerHand,
        playerValue,
        dealerValue,
        remainingDeck,
        betAmount
      });
    }

    // Handle hit/stand actions
    if (action === 'hit' || action === 'stand') {
      let { playerHand, dealerHand, remainingDeck } = gameState;

      if (action === 'hit') {
        playerHand.push(remainingDeck[0]);
        remainingDeck = remainingDeck.slice(1);
        const playerValue = calculateHandValue(playerHand);

        if (playerValue > 21) {
          // Player busts
          const amountChange = -betAmount;
          
          db.prepare(`
            INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(userId, 'blackjack', betAmount, 'bust', JSON.stringify({ playerValue, dealerValue: calculateHandValue(dealerHand) }), 0);

          db.prepare(`
            INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
            VALUES (?, NULL, 'game', ?, ?, ?)
          `).run(userId, 'stoneworks_dollar', Math.abs(amountChange), 'Blackjack: bust');

          return res.json({
            gameOver: true,
            result: 'bust',
            won: 0,
            playerHand,
            dealerHand,
            playerValue,
            dealerValue: calculateHandValue(dealerHand),
            amountChange,
            betAmount,
            newBalance: wallet.stoneworks_dollar - betAmount
          });
        }

        return res.json({
          gameOver: false,
          playerHand,
          dealerHand,
          playerValue,
          dealerValue: calculateHandValue(dealerHand),
          remainingDeck,
          betAmount
        });
      }

      if (action === 'stand') {
        // Dealer plays
        let dealerValue = calculateHandValue(dealerHand);
        while (dealerValue < 17) {
          dealerHand.push(remainingDeck[0]);
          remainingDeck = remainingDeck.slice(1);
          dealerValue = calculateHandValue(dealerHand);
        }

        const playerValue = calculateHandValue(playerHand);
        let result, won, amountChange;
        const currentBalance = wallet.stoneworks_dollar - betAmount;

        if (dealerValue > 21) {
          result = 'dealer_bust';
          won = 1;
          amountChange = betAmount; // 1:1 payout
          db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
            .run(currentBalance + betAmount + amountChange, userId);
        } else if (playerValue > dealerValue) {
          result = 'win';
          won = 1;
          amountChange = betAmount; // 1:1 payout
          db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
            .run(currentBalance + betAmount + amountChange, userId);
        } else if (playerValue === dealerValue) {
          result = 'push';
          won = 0;
          amountChange = 0;
          db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
            .run(currentBalance + betAmount, userId);
        } else {
          result = 'loss';
          won = 0;
          amountChange = -betAmount;
        }

        db.prepare(`
          INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(userId, 'blackjack', betAmount, result, JSON.stringify({ playerValue, dealerValue }), won);

        db.prepare(`
          INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
          VALUES (?, NULL, 'game', ?, ?, ?)
        `).run(userId, 'stoneworks_dollar', Math.abs(amountChange), `Blackjack: ${result}`);

        return res.json({
          gameOver: true,
          result,
          won,
          playerHand,
          dealerHand,
          playerValue,
          dealerValue,
          amountChange,
          betAmount,
          newBalance: currentBalance + (result === 'push' ? betAmount : (won ? betAmount + amountChange : 0))
        });
      }
    }

    res.status(400).json({ message: 'Invalid action' });
  } catch (error) {
    console.error('Error playing blackjack:', error);
    res.status(500).json({ message: 'Failed to play game' });
  }
};


