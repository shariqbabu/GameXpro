import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';

import {
  Gift,
  Zap,
  Star,
  Clock,
  CheckCircle,
  Trophy,
} from 'lucide-react';

import {
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  setDoc,
  getDoc,
} from 'firebase/firestore';

import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const dailyRewards = [
  { day: 1, reward: 5 },
  { day: 2, reward: 10 },
  { day: 3, reward: 15 },
  { day: 4, reward: 20 },
  { day: 5, reward: 30 },
  { day: 6, reward: 50 },
  { day: 7, reward: 100 },
];

const spinRewards = [5, 10, 20, 50, 100, 0, 15, 0];

export const RewardsPage = () => {
  const { currentUser } = useAuth();

  const [spinning, setSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(2);
  const [dailyRewardClaimed, setDailyRewardClaimed] =
    useState(false);

  // CHECK DAILY CLAIM
  useEffect(() => {
    const checkReward = async () => {
      if (!currentUser?.uid) return;

      try {
        const rewardRef = doc(
          db,
          'dailyRewards',
          currentUser.uid
        );

        const rewardDoc = await getDoc(rewardRef);

        const today = new Date().toDateString();

        if (
          rewardDoc.exists() &&
          rewardDoc.data()?.lastClaimDate === today
        ) {
          setDailyRewardClaimed(true);
        }

      } catch (error) {
        console.error(error);
      }
    };

    checkReward();
  }, [currentUser]);

  // DAILY REWARD
  const claimDailyReward = async () => {
    if (!currentUser?.uid) {
      return toast.error('Login required');
    }

    try {
      const rewardRef = doc(
        db,
        'dailyRewards',
        currentUser.uid
      );

      const rewardDoc = await getDoc(rewardRef);

      const today = new Date().toDateString();

      if (
        rewardDoc.exists() &&
        rewardDoc.data()?.lastClaimDate === today
      ) {
        return toast.error(
          'Reward already claimed today'
        );
      }

      const rewardAmount = 20;

      await updateDoc(
        doc(db, 'users', currentUser.uid),
        {
          walletBalance: increment(rewardAmount),
          bonusBalance: increment(rewardAmount),
        }
      );

      await setDoc(
        rewardRef,
        {
          lastClaimDate: today,
          claimedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await setDoc(
        doc(
          db,
          'transactions',
          `${currentUser.uid}_${Date.now()}`
        ),
        {
          userId: currentUser.uid,
          type: 'daily_reward',
          amount: rewardAmount,
          status: 'completed',
          createdAt: serverTimestamp(),
        }
      );

      setDailyRewardClaimed(true);

      toast.success(
        `🎁 ₹${rewardAmount} added to wallet!`
      );

    } catch (error) {
      console.error(error);
      toast.error('Failed to claim reward');
    }
  };

  // SPIN WHEEL
  const handleSpin = async () => {
    if (!currentUser?.uid) {
      return toast.error('Login required');
    }

    if (spinning || spinsLeft <= 0) return;

    try {
      setSpinning(true);

      const resultIndex = Math.floor(
        Math.random() * spinRewards.length
      );

      const reward = spinRewards[resultIndex];

      const extraSpins = 5 * 360;

      const segAngle =
        360 / spinRewards.length;

      const finalDeg =
        spinDeg +
        extraSpins +
        resultIndex * segAngle;

      setSpinDeg(finalDeg);

      setTimeout(async () => {
        try {
          if (reward > 0) {
            await updateDoc(
              doc(db, 'users', currentUser.uid),
              {
                walletBalance: increment(reward),
                bonusBalance: increment(reward),
              }
            );

            await setDoc(
              doc(
                db,
                'transactions',
                `${currentUser.uid}_${Date.now()}`
              ),
              {
                userId: currentUser.uid,
                type: 'spin_reward',
                amount: reward,
                status: 'completed',
                createdAt: serverTimestamp(),
              }
            );
          }

          setSpinResult(reward);

          setSpinsLeft((prev) => prev - 1);

          if (reward > 0) {
            toast.success(
              `🎉 You won ₹${reward}!`
            );
          } else {
            toast.error(
              '😅 Better luck next time!'
            );
          }

        } catch (error) {
          console.error(error);
          toast.error('Spin failed');

        } finally {
          setSpinning(false);
        }
      }, 3000);

    } catch (error) {
      console.error(error);

      setSpinning(false);
    }
  };

  return (
    <div className="space-y-6 pb-4 max-w-2xl mx-auto">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/20 border border-yellow-500/20"
      >
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">
          🎁
        </div>

        <h1 className="text-2xl font-bold font-sora text-white">
          Daily Rewards
        </h1>

        <p className="text-white/50 text-sm mt-1">
          Claim rewards and spin daily
        </p>
      </motion.div>

      {/* DAILY REWARDS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 border border-white/8"
      >
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          Daily Login Streak
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {dailyRewards.map((day) => (
            <div
              key={day.day}
              className={`text-center p-2 rounded-xl border ${
                day.day <= 3
                  ? 'bg-green-500/20 border-green-500/30'
                  : day.day === 4
                  ? 'bg-purple-500/20 border-purple-500/40'
                  : 'bg-white/5 border-white/10 opacity-60'
              }`}
            >
              <p className="text-[10px] text-white/40 mb-1">
                Day {day.day}
              </p>

              <div className="text-sm mb-1">
                {day.day <= 3
                  ? '✅'
                  : day.day === 4
                  ? '🎁'
                  : '🔒'}
              </div>

              <p className="text-[10px] font-bold text-white">
                ₹{day.reward}
              </p>
            </div>
          ))}
        </div>

        {!dailyRewardClaimed ? (
          <div className="mt-4">
            <GlowButton
              fullWidth
              onClick={claimDailyReward}
              variant="gold"
            >
              <Gift className="w-4 h-4" />
              Claim Today's Reward
            </GlowButton>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Today's reward claimed
          </div>
        )}
      </motion.div>

      {/* SPIN WHEEL */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 border border-purple-500/20 text-center"
      >
        <h3 className="font-semibold text-white mb-2 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          Spin & Win
        </h3>

        <p className="text-xs text-white/40 mb-5">
          {spinsLeft} spin
          {spinsLeft !== 1 ? 's' : ''} left
        </p>

        <div className="relative w-64 h-64 mx-auto mb-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10 text-3xl">
            ▼
          </div>

          <motion.div
            className="w-full h-full rounded-full border-4 border-purple-500/50 shadow-2xl shadow-purple-500/30 bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center"
            animate={{ rotate: spinDeg }}
            transition={{
              duration: 3,
              ease: 'easeOut',
            }}
          >
            <div className="grid grid-cols-2 gap-3 text-white text-sm font-bold">
              {spinRewards.map((r, i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-full bg-black/20 flex items-center justify-center"
                >
                  ₹{r}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {spinResult !== null && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`mb-4 p-3 rounded-xl font-bold ${
              spinResult > 0
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {spinResult > 0
              ? `🎉 You won ₹${spinResult}!`
              : '😅 Better luck next time!'}
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
            <>
              <div className="spin-loader w-4 h-4" />
              Spinning...
            </>
          ) : spinsLeft <= 0 ? (
            <>
              <Clock className="w-4 h-4" />
              No spins left
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Spin Now
            </>
          )}
        </GlowButton>
      </motion.div>

      {/* DAILY TASKS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Daily Tasks
          </h3>
        </div>

        <div className="divide-y divide-white/5">
          {[
            {
              task: 'Play 3 Color Prediction rounds',
              reward: '₹15',
              progress: 3,
              total: 3,
              done: true,
            },
            {
              task: 'Win 1 Ludo match',
              reward: '₹25',
              progress: 0,
              total: 1,
              done: false,
            },
            {
              task: 'Deposit ₹100+',
              reward: '₹10',
              progress: 1,
              total: 1,
              done: true,
            },
            {
              task: 'Invite 1 friend',
              reward: '₹50',
              progress: 0,
              total: 1,
              done: false,
            },
          ].map((task, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p
                  className={`text-sm font-medium ${
                    task.done
                      ? 'text-white/50 line-through'
                      : 'text-white'
                  }`}
                >
                  {task.task}
                </p>

                <div className="flex items-center gap-2">
                  {task.done && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}

                  <span className="text-xs font-bold text-green-400">
                    {task.reward}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      task.done
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-purple-500 to-cyan-500'
                    }`}
                    style={{
                      width: `${
                        (task.progress /
                          task.total) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <span className="text-[10px] text-white/30">
                  {task.progress}/{task.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
