import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { walletAPI } from '../services/api';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import api from '../services/api';

const CoinFlip = () => {
  const [wallet, setWallet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedSide, setSelectedSide] = useState('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [recentGames, setRecentGames] = useState([]);
  const audioCtxRef = useRef(null);

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    return audioCtxRef.current;
  };

  const playFlipSound = () => {
    const ctx = ensureAudioContext();
    const duration = 0.25;
    const now = ctx.currentTime;

    // Click attack
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(400, now);
    clickGain.gain.setValueAtTime(0.2, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    clickOsc.connect(clickGain).connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.06);

    // Short filtered noise swish
    const bufferSize = 0.2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
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
      const res = await api.get('/games/history');
      const filtered = (res.data.games || []).filter(g => g.game_type === 'coinflip');
      setRecentGames(filtered);
    } catch (error) {
      console.error('Failed to load game history:', error);
    }
  };

  const handleCoinFlip = async (e) => {
    e.preventDefault();
    
    if (!betAmount || parseFloat(betAmount) <= 0) {
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

    setIsFlipping(true);
    try { playFlipSound(); } catch {}
    setShowResult(false);
    setGameResult(null);

    try {
      const res = await api.post('/games/coinflip', {
        betAmount: parseFloat(betAmount),
        choice: selectedSide
      });

      // Simulate coin flip animation
      setTimeout(() => {
        setGameResult(res.data);
        setShowResult(true);
        setIsFlipping(false);
        if (res.data?.won) {
          try { playWinChime(); } catch {}
        }
        loadWallet();
        loadRecentGames();
      }, 1800);
    } catch (error) {
      setIsFlipping(false);
      alert(error.response?.data?.message || 'Failed to play game');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark relative">
      {/* Art deco background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
      </div>
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in relative z-10">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold"></div>
            <div className="w-12 h-12 border-2 border-gold bg-noir-darker flex items-center justify-center transform rotate-45">
              <svg className="w-6 h-6 text-gold -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold"></div>
          </div>
          <h1 className="text-5xl font-bold text-gold tracking-widest mb-3">COIN FLIP</h1>
          <p className="text-deco-silver text-sm tracking-wider">DOUBLE OR NOTHING</p>
        </div>

        {/* Art Deco Game Chips Balance */}
        <div className="bg-gold-bronze p-6 shadow-gold-glow border-2 border-gold-dark relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-noir-black"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-noir-black"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-noir-black"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-noir-black"></div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-noir-black/70 text-xs font-bold uppercase tracking-widest mb-1">Game Chips</p>
              <h2 className="text-4xl font-bold tracking-tight text-noir-black">
                {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(wallet?.stoneworks_dollar || 0)}
              </h2>
            </div>
            <div className="w-14 h-14 bg-noir-black/20 backdrop-blur-sm border-2 border-noir-black flex items-center justify-center">
              <svg className="w-8 h-8 text-noir-black" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="7" r="1" fill="currentColor"/>
                <circle cx="12" cy="17" r="1" fill="currentColor"/>
                <circle cx="7" cy="12" r="1" fill="currentColor"/>
                <circle cx="17" cy="12" r="1" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Art Deco Coin Flip Game */}
        <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-8 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 border-2 border-gold-dark flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gold uppercase tracking-wider">Coin Flip</h2>
              <p className="text-xs text-deco-silver/70 uppercase tracking-wider">House Edge: 10% • Win Rate: 45%</p>
            </div>
          </div>

          {/* Art Deco Coin Animation */}
          <div className="flex justify-center mb-8">
            <div className={`relative w-40 h-40 coin-3d ${isFlipping ? 'animate-coin-flip' : ''}`}>
              <div className="w-full h-full bg-gradient-gold rounded-full shadow-gold-glow flex items-center justify-center border-4 border-gold-dark">
                {!isFlipping && !showResult && (
                  <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {showResult && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-noir-black mb-1">
                      {gameResult?.result === 'heads' ? '👑' : '🎯'}
                    </p>
                    <p className="text-lg font-bold text-noir-black uppercase tracking-wider">
                      {gameResult?.result}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Art Deco Result Display */}
          {showResult && gameResult && (
            <div className={`mb-6 p-6 border-2 relative ${
              gameResult.won 
                ? 'bg-deco-emerald/10 border-deco-emerald/50' 
                : 'bg-deco-burgundy/10 border-deco-burgundy/50'
            }`}>
              <div className="absolute top-0 left-0 w-2 h-2 ${gameResult.won ? 'bg-deco-emerald' : 'bg-deco-burgundy'}"></div>
              <div className="absolute top-0 right-0 w-2 h-2 ${gameResult.won ? 'bg-deco-emerald' : 'bg-deco-burgundy'}"></div>
              <div className="text-center">
                <p className={`text-2xl font-bold mb-2 uppercase tracking-wider ${
                  gameResult.won ? 'text-deco-emerald' : 'text-deco-burgundy'
                }`}>
                  {gameResult.won ? '🎉 You Won!' : '😔 You Lost'}
                </p>
                <p className="text-gold text-xl font-bold">
                  {gameResult.won ? '+' : '-'}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(Math.abs(gameResult.amountChange))}
                </p>
                <p className="text-xs text-deco-silver/60 mt-2 uppercase tracking-wider">
                  New Balance: {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(gameResult.newBalance)}
                </p>
              </div>
            </div>
          )}

          {/* Betting Form */}
          <form onSubmit={handleCoinFlip} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-3">
                Choose Side
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedSide('heads')}
                  disabled={isFlipping}
                  className={`p-4 border-2 transition-all duration-200 relative ${
                    selectedSide === 'heads'
                      ? 'bg-gold/20 border-gold text-gold shadow-gold-glow'
                      : 'bg-noir-charcoal border-gold/30 text-deco-silver hover:border-gold/50'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold"></div>
                  <div className="text-3xl mb-2">👑</div>
                  <p className="font-bold uppercase tracking-wider text-sm">Heads</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSide('tails')}
                  disabled={isFlipping}
                  className={`p-4 border-2 transition-all duration-200 relative ${
                    selectedSide === 'tails'
                      ? 'bg-gold/20 border-gold text-gold shadow-gold-glow'
                      : 'bg-noir-charcoal border-gold/30 text-deco-silver hover:border-gold/50'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold"></div>
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="font-bold uppercase tracking-wider text-sm">Tails</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gold uppercase tracking-wider mb-3">
                Bet Amount (Game Chips)
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isFlipping}
                placeholder="Enter amount..."
                className="w-full px-4 py-3 bg-noir-charcoal border-2 border-gold/30 text-deco-cream placeholder-deco-silver/50 focus:border-gold focus:shadow-gold-glow focus:ring-0 transition-all disabled:opacity-50"
                step="0.01"
                min="0.01"
              />
              <div className="mt-2 flex gap-2">
                {[10, 50, 100, 500].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBetAmount(amount.toString())}
                    disabled={isFlipping}
                    className="px-3 py-1 text-sm bg-noir-charcoal border border-gold/30 text-deco-silver hover:border-gold hover:text-gold transition-all disabled:opacity-50 uppercase tracking-wider font-bold"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isFlipping || !betAmount}
              className="w-full py-4 bg-gradient-gold border-2 border-gold text-noir-black font-bold hover:shadow-gold-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-lg"
            >
              {isFlipping ? 'Flipping...' : 'Flip Coin'}
            </button>
          </form>
        </div>

        {/* Art Deco Recent Games */}
        <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-8 relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
          
          <h2 className="text-2xl font-bold text-gold mb-6 flex items-center gap-3 uppercase tracking-wider">
            <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Games
          </h2>
          
          {recentGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-deco-silver uppercase tracking-wider">No games played yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGames.map((game, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-noir-charcoal/50 border border-gold/20 relative"
                >
                  <div className="absolute top-0 left-0 w-1 h-1 bg-gold"></div>
                  <div className="absolute bottom-0 right-0 w-1 h-1 bg-gold"></div>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 border-2 flex items-center justify-center font-bold ${
                      game.won ? 'border-deco-emerald bg-deco-emerald/20 text-deco-emerald' : 'border-deco-burgundy bg-deco-burgundy/20 text-deco-burgundy'
                    }`}>
                      {game.won ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gold uppercase tracking-wide">
                        {game.choice} • {game.result}
                      </p>
                      <p className="text-xs text-deco-silver/60">
                        {new Date(game.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      game.won ? 'text-deco-emerald' : 'text-deco-burgundy'
                    }`}>
                      {game.won ? '+' : '-'}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(game.bet_amount * (game.won ? 1.0 : 1))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;

