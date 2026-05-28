// ============================================================
// WITHDRAW PAGE
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpFromLine, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWallet } from '../hooks/useWallet';
import { createWithdrawal } from '../services/walletService';
import { formatCurrency } from '../utils/wallet';
import toast from 'react-hot-toast';

export function WithdrawPage() {
  const { user } = useAuthStore();
  const { wallet } = useWallet();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt)) newErrors.amount = 'Amount is required';
    else if (amt < 100) newErrors.amount = 'Minimum withdrawal is ₹100';
    else if (amt > (wallet?.winningBalance || 0)) newErrors.amount = 'Insufficient winning balance';
    if (!upiId) newErrors.upiId = 'UPI ID is required';
    else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(upiId)) newErrors.upiId = 'Invalid UPI ID format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user?.uid) return;

    setIsSubmitting(true);
    try {
      const success = await createWithdrawal(user.uid, parseFloat(amount), upiId);
      if (success) {
        setSuccess(true);
        setAmount('');
        setUpiId('');
        toast.success('Withdrawal request submitted!');
      } else {
        toast.error('Insufficient winning balance');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Withdrawal failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Withdrawal Requested!</h2>
          <p className="text-slate-400 mb-6">Your withdrawal request is being processed. Funds will be credited within 24 hours.</p>
          <button onClick={() => setSuccess(false)} className="btn-primary px-8 py-3 rounded-xl font-semibold text-white">
            Make Another Request
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowUpFromLine className="w-6 h-6 text-red-400" /> Withdraw Funds
        </h1>
        <p className="text-slate-400 text-sm mt-1">Withdraw your winnings to UPI</p>
      </motion.div>

      {/* Balance Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
        <p className="text-slate-400 text-sm mb-1">Available Winning Balance</p>
        <p className="text-2xl font-bold text-green-400">{formatCurrency(wallet?.winningBalance || 0)}</p>
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400">
            <p className="text-yellow-400 font-medium mb-0.5">Withdrawal Rules:</p>
            <p>• Only winning balance is withdrawable</p>
            <p>• Deposit & bonus balance cannot be withdrawn</p>
            <p>• Minimum withdrawal: ₹100</p>
          </div>
        </div>
      </motion.div>

      {/* Withdraw Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Withdrawal Details</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter withdrawal amount (min ₹100)"
              className="input-casino"
            />
            {errors.amount && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.amount}</p>}
          </div>

          {/* Quick Amounts */}
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(Math.min(amt, wallet?.winningBalance || 0).toString())}
                disabled={(wallet?.winningBalance || 0) < amt}
                className="px-3 py-1.5 rounded-lg text-sm glass-card-light text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount((wallet?.winningBalance || 0).toString())}
              disabled={(wallet?.winningBalance || 0) < 100}
              className="px-3 py-1.5 rounded-lg text-sm bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-30"
            >
              Max
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="input-casino"
            />
            {errors.upiId && <p className="text-red-400 text-xs mt-1">{errors.upiId}</p>}
            <p className="text-slate-500 text-xs mt-1">Example: name@paytm, phone@gpay, name@ybl</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (wallet?.winningBalance || 0) < 100}
            className="btn-primary w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : 'Submit Withdrawal Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
