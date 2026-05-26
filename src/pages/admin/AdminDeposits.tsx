import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllDeposits, approveDeposit, rejectDeposit } from '../../services/walletService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Deposit } from '../../types';

const AdminDeposits: React.FC = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [filtered, setFiltered] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const load = async () => {
    try {
      const d = await getAllDeposits();
      setDeposits(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setFiltered(filter === 'all' ? deposits : deposits.filter(d => d.status === filter));
  }, [filter, deposits]);

  const handleApprove = async (deposit: Deposit) => {
    setActionLoading(deposit.id);
    try {
      await approveDeposit(deposit.id, adminNote);
      toast.success('Deposit approved! User wallet updated.');
      setSelectedDeposit(null);
      setAdminNote('');
      load();
    } catch { toast.error('Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (deposit: Deposit) => {
    setActionLoading(deposit.id);
    try {
      await rejectDeposit(deposit.id, adminNote);
      toast.success('Deposit rejected.');
      setSelectedDeposit(null);
      setAdminNote('');
      load();
    } catch { toast.error('Failed to reject'); }
    finally { setActionLoading(null); }
  };

  const pendingCount = deposits.filter(d => d.status === 'pending').length;
  const totalApproved = deposits.filter(d => d.status === 'approved').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💳 Deposit Management</h1>
          <p className="text-gray-400 text-sm">{pendingCount} pending approvals</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm hover:bg-yellow-500/20">🔄 Refresh</button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: pendingCount, color: 'text-yellow-400' },
          { label: 'Total Approved', value: formatCurrency(totalApproved), color: 'text-green-400' },
          { label: 'Total Deposits', value: deposits.length, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="glass border border-white/10 rounded-xl p-4 text-center">
            <p className={`font-orbitron font-bold text-xl ${s.color}`}>{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full spinning mx-auto mb-3" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No {filter} deposits</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  {['User', 'Amount', 'UTR', 'Screenshot', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-400 text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((dep) => (
                  <tr key={dep.id} className="border-t border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{dep.userName}</p>
                      <p className="text-gray-500 text-xs">{dep.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-green-400 font-bold">{formatCurrency(dep.amount)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{dep.utrNumber}</td>
                    <td className="px-4 py-3">
                      {dep.screenshotUrl ? (
                        <a href={dep.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:text-blue-300">View 📸</a>
                      ) : <span className="text-gray-600 text-xs">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(dep.status)}`}>{dep.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(dep.createdAt)}</td>
                    <td className="px-4 py-3">
                      {dep.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedDeposit(dep)}
                            className="px-3 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-xs hover:bg-green-600/30 transition-all disabled:opacity-50"
                            disabled={actionLoading === dep.id}>
                            {actionLoading === dep.id ? '...' : 'Review'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Action Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Review Deposit</h3>
              <button onClick={() => { setSelectedDeposit(null); setAdminNote(''); }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">User</span>
                  <span className="text-white">{selectedDeposit.userName}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-green-400 font-bold">{formatCurrency(selectedDeposit.amount)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">UTR</span>
                  <span className="text-white font-mono">{selectedDeposit.utrNumber}</span>
                </div>
              </div>
              {selectedDeposit.screenshotUrl && (
                <img src={selectedDeposit.screenshotUrl} alt="Screenshot" className="w-full h-32 object-cover rounded-xl border border-white/10" />
              )}
              <textarea
                placeholder="Admin note (optional)"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleApprove(selectedDeposit)} disabled={!!actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                {actionLoading ? '...' : '✅ Approve'}
              </button>
              <button onClick={() => handleReject(selectedDeposit)} disabled={!!actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                {actionLoading ? '...' : '❌ Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDeposits;
