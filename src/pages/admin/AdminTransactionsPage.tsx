import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOCK_TRANSACTIONS } from '../../utils/mockData';
import { Search, CreditCard, ArrowDownCircle, ArrowUpCircle, Gift, Gamepad2 } from 'lucide-react';
import type { Transaction } from '../../types';

export const AdminTransactionsPage = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Transaction['type'] | 'all'>('all');

  const filtered = MOCK_TRANSACTIONS.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
    deposit: { icon: ArrowDownCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    withdrawal: { icon: ArrowUpCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    bonus: { icon: Gift, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    referral: { icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/20' },
    game_win: { icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    game_loss: { icon: Gamepad2, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    transfer: { icon: CreditCard, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-cyan-400" /> All Transactions
        </h1>
        <p className="text-white/40 text-sm mt-1">{filtered.length} transactions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..." className="input-gaming w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(['all', 'deposit', 'withdrawal', 'game_win', 'bonus', 'referral'] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${typeFilter === t ? 'bg-purple-500/30 border border-purple-500/50 text-purple-400' : 'bg-white/5 border border-white/10 text-white/50'}`}>
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-gaming">
            <thead>
              <tr>
                <th className="text-left">Type</th>
                <th className="text-left">Description</th>
                <th className="text-center">Status</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => {
                const config = typeConfig[tx.type] || typeConfig.transfer;
                const Icon = config.icon;
                return (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl ${config.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <span className={`text-xs font-medium capitalize ${config.color}`}>{tx.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="text-white/70 max-w-xs truncate">{tx.description}</td>
                    <td className="text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{tx.status}</span>
                    </td>
                    <td className={`text-right font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                    </td>
                    <td className="text-white/40 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
