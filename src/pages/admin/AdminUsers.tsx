import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllUsers, updateUserProfile, addTransaction } from '../../services/userService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import type { User } from '../../types';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const load = async () => {
    try {
      const u = await getAllUsers();
      setUsers(u);
      setFiltered(u);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(users); return; }
    setFiltered(users.filter(u =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.uid.includes(search)
    ));
  }, [search, users]);

  const toggleBlock = async (user: User) => {
    try {
      await updateUserProfile(user.uid, { isBlocked: !user.isBlocked });
      toast.success(`User ${user.isBlocked ? 'unblocked' : 'blocked'} successfully`);
      load();
    } catch { toast.error('Action failed'); }
  };

  const makeAdmin = async (user: User) => {
    try {
      await updateUserProfile(user.uid, { role: user.role === 'admin' ? 'user' : 'admin' });
      toast.success(`User role updated`);
      load();
    } catch { toast.error('Action failed'); }
  };

  const handleAdjustBalance = async (type: 'add' | 'deduct') => {
    if (!selectedUser || !adjustAmount) return;
    const amount = Number(adjustAmount);
    if (amount <= 0) { toast.error('Invalid amount'); return; }
    
    setAdjusting(true);
    try {
      const change = type === 'add' ? amount : -amount;
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        walletBalance: increment(change),
        bonusAmount: type === 'add' ? increment(amount) : increment(0),
        totalPoints: increment(change),
      });
      await addTransaction(selectedUser.uid, 'bonus', change, adjustNote || `Admin ${type === 'add' ? 'credit' : 'debit'}`);
      toast.success(`Balance ${type === 'add' ? 'added' : 'deducted'} successfully`);
      setSelectedUser(null);
      setAdjustAmount('');
      setAdjustNote('');
      load();
    } catch { toast.error('Failed to adjust balance'); }
    finally { setAdjusting(false); }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 User Management</h1>
          <p className="text-gray-400 text-sm">{users.length} total users</p>
        </div>
      </motion.div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name, email, or UID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all"
        />
        <button onClick={load} className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm hover:bg-yellow-500/20 transition-all">
          🔄 Refresh
        </button>
      </div>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full spinning mx-auto mb-3" /><p className="text-gray-500 text-sm">Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  {['User', 'Balance', 'Games', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-400 text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.uid} className="border-t border-white/5 hover:bg-white/2 transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {user.displayName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{user.displayName}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-green-400 font-bold text-sm">{formatCurrency(user.walletBalance || 0)}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{user.totalGamesPlayed || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${user.isBlocked ? 'status-badge-error' : 'status-badge-success'}`}>
                          {user.isBlocked ? '🚫 Blocked' : '✅ Active'}
                        </span>
                        {user.role === 'admin' && (
                          <span className="text-xs px-2 py-0.5 rounded-full w-fit status-badge-warning">⚙️ Admin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/20 transition-all"
                        >
                          💰 Balance
                        </button>
                        <button
                          onClick={() => toggleBlock(user)}
                          className={`px-2 py-1 border rounded-lg text-xs transition-all ${user.isBlocked ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                        >
                          {user.isBlocked ? '✅ Unblock' : '🚫 Block'}
                        </button>
                        <button
                          onClick={() => makeAdmin(user)}
                          className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs hover:bg-purple-500/20 transition-all"
                        >
                          {user.role === 'admin' ? '👤 User' : '⚙️ Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Balance Adjust Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">💰 Adjust Balance</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="mb-4 p-3 bg-white/5 rounded-xl">
              <p className="text-white text-sm font-medium">{selectedUser.displayName}</p>
              <p className="text-gray-400 text-xs">{selectedUser.email}</p>
              <p className="text-green-400 font-bold mt-1">Balance: {formatCurrency(selectedUser.walletBalance || 0)}</p>
            </div>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount"
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleAdjustBalance('add')}
                  disabled={adjusting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {adjusting ? '...' : '+ Add'}
                </button>
                <button
                  onClick={() => handleAdjustBalance('deduct')}
                  disabled={adjusting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {adjusting ? '...' : '- Deduct'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
