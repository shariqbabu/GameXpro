import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getUserTransactions } from '../services/userService';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';

const typeIcon: Record<string, string> = {
  deposit: '💳', withdrawal: '🏧', game_win: '🏆', game_loss: '💸', bonus: '🎁', referral: '🔗',
};

const Transactions: React.FC = () => {
  const { userProfile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!userProfile) return;
    getUserTransactions(userProfile.uid).then(txns => {
      setTransactions(txns as any[]);
      setFiltered(txns as any[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, [userProfile]);

  useEffect(() => {
    let result = transactions;
    if (filter !== 'all') result = result.filter(t => t.type === filter);
    if (search) result = result.filter(t => t.description?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [filter, transactions, search]);

  const totalIn = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'game_win', label: 'Wins' },
    { value: 'game_loss', label: 'Losses' },
    { value: 'bonus', label: 'Bonuses' },
    { value: 'referral', label: 'Referrals' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-white">
        📊 Transaction History
      </motion.h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total In', value: formatCurrency(totalIn), color: 'text-green-400', bg: 'from-green-500/20 to-green-600/10 border-green-500/20' },
          { label: 'Total Out', value: formatCurrency(totalOut), color: 'text-red-400', bg: 'from-red-500/20 to-red-600/10 border-red-500/20' },
          { label: 'Total Txns', value: transactions.length, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/10 border-blue-500/20' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${s.bg} glass border rounded-xl p-4 text-center`}
          >
            <p className={`font-orbitron font-bold text-xl ${s.color}`}>{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex gap-1 flex-wrap">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === opt.value ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full spinning mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    {['Type', 'Description', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-400 text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((txn: any) => (
                    <tr key={txn.id} className="border-t border-white/5 hover:bg-white/2 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeIcon[txn.type] || '📋'}</span>
                          <span className="text-gray-400 text-xs capitalize">{txn.type?.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white text-sm max-w-48 truncate">{txn.description}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {txn.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(txn.status)}`}>{txn.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(txn.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="sm:hidden divide-y divide-white/5">
              {filtered.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${txn.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <span className="text-lg">{typeIcon[txn.type] || '📋'}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm truncate max-w-40">{txn.description}</p>
                      <p className="text-gray-500 text-xs">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(txn.status)}`}>{txn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Transactions;
