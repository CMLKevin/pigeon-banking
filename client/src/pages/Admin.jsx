import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { adminAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const StatCard = ({ title, value, sub, icon, trend }) => (
  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 hover:shadow-card-hover transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <p className="text-phantom-text-tertiary text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-phantom-text-primary group-hover:scale-105 transition-transform">{value}</p>
        {sub && <p className="text-phantom-text-secondary text-sm mt-1">{sub}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trend > 0 ? 'text-phantom-success' : 'text-phantom-error'}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              {trend > 0 ? (
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              )}
            </svg>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-gradient-phantom flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
          {icon}
        </div>
      )}
    </div>
  </div>
);

const BarChart = ({ data, label, maxValue }) => {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const percent = maxValue ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={idx} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-phantom-text-secondary group-hover:text-phantom-text-primary transition-colors">{item.label}</span>
              <span className="text-sm font-semibold text-phantom-text-primary">{item.display || item.value}</span>
            </div>
            <div className="h-2.5 bg-phantom-bg-tertiary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-phantom rounded-full transition-all duration-700 ease-out shadow-glow-sm"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LineChart = ({ data, color = 'phantom' }) => {
  if (!data || data.length === 0) return <p className="text-phantom-text-tertiary text-sm">No data</p>;
  
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;

  return (
    <div className="relative h-32">
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#AB9FF2" />
            <stop offset="100%" stopColor="#78F5E6" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#AB9FF2" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#AB9FF2" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={`M ${data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - min) / range) * 80;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')} L 100 100 L 0 100 Z`}
          fill="url(#areaGradient)"
        />
        
        {/* Line */}
        <path
          d={data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - min) / range) * 80;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.value - min) / range) * 80;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill="#AB9FF2"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {data.length > 0 && (
          <>
            <span className="text-xs text-phantom-text-tertiary">{data[data.length - 1].label}</span>
            <span className="text-xs text-phantom-text-tertiary">{data[0].label}</span>
          </>
        )}
      </div>
    </div>
  );
};

