import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';
import { Gift, Zap, Star, Clock, CheckCircle, Trophy } from 'lucide-react';

const dailyRewards = [
  { day: 1, reward: '₹5', claimed: true },
  { day: 2, reward: '₹10', claimed: true },
  { day: 3, reward: '₹15', claimed: true },
  { day: 4, reward: '₹20', claimed: false, isCurrent: true },
  { day: 5, reward: '₹30', claimed: false },
  { day: 6, reward: '₹50', claimed: false },
  { day: 7, reward: '₹100', claimed: false, isSpecial: true },
];

const spinRewards = ['₹5', '₹10', '₹20', '₹50', '₹100', '₹0', '₹15', '₹0'];

export const RewardsPage = () => {
  const [spinning, setSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(2);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  const handleSpin = () => {
    if (spinning || spinsLeft <= 0) return;
    setSpinning(true);
    setSpinResult(null);
    const extraSpins = 5 * 360;
    const resultIndex = Math.floor(Math.random() * spinRewards.length);
    const segAngle = 360 / spinRewards.length;
    const finalDeg = spinDeg + extraSpins + (resultIndex * segAngle);
    setSpinDeg(finalDeg);

    setTimeout(() => {
      setSpinning(false);
      setSpinResult(spinRewards[resultIndex]);
      setSpinsLeft(prev => prev - 1);
      if (spinRewards[resultIndex] !== '₹0') {
        toast.success(`🎉 You won ${spinRewards[resultIndex]}!`);
      } else {
        toast.error('Better luck next time!');
      }
    }, 3000);
  };

  const claimDailyReward = () => {
    setDailyRewardClaimed(true);
    toast.success('Daily reward claimed! ₹20 added to your wallet! 🎁');
  };

  return (
    <div className="space-y-6 pb-4 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/20 border border-yellow-500/20"
      >
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">🎁</div>
        <h1 className="text-2xl font-bold font-sora text-white">Daily Rewards</h1>
        <p className="text-white/50 text-sm mt-1">Claim your daily bonuses and spin to win!</p>
      </motion.div>

      {/* Daily Login Streak */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 border border-white/8"
      >
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Daily Login Streak
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {dailyRewards.map((day) => (
            <div
              key={day.day}
              className={`text-center p-2 rounded-xl border transition-all ${
                day.claimed ? 'bg-green-500/20 border-green-500/30' :
                day.isCurrent ? 'bg-purple-500/20 border-purple-500/40 ring-2 ring-purple-500/50' :
                'bg-white/5 border-white/10 opacity-50'
              }`}
            >
              <p className="text-[10px] text-white/40 mb-1">Day {day.day}</p>
              <div className="text-sm mb-1">{day.claimed ? '✅' : day.isCurrent ? '🎁' : day.isSpecial ? '🌟' : '🔒'}</div>
              <p className={`text-[10px] font-bold ${day.isSpecial ? 'text-yellow-400' : 'text-white'}`}>{day.reward}</p>
            </div>
          ))}
        </div>
        {!dailyRewardClaimed && (
          <div className="mt-4">
            <GlowButton fullWidth onClick={claimDailyReward} variant="gold">
              <Gift className="w-4 h-4" /> Claim Today's Reward — ₹20
            </GlowButton>
          </div>
        )}
        {dailyRewardClaimed && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" /> Today's reward claimed!
          </div>
        )}
      </motion.div>

      {/* Spin Wheel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 border border-purple-500/20 text-center"
      >
        <h3 className="font-semibold text-white mb-2 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" /> Spin & Win!
        </h3>
        <p className="text-xs text-white/40 mb-5">{spinsLeft} spin{spinsLeft !== 1 ? 's' : ''} remaining today</p>

        {/* Wheel */}
        <div className="relative w-64 h-64 mx-auto mb-6">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10 text-3xl">▼</div>

          <motion.div
            className="w-full h-full rounded-full border-4 border-purple-500/50 shadow-2xl shadow-purple-500/30 relative overflow-hidden"
            animate={{ rotate: spinDeg }}
            transition={{ duration: 3, ease: 'easeOut' }}
          >
            {spinRewards.map((reward, i) => {
              const angle = (360 / spinRewards.length) * i;
              return (
                <div
                  key={i}
                  className="absolute inset-0 flex items-start justify-center pt-6"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <div
                    className="text-xs font-bold text-white"
                    style={{ transform: `rotate(${360 / spinRewards.length / 2}deg)` }}
                  >
                    {reward}
                  </div>
                </div>
              );
            })}
            {/* Segments */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {spinRewards.map((_, i) => {
                const angle = (360 / spinRewards.length) * i;
                const colors = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#059669'];
                return (
                  <path
                    key={i}
                    d={`M 50 50 L ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)} ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)} A 50 50 0 0 1 ${50 + 50 * Math.cos((angle - 90 + 360 / spinRewards.length) * Math.PI / 180)} ${50 + 50 * Math.sin((angle - 90 + 360 / spinRewards.length) * Math.PI / 180)} Z`}
                    fill={colors[i % colors.length]}
                    opacity="0.8"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="0.5"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#0d0d1a] border-2 border-purple-500 flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {spinResult && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`mb-4 p-3 rounded-xl font-bold ${spinResult !== '₹0' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
          >
            {spinResult !== '₹0' ? `🎉 You won ${spinResult}!` : '😅 Better luck next time!'}
          </motion.div>
        )}

        <GlowButton
          fullWidth
          onClick={handleSpin}
          disabled={spinning || spinsLeft <= 0}
          size="lg"
          variant="purple"
        >
          {spinning ? (
            <><div className="spin-loader w-4 h-4" /> Spinning...</>
          ) : spinsLeft <= 0 ? (
            <><Clock className="w-4 h-4" /> No spins left today</>
          ) : (
            <><Zap className="w-4 h-4" /> Spin Now!</>
          )}
        </GlowButton>
      </motion.div>

      {/* Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Daily Tasks
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { task: 'Play 3 Color Prediction rounds', reward: '₹15', progress: 3, total: 3, done: true },
            { task: 'Win 1 Ludo match', reward: '₹25', progress: 0, total: 1, done: false },
            { task: 'Make a deposit of ₹100+', reward: '₹10', progress: 1, total: 1, done: true },
            { task: 'Invite 1 friend', reward: '₹50', progress: 0, total: 1, done: false },
          ].map((task, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className={`text-sm font-medium ${task.done ? 'text-white/50 line-through' : 'text-white'}`}>{task.task}</p>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {task.done && <CheckCircle className="w-4 h-4 text-green-400" />}
                  <span className="text-xs font-bold text-green-400">{task.reward}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${task.done ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-cyan-500'}`}
                    style={{ width: `${(task.progress / task.total) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30 flex-shrink-0">{task.progress}/{task.total}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
