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
    },
    {
      id: 'crash',
      title: 'Crash',
      description: 'Cash out before the crash! Up to 10000x multiplier',
      icon: (
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      gradient: 'from-red-500 to-orange-600',
      path: '/games/crash',
      stats: {
        houseEdge: '5%',
        winRate: 'Varies',
        payout: 'Up to 10000x'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">
            Game Center
          </h1>
          <p className="text-phantom-text-secondary text-xl">
            Play games with Game Chips and test your luck!
          </p>
        </div>

        {/* Balance & Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Game Chips Balance */}
          <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-card lg:col-span-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Available Game Chips</p>
                <h2 className="text-4xl font-bold tracking-tight">
                  {getCurrencySymbol('stoneworks_dollar')} {formatCurrency(wallet?.stoneworks_dollar || 0)}
                </h2>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white/90" fill="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
            <p className="text-phantom-text-secondary text-sm mb-1">Total Games</p>
            <p className="text-3xl font-bold text-phantom-text-primary">{stats?.total_games || 0}</p>
          </div>

          {/* Net Profit */}
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
            <p className="text-phantom-text-secondary text-sm mb-1">Net Profit</p>
            <p className={`text-3xl font-bold ${
              (stats?.total_profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {(stats?.total_profit || 0) >= 0 ? '+' : ''}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(Math.abs(stats?.total_profit || 0))}
            </p>
          </div>
        </div>

        {/* Games Grid */}
        <div>
          <h2 className="text-3xl font-bold text-phantom-text-primary mb-6">Available Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => (
              <Link
                key={game.id}
                to={game.path}
                className="group block"
              >
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border-2 border-phantom-border hover:border-phantom-accent-primary transition-all duration-300 p-8 hover:shadow-glow transform hover:scale-105">
                  {/* Game Icon & Title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${game.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      {game.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-phantom-text-primary group-hover:text-phantom-accent-primary transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-sm text-phantom-text-secondary">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  {/* Game Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-phantom-bg-tertiary/50 rounded-xl border border-phantom-border">
                      <p className="text-xs text-phantom-text-tertiary mb-1">House Edge</p>
                      <p className="text-sm font-bold text-phantom-text-primary">{game.stats.houseEdge}</p>
                    </div>
                    <div className="text-center p-3 bg-phantom-bg-tertiary/50 rounded-xl border border-phantom-border">
                      <p className="text-xs text-phantom-text-tertiary mb-1">Win Rate</p>
                      <p className="text-sm font-bold text-phantom-text-primary">{game.stats.winRate}</p>
                    </div>
                    <div className="text-center p-3 bg-phantom-bg-tertiary/50 rounded-xl border border-phantom-border">
                      <p className="text-xs text-phantom-text-tertiary mb-1">Payout</p>
                      <p className="text-sm font-bold text-phantom-text-primary">{game.stats.payout}</p>
                    </div>
                  </div>

                  {/* Play Button */}
                  <div className="mt-6">
                    <div className={`w-full py-3 rounded-xl bg-gradient-to-r ${game.gradient} text-white font-bold text-center group-hover:shadow-glow transition-all`}>
                      Play Now →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
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
              <p className="text-sm text-phantom-text-tertiary mt-2">Choose a game above to get started!</p>
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
                    className="flex items-center justify-between p-4 bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        game.won ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {game.won ? '✓' : '✗'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-phantom-text-primary">
                          {gameType} • {game.game_type === 'plinko' ? `${game.result}x` : game.result}
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
                        {game.won ? '+' : '-'}{getCurrencySymbol('stoneworks_dollar')} {formatCurrency(payout)}
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

export default Games;
