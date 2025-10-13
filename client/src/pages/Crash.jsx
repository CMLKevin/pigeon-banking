import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { walletAPI } from '../services/api';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import api from '../services/api';

const Crash = () => {
  const [wallet, setWallet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [autoCashout, setAutoCashout] = useState('');
  const [gameState, setGameState] = useState('waiting'); // waiting, starting, running, crashed
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(null);
  const [myBet, setMyBet] = useState(null);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [recentGames, setRecentGames] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const multiplierHistoryRef = useRef([]);
  const audioCtxRef = useRef(null);
  const GROWTH_RATE = 0.00035; // Slower growth for longer rounds

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    return audioCtxRef.current;
  };

  const playTickSound = () => {
    try {
      const ctx = ensureAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  };

  const playCrashSound = () => {
    try {
      const ctx = ensureAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.51);
    } catch {}
  };

  const playCashoutSound = () => {
    try {
      const ctx = ensureAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.21);
      });
    } catch {}
  };

  useEffect(() => {
    loadWallet();
    loadRecentGames();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
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
      const res = await api.get('/games/history', { params: { limit: 20 } });
      const filtered = (res.data.games || []).filter(g => g.game_type === 'crash');
      setRecentGames(filtered);
    } catch (error) {
      console.error('Failed to load game history:', error);
    }
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i < 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let i = 0; i < 8; i++) {
      const x = (width / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw graph line if game is running or crashed
    if ((gameState === 'running' || gameState === 'crashed') && multiplierHistoryRef.current.length > 1) {
      const history = multiplierHistoryRef.current;

      // Dynamic scaling to fit entire curve
      const latestTime = history[history.length - 1]?.time || 0;
      const maxTimeExpected = crashPoint
        ? Math.log(Math.max(crashPoint, 1.01)) / GROWTH_RATE
        : Math.max(6000, latestTime * 1.2);
      const currentMaxMult = history.reduce((m, p) => Math.max(m, p.mult), 1);
      const yMax = Math.max(2, gameState === 'crashed' ? (crashPoint || currentMaxMult) : currentMaxMult * 1.05);

      ctx.strokeStyle = gameState === 'crashed' ? '#ef4444' : '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();

      history.forEach((point, index) => {
        const x = Math.min(1, point.time / maxTimeExpected) * width;
        const y = height - (Math.min(point.mult, yMax) - 1) / (yMax - 1) * height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();

      // Draw glow effect
      if (gameState === 'running') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#10b981';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
  };

  useEffect(() => {
    drawGraph();
  }, [multiplier, gameState, multiplierHistoryRef.current.length]);

  const startNewRound = async () => {
    try {
      const res = await api.post('/games/crash/start');
      setCrashPoint(res.data.crashPoint);
      setGameState('starting');
      setMultiplier(1.00);
      setHasCashedOut(false);
      multiplierHistoryRef.current = [];
      setCountdown(5);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            startGame(res.data.crashPoint);
            return 0;
          }
          playTickSound();
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start crash round:', error);
    }
  };

  const startGame = (crashPointValue) => {
    setGameState('running');
    startTimeRef.current = Date.now();
    multiplierHistoryRef.current = [{ time: 0, mult: 1.00 }];
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      // Exponential growth: mult = e^(GROWTH_RATE * elapsed)
      const currentMult = Math.pow(Math.E, GROWTH_RATE * elapsed);
      
      setMultiplier(currentMult);
      multiplierHistoryRef.current.push({ time: elapsed, mult: currentMult });

      // Check for auto cashout
      if (myBet && !hasCashedOut && autoCashout && currentMult >= parseFloat(autoCashout)) {
        handleCashout();
        return;
      }

      // Check if crashed
      if (currentMult >= crashPointValue) {
        setGameState('crashed');
        setMultiplier(crashPointValue);
        playCrashSound();
        
        // Update local state if player lost
        if (myBet && !hasCashedOut) {
          setMyBet({ ...myBet, result: 'lost' });
        }

        // Always finalize the round on server to save all unresolved bets
        api.post('/games/crash/finalize').catch(err => 
          console.error('Failed to finalize round:', err)
        );

        // Stop here; wait for a new bet to start next round
        setTimeout(() => {
          setMyBet(null);
          setGameState('waiting');
          setCrashPoint(null);
          multiplierHistoryRef.current = [];
          loadRecentGames();
        }, 2000);
        
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const handlePlaceBet = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) > wallet?.stoneworks_dollar) {
      alert('Insufficient Game Chips balance');
      return;
    }

    if (gameState !== 'waiting' && gameState !== 'starting') {
      alert('Please wait for the next round');
      return;
    }

    try {
      const wasWaiting = gameState === 'waiting';
      let roundCrashPoint = crashPoint;

      // If no round is active, start one first
      if (wasWaiting) {
        const startRes = await api.post('/games/crash/start');
        roundCrashPoint = startRes.data.crashPoint;
        setCrashPoint(roundCrashPoint);
        setGameState('starting');
        setMultiplier(1.00);
        setHasCashedOut(false);
        multiplierHistoryRef.current = [];
        setCountdown(5);
      }

      // Now place the bet
      await api.post('/games/crash/bet', {
        betAmount: parseFloat(betAmount),
        autoCashout: autoCashout ? parseFloat(autoCashout) : null
      });

      setMyBet({
        amount: parseFloat(betAmount),
        autoCashout: autoCashout ? parseFloat(autoCashout) : null,
        result: 'active'
      });

      loadWallet();

      // Start countdown if we just started the round
      if (wasWaiting) {
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              startGame(roundCrashPoint);
              return 0;
            }
            playTickSound();
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to place bet:', error);
      alert(error.response?.data?.message || 'Failed to place bet');
    }
  };

  const handleCashout = async () => {
    if (!myBet || hasCashedOut || gameState !== 'running') {
      return;
    }

    try {
      const res = await api.post('/games/crash/cashout', {
        cashoutMultiplier: multiplier
      });

      setHasCashedOut(true);
      setMyBet({ ...myBet, result: 'cashed_out', cashoutMultiplier: multiplier, profit: res.data.profit });
      playCashoutSound();
      loadWallet();
      loadRecentGames();
    } catch (error) {
      console.error('Failed to cash out:', error);
      alert(error.response?.data?.message || 'Failed to cash out');
    }
  };

  // Remove auto-start: rounds begin only after a bet is placed

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">Crash</h1>
          <p className="text-phantom-text-secondary text-lg">Cash out before the crash!</p>
        </div>

        {/* Game Chips Balance */}
        <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Available Game Chips</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(wallet?.stoneworks_dollar || 0)}
              </h2>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Multiplier Display */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
              <div className="text-center mb-6">
                {gameState === 'starting' && (
                  <div>
                    <p className="text-phantom-text-secondary text-lg mb-2">Starting in</p>
                    <h2 className="text-6xl font-bold text-yellow-500">{countdown}</h2>
                  </div>
                )}
                {(gameState === 'running' || gameState === 'crashed') && (
                  <div>
                    <h2 className={`text-8xl font-bold mb-2 ${gameState === 'crashed' ? 'text-red-500' : 'text-green-500'}`}>
                      {multiplier.toFixed(2)}x
                    </h2>
                    {gameState === 'crashed' && (
                      <p className="text-red-500 text-2xl font-bold animate-pulse">CRASHED!</p>
                    )}
                  </div>
                )}
                {gameState === 'waiting' && (
                  <div>
                    <p className="text-phantom-text-secondary text-lg mb-2">Next round</p>
                    <h2 className="text-6xl font-bold text-phantom-text-primary">--</h2>
                  </div>
                )}
              </div>

              {/* Graph Canvas */}
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={300}
                className="w-full max-w-[600px] mx-auto bg-gradient-to-b from-slate-900/50 to-slate-800/50 rounded-2xl border border-phantom-border"
                style={{ aspectRatio: '2/1', display: 'block' }}
              />

              {/* Current Bet Display */}
              {myBet && (
                <div className={`mt-6 p-6 rounded-2xl border-2 ${
                  myBet.result === 'cashed_out' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : myBet.result === 'lost'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="text-center">
                    <p className="text-sm text-phantom-text-secondary mb-1">Your Bet</p>
                    <p className="text-2xl font-bold text-phantom-text-primary mb-2">
                      {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(myBet.amount)}
                    </p>
                    {myBet.result === 'cashed_out' && (
                      <div>
                        <p className="text-green-500 text-xl font-bold">Cashed Out at {myBet.cashoutMultiplier.toFixed(2)}x</p>
                        <p className="text-green-500 text-lg">+{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(myBet.profit)}</p>
                      </div>
                    )}
                    {myBet.result === 'lost' && (
                      <p className="text-red-500 text-xl font-bold">Lost</p>
                    )}
                    {myBet.result === 'active' && !hasCashedOut && gameState === 'running' && (
                      <div>
                        <p className="text-blue-500 text-lg mb-2">
                          Potential Win: {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(myBet.amount * multiplier)}
                        </p>
                        <button
                          onClick={handleCashout}
                          className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all duration-200"
                        >
                          Cash Out {multiplier.toFixed(2)}x
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Betting Form */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <h3 className="text-xl font-bold text-phantom-text-primary mb-4">Place Bet</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-phantom-text-primary mb-2">
                    Bet Amount
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={myBet && myBet.result === 'active'}
                    placeholder="Enter amount..."
                    className="w-full px-4 py-3 bg-phantom-bg-tertiary border-2 border-phantom-border rounded-2xl text-phantom-text-primary placeholder-phantom-text-tertiary focus:border-phantom-accent-primary focus:ring-0 transition-colors disabled:opacity-50"
                    step="0.01"
                    min="0.01"
                  />
                  <div className="mt-2 flex gap-2">
                    {[1, 5, 10, 50].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setBetAmount(amount.toString())}
                        disabled={myBet && myBet.result === 'active'}
                        className="flex-1 px-2 py-1 text-sm bg-phantom-bg-tertiary border border-phantom-border rounded-lg text-phantom-text-secondary hover:border-phantom-accent-primary hover:text-phantom-text-primary transition-all disabled:opacity-50"
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-phantom-text-primary mb-2">
                    Auto Cash Out (Optional)
                  </label>
                  <input
                    type="number"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(e.target.value)}
                    disabled={myBet && myBet.result === 'active'}
                    placeholder="e.g. 2.00"
                    className="w-full px-4 py-3 bg-phantom-bg-tertiary border-2 border-phantom-border rounded-2xl text-phantom-text-primary placeholder-phantom-text-tertiary focus:border-phantom-accent-primary focus:ring-0 transition-colors disabled:opacity-50"
                    step="0.1"
                    min="1.01"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePlaceBet}
                    disabled={myBet && myBet.result === 'active'}
                    className="w-full py-4 bg-gradient-phantom text-white font-bold rounded-2xl hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {myBet && myBet.result === 'active' ? 'Bet Placed' : 'Place Bet'}
                  </button>
                  <button
                    onClick={handleCashout}
                    disabled={!(myBet && myBet.result === 'active' && gameState === 'running')}
                    className="w-full py-4 bg-green-600/80 hover:bg-green-600 text-white font-bold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cash {multiplier.toFixed(2)}x
                  </button>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <h3 className="text-xl font-bold text-phantom-text-primary mb-4">📊 Game Info</h3>
              <div className="space-y-2 text-sm text-phantom-text-secondary">
                <div className="flex justify-between">
                  <span>House Edge:</span>
                  <span className="text-phantom-text-primary font-semibold">5%</span>
                </div>
                <div className="flex justify-between">
                  <span>RTP:</span>
                  <span className="text-phantom-text-primary font-semibold">95%</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Bet:</span>
                  <span className="text-phantom-text-primary font-semibold">{getCurrencySymbol('stoneworks_dollar')} 0.01</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
          <h2 className="text-2xl font-bold text-phantom-text-primary mb-6 flex items-center gap-3">
            <svg className="w-7 h-7 text-phantom-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Games
          </h2>
          
          {recentGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-phantom-text-secondary">No games played yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentGames.slice(0, 10).map((game, index) => {
                const gameData = JSON.parse(game.choice || '{}');
                const crashedAt = parseFloat(game.result);
                const cashedOut = gameData.cashedOut;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        game.won ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {crashedAt.toFixed(2)}x
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-phantom-text-primary">
                          {game.won ? `Cashed @ ${cashedOut?.toFixed(2)}x` : 'Crashed'}
                        </p>
                        <p className="text-xs text-phantom-text-tertiary">
                          {new Date(game.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        game.won ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {game.won ? '+' : '-'}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(Math.abs(game.bet_amount * (game.won ? (cashedOut - 1) : 1)))}
                      </p>
                      <p className="text-xs text-phantom-text-tertiary">
                        Bet: {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(game.bet_amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Crash;

