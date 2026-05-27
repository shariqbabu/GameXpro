// ============================================================
// TRANSACTIONS PAGE
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Filter } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { subscribeTransactions } from '../services/walletService';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/wallet';
import { format } from 'date-fns';

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdrawal',
  game_bet: 'Game Bet',
  game_win: 'Game Win',
  referral_bonus: 'Referral Bonus',
  admin_adjustment: 'Admin Adjustment',
};

const TYPE_ICONS: Record<string, string> = {
  deposit: '💰',
  withdraw: '💸',
  game_bet: '🎲',
  game_win: '🏆',
  referral_bonus: '🎁',
  admin_adjustment: '⚙️',
};

export function TransactionsPage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeTransactions(user.uid, (txns) => {
      setTransactions(txns);
      setIsLoading(false);
    }, 100);
    return () => unsub();
  }, [user?.uid]);

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  const isCredit = (type: string) => ['deposit', 'game_win', 'referral_bonus'].includes(type);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" /> Transaction History
          </h1>
          <p className="text-slate-400 text-sm mt-1">{transactions.length} total transactions</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
            filter === 'all' ? 'bg-purple-600 text-white' : 'glass-card-light text-slate-400 hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" /> All
        </button>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
              filter === key ? 'bg-purple-600 text-white' : 'glass-card-light text-slate-400 hover:text-white'
            }`}
          >
            {TYPE_ICONS[key]} {label}
          </button>
        ))}
      </div>

      {/* Table (desktop) */}
      <div className="glass-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="casino-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Balance Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">No transactions found</td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{TYPE_ICONS[tx.type] || '💳'}</span>
                        <span className="font-medium text-white">{TYPE_LABELS[tx.type] || tx.type}</span>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate">{tx.description}</td>
                    <td className={`font-semibold ${isCredit(tx.type) ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="capitalize">{tx.balanceType?.replace('Balance', ' Balance')}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'completed' ? 'badge-approved' :
                        tx.status === 'pending' ? 'badge-pending' : 'badge-rejected'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">
                      {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'MMM d, yyyy\nh:mm a') : 'Just now'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No transactions found</div>
          ) : (
            filtered.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{TYPE_ICONS[tx.type] || '💳'}</span>
                  <div>
                    <p className="text-sm text-white font-medium">{TYPE_LABELS[tx.type] || tx.type}</p>
                    <p className="text-xs text-slate-500">
                      {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${isCredit(tx.type) ? 'text-green-400' : 'text-red-400'}`}>
                    {isCredit(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tx.status === 'completed' ? 'badge-approved' :
                    tx.status === 'pending' ? 'badge-pending' : 'badge-rejected'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
