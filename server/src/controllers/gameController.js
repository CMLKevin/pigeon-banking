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
    // Get all games for this user
    const games = db.prepare(`
      SELECT game_type, bet_amount, result, won
      FROM game_history
      WHERE user_id = ?
    `).all(userId);

    let totalProfit = 0;
    let gamesWon = 0;
    let gamesLost = 0;

    games.forEach(game => {
      if (game.game_type === 'plinko') {
        // For plinko, result is the multiplier
        const multiplier = parseFloat(game.result);
        const profit = game.bet_amount * (multiplier - 1);
        totalProfit += profit;
      } else if (game.game_type === 'blackjack' && game.result === 'blackjack') {
        // Blackjack pays 3:2
        totalProfit += game.bet_amount * 1.5;
      } else if (game.won) {
        // Regular win pays 1:1
        totalProfit += game.bet_amount;
      } else {
        // Loss
        totalProfit -= game.bet_amount;
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

// Plinko game
export const playPlinko = (req, res) => {
  const { betAmount, rows, risk } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  if (![8, 12, 16].includes(rows)) {
    return res.status(400).json({ message: 'Invalid row count. Must be 8, 12, or 16' });
  }

  if (!['low', 'medium', 'high'].includes(risk)) {
    return res.status(400).json({ message: 'Invalid risk level. Must be low, medium, or high' });
  }

  try {
    // Get user's wallet
    const wallet = db.prepare('SELECT stoneworks_dollar FROM wallets WHERE user_id = ?').get(userId);
    
    if (!wallet || wallet.stoneworks_dollar < betAmount) {
      return res.status(400).json({ message: 'Insufficient Game Chips balance' });
    }

    // Multiplier configurations matching frontend
    const multipliers = {
      low: {
        8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
        12: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
        16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
      },
      medium: {
        8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
        16: [110, 41, 10, 5, 3, 1.5, 1.0, 0.5, 0.3, 0.5, 1.0, 1.5, 3, 5, 10, 41, 110]
      },
      high: {
        8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
        12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
        16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
      }
    };

    // Simulate ball drop using binomial distribution (Galton board)
    // Each peg bounce is a 50/50 decision left or right
    const currentMultipliers = multipliers[risk][rows];
    const slotsCount = currentMultipliers.length;
    
    // Simulate bounces - binomial distribution naturally creates bell curve
    let position = 0;
    for (let i = 0; i < rows; i++) {
      // 50/50 chance to go left (0) or right (1)
      if (Math.random() < 0.5) {
        position++;
      }
    }
    
    // Position is now 0 to rows, map to slot index
    // Center position around middle slot
    const middleSlot = Math.floor(slotsCount / 2);
    const offset = position - Math.floor(rows / 2);
    let landingSlot = middleSlot + offset;
    
    // Ensure slot is within bounds
    landingSlot = Math.max(0, Math.min(slotsCount - 1, landingSlot));
    
    // Apply house edge (5%)
    // Reduce multiplier by 5% on average
    const houseEdgeFactor = 0.95;
    const baseMultiplier = currentMultipliers[landingSlot];
    const multiplier = baseMultiplier * houseEdgeFactor;
    
    // Calculate winnings
    const payout = betAmount * multiplier;
    const amountChange = payout - betAmount;
    const newBalance = wallet.stoneworks_dollar + amountChange;
    
    // Update wallet
    db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
      .run(newBalance, userId);

    // Save game history
    const gameData = { rows, risk, landingSlot, multiplier: baseMultiplier };
    db.prepare(`
      INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      userId, 
      'plinko', 
      betAmount, 
      baseMultiplier.toString(), 
      JSON.stringify(gameData), 
      baseMultiplier >= 1 ? 1 : 0
    );

    // Record transaction
    db.prepare(`
      INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
      VALUES (?, NULL, 'game', ?, ?, ?)
    `).run(
      userId,
      'stoneworks_dollar',
      Math.abs(amountChange),
      `Plinko: ${rows} rows, ${risk} risk - ${baseMultiplier}x`
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

// Crash game - in-memory state (in production, use Redis or similar)
const crashGameState = {
  currentRound: null, // { crashPoint, startTime, bets: Map<userId, Bet> }
};

// Start a new crash round
export const startCrashRound = (req, res) => {
  try {
    // Generate crash point with 5% house edge (95% RTP)
    // Formula: crashPoint = 0.95 / (1 - random)
    // This ensures exactly 5% house edge regardless of cashout point
    // Proof: P(success at multiplier M) = P(0.95/(1-r) >= M) = P(r >= 1 - 0.95/M) = 0.95/M
    // Expected return = (0.95/M) * M = 0.95 = 95% RTP ✓
    const random = Math.random();
    const crashPoint = Math.max(1.00, 0.95 / (1 - random));
    
    crashGameState.currentRound = {
      crashPoint: Math.min(crashPoint, 10000), // Cap at 10000x for safety
      startTime: Date.now(),
      bets: new Map()
    };

    res.json({ 
      crashPoint: crashGameState.currentRound.crashPoint,
      message: 'Round started' 
    });
  } catch (error) {
    console.error('Error starting crash round:', error);
    res.status(500).json({ message: 'Failed to start crash round' });
  }
};

// Place a bet on the current crash round
export const placeCrashBet = (req, res) => {
  const { betAmount, autoCashout } = req.body;
  const userId = req.user.id;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ message: 'Invalid bet amount' });
  }

  if (autoCashout && autoCashout < 1.01) {
    return res.status(400).json({ message: 'Auto cashout must be at least 1.01x' });
  }

  try {
    if (!crashGameState.currentRound) {
      return res.status(400).json({ message: 'No active round. Please start a round first.' });
    }

    // Get user's wallet
    const wallet = db.prepare('SELECT stoneworks_dollar FROM wallets WHERE user_id = ?').get(userId);
    
    if (!wallet || wallet.stoneworks_dollar < betAmount) {
      return res.status(400).json({ message: 'Insufficient Game Chips balance' });
    }

    // Check if user already has an active bet in this round
    const existing = crashGameState.currentRound.bets.get(userId);
    if (existing && existing.status === 'active') {
      return res.status(400).json({ message: 'You already have an active bet' });
    }

    // Deduct bet amount from wallet
    const newBalance = wallet.stoneworks_dollar - betAmount;
    db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
      .run(newBalance, userId);

    // Store bet in memory under current round
    crashGameState.currentRound.bets.set(userId, {
      amount: betAmount,
      autoCashout: autoCashout || null,
      status: 'active', // active | cashed_out | lost
      cashoutMultiplier: null
    });

    res.json({ 
      message: 'Bet placed successfully',
      newBalance 
    });

  } catch (error) {
    console.error('Error placing crash bet:', error);
    res.status(500).json({ message: 'Failed to place bet' });
  }
};

// Cash out from the current crash round
export const cashoutCrash = (req, res) => {
  const { cashoutMultiplier } = req.body;
  const userId = req.user.id;

  if (!cashoutMultiplier || cashoutMultiplier < 1.00) {
    return res.status(400).json({ message: 'Invalid cashout multiplier' });
  }

  try {
    if (!crashGameState.currentRound) {
      return res.status(400).json({ message: 'No active round' });
    }
    // Check if user has an active bet
    const userBet = crashGameState.currentRound.bets.get(userId);
    if (!userBet) {
      return res.status(400).json({ message: 'No active bet found' });
    }

    if (userBet.status === 'cashed_out') {
      return res.status(400).json({ message: 'Already cashed out' });
    }

    // Check if cashout is before crash point
    if (crashGameState.currentRound && cashoutMultiplier > crashGameState.currentRound.crashPoint) {
      return res.status(400).json({ message: 'Cannot cash out after crash' });
    }

    // Get user's wallet
    const wallet = db.prepare('SELECT stoneworks_dollar FROM wallets WHERE user_id = ?').get(userId);

    // Calculate payout
    const payout = userBet.amount * cashoutMultiplier;
    const profit = payout - userBet.amount;
    const newBalance = wallet.stoneworks_dollar + payout;

    // Update wallet
    db.prepare('UPDATE wallets SET stoneworks_dollar = ? WHERE user_id = ?')
      .run(newBalance, userId);

    // Mark as cashed out (but keep record so user cannot double-bet this round)
    userBet.status = 'cashed_out';
    userBet.cashoutMultiplier = cashoutMultiplier;
    crashGameState.currentRound.bets.set(userId, userBet);

    // Save game history
    const gameData = { 
      crashedAt: crashGameState.currentRound?.crashPoint || cashoutMultiplier,
      cashedOut: cashoutMultiplier 
    };
    
    db.prepare(`
      INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      userId, 
      'crash', 
      userBet.amount, 
      (crashGameState.currentRound?.crashPoint ?? cashoutMultiplier).toString(),
      JSON.stringify(gameData), 
      1 // Won because they cashed out
    );

    // Record transaction
    db.prepare(`
      INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
      VALUES (?, NULL, 'game', ?, ?, ?)
    `).run(
      userId,
      'stoneworks_dollar',
      profit,
      `Crash: Cashed out at ${cashoutMultiplier.toFixed(2)}x`
    );

    res.json({
      success: true,
      profit,
      newBalance,
      cashoutMultiplier,
      message: 'Successfully cashed out!'
    });

  } catch (error) {
    console.error('Error cashing out:', error);
    res.status(500).json({ message: 'Failed to cash out' });
  }
};

// Clean up crashed bets (called after a crash)
export const finalizeCrashRound = (req, res) => {
  try {
    if (!crashGameState.currentRound) {
      return res.json({ message: 'No active round' });
    }

    // Mark unresolved bets as lost and persist
    for (const [uid, bet] of crashGameState.currentRound.bets.entries()) {
      if (bet.status === 'active') {
        bet.status = 'lost';
        crashGameState.currentRound.bets.set(uid, bet);

        const gameData = { 
          crashedAt: crashGameState.currentRound.crashPoint || 1.00,
          cashedOut: null 
        };

        db.prepare(`
          INSERT INTO game_history (user_id, game_type, bet_amount, result, choice, won, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          uid, 
          'crash', 
          bet.amount, 
          (crashGameState.currentRound.crashPoint ?? 1.00).toString(),
          JSON.stringify(gameData), 
          0
        );

        db.prepare(`
          INSERT INTO transactions (from_user_id, to_user_id, transaction_type, currency, amount, description)
          VALUES (?, NULL, 'game', ?, ?, ?)
        `).run(
          uid,
          'stoneworks_dollar',
          bet.amount,
          `Crash: Lost at ${Number(crashGameState.currentRound.crashPoint).toFixed(2)}x`
        );
      }
    }

    // End the round and clear state
    crashGameState.currentRound = null;
    res.json({ message: 'Round finalized' });

  } catch (error) {
    console.error('Error finalizing crash round:', error);
    res.status(500).json({ message: 'Failed to finalize round' });
  }
};


