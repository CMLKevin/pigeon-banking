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
      return ['♥', '♦'].includes(suit) ? 'text-deco-burgundy' : 'text-noir-black';
    };

    if (hidden) {
      return (
        <div className="w-20 h-28 bg-gradient-to-br from-gold-dark to-gold-bronze border-2 border-gold flex items-center justify-center shadow-gold-glow relative">
          <div className="absolute top-0 left-0 w-1 h-1 bg-noir-black"></div>
          <div className="absolute bottom-0 right-0 w-1 h-1 bg-noir-black"></div>
          <div className="text-4xl text-noir-black/50">🈠</div>
        </div>
      );
    }

    return (
      <div className="w-20 h-28 bg-deco-cream border-2 border-gold/50 flex flex-col items-center justify-between p-2 shadow-lg transform hover:scale-105 transition-transform relative">
        <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-gold"></div>
        <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-gold"></div>
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
      <h3 className="text-xl font-bold text-gold mb-4 flex items-center gap-2 uppercase tracking-wider">
        {title}
        {value !== undefined && (
          <span className="px-3 py-1 bg-noir-charcoal border border-gold/30 text-sm text-gold font-bold">
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
    <div className="min-h-screen bg-gradient-dark relative">
      {/* Art deco background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
      </div>
      
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Art Deco Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold"></div>
            <div className="w-12 h-12 border-2 border-gold bg-noir-darker flex items-center justify-center">
              <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold"></div>
          </div>
          <h1 className="text-5xl font-bold text-gold tracking-widest mb-3">
            BLACKJACK
          </h1>
          <p className="text-deco-silver text-sm tracking-wider">
            BEAT THE DEALER TO 21 • BLACKJACK PAYS 3:2
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-noir-dark/90 border-2 border-gold/30 p-8 shadow-card relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
              {/* Balance Display */}
              <div className="mb-6 flex items-center justify-between">
                <div className="px-4 py-2 bg-noir-charcoal border border-gold/30">
                  <p className="text-xs text-deco-silver/60 uppercase tracking-wider">Your Balance</p>
                  <p className="text-2xl font-bold text-gold">
                    {getCurrencySymbol('stoneworks_dollar')} {Number(wallet?.stoneworks_dollar || 0).toFixed(0)}
                  </p>
                </div>
                {gameState?.betAmount && (
                  <div className="px-4 py-2 bg-gold-bronze/20 border border-gold">
                    <p className="text-xs text-noir-black uppercase tracking-wider font-bold">Current Bet</p>
                    <p className="text-2xl font-bold text-gold-dark">
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
                    <label className="block text-gold font-bold mb-3 uppercase tracking-wider text-sm">
                      Bet Amount ({getCurrencySymbol('stoneworks_dollar')})
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-noir-charcoal border-2 border-gold/30 text-deco-cream placeholder:text-deco-silver/50 focus:border-gold focus:shadow-gold-glow focus:outline-none text-center text-xl font-bold mb-4"
                      placeholder="Enter bet amount"
                    />
                    
                    <div className="flex gap-2 mb-6">
                      {[10, 25, 50, 100].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount.toString())}
                          className="flex-1 px-3 py-2 bg-noir-charcoal hover:bg-gold/20 border border-gold/30 hover:border-gold text-deco-silver hover:text-gold transition-all text-sm font-bold uppercase tracking-wider"
                        >
                          {amount}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={startGame}
                      className="w-full px-8 py-4 bg-gradient-gold border-2 border-gold text-noir-black font-bold text-lg hover:shadow-gold-glow transition-all transform hover:scale-105 uppercase tracking-wider"
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

                  {/* Art Deco Game Result Message */}
                  {message && (
                    <div className={`mb-6 p-4 border-2 text-center relative ${
                      gameState.won 
                        ? 'bg-deco-emerald/10 border-deco-emerald/50' 
                        : gameState.result === 'push'
                        ? 'bg-gold/10 border-gold/50'
                        : 'bg-deco-burgundy/10 border-deco-burgundy/50'
                    }`}>
                      <div className={`absolute top-0 left-0 w-2 h-2 ${
                        gameState.won ? 'bg-deco-emerald' : gameState.result === 'push' ? 'bg-gold' : 'bg-deco-burgundy'
                      }`}></div>
                      <div className={`absolute top-0 right-0 w-2 h-2 ${
                        gameState.won ? 'bg-deco-emerald' : gameState.result === 'push' ? 'bg-gold' : 'bg-deco-burgundy'
                      }`}></div>
                      <p className={`text-2xl font-bold uppercase tracking-wider ${
                        gameState.won ? 'text-deco-emerald' : gameState.result === 'push' ? 'text-gold' : 'text-deco-burgundy'
                      }`}>{message}</p>
                      {gameState.amountChange !== 0 && (
                        <p className="text-lg mt-2 text-gold font-bold">
                          {gameState.amountChange > 0 ? '+' : ''}{getCurrencySymbol('stoneworks_dollar')} {Number(gameState.amountChange).toFixed(0)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Art Deco Action Buttons */}
                  {!gameState.gameOver ? (
                    <div className="flex gap-4">
                      <button
                        onClick={handleHit}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 border-2 border-gold-dark text-white font-bold text-lg hover:shadow-gold-glow transition-all transform hover:scale-105 uppercase tracking-wider"
                      >
                        Hit
                      </button>
                      <button
                        onClick={handleStand}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 border-2 border-gold-dark text-white font-bold text-lg hover:shadow-gold-glow transition-all transform hover:scale-105 uppercase tracking-wider"
                      >
                        Stand
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={resetGame}
                      className="w-full px-6 py-4 bg-gradient-gold border-2 border-gold text-noir-black font-bold text-lg hover:shadow-gold-glow transition-all transform hover:scale-105 uppercase tracking-wider"
                    >
                      New Game
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin h-12 w-12 border-4 border-gold/20 border-t-gold mx-auto mb-4"></div>
                  <p className="text-deco-silver uppercase tracking-wider">Loading game...</p>
                </div>
              )}
            </div>
          </div>

          {/* Art Deco Sidebar - Stats & Recent Games */}
          <div className="space-y-6">
            {/* Rules Card */}
            <div className="bg-noir-dark/90 border-2 border-gold/30 p-6 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gold"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gold"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gold"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gold"></div>
              <h3 className="text-xl font-bold text-gold mb-4 uppercase tracking-wider">📋 Rules</h3>
              <ul className="space-y-2 text-sm text-deco-silver">
                <li>• Get closer to 21 than dealer</li>
                <li>• Aces count as 1 or 11</li>
                <li>• Face cards count as 10</li>
                <li>• Dealer hits on 16 or less</li>
                <li>• Blackjack pays 3:2</li>
                <li>• Regular win pays 1:1</li>
              </ul>
            </div>

            {/* Art Deco Recent Games */}
            <div className="bg-noir-dark/90 border-2 border-gold/30 p-6 relative">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gold"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gold"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gold"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gold"></div>
              <h3 className="text-xl font-bold text-gold mb-4 uppercase tracking-wider">🎲 Recent Games</h3>
              <div className="space-y-3">
                {recentGames.length === 0 ? (
                  <p className="text-deco-silver/60 text-sm uppercase tracking-wider">No games played yet</p>
                ) : (
                  recentGames.map((game) => (
                    <div
                      key={game.id}
                      className="p-3 bg-noir-charcoal/50 border border-gold/20 relative"
                    >
                      <div className="absolute top-0 left-0 w-1 h-1 bg-gold"></div>
                      <div className="absolute bottom-0 right-0 w-1 h-1 bg-gold"></div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold uppercase tracking-wide ${game.won ? 'text-deco-emerald' : 'text-deco-burgundy'}`}>
                          {game.won ? '✓ Won' : '✗ Lost'}
                        </span>
                        <span className="text-xs text-deco-silver/60">
                          {new Date(game.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-deco-silver uppercase tracking-wider text-xs">{game.result}</span>
                        <span className="text-gold font-bold">
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

