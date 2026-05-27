import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import { MOCK_ADMIN_SETTINGS, MOCK_LEADERBOARD } from '../../utils/mockData';
import toast from 'react-hot-toast';
import { Copy, Share2, Users, Gift, Trophy, TrendingUp, CheckCircle } from 'lucide-react';

export const ReferralPage = () => {
  const { userProfile } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = userProfile?.referralCode || 'DEMO123';
  const referralLink = `${import.meta.env.VITE_APP_URL || 'https://game-xpro-pi.vercel.app'}/signup?ref=${referralCode}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join RoyalWin - Win Real Cash!',
        text: `Use my referral code ${referralCode} and get ₹${MOCK_ADMIN_SETTINGS.refereeBonus} bonus! Join India's best gaming platform.`,
        url: referralLink,
      });
    } else {
      handleCopy(referralLink);
    }
  };

  const stats = [
    { label: 'Total Referrals', value: '8', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { label: 'Total Earned', value: `₹${userProfile?.referralEarnings || 150}`, icon: Gift, color: 'text-green-400', bg: 'bg-green-500/20' },
    { label: 'Active Referrals', value: '5', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    { label: 'Pending Reward', value: '₹100', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  ];

  const myReferrals = [
    { username: 'PriyaGamer', joinDate: '2024-12-18', status: 'active', earned: 100 },
    { username: 'AmitPro', joinDate: '2024-12-15', status: 'active', earned: 100 },
    { username: 'SunitaDevi', joinDate: '2024-12-10', status: 'inactive', earned: 100 },
    { username: 'RohanK', joinDate: '2024-12-05', status: 'active', earned: 100 },
    { username: 'KiranB', joinDate: '2024-11-28', status: 'active', earned: 100 },
  ];

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-500/20"
      >
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">🎁</div>
        <h1 className="text-2xl font-bold font-sora text-white">Refer & Earn</h1>
        <p className="text-white/50 text-sm mt-1">Invite friends and earn ₹{MOCK_ADMIN_SETTINGS.referralBonus} per referral!</p>
      </motion.div>

      {/* How it Works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: '1', emoji: '📤', title: 'Share Code', desc: 'Share your unique referral code' },
          { step: '2', emoji: '👥', title: 'Friend Joins', desc: 'Friend signs up & verifies' },
          { step: '3', emoji: '💰', title: 'Earn Reward', desc: `Both get ₹${MOCK_ADMIN_SETTINGS.referralBonus} bonus!` },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-4 border border-white/8 text-center">
            <div className="text-3xl mb-2">{item.emoji}</div>
            <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">{item.step}</div>
            <p className="text-xs font-semibold text-white">{item.title}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/5"
      >
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Your Referral Code</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center justify-center py-4 rounded-2xl bg-black/30 border border-purple-500/30">
            <span className="text-3xl font-bold font-mono tracking-widest text-purple-400">{referralCode}</span>
          </div>
          <button
            onClick={() => handleCopy(referralCode)}
            className={`p-4 rounded-xl transition-all ${copied ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}
          >
            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <GlowButton fullWidth variant="ghost" onClick={() => handleCopy(referralLink)}>
            <Copy className="w-4 h-4" /> Copy Link
          </GlowButton>
          <GlowButton fullWidth onClick={handleShare}>
            <Share2 className="w-4 h-4" /> Share Now
          </GlowButton>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 text-center">
          🎁 You earn <strong>₹{MOCK_ADMIN_SETTINGS.referralBonus}</strong> • Friend gets <strong>₹{MOCK_ADMIN_SETTINGS.refereeBonus}</strong> bonus!
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
            className="glass rounded-2xl p-4 border border-white/8">
            <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-xl font-bold font-sora ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* My Referrals */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-white">My Referrals</h3>
          <span className="text-xs text-white/40">{myReferrals.length} friends</span>
        </div>
        <div className="divide-y divide-white/5">
          {myReferrals.map((ref, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-3 p-4 hover:bg-white/2 transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                {ref.username[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{ref.username}</p>
                <p className="text-xs text-white/40">Joined {new Date(ref.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ref.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                  {ref.status}
                </span>
                <span className="text-sm font-bold text-green-400">+₹{ref.earned}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Referral Leaderboard */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Top Referrers
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {MOCK_LEADERBOARD.slice(0, 5).map((player, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-gray-400 text-black' : 'bg-white/10 text-white'}`}>
                {i + 1}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                {player.username[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{player.username}</p>
              </div>
              <span className="text-xs text-green-400 font-semibold">{(player.rank * 2 + 10)} referrals</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
