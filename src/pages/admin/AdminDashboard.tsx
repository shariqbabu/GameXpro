import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StatCard } from '../../components/ui/StatCard';
import { MOCK_USERS, MOCK_DEPOSITS, MOCK_WITHDRAWALS, MOCK_TRANSACTIONS } from '../../utils/mockData';
import {
  Users, DollarSign, ArrowDownCircle, ArrowUpCircle, Activity,
  TrendingUp, Shield, AlertTriangle, Gamepad2, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 45000, deposits: 62000, withdrawals: 17000 },
  { name: 'Feb', revenue: 52000, deposits: 71000, withdrawals: 19000 },
  { name: 'Mar', revenue: 48000, deposits: 65000, withdrawals: 17000 },
  { name: 'Apr', revenue: 65000, deposits: 89000, withdrawals: 24000 },
  { name: 'May', revenue: 71000, deposits: 97000, withdrawals: 26000 },
  { name: 'Jun', revenue: 82000, deposits: 112000, withdrawals: 30000 },
  { name: 'Jul', revenue: 94000, deposits: 128000, withdrawals: 34000 },
];

const gameData = [
  { name: 'Color', rounds: 24891, revenue: 52000 },
  { name: 'Ludo', rounds: 12456, revenue: 38000 },
  { name: 'Other', rounds: 0, revenue: 0 },
];

const COLORS = ['#a855f7', '#06b6d4', '#22c55e', '#eab308'];

export const AdminDashboard = () => {
  const [liveData, setLiveData] = useState({
    onlineUsers: 14285,
    activeGames: 3847,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => ({
        onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 10) - 5,
        activeGames: prev.activeGames + Math.floor(Math.random() * 6) - 3,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalUsers = MOCK_USERS.filter(u => u.role !== 'admin').length;
  const activeUsers = MOCK_USERS.filter(u => u.accountStatus === 'active' && u.role !== 'admin').length;
  const blockedUsers = MOCK_USERS.filter(u => u.accountStatus === 'blocked').length;
  const pendingDeposits = MOCK_DEPOSITS.filter(d => d.status === 'pending').length;
  const pendingWithdrawals = MOCK_WITHDRAWALS.filter(w => w.status === 'pending').length;
  const totalRevenue = MOCK_TRANSACTIONS.filter(t => t.type === 'game_win').reduce((sum, t) => sum + t.amount, 0) * 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sora text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live Data • Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-semibold">{liveData.onlineUsers.toLocaleString()} online</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400 font-semibold">{liveData.activeGames.toLocaleString()} games</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(pendingDeposits > 0 || pendingWithdrawals > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {pendingDeposits > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex-1"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-sm text-yellow-400"><strong>{pendingDeposits}</strong> deposit requests pending approval</span>
            </motion.div>
          )}
          {pendingWithdrawals > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex-1"
            >
              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span className="text-sm text-orange-400"><strong>{pendingWithdrawals}</strong> withdrawal requests pending</span>
            </motion.div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={totalUsers} icon={<Users className="w-5 h-5" />} color="purple" delay={0.1} />
        <StatCard title="Active Users" value={activeUsers} icon={<Activity className="w-5 h-5" />} color="green" delay={0.2} />
        <StatCard title="Total Revenue" value={totalRevenue} prefix="₹" icon={<DollarSign className="w-5 h-5" />} color="gold" delay={0.3} decimals={0} />
        <StatCard title="Blocked Users" value={blockedUsers} icon={<Shield className="w-5 h-5" />} color="red" delay={0.4} />
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-5 border border-white/8"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white font-sora">Revenue Overview</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-purple-400"><span className="w-3 h-0.5 bg-purple-400 block" /> Revenue</span>
            <span className="flex items-center gap-1.5 text-green-400"><span className="w-3 h-0.5 bg-green-400 block" /> Deposits</span>
            <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-0.5 bg-red-400 block" /> Withdrawals</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="withGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} />
            <Tooltip
              contentStyle={{ background: '#13131f', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, color: '#fff' }}
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#a855f7" fill="url(#revGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="deposits" stroke="#22c55e" fill="url(#depGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" fill="url(#withGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Game Stats Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass rounded-2xl p-5 border border-white/8"
        >
          <h3 className="font-bold text-white font-sora mb-5">Game Performance</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gameData}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}K`} />
              <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="revenue" fill="#a855f7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="rounds" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-5 border border-white/8"
        >
          <h3 className="font-bold text-white font-sora mb-4">User Status</h3>
          <PieChart width={160} height={160} className="mx-auto">
            <Pie data={[
              { name: 'Active', value: activeUsers },
              { name: 'Blocked', value: blockedUsers },
              { name: 'Pending', value: 1 },
            ]} cx={75} cy={75} innerRadius={45} outerRadius={75} dataKey="value">
              {[0, 1, 2].map((idx) => (
                <Cell key={idx} fill={COLORS[idx]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, color: '#fff' }} />
          </PieChart>
          <div className="space-y-1.5 mt-3">
            {[{ label: 'Active', color: COLORS[0], value: activeUsers }, { label: 'Blocked', color: COLORS[1], value: blockedUsers }].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-white/60">{item.label}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Pending */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Deposits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-green-400" /> Recent Deposits
            </h3>
            <span className="badge-live">LIVE</span>
          </div>
          <div className="divide-y divide-white/5">
            {MOCK_DEPOSITS.map((dep) => (
              <div key={dep.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center font-bold text-green-400 text-sm">
                  {dep.username[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{dep.username}</p>
                  <p className="text-xs text-white/40">UTR: {dep.utrId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">₹{dep.amount}</p>
                  <div className="flex items-center gap-1">
                    {dep.status === 'pending' ? <Clock className="w-3 h-3 text-yellow-400" /> : <CheckCircle className="w-3 h-3 text-green-400" />}
                    <span className={`text-[10px] font-medium capitalize ${dep.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}>{dep.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Withdrawals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-orange-400" /> Recent Withdrawals
            </h3>
            <span className="text-xs text-orange-400">{pendingWithdrawals} pending</span>
          </div>
          <div className="divide-y divide-white/5">
            {MOCK_WITHDRAWALS.map((wd) => (
              <div key={wd.id} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-sm">
                  {wd.username[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{wd.username}</p>
                  <p className="text-xs text-white/40">{wd.upiId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-400">₹{wd.amount}</p>
                  <div className="flex items-center gap-1">
                    {wd.status === 'pending' ? <Clock className="w-3 h-3 text-yellow-400" /> :
                      wd.status === 'approved' ? <CheckCircle className="w-3 h-3 text-green-400" /> :
                      <XCircle className="w-3 h-3 text-red-400" />}
                    <span className={`text-[10px] font-medium capitalize ${wd.status === 'pending' ? 'text-yellow-400' : wd.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>{wd.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Deposits', value: '₹4,89,000', icon: ArrowDownCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
          { label: 'Total Withdrawals', value: '₹1,23,000', icon: ArrowUpCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
          { label: 'Active Ludo Rooms', value: '142', icon: Gamepad2, color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { label: 'Live Predictions', value: '24,891', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/20' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            className="glass rounded-2xl p-4 border border-white/8"
          >
            <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <p className={`text-xl font-bold font-sora ${item.color}`}>{item.value}</p>
            <p className="text-xs text-white/40 mt-1">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
