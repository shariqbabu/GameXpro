import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';

import {
  Clock,
  TrendingUp,
  Users,
  Zap,
  ChevronLeft,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import {
  doc,
  updateDoc,
  increment,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

import { db } from '../../firebase/config';

type ColorChoice = 'red' | 'green' | 'violet';

interface BetHistory {
  round: number;
  color: ColorChoice;
  amount: number;
  result: ColorChoice;
  won: boolean;
  payout: number;
}

const MULTIPLIERS = {
  red: 2,
  green: 2,
  violet: 4.5,
};

const ROUND_DURATION = 30;

const colorConfig = {
  red: {
    bg: 'bg-red-500',
    glow: 'shadow-red-500/40',
    border: 'border-red-500/50',
    text: 'text-red-400',
    label: 'Red',
    emoji: '🔴',
    multiplier: '2x',
  },

  green: {
    bg: 'bg-green-500',
    glow: 'shadow-green-500/40',
    border: 'border-green-500/50',
    text: 'text-green-400',
    label: 'Green',
    emoji: '🟢',
    multiplier: '2x',
  },

  violet: {
    bg: 'bg-violet-500',
    glow: 'shadow-violet-500/40',
    border: 'border-violet-500/50',
    text: 'text-violet-400',
    label: 'Violet',
    emoji: '🟣',
    multiplier: '4.5x',
  },
};

export const ColorPredictionGame = () => {
  const navigate = useNavigate();

  const { userProfile, currentUser } =
    useAuth();

  const [timer, setTimer] =
    useState(ROUND_DURATION);

  const [roundNumber, setRoundNumber] =
    useState(101);

  const [phase, setPhase] = useState<
    'betting' | 'waiting' | 'result'
  >('betting');

  const [selectedColor, setSelectedColor] =
    useState<ColorChoice | null>(null);

  const [betAmount, setBetAmount] =
    useState(10);

  const [result, setResult] =
    useState<ColorChoice | null>(null);

  const balance =
    userProfile?.walletBalance ?? 0;

  const [betHistory, setBetHistory] =
    useState<BetHistory[]>([]);

  const [roundHistory, setRoundHistory] =
    useState<any[]>([]);

  const [currentBet, setCurrentBet] =
    useState<{
      color: ColorChoice;
      amount: number;
    } | null>(null);

  const [showWinAnim, setShowWinAnim] =
    useState(false);

  const [liveUsers, setLiveUsers] =
    useState(12481);

  const timerRef =
    useRef<NodeJS.Timeout | null>(null);

  // LIVE USERS
  useEffect(() => {
    const userInterval = setInterval(() => {
      setLiveUsers(
        (prev) =>
          prev +
          Math.floor(Math.random() * 10) -
          5
      );
    }, 2000);

    return () =>
      clearInterval(userInterval);
  }, []);

  // REALTIME ROUND HISTORY
  useEffect(() => {
    const q = query(
      collection(db, 'gameRounds'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setRoundHistory(data);
      },
      (error) => {
        console.error(error);
      }
    );

    return () => unsubscribe();
  }, []);

  // TIMER
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleRoundEnd();

          return ROUND_DURATION;
        }

        if (prev === 6) {
          setPhase('waiting');
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ROUND END
  const handleRoundEnd = async () => {
    try {
      const colors: ColorChoice[] = [
        'red',
        'green',
        'violet',
        'red',
        'green',
      ];

      const res =
        colors[
          Math.floor(
            Math.random() * colors.length
          )
        ];

      setResult(res);

      setPhase('result');

      await addDoc(
        collection(db, 'gameRounds'),
        {
          roundNumber,
          result: res,
          totalBets:
            Math.floor(Math.random() * 50) +
            10,
          createdAt: serverTimestamp(),
        }
      );

      if (currentBet && currentUser?.uid) {
        const won =
          currentBet.color === res;

        const payout = won
          ? currentBet.amount *
            MULTIPLIERS[currentBet.color]
          : 0;

        if (won) {
          await updateDoc(
            doc(db, 'users', currentUser.uid),
            {
              walletBalance: increment(
                payout
              ),
            }
          );

          await addDoc(
            collection(db, 'transactions'),
            {
              userId: currentUser.uid,
              type: 'game_win',
              amount: payout,
              status: 'completed',
              game: 'color_prediction',
              createdAt:
                serverTimestamp(),
            }
          );

          setShowWinAnim(true);

          toast.success(
            `🎉 You won ₹${payout.toFixed(
              0
            )}`
          );

          setTimeout(() => {
            setShowWinAnim(false);
          }, 3000);

        } else {
          await addDoc(
            collection(db, 'transactions'),
            {
              userId: currentUser.uid,
              type: 'game_loss',
              amount: -currentBet.amount,
              status: 'completed',
              game: 'color_prediction',
              createdAt:
                serverTimestamp(),
            }
          );

          toast.error(
            `❌ You lost ₹${currentBet.amount}`
          );
        }

        setBetHistory((prev) => [
          {
            round: roundNumber,
            color: currentBet.color,
            amount: currentBet.amount,
            result: res,
            won,
            payout,
          },
          ...prev.slice(0, 9),
        ]);
      }

      setTimeout(() => {
        setRoundNumber(
          (prev) => prev + 1
        );

        setCurrentBet(null);

        setSelectedColor(null);

        setResult(null);

        setPhase('betting');
      }, 3000);

    } catch (error) {
      console.error(error);
    }
  };

  // PLACE BET
  const placeBet = async () => {
    if (!currentUser?.uid) {
      return toast.error(
        'Login required'
      );
    }

    if (!selectedColor) {
      return toast.error(
        'Select a color'
      );
    }

    if (phase !== 'betting') {
      return toast.error(
        'Betting closed'
      );
    }

    if (betAmount > balance) {
      return toast.error(
        'Insufficient balance'
      );
    }

    if (currentBet) {
      return toast.error(
        'Bet already placed'
      );
    }

    try {
      await updateDoc(
        doc(db, 'users', currentUser.uid),
        {
          walletBalance: increment(
            -betAmount
          ),
        }
      );

      await addDoc(collection(db, 'bets'), {
        userId: currentUser.uid,
        roundNumber,
        color: selectedColor,
        amount: betAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setCurrentBet({
        color: selectedColor,
        amount: betAmount,
      });

      toast.success(
        `Bet placed on ${selectedColor}`
      );

    } catch (error: any) {
  console.error('BET ERROR:', error);

  toast.error(error.message || 'Bet failed');
}
  };

  const progressPercent =
    ((ROUND_DURATION - timer) /
      ROUND_DURATION) *
    100;

  return (
    <div className="space-y-5 pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="text-center">
          <h1 className="text-xl font-bold text-white">
            Color Prediction
          </h1>

          <p className="text-xs text-white/40">
            Win Real Rewards
          </p>
        </div>

        <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-xs text-green-400 font-bold">
            ₹{balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* LIVE USERS */}
      <div className="glass rounded-2xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40">
              Live Players
            </p>

            <div className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4 text-cyan-400" />

              <p className="text-lg font-bold text-white">
                {liveUsers.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-white/40">
              Round
            </p>

            <p className="text-lg font-bold text-yellow-400">
              #{roundNumber}
            </p>
          </div>
        </div>
      </div>

      {/* TIMER */}
      <div className="glass rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-white/40">
              Time Left
            </p>

            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-red-400" />

              <p className="text-3xl font-bold text-white">
                {timer}s
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-2 rounded-xl ${
              phase === 'betting'
                ? 'bg-green-500/20 text-green-400'
                : phase === 'waiting'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-purple-500/20 text-purple-400'
            }`}
          >
            {phase.toUpperCase()}
          </div>
        </div>

        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>

      {/* COLORS */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(
          colorConfig
        ) as ColorChoice[]).map((color) => {
          const cfg = colorConfig[color];

          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={color}
              onClick={() =>
                setSelectedColor(color)
              }
              className={`relative overflow-hidden rounded-3xl p-5 border transition-all ${
                selectedColor === color
                  ? `${cfg.border} ${cfg.bg} shadow-2xl ${cfg.glow}`
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="text-4xl mb-3">
                {cfg.emoji}
              </div>

              <p className="text-white font-bold">
                {cfg.label}
              </p>

              <p
                className={`text-sm mt-1 ${cfg.text}`}
              >
                {cfg.multiplier}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* BET */}
      <div className="glass rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-semibold">
            Bet Amount
          </p>

          <p className="text-green-400 font-bold">
            ₹{betAmount}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[10, 50, 100, 500].map((amt) => (
            <button
              key={amt}
              onClick={() => setBetAmount(amt)}
              className={`py-3 rounded-xl font-bold transition-all ${
                betAmount === amt
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        <GlowButton
          fullWidth
          onClick={placeBet}
          disabled={
            phase !== 'betting' ||
            !!currentBet
          }
        >
          <Zap className="w-4 h-4" />
          {currentBet
            ? 'Bet Placed'
            : 'Place Bet'}
        </GlowButton>
      </div>

      {/* RESULT */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
            }}
            className={`rounded-3xl p-6 text-center border ${
              colorConfig[result].border
            } bg-white/5`}
          >
            <p className="text-sm text-white/40 mb-2">
              Winning Color
            </p>

            <div className="text-6xl mb-3">
              {colorConfig[result].emoji}
            </div>

            <p
              className={`text-3xl font-bold ${colorConfig[result].text}`}
            >
              {colorConfig[result].label}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORY */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-semibold">
            Recent Results
          </h3>
        </div>

        <div className="p-4 flex flex-wrap gap-2">
          {roundHistory.map((r) => (
            <div
              key={r.id}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                r.result === 'red'
                  ? 'bg-red-500/20'
                  : r.result === 'green'
                  ? 'bg-green-500/20'
                  : 'bg-violet-500/20'
              }`}
            >
              {r.result === 'red'
                ? '🔴'
                : r.result === 'green'
                ? '🟢'
                : '🟣'}
            </div>
          ))}
        </div>
      </div>

      {/* WIN EFFECT */}
      <AnimatePresence>
        {showWinAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{
                scale: 0.5,
                rotate: -20,
              }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              className="text-center"
            >
              <div className="text-8xl mb-4">
                🎉
              </div>

              <p className="text-4xl font-bold text-green-400">
                YOU WON!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
