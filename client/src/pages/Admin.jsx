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
                sub={`${metrics.totals.payment_count} payments • ${metrics.totals.swap_count} swaps`}
                icon={
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                }
              />
              <StatCard 
                title="Payment Volume" 
                value={formatCurrency(metrics.totals.total_payment_volume || 0, 'PC')}
                sub={`Avg: ${formatCurrency(metrics.totals.avg_payment || 0, 'PC')}`}
                icon={
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                }
              />
              <StatCard 
                title="Currency Supply" 
                value={`${formatCurrency(metrics.totals.sum_pc || 0, 'PC')}`}
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
                        <p className="text-sm font-semibold text-phantom-accent-primary">{formatCurrency(user.agon || 0, 'Ⱥ')}</p>
                        <p className="text-xs text-phantom-text-tertiary">SW$ {Number(user.stoneworks_dollar || 0).toFixed(0)}</p>
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
                    {metrics.recentTransactions?.map(tx => (
                      <tr key={tx.id} className="border-b border-phantom-border/50 hover:bg-phantom-bg-tertiary/50 transition-all">
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold ${
                            tx.transaction_type === 'payment' 
                              ? 'bg-phantom-success/20 text-phantom-success' 
                              : 'bg-phantom-accent-primary/20 text-phantom-accent-primary'
                          }`}>
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="py-3 text-phantom-text-primary font-medium">{tx.from_username}</td>
                        <td className="py-3 text-phantom-text-primary font-medium">{tx.to_username || '-'}</td>
                        <td className="py-3 text-phantom-accent-primary font-semibold">
                          {formatCurrency(tx.amount, tx.currency === 'agon' ? 'Ⱥ' : 'SW$')}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
                  <th className="py-3 font-semibold">Agon</th>
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
