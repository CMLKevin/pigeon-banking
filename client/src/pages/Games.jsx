import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { walletAPI } from '../services/api';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import api from '../services/api';

const Games = () => {
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    loadWallet();
    loadGameStats();
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

  const loadGameStats = async () => {
    try {
      const res = await api.get('/games/stats');
      setStats(res.data.stats);
    } catch (error) {
      console.error('Failed to load game stats:', error);
    }
  };

  const loadRecentGames = async () => {
    try {
      const res = await api.get('/games/history', { params: { limit: 10 } });
      setRecentGames(res.data.games || []);
    } catch (error) {
      console.error('Failed to load game history:', error);
    }
  };

  const games = [
    {
      id: 'coinflip',
      title: 'Coin Flip',
      description: 'Classic heads or tails game with a 45% win rate',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-yellow-500',
      path: '/games/coinflip',
      stats: {
        houseEdge: '10%',
        winRate: '45%',
        payout: '2x'
      }
    },
    {
      id: 'blackjack',
      title: 'Blackjack',
      description: 'Beat the dealer to 21! Blackjack pays 3:2',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      gradient: 'from-green-500 to-emerald-600',
      path: '/games/blackjack',
      stats: {
        houseEdge: '~0.5%',
        winRate: 'Varies',
        payout: '3:2 for BJ'
      }
    },
    {
      id: 'plinko',
      title: 'Plinko',
      description: 'Drop the ball and hit multipliers up to 1000x!',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="16" cy="8" r="1.5" fill="currentColor" />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-600',
      path: '/games/plinko',
      stats: {
        houseEdge: '5%',
        winRate: 'Varies',
        payout: 'Up to 1000x'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-dark relative">
      {/* Art deco background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-gold via-gold/50 to-transparent"></div>
      </div>
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in relative z-10">
        {/* Art Deco Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold"></div>
            <div className="w-12 h-12 border-2 border-gold bg-noir-darker flex items-center justify-center transform rotate-45">
              <svg className="w-6 h-6 text-gold -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold"></div>
          </div>
          <h1 className="text-5xl font-bold text-gold tracking-widest mb-3">
            GAME CENTER
          </h1>
          <p className="text-deco-silver text-sm tracking-wider">
            TEST YOUR LUCK • WIN BIG
          </p>
        </div>

        {/* Art Deco Balance & Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Game Chips Balance - Art Deco */}
          <div className="bg-gradient-gold p-6 shadow-gold-glow lg:col-span-2 border-2 border-gold-dark relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-noir-black"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-noir-black"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-noir-black"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-noir-black"></div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-noir-black/70 text-xs font-bold uppercase tracking-widest mb-2">Game Chips</p>
                <h2 className="text-5xl font-bold tracking-tight text-noir-black">
                  {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(wallet?.stoneworks_dollar || 0)}
                </h2>
              </div>
              <div className="w-16 h-16 bg-noir-black/20 backdrop-blur-sm border-2 border-noir-black flex items-center justify-center">
                <svg className="w-10 h-10 text-noir-black" fill="currentColor" viewBox="0 0 24 24">
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

          {/* Total Games */}
          <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-6 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold"></div>
            <p className="text-deco-silver/60 text-xs uppercase tracking-widest mb-2">Total Games</p>
            <p className="text-3xl font-bold text-gold">{stats?.total_games || 0}</p>
          </div>

          {/* Net Profit */}
          <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-6 relative">
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold"></div>
            <p className="text-deco-silver/60 text-xs uppercase tracking-widest mb-2">Net Profit</p>
            <p className={`text-3xl font-bold ${
              (stats?.total_profit || 0) >= 0 ? 'text-deco-emerald' : 'text-deco-burgundy'
            }`}>
              {(stats?.total_profit || 0) >= 0 ? '+' : ''}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(Math.abs(stats?.total_profit || 0))}
            </p>
          </div>
        </div>

        {/* Art Deco Games Grid */}
        <div>
          <h2 className="text-3xl font-bold text-gold mb-6 uppercase tracking-wider text-center">Available Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => (
              <Link
                key={game.id}
                to={game.path}
                className="group block"
              >
                <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 hover:border-gold transition-all duration-300 p-8 hover:shadow-gold-glow transform hover:scale-105 relative">
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gold"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gold"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gold"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gold"></div>
                  
                  {/* Game Icon & Title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${game.gradient} border-2 border-gold-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      {game.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gold group-hover:text-gold-light transition-colors uppercase tracking-wide">
                        {game.title}
                      </h3>
                      <p className="text-xs text-deco-silver/70 uppercase tracking-wider">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  {/* Game Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-noir-charcoal/50 border border-gold/20">
                      <p className="text-xs text-deco-silver/60 mb-1 uppercase tracking-wider">House Edge</p>
                      <p className="text-sm font-bold text-gold">{game.stats.houseEdge}</p>
                    </div>
                    <div className="text-center p-3 bg-noir-charcoal/50 border border-gold/20">
                      <p className="text-xs text-deco-silver/60 mb-1 uppercase tracking-wider">Win Rate</p>
                      <p className="text-sm font-bold text-gold">{game.stats.winRate}</p>
                    </div>
                    <div className="text-center p-3 bg-noir-charcoal/50 border border-gold/20">
                      <p className="text-xs text-deco-silver/60 mb-1 uppercase tracking-wider">Payout</p>
                      <p className="text-sm font-bold text-gold">{game.stats.payout}</p>
                    </div>
                  </div>

                  {/* Play Button */}
                  <div className="mt-6">
                    <div className="w-full py-3 bg-gradient-gold border-2 border-gold text-noir-black font-bold text-center group-hover:shadow-gold-glow transition-all uppercase tracking-wider">
                      Play Now →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Art Deco Recent Games */}
        <div className="bg-noir-dark/90 backdrop-blur-xl shadow-card border-2 border-gold/30 p-8 relative">
          {/* Corner decorations */}
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
              <p className="text-sm text-deco-silver/60 mt-2">Choose a game above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGames.map((game, index) => {
                const gameType = game.game_type === 'coinflip' ? 'Coin Flip' 
                  : game.game_type === 'blackjack' ? 'Blackjack' 
                  : game.game_type === 'plinko' ? 'Plinko' 
                  : game.game_type;
                
                let payout;
                if (game.game_type === 'blackjack' && game.result === 'blackjack') {
                  payout = game.bet_amount * 1.5;
                } else if (game.game_type === 'plinko') {
                  const multiplier = parseFloat(game.result);
                  payout = Math.abs(game.bet_amount * (multiplier - 1));
                } else {
                  payout = game.bet_amount;
                }
                
                return (
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
                          {gameType} • {game.game_type === 'plinko' ? `${game.result}x` : game.result}
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
                        {game.won ? '+' : '-'}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(payout)}
                      </p>
                      <p className="text-xs text-deco-silver/60">
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

export default Games;
