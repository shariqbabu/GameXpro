import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOCK_WITHDRAWALS } from '../../utils/mockData';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';
import type { WithdrawalRequest } from '../../types';
import { CheckCircle, XCircle, Clock, Search, ArrowUpCircle } from 'lucide-react';

export const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(MOCK_WITHDRAWALS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filtered = withdrawals.filter(w => {
    const matchSearch = w.username.toLowerCase().includes(search.toLowerCase()) ||
      w.upiId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approve = (id: string) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved', updatedAt: new Date().toISOString(), adminNote: 'Payment sent' } : w));
    toast.success('Withdrawal approved! Payment sent. ✅');
  };

  const reject = (id: string) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected', updatedAt: new Date().toISOString(), adminNote: 'Rejected by admin' } : w));
    toast.error('Withdrawal rejected.');
  };

  const pending = withdrawals.filter(w => w.status === 'pending');
  const totalPending = pending.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-orange-400" /> Withdrawal Requests
          </h1>
          <p className="text-white/40 text-sm mt-1">₹{totalPending.toLocaleString()} pending payout</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-lg font-bold text-yellow-400">{pending.length}</p>
            <p className="text-xs text-white/40">Pending</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
            <p className="text-lg font-bold text-orange-400">₹{totalPending.toLocaleString()}</p>
            <p className="text-xs text-white/40">Amount</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or UPI ID..."
            className="input-gaming w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-purple-500/30 border border-purple-500/50 text-purple-400' : 'bg-white/5 border border-white/10 text-white/50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((wd, i) => (
          <motion.div
            key={wd.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass rounded-2xl p-5 border transition-all ${wd.status === 'pending' ? 'border-yellow-500/20 bg-yellow-500/3' : wd.status === 'approved' ? 'border-green-500/15' : 'border-red-500/15'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-xl font-bold text-orange-400">
                  {wd.username[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{wd.username}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wd.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      wd.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{wd.status.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{wd.email}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="text-xs text-white/50">
                      UPI: <span className="text-white font-mono">{wd.upiId}</span>
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(wd.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {wd.adminNote && (
                    <p className="text-xs text-white/40 mt-1 italic">Note: {wd.adminNote}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <p className="text-2xl font-bold text-orange-400">₹{wd.amount}</p>
                {wd.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <GlowButton size="sm" variant="green" onClick={() => approve(wd.id)}>
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </GlowButton>
                    <GlowButton size="sm" variant="red" onClick={() => reject(wd.id)}>
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </GlowButton>
                  </div>
                ) : (
                  <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${wd.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {wd.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {wd.status === 'approved' ? 'Payment Sent' : 'Rejected'}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 glass rounded-2xl border border-white/8">
            <Clock className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No withdrawals found</p>
          </div>
        )}
      </div>
    </div>
  );
};
