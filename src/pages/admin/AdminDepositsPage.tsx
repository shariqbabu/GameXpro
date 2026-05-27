import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOCK_DEPOSITS } from '../../utils/mockData';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';
import type { DepositRequest } from '../../types';
import { CheckCircle, XCircle, Clock, Search, ArrowDownCircle, Eye } from 'lucide-react';

export const AdminDepositsPage = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>(MOCK_DEPOSITS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewScreenshot, setViewScreenshot] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const filtered = deposits.filter(d => {
    const matchSearch = d.username.toLowerCase().includes(search.toLowerCase()) ||
      d.utrId.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approve = (id: string) => {
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'approved', updatedAt: new Date().toISOString(), adminNote: 'Verified' } : d));
    toast.success('Deposit approved! Wallet updated. ✅');
  };

  const reject = (id: string) => {
    setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected', updatedAt: new Date().toISOString(), adminNote: adminNote || 'Payment not verified' } : d));
    toast.error('Deposit rejected.');
    setAdminNote('');
  };

  const pending = deposits.filter(d => d.status === 'pending');
  const approved = deposits.filter(d => d.status === 'approved');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
            <ArrowDownCircle className="w-6 h-6 text-green-400" /> Deposit Requests
          </h1>
          <p className="text-white/40 text-sm mt-1">{pending.length} pending approval</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-lg font-bold text-yellow-400">{pending.length}</p>
            <p className="text-xs text-white/40">Pending</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-lg font-bold text-green-400">{approved.length}</p>
            <p className="text-xs text-white/40">Approved</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username, UTR, or email..." className="input-gaming w-full pl-10 pr-4 py-3 rounded-xl text-sm" />
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

      {/* Screenshot Modal */}
      {viewScreenshot && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewScreenshot(null)}>
          <div className="bg-[#13131f] rounded-2xl p-4 max-w-lg w-full border border-white/10">
            <div className="bg-white/5 rounded-xl p-8 text-center text-white/30">
              <p>Screenshot not available in demo</p>
            </div>
          </div>
        </div>
      )}

      {/* Deposits List */}
      <div className="space-y-3">
        {filtered.map((dep, i) => (
          <motion.div
            key={dep.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass rounded-2xl p-5 border transition-all ${dep.status === 'pending' ? 'border-yellow-500/20 bg-yellow-500/3' : dep.status === 'approved' ? 'border-green-500/15' : 'border-red-500/15'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-xl font-bold text-green-400">
                  {dep.username[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{dep.username}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dep.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      dep.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {dep.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{dep.email}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="text-xs text-white/50">
                      UTR: <span className="text-white font-mono">{dep.utrId}</span>
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(dep.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {dep.adminNote && (
                    <p className="text-xs text-white/40 mt-1 italic">Note: {dep.adminNote}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <p className="text-2xl font-bold text-green-400">₹{dep.amount}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewScreenshot(dep.id)}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-2 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 transition-all">
                    <Eye className="w-3.5 h-3.5" /> Screenshot
                  </button>
                  {dep.status === 'pending' && (
                    <>
                      <GlowButton size="sm" variant="green" onClick={() => approve(dep.id)}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </GlowButton>
                      <GlowButton size="sm" variant="red" onClick={() => reject(dep.id)}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </GlowButton>
                    </>
                  )}
                  {dep.status !== 'pending' && (
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${dep.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {dep.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {dep.status === 'approved' ? 'Approved' : 'Rejected'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 glass rounded-2xl border border-white/8">
            <Clock className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No deposits found</p>
          </div>
        )}
      </div>
    </div>
  );
};
