import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOCK_USERS } from '../../utils/mockData';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';
import type { User } from '../../types';
import { Search, Filter, UserX, UserCheck, Plus, Minus, Eye, Shield } from 'lucide-react';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState(MOCK_USERS.filter(u => u.role !== 'admin'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'add' | 'deduct'>('add');

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.accountStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleBlock = (uid: string) => {
    setUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        const newStatus = u.accountStatus === 'active' ? 'blocked' : 'active';
        toast.success(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`);
        return { ...u, accountStatus: newStatus };
      }
      return u;
    }));
  };

  const adjustBalance = () => {
    if (!selectedUser || !balanceAmount) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return toast.error('Enter valid amount');

    setUsers(prev => prev.map(u => {
      if (u.uid === selectedUser.uid) {
        const newBalance = balanceType === 'add'
          ? u.walletBalance + amount
          : Math.max(0, u.walletBalance - amount);
        toast.success(`₹${amount} ${balanceType === 'add' ? 'added to' : 'deducted from'} ${u.username}'s wallet`);
        return { ...u, walletBalance: newBalance };
      }
      return u;
    }));
    setBalanceAmount('');
    setSelectedUser(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sora text-white">User Management</h1>
          <p className="text-white/40 text-sm mt-1">{filtered.length} users found</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Total: {users.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email..."
            className="input-gaming w-full pl-10 pr-4 py-3 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'blocked'] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${statusFilter === status ? 'bg-purple-500/30 border border-purple-500/50 text-purple-400' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}>
              <Filter className="w-3 h-3 inline mr-1" />{status}
            </button>
          ))}
        </div>
      </div>

      {/* Balance Adjust Panel */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 border border-yellow-500/30 bg-yellow-500/5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-sm font-bold text-white">
                {selectedUser.username[0]}
              </div>
              <span className="text-sm font-medium text-white">{selectedUser.username}</span>
              <span className="text-xs text-white/40">Balance: ₹{selectedUser.walletBalance}</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <div className="flex gap-1">
                {(['add', 'deduct'] as const).map((t) => (
                  <button key={t} onClick={() => setBalanceType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${balanceType === t ? (t === 'add' ? 'bg-green-500/30 text-green-400' : 'bg-red-500/30 text-red-400') : 'bg-white/5 text-white/50'}`}>
                    {t === 'add' ? <Plus className="w-3 h-3 inline" /> : <Minus className="w-3 h-3 inline" />} {t}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="Amount"
                className="input-gaming flex-1 px-3 py-1.5 rounded-lg text-sm"
              />
              <GlowButton size="sm" onClick={adjustBalance} variant={balanceType === 'add' ? 'green' : 'red'}>
                Apply
              </GlowButton>
              <button onClick={() => setSelectedUser(null)} className="text-white/40 hover:text-white text-xs">Cancel</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-gaming">
            <thead>
              <tr>
                <th className="text-left">User</th>
                <th className="text-left">Email</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Matches</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <motion.tr
                  key={user.uid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-white/2 transition-colors"
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {user.username[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.username}</p>
                        <p className="text-[10px] text-white/30 font-mono">{user.referralCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-white/60">{user.email}</td>
                  <td className="text-right">
                    <div>
                      <p className="text-sm font-semibold text-green-400">₹{user.walletBalance.toFixed(0)}</p>
                      <p className="text-[10px] text-white/30">Win: ₹{user.winningBalance}</p>
                    </div>
                  </td>
                  <td className="text-right text-white/70">{user.totalMatches}</td>
                  <td className="text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${user.accountStatus === 'active' ? 'bg-green-500/20 text-green-400' : user.accountStatus === 'blocked' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {user.accountStatus}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedUser(user === selectedUser ? null : user)}
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                        title="Manage Balance"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleBlock(user.uid)}
                        className={`p-1.5 rounded-lg transition-all ${user.accountStatus === 'active' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                        title={user.accountStatus === 'active' ? 'Block User' : 'Unblock User'}
                      >
                        {user.accountStatus === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => toast.success(`${user.username} role changed`)}
                        className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
                        title="Manage Role"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-white/30">No users found</div>
        )}
      </div>
    </div>
  );
};
