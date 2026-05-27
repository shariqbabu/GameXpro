import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { GlowButton } from '../../components/ui/GlowButton';
import { MOCK_GAME_HISTORY, MOCK_NOTIFICATIONS, MOCK_LEADERBOARD } from '../../utils/mockData';
import {
  Wallet, Trophy, Gamepad2, TrendingUp, Zap, Crown, Gift,
  ArrowRight, Users, Star, Bell, ChevronRight, Play
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const earningsData = [
  { day: 'Mon', amount: 200 }, { day: 'Tue', amount: 450 }, { day: 'Wed', amount: 320 },
  { day: 'Thu', amount: 780 }, { day: 'Fri', amount: 590 }, { day: 'Sat', amount: 920 },
  { day: 'Sun', amount: 750 },
];

const games = [
  {
    id: 'color', name: 'Color Prediction', icon: '🎨', description: 'Predict Red, Green, or Violet',
    path: '/games/color', players: '12.4K', minBet: '₹10', gradient: 'from-red-500/20 via-green-500/20 to-violet-500/20',
    border: 'border-purple-500/30', badge: 'LIVE',
  },
  {
    id: 'ludo', name: 'Ludo Battle', icon: '🎲', description: 'Real-time 1v1 multiplayer betting',
    path: '/games/ludo', players: '8.2K', minBet: '₹50', gradient: 'from-blue-500/20 via-purple-500/20 to-pink-500/20',
    border: 'border-cyan-500/30', badge: 'HOT',
  },
];

export const DashboardPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState({ onlineUsers: 14285, activeBets: 3847 });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 10) - 5,
        activeBets: prev.activeBets + Math.floor(Math.random() * 6) - 3,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalBalance = (userProfile?.walletBalance || 1250);
  const winBalance = (userProfile?.winningBalance || 750);
  const totalMatches = (userProfile?.totalMatches || 47);
  const totalPoints = (userProfile?.totalPoints || 8500);

  return (
    <div className="space-y-6 pb-4">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-purple-900/50 via-purple-800/30 to-cyan-900/30 border border-purple-500/20"
      >
        {/* Background decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
        <div className="absolute right-4 top-4 text-6xl opacity-20 select-none">👑</div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-white/50 uppercase tracking-wider">Online & Ready</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-sora text-white">
              Hey, {userProfile?.username || 'Champion'}! 👋
            </h1>
            <p className="text-white/50 text-sm mt-1">Ready to win big today?</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Users className="w-3.5 h-3.5" />
                <span className="text-green-400 font-semibold">{liveStats.onlineUsers.toLocaleString()}</span> online
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-yellow-400 font-semibold">{liveStats.activeBets.toLocaleString()}</span> active bets
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <GlowButton onClick={() => navigate('/wallet')} variant="cyan" size="md">
              <Wallet className="w-4 h-4" /> Add Money
            </GlowButton>
            <GlowButton onClick={() => navigate('/games')} size="md">
              <Play className="w-4 h-4" /> Play Now
            </GlowButton>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Balance" value={totalBalance} prefix="₹" icon={<Wallet className="w-5 h-5" />} color="purple" decimals={2} delay={0.1} />
        <StatCard title="Winnings" value={winBalance} prefix="₹" icon={<Trophy className="w-5 h-5" />} color="green" decimals={2} delay={0.2} />
        <StatCard title="Total Matches" value={totalMatches} icon={<Gamepad2 className="w-5 h-5" />} color="cyan" delay={0.3} />
        <StatCard title="Total Points" value={totalPoints} icon={<Star className="w-5 h-5" />} color="gold" delay={0.4} />
      </div>

      {/* Games & Chart Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Games */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-sora text-white">🎮 Live Games</h2>
            <button onClick={() => navigate('/games')} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid gap-4">
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => navigate(game.path)}
                className={`game-card cursor-pointer rounded-2xl p-5 bg-gradient-to-r ${game.gradient} border ${game.border} relative overflow-hidden`}
              >
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${game.badge === 'LIVE' ? 'badge-live' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                    {game.badge}
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{game.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white font-sora">{game.name}</h3>
                    <p className="text-xs text-white/50 mt-0.5">{game.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-xs text-white/40">
                        <span className="text-green-400 font-semibold">{game.players}</span> playing
                      </div>
                      <div className="text-xs text-white/40">
                        Min bet: <span className="text-yellow-400 font-semibold">{game.minBet}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-5 glass border border-white/8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white font-sora">Weekly Earnings</h3>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">₹3,010</div>
          <p className="text-xs text-white/40 mb-4">+23% from last week</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={earningsData}>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, color: '#fff' }}
                formatter={(value) => [`₹${value}`, 'Earnings']}
              />
              <Line type="monotone" dataKey="amount" stroke="#a855f7" strokeWidth={2} dot={false}
                activeDot={{ r: 4, fill: '#a855f7' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity & Leaderboard */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl glass border border-white/8 overflow-hidden"
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white font-sora">Recent Games</h3>
            <button onClick={() => navigate('/wallet')} className="text-xs text-purple-400">View All</button>
          </div>
          <div className="divide-y divide-white/5">
            {MOCK_GAME_HISTORY.slice(0, 5).map((game) => (
              <div key={game.id} className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${game.gameType === 'color_prediction' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                  {game.gameType === 'color_prediction' ? '🎨' : '🎲'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {game.gameType === 'color_prediction' ? 'Color Prediction' : 'Ludo Battle'}
                  </p>
                  <p className="text-xs text-white/40">{new Date(game.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${game.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                    {game.result === 'win' ? `+₹${game.winAmount}` : `-₹${game.amount}`}
                  </p>
                  <p className={`text-xs px-2 py-0.5 rounded-full font-medium ${game.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {game.result.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Leaderboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl glass border border-white/8 overflow-hidden"
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white font-sora">🏆 Top Players</h3>
            <button onClick={() => navigate('/leaderboard')} className="text-xs text-purple-400">Full Board</button>
          </div>
          <div className="divide-y divide-white/5">
            {MOCK_LEADERBOARD.slice(0, 5).map((player) => (
              <div key={player.userId} className="flex items-center gap-3 p-4 hover:bg-white/2 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${player.rank === 1 ? 'bg-yellow-500 text-black' : player.rank === 2 ? 'bg-gray-400 text-black' : player.rank === 3 ? 'bg-orange-600 text-white' : 'bg-white/10 text-white/60'}`}>
                  {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                  {player.username[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{player.username}</p>
                  <p className="text-xs text-white/40">{player.totalWins} wins</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">₹{player.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Notifications Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl glass border border-white/8 overflow-hidden"
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white font-sora">Recent Notifications</h3>
          </div>
          <button onClick={() => navigate('/notifications')} className="text-xs text-purple-400">View All</button>
        </div>
        <div className="divide-y divide-white/5">
          {MOCK_NOTIFICATIONS.map((notif) => (
            <div key={notif.id} className={`flex items-start gap-3 p-4 ${!notif.isRead ? 'bg-purple-500/3' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                notif.type === 'reward' ? 'bg-yellow-500/20' :
                notif.type === 'success' ? 'bg-green-500/20' : 'bg-blue-500/20'
              }`}>
                {notif.type === 'reward' ? '🎁' : notif.type === 'success' ? '✅' : 'ℹ️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{notif.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{notif.message}</p>
              </div>
              {!notif.isRead && <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-1" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referral CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl p-6 bg-gradient-to-r from-green-900/30 to-emerald-800/20 border border-green-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-green-400" />
            <h3 className="font-bold text-white font-sora">Invite Friends, Earn More!</h3>
          </div>
          <p className="text-sm text-white/50">Share your referral code and earn ₹{100} per referral</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/30 border border-green-500/20">
            <Crown className="w-3.5 h-3.5 text-green-400" />
            <span className="text-sm font-bold text-green-400 font-mono">{userProfile?.referralCode || 'DEMO123'}</span>
          </div>
        </div>
        <GlowButton onClick={() => navigate('/referral')} variant="green">
          <Users className="w-4 h-4" /> Invite Now
        </GlowButton>
      </motion.div>
    </div>
  );
};
