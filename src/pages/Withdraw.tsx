import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminSettings } from '../services/userService';
import { submitWithdrawal } from '../services/walletService';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import type { AdminSettings } from '../types';

const Withdraw: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAdminSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    const amt = Number(amount);
    const minWd = settings?.minWithdrawal || 100;
    const maxWd = settings?.maxWithdrawal || 10000;
    
    if (!amt || amt < minWd) { toast.error(`Minimum withdrawal is ₹${minWd}`); return; }
    if (amt > maxWd) { toast.error(`Maximum withdrawal is ₹${maxWd}`); return; }
    if (amt > (userProfile.walletBalance || 0)) { toast.error('Insufficient balance'); return; }
    if (payMethod === 'upi' && !upiId.trim()) { toast.error('UPI ID is required'); return; }
    if (payMethod === 'bank' && (!bankAccount.trim() || !ifscCode.trim() || !accountName.trim())) { toast.error('All bank details are required'); return; }

    setSubmitting(true);
    try {
      const paymentDetails = payMethod === 'upi'
        ? { upiId }
        : { bankAccount, ifscCode, accountName };

      await submitWithdrawal(userProfile.uid, userProfile.displayName, userProfile.email, amt, paymentDetails);
      toast.success('Withdrawal request submitted! 🎉');
      navigate('/wallet');
    } catch (err) {
      toast.error('Submission failed. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-gray-400">←</button>
        <div>
          <h1 className="text-2xl font-bold text-white">🏧 Withdraw Money</h1>
          <p className="text-gray-400 text-sm">Withdraw your winnings to your account</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">💰 Available Balance</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Balance', value: userProfile?.walletBalance || 0, color: 'text-white' },
                { label: 'Winning Amount', value: userProfile?.winningAmount || 0, color: 'text-green-400' },
                { label: 'Bonus Amount', value: userProfile?.bonusAmount || 0, color: 'text-yellow-400' },
                { label: 'Deposit Amount', value: userProfile?.depositAmount || 0, color: 'text-blue-400' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className={`font-orbitron font-bold ${item.color}`}>{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">ℹ️ Withdrawal Info</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Min Withdrawal', value: `₹${settings?.minWithdrawal || 100}` },
                { label: 'Max Withdrawal', value: `₹${settings?.maxWithdrawal || 10000}` },
                { label: 'Processing Time', value: '1-24 hours' },
                { label: 'Admin Approval', value: 'Required' },
              ].map((info) => (
                <div key={info.label} className="flex justify-between">
                  <span className="text-gray-400">{info.label}</span>
                  <span className="text-white">{info.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Withdrawal Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">💸 Withdrawal Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Min ₹${settings?.minWithdrawal || 100}`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500/50 transition-all"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {quickAmounts.map(a => (
                  <button key={a} type="button" onClick={() => setAmount(String(a))}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${Number(amount) === a ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    ₹{a}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Payment Method</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('upi')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${payMethod === 'upi' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  📱 UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('bank')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${payMethod === 'bank' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  🏦 Bank Transfer
                </button>
              </div>
            </div>

            {payMethod === 'upi' ? (
              <div>
                <label className="text-gray-400 text-sm mb-2 block">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Account Holder Name</label>
                  <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Account Number</label>
                  <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="Account Number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">IFSC Code</label>
                  <input type="text" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} placeholder="IFSC Code"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all" />
                </div>
              </div>
            )}

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-400 text-xs">⚠️ Withdrawal requests are processed within 1-24 hours after admin approval.</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg transition-all hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
            >
              {submitting ? '⏳ Submitting...' : '🏧 Submit Withdrawal Request'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Withdraw;
