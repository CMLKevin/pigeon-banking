import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { predictionAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const PredictionPortfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('positions'); // positions, trades

  useEffect(() => {
    loadPortfolio();
    // Refresh every 30 seconds
    const interval = setInterval(loadPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPortfolio = async () => {
    try {
      const res = await predictionAPI.getPortfolio();
      setPortfolio(res.data);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!portfolio?.trades || portfolio.trades.length === 0) {
      alert('No trades to export');
      return;
    }

    // Helper function to escape CSV values properly
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Escape quotes by doubling them and wrap in quotes if contains special chars
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Prepare CSV data with proper escaping
    const headers = ['Date', 'Market', 'Side', 'Action', 'Quantity', 'Price', 'Cost (Agon)', 'Status'];
    const rows = portfolio.trades.map(trade => [
      new Date(trade.created_at).toLocaleString(),
      trade.market_question || '',
      (trade.side || '').toUpperCase(),
      trade.action || '',
      trade.quantity || 0,
      trade.exec_price || 0,
      trade.cost_agon || 0,
      trade.status || ''
    ]);

    // Build CSV string with proper escaping
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Create download link with BOM for proper Excel UTF-8 handling
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prediction-trades-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
            <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary opacity-20"></div>
          </div>
        </div>
      </div>
    );
  }

  const openPositions = portfolio?.positions?.filter(p => p.quantity > 0) || [];

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent mb-3">
              Prediction Portfolio
            </h1>
            <p className="text-phantom-text-secondary text-lg">
              Track your positions and performance
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-phantom-bg-secondary border border-phantom-border text-phantom-text-primary rounded-xl hover:bg-phantom-bg-tertiary transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Trades
            </button>
            <Link to="/prediction-markets">
              <button className="px-6 py-3 bg-gradient-phantom text-white font-bold rounded-2xl hover:shadow-glow transition-all duration-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              Browse Markets
            </button>
          </Link>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-card">
            <p className="text-white/80 text-sm font-medium mb-1">Total Equity</p>
            <h2 className="text-3xl font-bold tracking-tight">
              Ⱥ {formatCurrency(portfolio?.totals?.equity || 0)}
            </h2>
            <p className="text-xs text-white/70 mt-2">Cash + Positions</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-card">
            <p className="text-white/80 text-sm font-medium mb-1">Cash</p>
            <h2 className="text-3xl font-bold tracking-tight">
              Ⱥ {formatCurrency(portfolio?.totals?.cash || 0)}
            </h2>
            <p className="text-xs text-white/70 mt-2">Available Balance</p>
          </div>

          <div className={`rounded-3xl p-6 text-white shadow-card ${
            (portfolio?.totals?.unrealizedPnl || 0) >= 0 
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
              : 'bg-gradient-to-br from-orange-500 to-red-600'
          }`}>
            <p className="text-white/80 text-sm font-medium mb-1">Unrealized P&L</p>
            <h2 className="text-3xl font-bold tracking-tight">
              {(portfolio?.totals?.unrealizedPnl || 0) >= 0 ? '+' : ''}
              Ⱥ {formatCurrency(Math.abs(portfolio?.totals?.unrealizedPnl || 0))}
            </h2>
            <p className="text-xs text-white/70 mt-2">Open Positions</p>
          </div>

          <div className={`rounded-3xl p-6 text-white shadow-card ${
            (portfolio?.totals?.realizedPnl || 0) >= 0 
              ? 'bg-gradient-to-br from-purple-500 to-pink-600'
              : 'bg-gradient-to-br from-red-500 to-pink-600'
          }`}>
            <p className="text-white/80 text-sm font-medium mb-1">Realized P&L</p>
            <h2 className="text-3xl font-bold tracking-tight">
              {(portfolio?.totals?.realizedPnl || 0) >= 0 ? '+' : ''}
              Ⱥ {formatCurrency(Math.abs(portfolio?.totals?.realizedPnl || 0))}
            </h2>
            <p className="text-xs text-white/70 mt-2">Closed Positions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
              activeTab === 'positions'
                ? 'bg-gradient-phantom text-white shadow-glow'
                : 'bg-phantom-bg-secondary text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Open Positions ({openPositions.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
              activeTab === 'trades'
                ? 'bg-gradient-phantom text-white shadow-glow'
                : 'bg-phantom-bg-secondary text-phantom-text-secondary hover:text-phantom-text-primary hover:bg-phantom-bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Trade History
            </span>
          </button>
        </div>

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
            <h2 className="text-2xl font-bold text-phantom-text-primary mb-6">Open Positions</h2>
            
            {openPositions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-20 h-20 text-phantom-text-tertiary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-xl font-semibold text-phantom-text-primary mb-2">No Open Positions</h3>
                <p className="text-phantom-text-secondary mb-6">
                  Start trading to build your portfolio
                </p>
                <Link to="/prediction-markets">
                  <button className="px-6 py-3 bg-gradient-phantom text-white font-bold rounded-2xl hover:shadow-glow transition-all">
                    Browse Markets
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {openPositions.map((position) => (
                  <Link
                    key={position.id}
                    to={`/prediction-markets/${position.market_id}`}
                    className="block p-6 bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border hover:border-phantom-accent-primary hover:bg-phantom-bg-tertiary transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-phantom-text-primary mb-1">
                          {position.question}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                            position.side === 'yes'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {position.side.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                            position.status === 'active'
                              ? 'bg-blue-500/20 text-blue-500'
                              : 'bg-gray-500/20 text-gray-500'
                          }`}>
                            {position.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {position.unrealizedPnl >= 0 ? '+' : ''}
                          Ⱥ {formatCurrency(Math.abs(position.unrealizedPnl))}
                        </p>
                        <p className="text-xs text-phantom-text-tertiary">Unrealized P&L</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-phantom-text-tertiary mb-1">Quantity</p>
                        <p className="text-sm font-bold text-phantom-text-primary">
                          {formatCurrency(position.quantity)} shares
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-phantom-text-tertiary mb-1">Avg Price</p>
                        <p className="text-sm font-bold text-phantom-text-primary">
                          Ⱥ {position.avg_price.toFixed(3)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-phantom-text-tertiary mb-1">Current Price</p>
                        <p className="text-sm font-bold text-phantom-text-primary">
                          Ⱥ {position.currentPrice.toFixed(3)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-phantom-text-tertiary mb-1">Market Value</p>
                        <p className="text-sm font-bold text-phantom-text-primary">
                          Ⱥ {formatCurrency(position.marketValue)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === 'trades' && (
          <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-8">
            <h2 className="text-2xl font-bold text-phantom-text-primary mb-6">Trade History</h2>
            
            {(!portfolio?.trades || portfolio.trades.length === 0) ? (
              <div className="text-center py-12">
                <p className="text-phantom-text-secondary">No trades yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolio.trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 bg-phantom-bg-tertiary/50 rounded-2xl border border-phantom-border"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        trade.action === 'buy'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {trade.action === 'buy' ? 'B' : 'S'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-phantom-text-primary">
                          {trade.action.toUpperCase()} {formatCurrency(trade.quantity)} {trade.side.toUpperCase()}
                        </p>
                        <p className="text-xs text-phantom-text-tertiary">
                          {trade.question}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-phantom-text-primary">
                        @ Ⱥ {parseFloat(trade.exec_price).toFixed(3)}
                      </p>
                      <p className="text-xs text-phantom-text-tertiary">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionPortfolio;

