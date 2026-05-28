// ============================================================
// WALLET PAGE - REALTIME WALLET
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  Gift,
  RefreshCw,
} from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useAuthStore } from '../store/authStore';
import { subscribeTransactions } from '../services/walletService';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/wallet';
import { format } from 'date-fns';

export function WalletPage() {
  const { wallet, isLoading } = useWallet();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'withdraw' | 'game'>('all');

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeTransactions(user.uid, (txns) => {
      setTransactions(txns);
      setTxLoading(false);
    }, 50);
    return () => unsub();
  }, [user?.uid]);

  const filteredTx = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'deposit') return tx.type === 'deposit' || tx.type === 'referral_bonus' || tx.type === 'admin_adjustment';
    if (activeTab === 'withdraw') return tx.type === 'withdraw';
    if (activeTab === 'game') return tx.type === 'game_bet' || tx.type === 'game_win';
    return true;
  });

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💰';
      case 'withdraw': return '💸';
      case 'game_bet': return '🎲';
      case 'game_win': return '🏆';
      case 'referral_bonus': return '🎁';
      case 'admin_adjustment': return '⚙️';
      default: return '💳';
    }
  };

  const isCredit = (type: string) => ['deposit', 'game_win', 'referral_bonus'].includes(type);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-purple-400" /> My Wallet
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your casino funds</p>
      </motion.div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 lg:col-span-4 glass-card p-6 bg-gradient-to-br from-purple-600/20 to-yellow-500/10 border border-purple-500/30 neon-glow-purple"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">Total Balance</p>
            <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          {isLoading ? (
            <div className="skeleton h-10 w-48 mb-4" />
          ) : (
            <p className="text-3xl md:text-4xl font-bold text-white font-casino mb-4">
              {wallet ? formatCurrency(wallet.totalBalance) : '₹0.00'}
            </p>
          )}
          <div className="flex gap-3 flex-wrap">
            <Link to="/deposit" className="btn-gold px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4" /> Add Money
            </Link>
            <Link to="/withdraw" className="glass-card-light px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 border border-white/10 hover:border-purple-500/30 transition-all">
              <ArrowUpFromLine className="w-4 h-4" /> Withdraw
            </Link>
          </div>
        </motion.div>

        {/* Deposit Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 bg-gradient-to-br from-blue-500/15 to-cyan-500/5 border border-blue-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <ArrowDownToLine className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Deposit</span>
          </div>
          <p className="text-xl font-bold text-blue-400">
            {isLoading ? <span className="skeleton inline-block h-6 w-24" /> : formatCurrency(wallet?.depositBalance || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Available to play</p>
        </motion.div>

        {/* Winning Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 bg-gradient-to-br from-green-500/15 to-emerald-500/5 border border-green-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Winning</span>
          </div>
          <p className="text-xl font-bold text-green-400">
            {isLoading ? <span className="skeleton inline-block h-6 w-24" /> : formatCurrency(wallet?.winningBalance || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Withdrawable</p>
        </motion.div>

        {/* Bonus Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 bg-gradient-to-br from-purple-500/15 to-pink-500/5 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <Gift className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">Bonus</span>
          </div>
          <p className="text-xl font-bold text-purple-400">
            {isLoading ? <span className="skeleton inline-block h-6 w-24" /> : formatCurrency(wallet?.bonusBalance || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Referral rewards</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5 bg-gradient-to-br from-red-500/15 to-orange-500/5 border border-red-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Withdrawn</span>
          </div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(user?.totalWithdraw || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Total withdrawn</p>
        </motion.div>
      </div>

      {/* Transaction History */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Transaction History</h2>
          <span className="text-xs text-slate-500">{transactions.length} transactions</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(['all', 'deposit', 'withdraw', 'game'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTxIcon(tx.type)}</span>
                  <div>
                    <p className="text-sm text-white capitalize font-medium">{tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500 max-w-[200px] truncate">{tx.description}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isCredit(tx.type) ? 'text-green-400' : 'text-red-400'}`}>
                    {isCredit(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'completed' ? 'badge-approved' : tx.status === 'pending' ? 'badge-pending' : 'badge-rejected'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
