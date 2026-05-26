import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllWithdrawals, approveWithdrawal, rejectWithdrawal } from '../../services/walletService';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { Withdrawal } from '../../types';

const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filtered, setFiltered] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedWd, setSelectedWd] = useState<Withdrawal | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const load = async () => {
    try {
      const w = await getAllWithdrawals();
      setWithdrawals(w);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    setFiltered(filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter));
  }, [filter, withdrawals]);

  const handleApprove = async (wd: Withdrawal) => {
    setActionLoading(wd.id);
    try {
      await approveWithdrawal(wd.id, adminNote);
      toast.success('Withdrawal approved!');
      setSelectedWd(null);
      setAdminNote('');
      load();
    } catch { toast.error('Failed'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (wd: Withdrawal) => {
    setActionLoading(wd.id);
    try {
      await rejectWithdrawal(wd.id, adminNote);
      toast.success('Withdrawal rejected. Amount refunded.');
      setSelectedWd(null);
      setAdminNote('');
      load();
    } catch { toast.error('Failed'); }
    finally { setActionLoading(null); }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const totalApproved = withdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + w.amount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🏧 Withdrawal Management</h1>
          <p className="text-gray-400 text-sm">{pendingCount} pending requests</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm hover:bg-yellow-500/20">🔄 Refresh</button>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: pendingCount, color: 'text-yellow-400' },
          { label: 'Total Approved', value: formatCurrency(totalApproved), color: 'text-red-400' },
          { label: 'Total Requests', value: withdrawals.length, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="glass border border-white/10 rounded-xl p-4 text-center">
            <p className={`font-orbitron font-bold text-xl ${s.color}`}>{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

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
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full spinning mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No {filter} withdrawals</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  {['User', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-400 text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((wd) => (
                  <tr key={wd.id} className="border-t border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{wd.userName}</p>
                      <p className="text-gray-500 text-xs">{wd.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-red-400 font-bold">{formatCurrency(wd.amount)}</td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{wd.upiId || wd.bankAccount || 'N/A'}</p>
                      {wd.ifscCode && <p className="text-gray-500 text-xs">{wd.ifscCode}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(wd.status)}`}>{wd.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(wd.createdAt)}</td>
                    <td className="px-4 py-3">
                      {wd.status === 'pending' && (
                        <button onClick={() => setSelectedWd(wd)}
                          className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs hover:bg-blue-600/30 transition-all">
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {selectedWd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Review Withdrawal</h3>
              <button onClick={() => { setSelectedWd(null); setAdminNote(''); }} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-3 bg-white/5 rounded-xl mb-4 space-y-2">
              {[
                { label: 'User', value: selectedWd.userName },
                { label: 'Amount', value: formatCurrency(selectedWd.amount), className: 'text-red-400 font-bold' },
                { label: 'UPI/Bank', value: selectedWd.upiId || selectedWd.bankAccount || 'N/A' },
                selectedWd.ifscCode ? { label: 'IFSC', value: selectedWd.ifscCode } : null,
                selectedWd.accountName ? { label: 'Name', value: selectedWd.accountName } : null,
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={item.className || 'text-white'}>{item.value}</span>
                </div>
              ))}
            </div>
            <textarea placeholder="Admin note (optional)" value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 resize-none mb-4" />
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
              <p className="text-blue-400 text-xs">⚠️ Make sure you've sent the money before approving. Rejecting will refund the amount to user's wallet.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleApprove(selectedWd)} disabled={!!actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                {actionLoading ? '...' : '✅ Mark Sent'}
              </button>
              <button onClick={() => handleReject(selectedWd)} disabled={!!actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                {actionLoading ? '...' : '❌ Reject & Refund'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
