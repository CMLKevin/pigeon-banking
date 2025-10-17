import db from '../config/database.js';

// Play coin flip game
export const playCoinFlip = async (req, res) => {
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
    const wallet = await db.queryOne('SELECT stoneworks_dollar FROM wallets WHERE user_id = $1', [userId]);
    
    if (!wallet || parseFloat(wallet.stoneworks_dollar) < betAmount) {
      return res.status(400).json({ message: 'Insufficient Game Chips balance' });
    }

    // Coin flip logic with 10% house edge
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
    const guessedCorrectly = choice === flipResult;
    const winRoll = Math.random();
    const playerWins = guessedCorrectly && winRoll < 0.9;
    const result = flipResult;

    let amountChange;
    let newBalance;

    if (playerWins) {
      amountChange = betAmount * 1.0;
      newBalance = parseFloat(wallet.stoneworks_dollar) + amountChange;
      await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [newBalance, userId]);
    } else {
      amountChange = -betAmount;
      newBalance = parseFloat(wallet.stoneworks_dollar) - betAmount;
      await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [newBalance, userId]);
    }

    // Save game history
    await db.exec(
      `INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())`,
      [userId, 'coinflip', betAmount, result, JSON.stringify(choice), playerWins]
    );

    // Record transaction
    await db.exec(
      `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
       VALUES ($1, NULL, 'game', $2, $3, $4)`,
      [userId, 'stoneworks_dollar', Math.abs(amountChange), `Coin flip: ${choice} vs ${result} - ${playerWins ? 'Won' : 'Lost'}`]
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
export const getGameHistory = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const games = await db.query(
      `SELECT * FROM game_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({ games });
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ message: 'Failed to fetch game history' });
  }
};

// Get game statistics
export const getGameStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const games = await db.query(
      `SELECT game_type, bet_amount, result, won
       FROM game_history
       WHERE user_id = $1`,
      [userId]
    );

    let totalProfit = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    games.forEach(game => {
      if (game.game_type === 'plinko') {
        const multiplier = parseFloat(game.result);
        const profit = parseFloat(game.bet_amount) * (multiplier - 1);
        totalProfit += profit;
      } else if (game.game_type === 'blackjack' && game.result === 'blackjack') {
        totalProfit += parseFloat(game.bet_amount) * 1.5;
      } else if (game.won) {
        totalProfit += parseFloat(game.bet_amount);
      } else {
        totalProfit -= parseFloat(game.bet_amount);
      }

      if (game.won) gamesWon++;
      else gamesLost++;
    });

    const stats = {
      total_games: games.length,
      games_won: gamesWon,
      games_lost: gamesLost,
      total_profit: totalProfit
    };

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
export const playBlackjack = async (req, res) => {
  const { betAmount, action, gameState } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  try {
    // Initialize new game
    if (!action || action === 'deal') {
      const wallet = await db.queryOne('SELECT stoneworks_dollar FROM wallets WHERE user_id = $1', [userId]);
      
      if (!wallet || parseFloat(wallet.stoneworks_dollar) < betAmount) {
        return res.status(400).json({ message: 'Insufficient Game Chips balance' });
      }
      const deck = shuffleDeck(createDeck());
      const playerHand = [deck[0], deck[2]];
      const dealerHand = [deck[1], deck[3]];
      const remainingDeck = deck.slice(4);

      const playerValue = calculateHandValue(playerHand);
      const dealerValue = calculateHandValue(dealerHand);
      const playerBlackjack = isBlackjack(playerHand);
      const dealerBlackjack = isBlackjack(dealerHand);

      // Deduct bet immediately
      const newBalance = parseFloat(wallet.stoneworks_dollar) - betAmount;
      await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [newBalance, userId]);

      // Check for immediate blackjack
      if (playerBlackjack || dealerBlackjack) {
        let result, amountChange, won;
        
        if (playerBlackjack && dealerBlackjack) {
          result = 'push';
          amountChange = 0;
          won = false;
          await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [newBalance + betAmount, userId]);
        } else if (playerBlackjack) {
          result = 'blackjack';
          amountChange = betAmount * 1.5;
          won = true;
          await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [newBalance + betAmount + amountChange, userId]);
        } else {
          result = 'dealer_blackjack';
          amountChange = -betAmount;
          won = false;
        }

        await db.exec(
          `INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())`,
          [userId, 'blackjack', betAmount, result, JSON.stringify({ playerValue, dealerValue }), won]
        );

        if (amountChange !== 0) {
          await db.exec(
            `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
             VALUES ($1, NULL, 'game', $2, $3, $4)`,
            [userId, 'stoneworks_dollar', Math.abs(amountChange), `Blackjack: ${result}`]
          );
        }

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
      const wallet = await db.queryOne('SELECT stoneworks_dollar FROM wallets WHERE user_id = $1', [userId]);
      let { playerHand, dealerHand, remainingDeck } = gameState;

      if (action === 'hit') {
        playerHand.push(remainingDeck[0]);
        remainingDeck = remainingDeck.slice(1);
        const playerValue = calculateHandValue(playerHand);

        if (playerValue > 21) {
          const amountChange = -betAmount;
          // Bet was already deducted when dealing, so current balance is what's in the wallet
          const currentBalance = parseFloat(wallet.stoneworks_dollar);
          
          await db.exec(
            `INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())`,
            [userId, 'blackjack', betAmount, 'bust', JSON.stringify({ playerValue, dealerValue: calculateHandValue(dealerHand) }), false]
          );

          await db.exec(
            `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
             VALUES ($1, NULL, 'game', $2, $3, $4)`,
            [userId, 'stoneworks_dollar', Math.abs(amountChange), 'Blackjack: bust']
          );

          return res.json({
            gameOver: true,
            result: 'bust',
            won: false,
            playerHand,
            dealerHand,
            playerValue,
            dealerValue: calculateHandValue(dealerHand),
            amountChange,
            betAmount,
            newBalance: currentBalance
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
        let dealerValue = calculateHandValue(dealerHand);
        while (dealerValue < 17) {
          dealerHand.push(remainingDeck[0]);
          remainingDeck = remainingDeck.slice(1);
          dealerValue = calculateHandValue(dealerHand);
        }

        const playerValue = calculateHandValue(playerHand);
        let result, won, amountChange;
        // Bet was already deducted when dealing, so current balance is what's in the wallet
        const currentBalance = parseFloat(wallet.stoneworks_dollar);

        if (dealerValue > 21) {
          result = 'dealer_bust';
          won = true;
          amountChange = betAmount;
          // Player wins: return bet + winnings
          await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [currentBalance + betAmount + amountChange, userId]);
        } else if (playerValue > dealerValue) {
          result = 'win';
          won = true;
          amountChange = betAmount;
          // Player wins: return bet + winnings
          await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [currentBalance + betAmount + amountChange, userId]);
        } else if (playerValue === dealerValue) {
          result = 'push';
          won = false;
          amountChange = 0;
          // Push: return bet only
          await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [currentBalance + betAmount, userId]);
        } else {
          result = 'loss';
          won = false;
          amountChange = -betAmount;
          // Player loses: bet stays deducted, no wallet update needed
        }

        await db.exec(
          `INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())`,
          [userId, 'blackjack', betAmount, result, JSON.stringify({ playerValue, dealerValue }), won]
        );

        if (amountChange !== 0) {
          await db.exec(
            `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
             VALUES ($1, NULL, 'game', $2, $3, $4)`,
            [userId, 'stoneworks_dollar', Math.abs(amountChange), `Blackjack: ${result}`]
          );
        }

        // Calculate final balance based on result
        let finalBalance;
        if (result === 'push') {
          finalBalance = currentBalance + betAmount; // Return bet
        } else if (won) {
          finalBalance = currentBalance + betAmount + amountChange; // Return bet + winnings
        } else {
          finalBalance = currentBalance; // Bet stays deducted
        }

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
          newBalance: finalBalance
        });
      }
    }

    res.status(400).json({ message: 'Invalid action' });
  } catch (error) {
    console.error('Error playing blackjack:', error);
    res.status(500).json({ message: 'Failed to play game' });
  }
};

// Plinko game - Fixed to low risk, 8 rows only
export const playPlinko = async (req, res) => {
  const { betAmount } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  // Force low risk and 8 rows
  const rows = 8;
  const risk = 'low';

  try {
    const wallet = await db.queryOne('SELECT stoneworks_dollar FROM wallets WHERE user_id = $1', [userId]);
    
    if (!wallet || parseFloat(wallet.stoneworks_dollar) < betAmount) {
      return res.status(400).json({ message: 'Insufficient Game Chips balance' });
    }

    // Only low risk, 8 rows multipliers
    const multipliers = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];
    const slotsCount = multipliers.length;
    
    let position = 0;
    for (let i = 0; i < rows; i++) {
      if (Math.random() < 0.5) {
        position++;
      }
    }
    
    const middleSlot = Math.floor(slotsCount / 2);
    const offset = position - Math.floor(rows / 2);
    let landingSlot = middleSlot + offset;
    landingSlot = Math.max(0, Math.min(slotsCount - 1, landingSlot));
    
    const houseEdgeFactor = 0.95;
    const baseMultiplier = multipliers[landingSlot];
    const multiplier = baseMultiplier * houseEdgeFactor;
    
    const payout = betAmount * multiplier;
    const amountChange = payout - betAmount;
    const newBalance = parseFloat(wallet.stoneworks_dollar) + amountChange;
    
    await db.exec('UPDATE wallets SET stoneworks_dollar = $1 WHERE user_id = $2', [newBalance, userId]);

    const gameData = { rows, risk, landingSlot, multiplier: baseMultiplier };
    await db.exec(
      `INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())`,
      [userId, 'plinko', betAmount, baseMultiplier.toString(), JSON.stringify(gameData), baseMultiplier >= 1]
    );

    await db.exec(
      `INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
       VALUES ($1, NULL, 'game', $2, $3, $4)`,
      [userId, 'stoneworks_dollar', Math.abs(amountChange), `Plinko: ${baseMultiplier}x`]
    );

    res.json({
      won: baseMultiplier >= 1,
      multiplier: baseMultiplier,
      landingSlot,
      betAmount,
      payout,
      amountChange,
      newBalance,
      message: baseMultiplier >= 1 ? 'Congratulations!' : 'Better luck next time!'
    });

  } catch (error) {
    console.error('Error playing plinko:', error);
    res.status(500).json({ message: 'Failed to play game' });
  }
};

