import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatPoints, copyToClipboard } from '../utils/helpers';
import { getAdminSettings } from '../services/userService';
import { getUserBets } from '../services/gameService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import type { AdminSettings, GameBet } from '../types';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [recentBets, setRecentBets] = useState<GameBet[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, bets] = await Promise.all([
          getAdminSettings(),
          userProfile ? getUserBets(userProfile.uid) : Promise.resolve([]),
        ]);
        setSettings(s);
        setRecentBets(bets.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userProfile]);

  const handleCopyReferral = async () => {
    if (userProfile?.referralCode) {
      const success = await copyToClipboard(userProfile.referralCode);
      if (success) toast.success('Referral code copied! 🎉');
    }
  };

  // Generate mock chart data based on user activity
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    return {
      day: day.toLocaleDateString('en', { weekday: 'short' }),
      earnings: Math.floor(Math.random() * 500) + 100,
      losses: Math.floor(Math.random() * 200) + 50,
    };
  });

  const games = [
    { name: 'Color Prediction', icon: '🎨', path: '/games/color', desc: 'Predict the winning color', color: 'from-pink-500/20 to-red-500/20 border-pink-500/30', enabled: settings?.colorGameEnabled },
    { name: 'Ludo Game', icon: '🎲', path: '/games/ludo', desc: 'Play multiplayer Ludo', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30', enabled: settings?.ludoGameEnabled },
    { name: 'Spin Wheel', icon: '🎡', path: '/games/spin', desc: 'Spin to win prizes', color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30', enabled: settings?.spinWheelEnabled },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Announcement Banner */}
      {settings?.announcement && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <span className="text-xl animate-pulse">📢</span>
          <p className="text-purple-200 text-sm">{settings.announcement}</p>
        </motion.div>
      )}

      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold text-white">
          Welcome back, <span className="gradient-text">{userProfile?.displayName?.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-gray-400 text-sm mt-1">Ready to play and win today?</p>
      </motion.div>

      {/* Wallet Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Balance', value: formatCurrency(userProfile?.walletBalance || 0), icon: '💰', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20', delay: 0 },
          { label: 'Winning Amount', value: formatCurrency(userProfile?.winningAmount || 0), icon: '🏆', color: 'from-green-500/20 to-green-600/10 border-green-500/20', delay: 0.05 },
          { label: 'Bonus Amount', value: formatCurrency(userProfile?.bonusAmount || 0), icon: '🎁', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20', delay: 0.1 },
          { label: 'Total Points', value: formatPoints(userProfile?.totalPoints || 0), icon: '⭐', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20', delay: 0.15 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            className={`bg-gradient-to-br ${stat.color} glass border rounded-2xl p-4`}
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
            <p className="text-white font-bold font-orbitron text-lg">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          { label: 'Add Money', icon: '💳', path: '/wallet/add', color: 'bg-green-600 hover:bg-green-700' },
          { label: 'Withdraw', icon: '🏧', path: '/wallet/withdraw', color: 'bg-blue-600 hover:bg-blue-700' },
          { label: 'Wallet', icon: '👛', path: '/wallet', color: 'bg-purple-600 hover:bg-purple-700' },
          { label: 'History', icon: '📋', path: '/transactions', color: 'bg-gray-700 hover:bg-gray-600' },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={`${action.color} text-white rounded-xl py-3 px-4 flex items-center gap-2 text-sm font-medium transition-all hover:-translate-y-1`}
          >
            <span className="text-lg">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </motion.div>

      {/* Games Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h3 className="text-white font-semibold text-lg mb-4">🎮 Play Games</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {games.map((game) => (
            <div
              key={game.name}
              onClick={() => game.enabled !== false && navigate(game.path)}
              className={`bg-gradient-to-br ${game.color} glass border rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-2 hover:shadow-xl ${
                game.enabled === false ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="text-4xl mb-3">{game.icon}</div>
              <h4 className="text-white font-bold mb-1">{game.name}</h4>
              <p className="text-gray-400 text-sm">{game.desc}</p>
              {game.enabled === false && (
                <span className="inline-block mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Maintenance</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass border border-white/10 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold mb-4">📈 Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="earnings" stroke="#7c3aed" fill="url(#colorEarnings)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Referral Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass border border-white/10 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold mb-4">🔗 Referral Program</h3>
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
            <p className="text-gray-400 text-xs mb-2">Your Referral Code</p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-orbitron font-bold gradient-text flex-1">
                {userProfile?.referralCode || 'LOADING'}
              </code>
              <button
                onClick={handleCopyReferral}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <p className="text-yellow-400 text-xl font-bold">
                {formatCurrency(settings?.referralBonus || 100)}
              </p>
              <p className="text-gray-400 text-xs">Per Referral</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <p className="text-green-400 text-xl font-bold">
                {formatCurrency(userProfile?.referralEarnings || 0)}
              </p>
              <p className="text-gray-400 text-xs">Total Earned</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Game History */}
      {recentBets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">🎯 Recent Games</h3>
            <button onClick={() => navigate('/transactions')} className="text-purple-400 text-xs hover:text-purple-300">View All →</button>
          </div>
          <div className="space-y-2">
            {recentBets.map((bet) => (
              <div key={bet.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    bet.color === 'red' ? 'bg-red-500/20' : bet.color === 'green' ? 'bg-green-500/20' : 'bg-purple-500/20'
                  }`}>
                    {bet.color === 'red' ? '🔴' : bet.color === 'green' ? '🟢' : '🟣'}
                  </div>
                  <div>
                    <p className="text-white text-sm capitalize">{bet.color} Prediction</p>
                    <p className="text-gray-500 text-xs">{new Date(bet.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${bet.result === 'win' ? 'text-green-400' : bet.result === 'loss' ? 'text-red-400' : 'text-gray-400'}`}>
                    {bet.result === 'win' ? `+${formatCurrency(bet.winAmount || 0)}` : `-${formatCurrency(bet.amount)}`}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    bet.result === 'win' ? 'status-badge-success' : bet.result === 'loss' ? 'status-badge-error' : 'status-badge-warning'
                  }`}>
                    {bet.result || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Games Played', value: userProfile?.totalGamesPlayed || 0, icon: '🎮' },
          { label: 'Total Wins', value: userProfile?.totalWins || 0, icon: '🏆' },
          { label: 'Win Rate', value: `${userProfile?.totalGamesPlayed ? Math.round((userProfile.totalWins / userProfile.totalGamesPlayed) * 100) : 0}%`, icon: '📊' },
        ].map((stat) => (
          <div key={stat.label} className="glass border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-white font-bold text-xl">{stat.value}</p>
            <p className="text-gray-400 text-xs">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Dashboard;
