// ============================================================
// ADMIN USERS MANAGEMENT
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, Ban, DollarSign, RefreshCw } from 'lucide-react';
import { subscribeUsers, toggleUserBan, adminAdjustWallet, makeUserAdmin } from '../services/adminService';
import { User } from '../types';
import { formatCurrency } from '../utils/wallet';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AdminUsers() {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdjust, setShowAdjust] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'depositBalance' | 'winningBalance' | 'bonusBalance'>('depositBalance');
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => {
    const unsub = subscribeUsers((u) => {
      setUsers(u);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
  );

  const handleBan = async (uid: string, ban: boolean) => {
    try {
      await toggleUserBan(uid, ban);
      toast.success(`User ${ban ? 'banned' : 'unbanned'} successfully`);
    } catch {
      toast.error('Action failed');
    }
  };

  const handleAdjust = async (uid: string) => {
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt)) { toast.error('Invalid amount'); return; }
    if (!currentAdmin?.uid) return;
    try {
      await adminAdjustWallet(uid, amt, adjustType, adjustNote || 'Admin adjustment', currentAdmin.uid);
      toast.success('Wallet adjusted successfully');
      setShowAdjust(null);
      setAdjustAmount('');
      setAdjustNote('');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Adjustment failed');
    }
  };

  const handleMakeAdmin = async (uid: string) => {
    if (!confirm('Make this user an admin? This cannot be undone easily.')) return;
    try {
      await makeUserAdmin(uid);
      toast.success('User is now an admin');
    } catch {
      toast.error('Failed to make admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" /> User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="input-casino pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="casino-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Total Deposit</th>
                <th>Total Won</th>
                <th>Games</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((u) => (
                <tr key={u.uid}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm flex items-center gap-1">
                          {u.name}
                          {u.isAdmin && <Shield className="w-3 h-3 text-yellow-400" />}
                        </p>
                        <p className="text-slate-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-400 text-sm">{u.phone}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.status === 'active' ? 'badge-approved' : 'badge-rejected'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="text-green-400 font-semibold text-sm">{formatCurrency(u.totalDeposit || 0)}</td>
                  <td className="text-yellow-400 font-semibold text-sm">{formatCurrency(u.totalWon || 0)}</td>
                  <td className="text-slate-400">{u.totalPlayed || 0}</td>
                  <td className="text-slate-500 text-xs">
                    {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowAdjust(showAdjust === u.uid ? null : u.uid)}
                        className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all"
                        title="Adjust Wallet"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleBan(u.uid, u.status === 'active')}
                        className={`p-1.5 rounded-lg transition-all ${
                          u.status === 'active'
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                        title={u.status === 'active' ? 'Ban User' : 'Unban User'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      {!u.isAdmin && (
                        <button
                          onClick={() => handleMakeAdmin(u.uid)}
                          className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all"
                          title="Make Admin"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {/* Wallet Adjust Panel */}
                    {showAdjust === u.uid && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 p-3 bg-yellow-500/10 rounded-lg space-y-2 min-w-[200px]"
                      >
                        <input
                          type="number"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="Amount (negative to deduct)"
                          className="input-casino text-xs py-1.5"
                        />
                        <select
                          value={adjustType}
                          onChange={(e) => setAdjustType(e.target.value as typeof adjustType)}
                          className="input-casino text-xs py-1.5"
                        >
                          <option value="depositBalance">Deposit Balance</option>
                          <option value="winningBalance">Winning Balance</option>
                          <option value="bonusBalance">Bonus Balance</option>
                        </select>
                        <input
                          type="text"
                          value={adjustNote}
                          onChange={(e) => setAdjustNote(e.target.value)}
                          placeholder="Note (optional)"
                          className="input-casino text-xs py-1.5"
                        />
                        <button
                          onClick={() => handleAdjust(u.uid)}
                          className="w-full py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium hover:bg-yellow-500/30 transition-all"
                        >
                          Apply Adjustment
                        </button>
                      </motion.div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden p-4 space-y-3">
          {filtered.map((u) => (
            <div key={u.uid} className="p-4 rounded-xl bg-white/3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'active' ? 'badge-approved' : 'badge-rejected'}`}>
                  {u.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-slate-500">Deposited</p><p className="text-green-400 font-semibold">{formatCurrency(u.totalDeposit || 0)}</p></div>
                <div><p className="text-slate-500">Won</p><p className="text-yellow-400 font-semibold">{formatCurrency(u.totalWon || 0)}</p></div>
                <div><p className="text-slate-500">Games</p><p className="text-white font-semibold">{u.totalPlayed || 0}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleBan(u.uid, u.status === 'active')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    u.status === 'active' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                  }`}>
                  {u.status === 'active' ? 'Ban' : 'Unban'}
                </button>
                <button onClick={() => setShowAdjust(showAdjust === u.uid ? null : u.uid)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 transition-all">
                  Adjust Wallet
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
