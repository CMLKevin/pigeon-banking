import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { walletAPI } from '../services/api';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import api from '../services/api';

const Blackjack = () => {
  const [wallet, setWallet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [gameState, setGameState] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [recentGames, setRecentGames] = useState([]);
  const audioCtxRef = useRef(null);

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    return audioCtxRef.current;
  };

  const playWinChime = () => {
    const ctx = ensureAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.0001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  };

  useEffect(() => {
    loadWallet();
    loadRecentGames();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await walletAPI.getWallet();
      setWallet(res.data.wallet);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const loadRecentGames = async () => {
    try {
      const res = await api.get('/games/history', { params: { limit: 5 } });
      setRecentGames(res.data.games.filter(g => g.game_type === 'blackjack'));
    } catch (error) {
      console.error('Failed to load recent games:', error);
    }
  };

  const startGame = async () => {
    if (!betAmount || betAmount <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    // Round to 2 decimal places to handle floating point precision issues
    const betAmountRounded = Math.round(parseFloat(betAmount) * 100) / 100;
    const balanceRounded = Math.round((wallet?.stoneworks_dollar || 0) * 100) / 100;
    
    if (betAmountRounded > balanceRounded) {
      alert('Insufficient Game Chips balance');
      return;
    }

    setIsPlaying(true);
    setMessage('');

    try {
      const res = await api.post('/games/blackjack', {
        betAmount: parseFloat(betAmount),
        action: 'deal'
      });

      setGameState(res.data);
      
      if (res.data.gameOver) {
        handleGameEnd(res.data);
      }
    } catch (error) {
      setIsPlaying(false);
      alert(error.response?.data?.message || 'Failed to start game');
    }
  };

  const handleHit = async () => {
    try {
      const res = await api.post('/games/blackjack', {
        betAmount: parseFloat(betAmount),
        action: 'hit',
        gameState: {
          playerHand: gameState.playerHand,
          dealerHand: gameState.dealerHand,
          remainingDeck: gameState.remainingDeck
        }
      });

      setGameState(res.data);
      
      if (res.data.gameOver) {
        handleGameEnd(res.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to hit');
    }
  };

  const handleStand = async () => {
    try {
      const res = await api.post('/games/blackjack', {
        betAmount: parseFloat(betAmount),
        action: 'stand',
        gameState: {
          playerHand: gameState.playerHand,
          dealerHand: gameState.dealerHand,
          remainingDeck: gameState.remainingDeck
        }
      });

      setGameState(res.data);
      handleGameEnd(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to stand');
    }
  };

  const handleGameEnd = (data) => {
    let msg = '';
    switch (data.result) {
      case 'blackjack':
        msg = '🎉 BLACKJACK! You win 3:2!';
        break;
      case 'win':
      case 'dealer_bust':
        msg = '🎊 You Win!';
        break;
      case 'loss':
        msg = '😔 Dealer Wins';
        break;
      case 'bust':
        msg = '💥 Bust! You Lose';
        break;
      case 'push':
        msg = '🤝 Push - Bet Returned';
        break;
      case 'dealer_blackjack':
        msg = '🃏 Dealer Blackjack';
        break;
    }
    setMessage(msg);
    
    // Play win chime if player won
    if (data.won) {
      try { playWinChime(); } catch {}
    }
    
    loadWallet();
    loadRecentGames();
  };

  const resetGame = () => {
    setGameState(null);
    setIsPlaying(false);
    setMessage('');
    setBetAmount('');
  };

  const Card = ({ card, hidden = false }) => {
    const getCardColor = (suit) => {
      return ['♥', '♦'].includes(suit) ? 'text-red-500' : 'text-gray-900';
    };

    if (hidden) {
      return (
        <div className="w-20 h-28 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-900 flex items-center justify-center shadow-lg">
          <div className="text-4xl text-blue-200">🂠</div>
        </div>
      );
    }

    return (
      <div className="w-20 h-28 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-between p-2 shadow-lg transform hover:scale-105 transition-transform">
        <div className={`text-2xl font-bold ${getCardColor(card.suit)}`}>
          {card.value}
        </div>
        <div className={`text-3xl ${getCardColor(card.suit)}`}>
          {card.suit}
        </div>
        <div className={`text-2xl font-bold ${getCardColor(card.suit)}`}>
          {card.value}
        </div>
      </div>
    );
  };

  const HandDisplay = ({ title, cards, value, hideFirstCard = false }) => (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-phantom-text-primary mb-4 flex items-center gap-2">
        {title}
        {value !== undefined && (
          <span className="px-3 py-1 bg-phantom-bg-tertiary rounded-full text-sm">
            Value: {value}
          </span>
        )}
      </h3>
      <div className="flex gap-3 flex-wrap">
        {cards.map((card, idx) => (
          <Card key={idx} card={card} hidden={hideFirstCard && idx === 0} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-phantom-bg-primary">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-phantom-text-primary mb-2 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            Blackjack
          </h1>
          <p className="text-phantom-text-secondary">
            Beat the dealer to 21! Blackjack pays 3:2
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-phantom-bg-secondary border-2 border-phantom-border rounded-2xl p-8 shadow-glow">
              {/* Balance Display */}
              <div className="mb-6 flex items-center justify-between">
                <div className="px-4 py-2 bg-phantom-bg-tertiary rounded-xl border border-phantom-border">
                  <p className="text-sm text-phantom-text-secondary">Your Balance</p>
                  <p className="text-2xl font-bold text-phantom-text-primary">
                    {getCurrencySymbol('stoneworks_dollar')} {Number(wallet?.stoneworks_dollar || 0).toFixed(0)}
                  </p>
                </div>
                {gameState?.betAmount && (
                  <div className="px-4 py-2 bg-amber-500/20 rounded-xl border border-amber-500/50">
                    <p className="text-sm text-amber-300">Current Bet</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {getCurrencySymbol('stoneworks_dollar')} {Number(gameState.betAmount).toFixed(0)}
                    </p>
                  </div>
                )}
              </div>

              {/* Game Board */}
              {!isPlaying ? (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <svg className="w-24 h-24 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  
                  <div className="max-w-md mx-auto">
                    <label className="block text-phantom-text-primary font-medium mb-2">
                      Bet Amount ({getCurrencySymbol('stoneworks_dollar')})
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-phantom-bg-tertiary border-2 border-phantom-border text-phantom-text-primary placeholder:text-phantom-text-tertiary focus:border-phantom-accent-primary focus:shadow-input focus:outline-none text-center text-xl font-bold mb-4"
                      placeholder="Enter bet amount"
                    />
                    
                    <div className="flex gap-2 mb-6">
                      {[10, 25, 50, 100].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount.toString())}
                          className="flex-1 px-3 py-2 rounded-lg bg-phantom-bg-tertiary hover:bg-phantom-accent-primary/20 border border-phantom-border hover:border-phantom-accent-primary text-phantom-text-secondary hover:text-phantom-accent-primary transition-all text-sm"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={startGame}
                      className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-glow-sm hover:shadow-glow transition-all transform hover:scale-105"
                    >
                      Deal Cards
                    </button>
                  </div>
                </div>
              ) : gameState ? (
                <div>
                  {/* Dealer's Hand */}
                  <HandDisplay
                    title="🎩 Dealer"
                    cards={gameState.dealerHand}
                    value={gameState.gameOver ? gameState.dealerValue : undefined}
                    hideFirstCard={!gameState.gameOver}
                  />

                  {/* Player's Hand */}
                  <HandDisplay
                    title="🎮 You"
                    cards={gameState.playerHand}
                    value={gameState.playerValue}
                  />

                  {/* Game Result Message */}
                  {message && (
                    <div className={`mb-6 p-4 rounded-xl border-2 text-center ${
                      gameState.won 
                        ? 'bg-green-500/20 border-green-500 text-green-300' 
                        : gameState.result === 'push'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-red-500/20 border-red-500 text-red-300'
                    }`}>
                      <p className="text-2xl font-bold">{message}</p>
                      {gameState.amountChange !== 0 && (
                        <p className="text-lg mt-2">
                          {gameState.amountChange > 0 ? '+' : ''}{getCurrencySymbol('stoneworks_dollar')} {Number(gameState.amountChange).toFixed(0)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!gameState.gameOver ? (
                    <div className="flex gap-4">
                      <button
                        onClick={handleHit}
                        className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold text-lg shadow-glow-sm hover:shadow-glow transition-all transform hover:scale-105"
                      >
                        Hit
                      </button>
                      <button
                        onClick={handleStand}
                        className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold text-lg shadow-glow-sm hover:shadow-glow transition-all transform hover:scale-105"
                      >
                        Stand
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={resetGame}
                      className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-glow-sm hover:shadow-glow transition-all transform hover:scale-105"
                    >
                      New Game
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-phantom-accent-primary mx-auto mb-4"></div>
                  <p className="text-phantom-text-secondary">Loading game...</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Stats & Recent Games */}
          <div className="space-y-6">
            {/* Rules Card */}
            <div className="bg-phantom-bg-secondary border-2 border-phantom-border rounded-2xl p-6">
              <h3 className="text-xl font-bold text-phantom-text-primary mb-4">📋 Rules</h3>
              <ul className="space-y-2 text-sm text-phantom-text-secondary">
                <li>• Get closer to 21 than dealer</li>
                <li>• Aces count as 1 or 11</li>
                <li>• Face cards count as 10</li>
                <li>• Dealer hits on 16 or less</li>
                <li>• Blackjack pays 3:2</li>
                <li>• Regular win pays 1:1</li>
              </ul>
            </div>

            {/* Recent Games */}
            <div className="bg-phantom-bg-secondary border-2 border-phantom-border rounded-2xl p-6">
              <h3 className="text-xl font-bold text-phantom-text-primary mb-4">🎲 Recent Games</h3>
              <div className="space-y-3">
                {recentGames.length === 0 ? (
                  <p className="text-phantom-text-tertiary text-sm">No games played yet</p>
                ) : (
                  recentGames.map((game) => (
                    <div
                      key={game.id}
                      className="p-3 bg-phantom-bg-tertiary rounded-xl border border-phantom-border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                          {game.won ? '✓ Won' : '✗ Lost'}
                        </span>
                        <span className="text-xs text-phantom-text-tertiary">
                          {new Date(game.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-phantom-text-secondary">{game.result}</span>
                        <span className="text-phantom-text-primary font-medium">
                          {getCurrencySymbol('stoneworks_dollar')} {Number(game.bet_amount).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blackjack;

