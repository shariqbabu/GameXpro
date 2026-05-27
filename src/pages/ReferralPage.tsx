// ============================================================
// REFERRAL PAGE
// ============================================================

import { motion } from 'framer-motion';
import { Users, Copy, Gift, TrendingUp, Share2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useReferral } from '../hooks/useReferral';
import { formatCurrency } from '../utils/wallet';
import toast from 'react-hot-toast';

export function ReferralPage() {
  const { user } = useAuthStore();
  const { referral, isLoading } = useReferral();

  const referralLink = `${window.location.origin}/signup?ref=${referral?.code || ''}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referral?.code || '');
    toast.success('Referral code copied!');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const shareWhatsApp = () => {
    const msg = `Join RoyalBet Casino - Premium Gaming Platform! Use my referral code ${referral?.code} and get ₹50 bonus! Sign up: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" /> Referral Program
        </h1>
        <p className="text-slate-400 text-sm mt-1">Invite friends and earn rewards together</p>
      </motion.div>

      {/* How it Works */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share Code', desc: 'Share your unique referral code with friends', icon: '📤' },
            { step: '2', title: 'Friend Signs Up', desc: 'Your friend registers using your code', icon: '👤' },
            { step: '3', title: 'Both Earn', desc: 'You get ₹100, your friend gets ₹50 bonus!', icon: '🎁' },
          ].map(({ step, title, desc, icon }) => (
            <div key={step} className="text-center p-4 glass-card-light rounded-xl">
              <span className="text-2xl mb-2 block">{icon}</span>
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                {step}
              </div>
              <p className="text-white font-medium text-sm">{title}</p>
              <p className="text-slate-400 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
          <Users className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-blue-400">
            {isLoading ? <span className="skeleton inline-block h-7 w-8" /> : referral?.totalReferrals || 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total Referrals</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
          <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-green-400">
            {isLoading ? <span className="skeleton inline-block h-7 w-16" /> : formatCurrency(referral?.totalEarned || 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total Earned</p>
        </motion.div>
      </div>

      {/* Referral Code */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-400" /> Your Referral Code
        </h2>

        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            {isLoading ? (
              <div className="skeleton h-8 w-32" />
            ) : (
              <p className="text-yellow-400 font-casino text-2xl font-bold tracking-widest">
                {referral?.code || user?.referralCode || 'Loading...'}
              </p>
            )}
            <p className="text-slate-500 text-xs mt-1">Your unique referral code</p>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30 transition-all text-sm font-medium"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
        </div>

        {/* Referral Link */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Referral Link</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralLink}
              className="input-casino flex-1 text-xs text-slate-400"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-all text-sm"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Share Options */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-slate-400 text-sm mb-3 flex items-center gap-1"><Share2 className="w-4 h-4" /> Share via:</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-sm font-medium"
            >
              📱 WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card-light text-slate-300 hover:text-white transition-all text-sm font-medium"
            >
              🔗 Copy Link
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reward Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
        <h3 className="text-white font-semibold mb-3">Reward Details</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">You earn per referral:</span>
            <span className="text-green-400 font-bold">₹100</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Your friend gets:</span>
            <span className="text-blue-400 font-bold">₹50</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Credited to:</span>
            <span className="text-purple-400">Bonus Balance</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
