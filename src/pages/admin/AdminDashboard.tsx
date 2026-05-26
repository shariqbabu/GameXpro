import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllUsers } from '../../services/userService';
import { getAllDeposits, getAllWithdrawals } from '../../services/walletService';
import { formatCurrency } from '../../utils/helpers';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import type { User, Deposit, Withdrawal } from '../../types';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, d, w] = await Promise.all([getAllUsers(), getAllDeposits(), getAllWithdrawals()]);
        setUsers(u);
        setDeposits(d);
        setWithdrawals(w);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalDeposits = deposits.filter(d => d.status === 'approved').reduce((s, d) => s + d.amount, 0);
  const totalWithdrawals = withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.amount, 0);
  const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
  const activeUsers = users.filter(u => !u.isBlocked).length;
  const blockedUsers = users.filter(u => u.isBlocked).length;
  const revenue = totalDeposits - totalWithdrawals;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      users: Math.floor(Math.random() * 20) + 5,
      deposits: Math.floor(Math.random() * 5000) + 1000,
      revenue: Math.floor(Math.random() * 2000) + 500,
    };
  });

  const stats = [
    { title: 'Total Users', value: users.length, icon: '👥', color: 'purple', trend: { value: 12, positive: true } },
    { title: 'Active Users', value: activeUsers, icon: '✅', color: 'green', trend: { value: 8, positive: true } },
    { title: 'Blocked Users', value: blockedUsers, icon: '🚫', color: 'red', trend: { value: 2, positive: false } },
    { title: 'Total Revenue', value: formatCurrency(revenue), icon: '💰', color: 'yellow', trend: { value: 15, positive: true } },
    { title: 'Total Deposits', value: formatCurrency(totalDeposits), icon: '💳', color: 'blue', trend: { value: 20, positive: true } },
    { title: 'Total Withdrawals', value: formatCurrency(totalWithdrawals), icon: '🏧', color: 'red', trend: { value: 5, positive: false } },
    { title: 'Pending Deposits', value: pendingDeposits, icon: '⏳', color: 'yellow', trend: null },
    { title: 'Pending Withdrawals', value: pendingWithdrawals, icon: '⏳', color: 'orange', trend: null },
  ];

  const colorMap: Record<string, string> = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400',
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white font-orbitron">📊 Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform overview and analytics</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${colorMap[stat.color] || colorMap.purple} glass border rounded-2xl p-4`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              {stat.trend && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${stat.trend.positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {stat.trend.positive ? '↑' : '↓'} {stat.trend.value}%
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mb-1">{stat.title}</p>
            <p className="text-white font-bold font-orbitron text-xl">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">📈 Revenue Chart</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">👥 User Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass border border-white/10 rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">💳 Deposit vs Withdrawal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="deposits" fill="#22c55e" radius={[4, 4, 0, 0]} name="Deposits" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-white font-semibold">⏳ Pending Deposits ({pendingDeposits})</h3>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
            ) : deposits.filter(d => d.status === 'pending').slice(0, 5).map(dep => (
              <div key={dep.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-white text-sm">{dep.userName}</p>
                  <p className="text-gray-500 text-xs font-mono">{dep.utrNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-sm">{formatCurrency(dep.amount)}</p>
                  <span className="text-xs status-badge-warning px-2 py-0.5 rounded-full">Pending</span>
                </div>
              </div>
            ))}
            {!loading && deposits.filter(d => d.status === 'pending').length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">No pending deposits</div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-white font-semibold">⏳ Pending Withdrawals ({pendingWithdrawals})</h3>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
            ) : withdrawals.filter(w => w.status === 'pending').slice(0, 5).map(wd => (
              <div key={wd.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-white text-sm">{wd.userName}</p>
                  <p className="text-gray-500 text-xs">{wd.upiId || wd.bankAccount || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold text-sm">{formatCurrency(wd.amount)}</p>
                  <span className="text-xs status-badge-warning px-2 py-0.5 rounded-full">Pending</span>
                </div>
              </div>
            ))}
            {!loading && withdrawals.filter(w => w.status === 'pending').length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">No pending withdrawals</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