const Admin = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [m, u, a, ic] = await Promise.all([
        adminAPI.getMetrics(),
        adminAPI.getUsers(),
        adminAPI.getActivity(20, 0),
        adminAPI.getInviteCodes(),
      ]);
      setMetrics(m.data);
      setUsers(u.data.users);
      setActivity(a.data.activity);
      setInviteCodes(ic.data.codes);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleDisabled = async (id) => {
    try {
      await adminAPI.toggleDisabled(id);
      load();
    } catch (error) {
      console.error('Failed to toggle disabled:', error);
    }
  };

  const toggleAdmin = async (id) => {
    try {
      await adminAPI.toggleAdmin(id);
      load();
    } catch (error) {
      console.error('Failed to toggle admin:', error);
    }
  };

  const createInviteCode = async () => {
    try {
      setCodeError('');
      if (!newCode.trim()) {
        setCodeError('Code cannot be empty');
        return;
      }
      await adminAPI.createInviteCode(newCode.toUpperCase());
      setNewCode('');
      load();
    } catch (error) {
      setCodeError(error.response?.data?.error || 'Failed to create invite code');
    }
  };

  const generateInviteCode = async () => {
    try {
      setCodeError('');
      await adminAPI.generateInviteCode();
      load();
    } catch (error) {
      setCodeError(error.response?.data?.error || 'Failed to generate invite code');
    }
  };

  const deleteInviteCode = async (id) => {
    try {
      await adminAPI.deleteInviteCode(id);
      load();
    } catch (error) {
      console.error('Failed to delete invite code:', error);
      alert(error.response?.data?.error || 'Failed to delete invite code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary"></div>
          <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-phantom-accent-primary opacity-20"></div>
        </div>
      </div>
    );
  }

  const volumeChartData = metrics?.volumeByDay?.slice().reverse().map(d => ({
    label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Number(d.payment_volume || 0)
  })) || [];

  const userGrowthData = metrics?.userGrowth?.slice().reverse().map(d => ({
    label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.new_users
  })) || [];

  const activityBarData = metrics?.activity24h?.slice(0, 5).map(a => ({
    label: a.action.replace(/_/g, ' '),
    value: a.count,
    display: a.count.toString()
  })) || [];

  const maxActivity = Math.max(...(activityBarData.map(d => d.value) || [1]));

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-phantom flex items-center justify-center shadow-glow">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-phantom bg-clip-text text-transparent">Admin Dashboard</h1>
          </div>
          <p className="text-phantom-text-secondary">Monitor system metrics and manage users</p>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Users" 
                value={metrics.totals.total_users} 
                sub={`${metrics.totals.disabled_users} disabled • ${metrics.totals.admin_users} admins`}
                icon={
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                }
              />
              <StatCard 
                title="Total Transactions" 
                value={metrics.totals.total_transactions} 
                sub={`${metrics.totals.payment_count || 0} payments • ${metrics.totals.swap_count || 0} swaps • ${(metrics.totals.auction_count || 0) + (metrics.totals.commission_count || 0)} auction`}
                icon={
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                }
              />
              <StatCard 
                title="Payment Volume" 
                value={formatCurrency(metrics.totals.total_payment_volume || 0, '$')}
                sub={`Avg: ${formatCurrency(metrics.totals.avg_payment || 0, '$')}`}
                icon={
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                }
              />
              <StatCard 
                title="Currency Supply" 
                value={`$ ${Number(metrics.totals.sum_agon || 0).toFixed(2)}`}
                sub={`SW$ ${Number(metrics.totals.sum_sw || 0).toFixed(0)}`}
                icon={
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                }
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Volume Chart */}
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 group">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-phantom-text-primary">Payment Volume (14 days)</h2>
                    <p className="text-sm text-phantom-text-tertiary">Daily transaction volume</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-phantom/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-phantom-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
                <LineChart data={volumeChartData} />
              </div>

              {/* User Growth Chart */}
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 group">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-phantom-text-primary">User Growth (14 days)</h2>
                    <p className="text-sm text-phantom-text-tertiary">New user signups per day</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-phantom/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-phantom-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
                <LineChart data={userGrowthData} />
              </div>
            </div>

            {/* Trading Analytics */}
            {metrics?.tradingTotals && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-glow">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-phantom bg-clip-text text-transparent">Trading Analytics</h2>
                    <p className="text-phantom-text-secondary">Monitor leveraged trading activity across all assets (crypto, stocks, commodities)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    title="Total Positions" 
                    value={metrics.tradingTotals.total_positions || 0} 
                    sub={`${metrics.tradingTotals.open_positions || 0} open • ${metrics.tradingTotals.closed_positions || 0} closed`}
                    icon={
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                  />
                  <StatCard 
                    title="Unique Traders" 
                    value={metrics.tradingTotals.unique_traders || 0} 
                    sub={`Win rate: ${Number(metrics.tradingTotals.win_rate || 0).toFixed(1)}%`}
                    icon={
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    }
                  />
                  <StatCard 
                    title="Total Volume" 
                    value={formatCurrency(metrics.tradingTotals.total_volume || 0, '$')} 
                    sub={`Locked: ${formatCurrency(metrics.tradingTotals.locked_margin || 0, '$')}`}
                    icon={
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                  <StatCard 
                    title="House P&L" 
                    value={`${Number(metrics.tradingTotals.house_pnl || 0) >= 0 ? '+' : ''}${formatCurrency(metrics.tradingTotals.house_pnl || 0, '$')}`}
                    sub={`Commissions + Fees: ${formatCurrency(metrics.tradingTotals.total_fees || 0, '$')}`}
                    icon={
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Positions by Day */}
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 group">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-phantom-text-primary">Positions by Day (14 days)</h3>
                        <p className="text-sm text-phantom-text-tertiary">Daily trading activity</p>
                      </div>
                    </div>
                    <LineChart data={
                      metrics.tradingByDay?.slice().reverse().map(d => ({
                        label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: Number(d.positions_opened || 0)
                      })) || []
                    } />
                  </div>

                  {/* Top Traders */}
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                    <h3 className="text-xl font-bold text-phantom-text-primary mb-2">Top Traders</h3>
                    <p className="text-sm text-phantom-text-tertiary mb-4">Most active traders across all assets</p>
                    <div className="space-y-3">
                      {metrics.topTraders?.slice(0, 6).map((trader, idx) => (
                        <div key={trader.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-phantom-bg-tertiary transition-all group">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-phantom-text-primary">{trader.username}</p>
                            <p className="text-xs text-phantom-text-tertiary">{trader.total_positions} positions • {trader.wins} wins</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${Number(trader.net_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {Number(trader.net_pnl || 0) >= 0 ? '+' : ''}{Number(trader.net_pnl || 0).toFixed(2)} ⱺ
                            </p>
                            <p className="text-xs text-phantom-text-tertiary">{formatCurrency(trader.total_volume || 0, '$')} volume</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Positions by Coin & Leverage Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Positions by Coin */}
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                    <h3 className="text-xl font-bold text-phantom-text-primary mb-2">Positions by Cryptocurrency</h3>
                    <p className="text-sm text-phantom-text-tertiary mb-4">Trading activity per coin</p>
                    <div className="space-y-4">
                      {metrics.cryptoByCoin?.map((coin) => {
                        const coinNames = { bitcoin: 'Bitcoin (BTC)', ethereum: 'Ethereum (ETH)', dogecoin: 'Dogecoin (DOGE)' };
                        const coinColors = { bitcoin: 'from-orange-500 to-yellow-600', ethereum: 'from-blue-500 to-purple-600', dogecoin: 'from-yellow-400 to-orange-500' };
                        return (
                          <div key={coin.coin_id} className="p-4 bg-phantom-bg-tertiary rounded-2xl border border-phantom-border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${coinColors[coin.coin_id]} flex items-center justify-center shadow-glow-sm`}>
                                  <span className="text-white font-bold text-xs">{coin.coin_id.substring(0,3).toUpperCase()}</span>
                                </div>
                                <span className="text-sm font-semibold text-phantom-text-primary">{coinNames[coin.coin_id]}</span>
                              </div>
                              <span className="text-sm font-bold text-phantom-text-primary">{coin.positions} positions</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-phantom-text-tertiary">Volume: {formatCurrency(coin.volume || 0, '$')}</span>
                              <span className={`font-semibold ${Number(coin.net_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                P&L: {Number(coin.net_pnl || 0) >= 0 ? '+' : ''}{Number(coin.net_pnl || 0).toFixed(2)} $
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leverage Distribution */}
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                    <h3 className="text-xl font-bold text-phantom-text-primary mb-2">Leverage Distribution</h3>
                    <p className="text-sm text-phantom-text-tertiary mb-4">Position count by leverage range</p>
                    <div className="space-y-3">
                      {metrics.leverageDistribution?.map((range, idx) => (
                        <div key={idx} className="p-4 bg-phantom-bg-tertiary rounded-2xl border border-phantom-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-phantom-accent-primary">{range.leverage_range}</span>
                            <span className="text-sm font-semibold text-phantom-text-primary">{range.positions} positions</span>
                          </div>
                          <div className="flex justify-between text-xs text-phantom-text-tertiary">
                            <span>Avg: {Number(range.avg_leverage || 0).toFixed(2)}x</span>
                            <span>Volume: {formatCurrency(range.volume || 0, '$')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Coin Flip Analytics */}
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-glow">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-phantom bg-clip-text text-transparent">Coin Flip Analytics</h2>
                  <p className="text-phantom-text-secondary">Monitor coin flip activity and player performance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Games" 
                  value={metrics.coinflipTotals?.total_games || 0} 
                  sub={`${metrics.coinflipTotals?.wins || 0} wins • ${metrics.coinflipTotals?.losses || 0} losses`}
                />
                <StatCard 
                  title="Unique Players" 
                  value={metrics.coinflipTotals?.unique_players || 0} 
                  sub={`Win rate: ${Number(metrics.coinflipTotals?.win_rate || 0).toFixed(2)}%`}
                />
                <StatCard 
                  title="Total Bet (◉)" 
                  value={`${Number(metrics.coinflipTotals?.total_bet || 0).toFixed(0)}`} 
                  sub={`Won Bets: ${Number(metrics.coinflipTotals?.total_bet_won || 0).toFixed(0)}`}
                />
                <StatCard 
                  title="House Profit (◉)" 
                  value={`${Number(metrics.coinflipTotals?.house_profit || 0).toFixed(0)}`} 
                  sub={`Expected ≈ 10% edge`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 group">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-phantom-text-primary">Games by Day (14 days)</h3>
                      <p className="text-sm text-phantom-text-tertiary">Coin flip games per day</p>
                    </div>
                  </div>
                  <LineChart data={
                    metrics.coinflipByDay?.slice().reverse().map(d => ({
                      label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      value: Number(d.games || 0)
                    })) || []
                  } />
                </div>
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                  <h3 className="text-xl font-bold text-phantom-text-primary mb-2">Top Players</h3>
                  <p className="text-sm text-phantom-text-tertiary mb-4">Most coin flip games played</p>
                  <div className="space-y-3">
                    {metrics.topCoinflipPlayers?.slice(0, 6).map((g, idx) => (
                      <div key={g.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-phantom-bg-tertiary transition-all group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-phantom-text-primary">{g.username}</p>
                          <p className="text-xs text-phantom-text-tertiary">{g.games_played} games • {g.wins} wins</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${g.player_net >= 0 ? 'text-phantom-success' : 'text-phantom-error'}`}>{g.player_net >= 0 ? '+' : ''}{Number(g.player_net || 0).toFixed(0)} ◉</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Blackjack Analytics */}
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-glow">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-phantom bg-clip-text text-transparent">Blackjack Analytics</h2>
                  <p className="text-phantom-text-secondary">Monitor blackjack activity and player performance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Games" 
                  value={metrics.blackjackTotals?.total_games || 0} 
                  sub={`${metrics.blackjackTotals?.wins || 0} wins • ${metrics.blackjackTotals?.losses || 0} losses`}
                />
                <StatCard 
                  title="Unique Players" 
                  value={metrics.blackjackTotals?.unique_players || 0} 
                  sub={`Win rate: ${Number(metrics.blackjackTotals?.win_rate || 0).toFixed(2)}%`}
                />
                <StatCard 
                  title="Blackjacks & Pushes" 
                  value={`${Number(metrics.blackjackTotals?.blackjacks || 0)}`} 
                  sub={`${Number(metrics.blackjackTotals?.pushes || 0)} pushes`}
                />
                <StatCard 
                  title="House Profit (◉)" 
                  value={`${Number(metrics.blackjackTotals?.house_profit || 0).toFixed(0)}`} 
                  sub={`Total Bet: ${Number(metrics.blackjackTotals?.total_bet || 0).toFixed(0)}`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 group">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-phantom-text-primary">Games by Day (14 days)</h3>
                      <p className="text-sm text-phantom-text-tertiary">Blackjack games per day</p>
                    </div>
                  </div>
                  <LineChart data={
                    metrics.blackjackByDay?.slice().reverse().map(d => ({
                      label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      value: Number(d.games || 0)
                    })) || []
                  } />
                </div>
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                  <h3 className="text-xl font-bold text-phantom-text-primary mb-2">Top Players</h3>
                  <p className="text-sm text-phantom-text-tertiary mb-4">Most blackjack games played</p>
                  <div className="space-y-3">
                    {metrics.topBlackjackPlayers?.slice(0, 6).map((g, idx) => (
                      <div key={g.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-phantom-bg-tertiary transition-all group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-phantom-text-primary">{g.username}</p>
                          <p className="text-xs text-phantom-text-tertiary">{g.games_played} games • {g.wins} wins</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${g.player_net >= 0 ? 'text-phantom-success' : 'text-phantom-error'}`}>{g.player_net >= 0 ? '+' : ''}{Number(g.player_net || 0).toFixed(0)} ◉</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Crash Analytics */}
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-glow">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-phantom bg-clip-text text-transparent">Crash Analytics</h2>
                  <p className="text-phantom-text-secondary">Monitor crash game activity and player cashouts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Games" 
                  value={metrics.crashTotals?.total_games || 0} 
                  sub={`${metrics.crashTotals?.wins || 0} wins • ${metrics.crashTotals?.losses || 0} losses`}
                />
                <StatCard 
                  title="Unique Players" 
                  value={metrics.crashTotals?.unique_players || 0} 
                  sub={`Win Rate: ${metrics.crashTotals?.win_rate || 0}%`}
                />
                <StatCard 
                  title="Avg Crash Point" 
                  value={`${metrics.crashTotals?.avg_crash_point || 0}x`} 
                  sub={`Max: ${metrics.crashTotals?.max_crash_point || 0}x`}
                />
                <StatCard 
                  title="House Profit (◉)" 
                  value={`${Number(metrics.crashTotals?.house_profit || 0).toFixed(0)}`} 
                  sub={`Total Bet: ${Number(metrics.crashTotals?.total_bet || 0).toFixed(0)}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-2xl shadow-card border border-phantom-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-phantom-text-tertiary text-sm mb-1">Total Payout to Players</p>
                      <p className="text-2xl font-bold text-phantom-text-primary">◉ {Number(metrics.crashTotals?.total_payout || 0).toFixed(0)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-2xl shadow-card border border-phantom-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-phantom-text-tertiary text-sm mb-1">Actual RTP</p>
                      <p className="text-2xl font-bold text-phantom-text-primary">{metrics.crashTotals?.actual_rtp || 0}%</p>
                      <p className="text-xs text-phantom-text-tertiary mt-1">Target: 95% (5% house edge)</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      (metrics.crashTotals?.actual_rtp || 0) >= 94 && (metrics.crashTotals?.actual_rtp || 0) <= 96
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20'
                        : 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20'
                    }`}>
                      <svg className={`w-6 h-6 ${
                        (metrics.crashTotals?.actual_rtp || 0) >= 94 && (metrics.crashTotals?.actual_rtp || 0) <= 96
                          ? 'text-green-500'
                          : 'text-yellow-500'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 group">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-phantom-text-primary">Games by Day (14 days)</h3>
                      <p className="text-sm text-phantom-text-tertiary">Crash games per day</p>
                    </div>
                  </div>
                  <LineChart data={
                    metrics.crashByDay?.slice().reverse().map(d => ({
                      label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      value: Number(d.games || 0)
                    })) || []
                  } />
                </div>
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                  <h3 className="text-xl font-bold text-phantom-text-primary mb-2">Top Players</h3>
                  <p className="text-sm text-phantom-text-tertiary mb-4">Most crash games played</p>
                  <div className="space-y-3">
                    {metrics.topCrashPlayers?.slice(0, 6).map((g, idx) => (
                      <div key={g.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-phantom-bg-tertiary transition-all group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-phantom-text-primary">{g.username}</p>
                          <p className="text-xs text-phantom-text-tertiary">{g.games_played} games • {Number(g.avg_crash_point || 0).toFixed(2)}x avg</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-orange-400">{Number(g.max_crash_point || 0).toFixed(1)}x max</p>
                          <p className="text-xs text-phantom-text-tertiary">{Number(g.total_bet || 0).toFixed(0)} ◉ bet</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity and Top Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Breakdown */}
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                <h2 className="text-xl font-bold text-phantom-text-primary mb-2">Activity (Last 24h)</h2>
                <p className="text-sm text-phantom-text-tertiary mb-4">Most common user actions</p>
                {activityBarData.length > 0 ? (
                  <BarChart data={activityBarData} maxValue={maxActivity} />
                ) : (
                  <p className="text-phantom-text-tertiary text-sm">No activity in the last 24 hours</p>
                )}
              </div>

              {/* Top Users */}
              <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                <h2 className="text-xl font-bold text-phantom-text-primary mb-2">Top Users</h2>
                <p className="text-sm text-phantom-text-tertiary mb-4">Most active by transaction count</p>
                <div className="space-y-3">
                  {metrics.topUsers?.slice(0, 5).map((user, idx) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-phantom-bg-tertiary transition-all group">
                      <div className="w-8 h-8 rounded-full bg-gradient-phantom flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-phantom-text-primary">{user.username}</p>
                        <p className="text-xs text-phantom-text-tertiary">{user.sent_count + user.received_count} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-phantom-accent-primary">{formatCurrency(user.agon || 0, '$')}</p>
                        <p className="text-xs text-phantom-text-tertiary">◉ {Number(user.stoneworks_dollar || 0).toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-phantom-text-primary">Recent Transactions</h2>
                  <p className="text-sm text-phantom-text-tertiary">Latest system activity</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-phantom-text-tertiary text-sm border-b border-phantom-border">
                    <tr>
                      <th className="py-3 font-semibold">Type</th>
                      <th className="py-3 font-semibold">From</th>
                      <th className="py-3 font-semibold">To</th>
                      <th className="py-3 font-semibold">Amount</th>
                      <th className="py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentTransactions?.map(tx => {
                      // Determine transaction type styling
                      let typeStyle = 'bg-phantom-accent-primary/20 text-phantom-accent-primary'; // default (swap)
                      if (tx.transaction_type === 'payment') {
                        typeStyle = 'bg-phantom-success/20 text-phantom-success';
                      } else if (tx.transaction_type === 'auction') {
                        typeStyle = 'bg-blue-500/20 text-blue-400';
                      } else if (tx.transaction_type === 'commission') {
                        typeStyle = 'bg-yellow-500/20 text-yellow-400';
                      }

                      return (
                        <tr key={tx.id} className="border-b border-phantom-border/50 hover:bg-phantom-bg-tertiary/50 transition-all">
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold ${typeStyle}`}>
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="py-3 text-phantom-text-primary font-medium">{tx.from_username}</td>
                          <td className="py-3 text-phantom-text-primary font-medium">
                            {tx.to_username || '-'}
                            {tx.transaction_type === 'commission' && (
                              <span className="ml-1 text-xs text-yellow-400">(Platform Fee)</span>
                            )}
                          </td>
                          <td className="py-3 text-phantom-accent-primary font-semibold">
                            {formatCurrency(tx.amount, tx.currency === 'agon' ? '$' : 'SW$')}
                          </td>
                          <td className="py-3 text-phantom-text-secondary text-sm">
                            {new Date(tx.created_at).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Auction Analytics Section */}
            {metrics?.auctionTotals && (
              <>
                {/* Section Header */}
                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-phantom flex items-center justify-center shadow-glow">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-phantom bg-clip-text text-transparent">Auction House Analytics</h2>
                      <p className="text-phantom-text-secondary">Monitor auction performance and bidding activity</p>
                    </div>
                  </div>
                </div>

                {/* Auction Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    title="Total Auctions" 
                    value={metrics.auctionTotals.total_auctions || 0}
                    sub={`${metrics.auctionTotals.active_auctions || 0} active • ${metrics.auctionTotals.completed_auctions || 0} completed`}
                    icon={
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                  />
                  <StatCard 
                    title="Total Bids" 
                    value={metrics.auctionTotals.total_bids || 0}
                    sub={`${metrics.auctionTotals.unique_bidders || 0} unique bidders • ${Number(metrics.auctionTotals.avg_bids_per_auction || 0).toFixed(1)} avg/auction`}
                    icon={
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                      </svg>
                    }
                  />
                  <StatCard 
                    title="Auction Revenue" 
                    value={formatCurrency(metrics.auctionTotals.total_auction_revenue || 0, '$')}
                    sub={`Avg: ${formatCurrency(metrics.auctionTotals.avg_final_bid || 0, '$')} • ${formatCurrency(metrics.totals.total_commission_collected || 0, '$')} commission`}
                    icon={
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                  <StatCard 
                    title="Platform Commission (5%)" 
                    value={formatCurrency(metrics.totals.total_commission_collected || 0, '$')}
                    sub={`From ${metrics.totals.commission_count || 0} completed auctions`}
                    icon={
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    }
                  />
                </div>

                {/* Auction Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Auctions by Day Chart */}
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 group">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-phantom-text-primary">Auction Activity (14 days)</h2>
                        <p className="text-sm text-phantom-text-tertiary">New auctions created per day</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-phantom/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-phantom-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                    </div>
                    <LineChart data={
                      metrics.auctionsByDay?.slice().reverse().map(d => ({
                        label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: Number(d.auctions_created || 0)
                      })) || []
                    } />
                  </div>

                  {/* Bids by Day Chart */}
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6 group">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-phantom-text-primary">Bidding Activity (14 days)</h2>
                        <p className="text-sm text-phantom-text-tertiary">Total bids placed per day</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-phantom/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-phantom-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                    </div>
                    <LineChart data={
                      metrics.bidsByDay?.slice().reverse().map(d => ({
                        label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: Number(d.bids_placed || 0)
                      })) || []
                    } />
                  </div>
                </div>

                {/* Rarity Distribution & Top Bidders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Rarity Distribution */}
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                    <h2 className="text-xl font-bold text-phantom-text-primary mb-2">Item Rarity Distribution</h2>
                    <p className="text-sm text-phantom-text-tertiary mb-4">Average prices by rarity tier</p>
                    {metrics.rarityDistribution && metrics.rarityDistribution.length > 0 ? (
                      <div className="space-y-3">
                        {metrics.rarityDistribution.map((rarity, idx) => {
                          const rarityColors = {
                            'Common': 'bg-gray-500/20 text-gray-300',
                            'Uncommon': 'bg-green-500/20 text-green-400',
                            'Rare': 'bg-blue-500/20 text-blue-400',
                            'Epic': 'bg-purple-500/20 text-purple-400',
                            'Legendary': 'bg-orange-500/20 text-orange-400',
                            'Mythic': 'bg-red-500/20 text-red-400'
                          };
                          const colorClass = rarityColors[rarity.rarity] || 'bg-phantom-accent-primary/20 text-phantom-accent-primary';
                          
                          return (
                            <div key={idx} className="p-3 rounded-2xl hover:bg-phantom-bg-tertiary transition-all group">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold ${colorClass}`}>
                                  {rarity.rarity}
                                </span>
                                <span className="text-sm text-phantom-text-secondary">{rarity.count} items</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-phantom-text-tertiary">Avg Price:</span>
                                <span className="font-semibold text-phantom-accent-primary">{formatCurrency(rarity.avg_price || 0, '$')}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-phantom-text-tertiary">Total Revenue:</span>
                                <span className="font-semibold text-phantom-success">{formatCurrency(rarity.total_revenue || 0, '$')}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-phantom-text-tertiary text-sm">No auction data available</p>
                    )}
                  </div>

                  {/* Top Bidders */}
                  <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                    <h2 className="text-xl font-bold text-phantom-text-primary mb-2">Top Bidders</h2>
                    <p className="text-sm text-phantom-text-tertiary mb-4">Most active auction participants</p>
                    <div className="space-y-3">
                      {metrics.topBidders?.slice(0, 5).map((bidder, idx) => (
                        <div key={bidder.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-phantom-bg-tertiary transition-all group">
                          <div className="w-8 h-8 rounded-full bg-gradient-phantom flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-phantom-text-primary">{bidder.username}</p>
                            <p className="text-xs text-phantom-text-tertiary">
                              {bidder.total_bids_placed} bids • {bidder.auctions_won} won
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-phantom-accent-primary">
                              {formatCurrency(bidder.total_bid_amount || 0, '$')}
                            </p>
                            <p className="text-xs text-phantom-text-tertiary">{bidder.auctions_participated} auctions</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Auctions */}
                <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-phantom-text-primary">Highest Value Auctions</h2>
                      <p className="text-sm text-phantom-text-tertiary">Top auctions by current bid</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-phantom-text-tertiary text-sm border-b border-phantom-border">
                        <tr>
                          <th className="py-3 font-semibold">Item</th>
                          <th className="py-3 font-semibold">Rarity</th>
                          <th className="py-3 font-semibold">Seller</th>
                          <th className="py-3 font-semibold">Starting Price</th>
                          <th className="py-3 font-semibold">Current Bid</th>
                          <th className="py-3 font-semibold">Bids</th>
                          <th className="py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.topAuctions?.map(auction => {
                          const rarityColors = {
                            'Common': 'bg-gray-500/20 text-gray-300',
                            'Uncommon': 'bg-green-500/20 text-green-400',
                            'Rare': 'bg-blue-500/20 text-blue-400',
                            'Epic': 'bg-purple-500/20 text-purple-400',
                            'Legendary': 'bg-orange-500/20 text-orange-400',
                            'Mythic': 'bg-red-500/20 text-red-400'
                          };
                          const rarityClass = rarityColors[auction.rarity] || 'bg-phantom-accent-primary/20 text-phantom-accent-primary';
                          
                          const statusColors = {
                            'active': 'bg-phantom-success/20 text-phantom-success',
                            'ended': 'bg-phantom-accent-secondary/20 text-phantom-accent-secondary',
                            'completed': 'bg-phantom-accent-primary/20 text-phantom-accent-primary',
                            'cancelled': 'bg-phantom-error/20 text-phantom-error'
                          };
                          const statusClass = statusColors[auction.status] || 'bg-phantom-bg-tertiary text-phantom-text-secondary';

                          return (
                            <tr key={auction.id} className="border-b border-phantom-border/50 hover:bg-phantom-bg-tertiary/50 transition-all">
                              <td className="py-3 text-phantom-text-primary font-medium">{auction.item_name}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold ${rarityClass}`}>
                                  {auction.rarity}
                                </span>
                              </td>
                              <td className="py-3 text-phantom-text-primary font-medium">{auction.seller_username}</td>
                              <td className="py-3 text-phantom-text-secondary">{formatCurrency(auction.starting_price, '$')}</td>
                              <td className="py-3 text-phantom-accent-primary font-semibold">
                                {formatCurrency(auction.current_bid, '$')}
                              </td>
                              <td className="py-3 text-phantom-text-secondary">{auction.bid_count}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold ${statusClass}`}>
                                  {auction.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Users Management Table */}
        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-phantom-text-primary">User Management</h2>
              <p className="text-sm text-phantom-text-tertiary">Manage user accounts and permissions</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-phantom-text-tertiary text-sm border-b border-phantom-border">
                <tr>
                  <th className="py-3 font-semibold">Username</th>
                  <th className="py-3 font-semibold">Stoneworks Dollars</th>
                  <th className="py-3 font-semibold">SW Dollar</th>
                  <th className="py-3 font-semibold">Transactions</th>
                  <th className="py-3 font-semibold">Role</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-phantom-border/50 hover:bg-phantom-bg-tertiary/50 transition-all">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-phantom flex items-center justify-center text-white font-semibold text-sm shadow-glow-sm">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-phantom-text-primary">{u.username}</span>
                      </div>
                    </td>
                    <td className="py-4 text-phantom-text-primary font-medium">{Number(u.agon || 0).toFixed(2)}</td>
                    <td className="py-4 text-phantom-text-primary font-medium">{Number(u.stoneworks_dollar || 0).toFixed(2)}</td>
                    <td className="py-4 text-phantom-text-secondary">{u.transaction_count}</td>
                    <td className="py-4">
                      {u.is_admin ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-phantom-accent-primary/20 text-phantom-accent-primary">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-phantom-bg-tertiary text-phantom-text-secondary">
                          User
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      {u.disabled ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-phantom-error/20 text-phantom-error">
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-phantom-success/20 text-phantom-success">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          className="w-28 px-2 py-1.5 rounded-xl bg-phantom-bg-tertiary border-2 border-phantom-border text-phantom-text-primary placeholder:text-phantom-text-tertiary focus:border-phantom-accent-primary focus:shadow-input focus:outline-none text-sm"
                          onChange={(e) => (u._adjAmount = e.target.value)}
                        />
                        <select
                          className="px-2 py-1.5 rounded-xl bg-phantom-bg-tertiary border-2 border-phantom-border text-phantom-text-primary focus:border-phantom-accent-primary focus:shadow-input focus:outline-none text-sm"
                          defaultValue="agon"
                          onChange={(e) => (u._adjCurrency = e.target.value)}
                        >
                          <option value="agon">Stoneworks Dollars</option>
                          <option value="stoneworks_dollar">Game Chips</option>
                        </select>
                        <button
                          onClick={async () => {
                            const amt = Number(u._adjAmount);
                            const cur = u._adjCurrency || 'agon';
                            if (!amt || !isFinite(amt)) return alert('Enter a valid amount');
                            try {
                              await adminAPI.adjustBalance(u.id, cur, amt);
                              load();
                            } catch (e) {
                              alert(e.response?.data?.error || 'Failed to adjust balance');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-phantom-success/20 text-phantom-success hover:bg-phantom-success/30 transition-all text-sm font-medium"
                        >
                          Add
                        </button>
                        <button
                          onClick={async () => {
                            const amt = Number(u._adjAmount);
                            const cur = u._adjCurrency || 'agon';
                            if (!amt || !isFinite(amt)) return alert('Enter a valid amount');
                            try {
                              await adminAPI.adjustBalance(u.id, cur, -Math.abs(amt));
                              load();
                            } catch (e) {
                              alert(e.response?.data?.error || 'Failed to adjust balance');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-phantom-error/20 text-phantom-error hover:bg-phantom-error/30 transition-all text-sm font-medium"
                        >
                          Deduct
                        </button>
                      </div>
                      <button 
                        onClick={() => toggleDisabled(u.id)} 
                        className="px-3 py-1.5 rounded-xl bg-phantom-bg-tertiary hover:bg-phantom-bg-primary border border-phantom-border hover:border-phantom-border-light text-phantom-text-primary hover:text-phantom-accent-primary text-sm transition-all hover:shadow-glow-sm"
                      >
                        {u.disabled ? 'Enable' : 'Disable'}
                      </button>
                      <button 
                        onClick={() => toggleAdmin(u.id)} 
                        className="px-3 py-1.5 rounded-xl bg-gradient-phantom text-white hover:shadow-glow text-sm transition-all"
                      >
                        {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Code Management */}
        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-phantom-text-primary">Invite Codes</h2>
              <p className="text-sm text-phantom-text-tertiary">Manage one-time use registration codes</p>
            </div>
          </div>

          {/* Create/Generate Invite Code */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Enter custom code (e.g., WELCOME2024)"
                className="flex-1 px-4 py-3 rounded-2xl border-2 bg-phantom-bg-tertiary text-phantom-text-primary placeholder:text-phantom-text-tertiary border-phantom-border hover:border-phantom-border-light focus:border-phantom-accent-primary focus:shadow-input focus:outline-none transition-all"
              />
              <button
                onClick={createInviteCode}
                className="px-6 py-3 rounded-2xl bg-gradient-phantom text-white hover:shadow-glow transition-all font-semibold"
              >
                Create Code
              </button>
              <button
                onClick={generateInviteCode}
                className="px-6 py-3 rounded-2xl bg-phantom-bg-tertiary text-phantom-text-primary border-2 border-phantom-border hover:border-phantom-accent-primary hover:shadow-glow-sm transition-all font-semibold"
              >
                Generate Random
              </button>
            </div>
            {codeError && (
              <p className="text-sm text-phantom-error flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {codeError}
              </p>
            )}
          </div>

          {/* Invite Codes List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-phantom-text-tertiary text-sm border-b border-phantom-border">
                <tr>
                  <th className="py-3 font-semibold">Code</th>
                  <th className="py-3 font-semibold">Created By</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Used By</th>
                  <th className="py-3 font-semibold">Created</th>
                  <th className="py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inviteCodes.map(code => (
                  <tr key={code.id} className="border-b border-phantom-border/50 hover:bg-phantom-bg-tertiary/50 transition-all">
                    <td className="py-4">
                      <span className="font-mono font-semibold text-phantom-accent-primary bg-phantom-bg-tertiary px-3 py-1.5 rounded-xl">
                        {code.code}
                      </span>
                    </td>
                    <td className="py-4 text-phantom-text-primary font-medium">{code.created_by_username}</td>
                    <td className="py-4">
                      {code.is_used ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-phantom-error/20 text-phantom-error">
                          Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-phantom-success/20 text-phantom-success">
                          Available
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-phantom-text-secondary">
                      {code.used_by_username || '-'}
                    </td>
                    <td className="py-4 text-phantom-text-secondary text-sm">
                      {new Date(code.created_at).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 text-right">
                      {!code.is_used && (
                        <button
                          onClick={() => deleteInviteCode(code.id)}
                          className="px-3 py-1.5 rounded-xl bg-phantom-error/20 text-phantom-error hover:bg-phantom-error/30 transition-all text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inviteCodes.length === 0 && (
              <div className="text-center py-8 text-phantom-text-tertiary">
                No invite codes yet. Create one to get started!
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-phantom-bg-secondary/60 backdrop-blur-xl rounded-3xl shadow-card border border-phantom-border p-6">
          <h2 className="text-2xl font-bold text-phantom-text-primary mb-4">Activity Log</h2>
          <div className="space-y-2">
            {activity.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-phantom-bg-tertiary transition-all border border-transparent hover:border-phantom-border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-phantom shadow-glow-sm"></div>
                  <div className="text-phantom-text-secondary text-sm">
                    <span className="font-semibold text-phantom-text-primary">{a.username}</span>
                    {' '}
                    <span className="text-phantom-text-tertiary">{a.action.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <div className="text-phantom-text-tertiary text-sm">
                  {new Date(a.created_at).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
