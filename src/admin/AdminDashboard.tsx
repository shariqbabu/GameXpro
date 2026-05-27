// ============================================================
// ADMIN DASHBOARD
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ArrowDownToLine, ArrowUpFromLine, AlertCircle, DollarSign, Gamepad2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAdminStats } from '../services/adminService';
import { AdminStats } from '../types';
import { formatCurrency } from '../utils/wallet';

const mockChartData = [
  { date: 'Mon', deposits: 4200, withdrawals: 1800 },
  { date: 'Tue', deposits: 6800, withdrawals: 2200 },
  { date: 'Wed', deposits: 3200, withdrawals: 1500 },
  { date: 'Thu', deposits: 8900, withdrawals: 3200 },
  { date: 'Fri', deposits: 7500, withdrawals: 2800 },
  { date: 'Sat', deposits: 12000, withdrawals: 4500 },
  { date: 'Sun', deposits: 9800, withdrawals: 3800 },
];

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers?.toString() || '0', icon: Users, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/5', border: 'border-blue-500/20' },
    { label: 'Total Deposits', value: formatCurrency(stats?.totalDeposit || 0), icon: ArrowDownToLine, color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/5', border: 'border-green-500/20' },
    { label: 'Total Withdrawals', value: formatCurrency(stats?.totalWithdraw || 0), icon: ArrowUpFromLine, color: 'text-red-400', bg: 'from-red-500/20 to-orange-500/5', border: 'border-red-500/20' },
    { label: 'Net Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-orange-500/5', border: 'border-yellow-500/20' },
    { label: 'Active Users', value: stats?.activeUsers?.toString() || '0', icon: TrendingUp, color: 'text-purple-400', bg: 'from-purple-500/20 to-pink-500/5', border: 'border-purple-500/20' },
    { label: 'Games Played', value: stats?.totalGamesPlayed?.toString() || '0', icon: Gamepad2, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-blue-500/5', border: 'border-cyan-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-yellow-400" /> Admin Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and analytics</p>
      </div>

      {/* Alerts */}
      {(stats?.pendingDeposits || stats?.pendingWithdrawals) ? (
        <div className="flex flex-wrap gap-3">
          {(stats?.pendingDeposits || 0) > 0 && (
            <Link to="/admin/deposits"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-500/20 transition-all">
              <AlertCircle className="w-4 h-4" />
              {stats?.pendingDeposits} pending deposits
            </Link>
          )}
          {(stats?.pendingWithdrawals || 0) > 0 && (
            <Link to="/admin/withdrawals"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-all">
              <AlertCircle className="w-4 h-4" />
              {stats?.pendingWithdrawals} pending withdrawals
            </Link>
          )}
        </div>
      ) : null}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 bg-gradient-to-br ${bg} border ${border} col-span-1`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {isLoading ? (
              <div className="skeleton h-6 w-full mb-1" />
            ) : (
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            )}
            <p className="text-xs text-slate-500">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue Overview (7 Days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={mockChartData}>
            <defs>
              <linearGradient id="deposits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="withdrawals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#0f0f1e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
            />
            <Area type="monotone" dataKey="deposits" stroke="#10b981" fill="url(#deposits)" name="Deposits" strokeWidth={2} />
            <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" fill="url(#withdrawals)" name="Withdrawals" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded-full bg-green-500" />Deposits</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-3 h-3 rounded-full bg-red-500" />Withdrawals</div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Manage Users', path: '/admin/users', icon: Users, color: 'text-blue-400' },
          { label: 'Approve Deposits', path: '/admin/deposits', icon: ArrowDownToLine, color: 'text-green-400' },
          { label: 'Process Withdrawals', path: '/admin/withdrawals', icon: ArrowUpFromLine, color: 'text-red-400' },
          { label: 'View Transactions', path: '/admin/transactions', icon: TrendingUp, color: 'text-purple-400' },
        ].map(({ label, path, icon: Icon, color }) => (
          <Link
            key={label}
            to={path}
            className="glass-card p-4 flex flex-col items-center gap-2 text-center hover:border-yellow-500/20 transition-all group"
          >
            <Icon className={`w-6 h-6 ${color} group-hover:scale-110 transition-transform`} />
            <span className="text-xs text-slate-300">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
