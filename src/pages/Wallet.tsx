import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserTransactions } from '../services/userService';
import { getUserDeposits, getUserWithdrawals } from '../services/walletService';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Wallet: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'withdrawals' | 'transactions'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    const load = async () => {
      try {
        const [txns, deps, wds] = await Promise.all([
          getUserTransactions(userProfile.uid),
          getUserDeposits(userProfile.uid),
          getUserWithdrawals(userProfile.uid),
        ]);
        setTransactions(txns as any[]);
        setDeposits(deps);
        setWithdrawals(wds);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [userProfile]);

  const walletData = [
    { name: 'Winning', value: userProfile?.winningAmount || 0, color: '#22c55e' },
    { name: 'Bonus', value: userProfile?.bonusAmount || 0, color: '#f59e0b' },
    { name: 'Deposit', value: userProfile?.depositAmount || 0, color: '#3b82f6' },
    { name: 'Referral', value: userProfile?.referralEarnings || 0, color: '#a855f7' },
  ].filter(d => d.value > 0);

  const barData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), deposits: Math.random() * 500, withdrawals: Math.random() * 200 };
  });

  const tabs = ['overview', 'deposits', 'withdrawals', 'transactions'] as const;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">💰 Wallet</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/wallet/add')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
            + Add Money
          </button>
          <button onClick={() => navigate('/wallet/withdraw')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
            Withdraw
          </button>
        </div>
      </motion.div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Balance', value: userProfile?.walletBalance || 0, icon: '💰', color: 'purple' },
          { label: 'Winning', value: userProfile?.winningAmount || 0, icon: '🏆', color: 'green' },
          { label: 'Bonus', value: userProfile?.bonusAmount || 0, icon: '🎁', color: 'yellow' },
          { label: 'Deposited', value: userProfile?.depositAmount || 0, icon: '💳', color: 'blue' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass border rounded-2xl p-4 ${
              card.color === 'purple' ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/20' :
              card.color === 'green' ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/20' :
              card.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/20' :
              'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/20'
            }`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="text-gray-400 text-xs mb-1">{card.label}</p>
            <p className={`font-orbitron font-bold text-lg ${
              card.color === 'purple' ? 'text-purple-300' :
              card.color === 'green' ? 'text-green-300' :
              card.color === 'yellow' ? 'text-yellow-300' : 'text-blue-300'
            }`}>{formatCurrency(card.value)}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">💹 Wallet Breakdown</h3>
            {walletData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={walletData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    {walletData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No data yet</div>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {walletData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400">{item.name}: {formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">📊 Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="deposits" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Deposits */}
      {activeTab === 'deposits' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-white font-semibold">Deposit History</h3>
            <button onClick={() => navigate('/wallet/add')} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">+ Add</button>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : deposits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No deposits yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    {['Amount', 'UTR', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-400 text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((dep) => (
                    <tr key={dep.id} className="border-t border-white/5 hover:bg-white/2">
                      <td className="px-4 py-3 text-white font-medium">{formatCurrency(dep.amount)}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm font-mono">{dep.utrNumber}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(dep.status)}`}>{dep.status}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(dep.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Withdrawals */}
      {activeTab === 'withdrawals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-white font-semibold">Withdrawal History</h3>
            <button onClick={() => navigate('/wallet/withdraw')} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Withdraw</button>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No withdrawals yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    {['Amount', 'UPI/Bank', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-400 text-xs font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((wd) => (
                    <tr key={wd.id} className="border-t border-white/5 hover:bg-white/2">
                      <td className="px-4 py-3 text-white font-medium">{formatCurrency(wd.amount)}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{wd.upiId || wd.bankAccount || '-'}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(wd.status)}`}>{wd.status}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(wd.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Transactions */}
      {activeTab === 'transactions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-white font-semibold">All Transactions</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No transactions yet</div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      txn.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {txn.type === 'deposit' ? '💳' : txn.type === 'withdrawal' ? '🏧' : txn.type === 'game_win' ? '🏆' : txn.type === 'bonus' ? '🎁' : '🔗'}
                    </div>
                    <div>
                      <p className="text-white text-sm">{txn.description}</p>
                      <p className="text-gray-500 text-xs">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {txn.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Wallet;
