// ============================================================
// DASHBOARD PAGE
// ============================================================

import { useEffect, useState } from 'react';
import { StatCard, GlowButton } from '../components';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gamepad2,
  Users,
  TrendingUp,
  Trophy,
  Dice6,
  Palette,
  PlayCircle,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/wallet';
import { getUserTransactions } from '../services/walletService';
import { Transaction } from '../types';
import { format } from 'date-fns';

const games = [
  {
    title: 'Card Casino',
    description: '2-player card battle. Higher card wins!',
    icon: '🃏',
    path: '/games/casino',
    color: 'from-yellow-500/20 to-orange-500/10',
    border: 'border-yellow-500/30',
    badge: 'Multiplayer',
  },
  {
    title: 'Dice Even/Odd',
    description: 'Roll dice and bet on even or odd!',
    icon: '🎲',
    path: '/games/dice',
    color: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/30',
    badge: 'Live',
  },
  {
    title: 'Color Prediction',
    description: 'Predict the color and multiply wins!',
    icon: '🎨',
    path: '/games/color',
    color: 'from-purple-500/20 to-pink-500/10',
    border: 'border-purple-500/30',
    badge: 'Realtime',
  },
];

export function DashboardPage() {
  const { user } = useAuthStore();
  const { wallet, isLoading: walletLoading } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getUserTransactions(user.uid, 5)
      .then(setTransactions)
      .finally(() => setTxLoading(false));
  }, [user?.uid]);

  const stats = [
    {
      label: 'Total Balance',
      value: wallet ? formatCurrency(wallet.totalBalance) : '₹0.00',
      icon: Wallet,
      color: 'text-yellow-400',
      bg: 'from-yellow-500/20 to-orange-500/10',
    },
    {
      label: 'Total Won',
      value: formatCurrency(user?.totalWon || 0),
      icon: Trophy,
      color: 'text-green-400',
      bg: 'from-green-500/20 to-emerald-500/10',
    },
    {
      label: 'Total Deposited',
      value: formatCurrency(user?.totalDeposit || 0),
      icon: ArrowDownToLine,
      color: 'text-blue-400',
      bg: 'from-blue-500/20 to-cyan-500/10',
    },
    {
      label: 'Games Played',
      value: (user?.totalPlayed || 0).toString(),
      icon: Gamepad2,
      color: 'text-purple-400',
      bg: 'from-purple-500/20 to-pink-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, <span className="text-yellow-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Ready to play? Check your wallet and join a game.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 glass-card-light px-4 py-2 rounded-xl">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-yellow-400 font-casino">Premium Player</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-4 bg-gradient-to-br ${bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-xs font-medium">{label}</p>
              <div className={`p-2 rounded-lg bg-white/5`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            {walletLoading && label === 'Total Balance' ? (
              <div className="skeleton h-6 w-24" />
            ) : (
              <p className={`text-lg md:text-xl font-bold ${color}`}>{value}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Wallet Quick Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" /> Wallet Overview
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-slate-400 mb-1">Deposit</p>
              <p className="text-sm md:text-base font-bold text-blue-400">
                {wallet ? formatCurrency(wallet.depositBalance) : '₹0'}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-slate-400 mb-1">Winning</p>
              <p className="text-sm md:text-base font-bold text-green-400">
                {wallet ? formatCurrency(wallet.winningBalance) : '₹0'}
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-slate-400 mb-1">Bonus</p>
              <p className="text-sm md:text-base font-bold text-purple-400">
                {wallet ? formatCurrency(wallet.bonusBalance) : '₹0'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/deposit"
              className="flex-1 btn-gold py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <ArrowDownToLine className="w-4 h-4" /> Add Money
            </Link>
            <Link
              to="/withdraw"
              className="flex-1 glass-card-light py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 border border-white/10 hover:border-purple-500/30 transition-all"
            >
              <ArrowUpFromLine className="w-4 h-4" /> Withdraw
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Games Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" /> Featured Games
          </h2>
          <Link to="/games" className="text-purple-400 text-sm hover:text-purple-300">View All →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {games.map((game, i) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <Link
                to={game.path}
                className={`block glass-card p-5 bg-gradient-to-br ${game.color} border ${game.border} hover:scale-[1.02] transition-all duration-200 group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{game.icon}</span>
                  <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-full">{game.badge}</span>
                </div>
                <h3 className="font-bold text-white mb-1">{game.title}</h3>
                <p className="text-slate-400 text-xs mb-4">{game.description}</p>
                <div className="flex items-center gap-1 text-purple-300 text-sm font-medium group-hover:gap-2 transition-all">
                  <PlayCircle className="w-4 h-4" /> Play Now
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Stats & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Links */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Referral', icon: Users, path: '/referral', color: 'text-blue-400' },
              { label: 'Dice Game', icon: Dice6, path: '/games/dice', color: 'text-yellow-400' },
              { label: 'Color Game', icon: Palette, path: '/games/color', color: 'text-pink-400' },
              { label: 'History', icon: TrendingUp, path: '/transactions', color: 'text-green-400' },
            ].map(({ label, icon: Icon, path, color }) => (
              <Link
                key={label}
                to={path}
                className="glass-card-light p-3 rounded-xl flex items-center gap-2 hover:border-purple-500/30 transition-all"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm text-slate-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No transactions yet</p>
              <Link to="/deposit" className="text-purple-400 text-sm mt-2 inline-block">Make your first deposit →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 hover:bg-white/5 transition-all">
                  <div>
                    <p className="text-sm text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-500">
                      {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'game_bet' || tx.type === 'withdraw' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'game_bet' || tx.type === 'withdraw' ? '-' : '+'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
              <Link to="/transactions" className="block text-center text-purple-400 text-sm mt-2 hover:text-purple-300">
                View All →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
