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

type ColorChoice =
  | 'red'
  | 'green'
  | 'violet';

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

  const navigate =
    useNavigate();

  const {
    userProfile,
    currentUser,
  } = useAuth();

  const [
    timer,
    setTimer,
  ] = useState(
    ROUND_DURATION
  );

  const [
    roundNumber,
    setRoundNumber,
  ] = useState(1);

  const [
    phase,
    setPhase,
  ] = useState<
    'betting'
    | 'waiting'
    | 'result'
  >('betting');

  const [
    selectedColor,
    setSelectedColor,
  ] = useState<ColorChoice | null>(
    null
  );

  const [
    betAmount,
    setBetAmount,
  ] = useState(10);

  const [
    result,
    setResult,
  ] = useState<ColorChoice | null>(
    null
  );

  const [
    walletData,
    setWalletData,
  ] = useState<any>(null);

  const balance =
    Number(
      walletData?.totalBalance ??
      userProfile?.walletBalance ??
      0
    );

  const [
    betHistory,
    setBetHistory,
  ] = useState<BetHistory[]>([]);

  const [
    roundHistory,
    setRoundHistory,
  ] = useState<any[]>([]);

  const [
    currentBet,
    setCurrentBet,
  ] = useState<{
    color: ColorChoice;
    amount: number;
  } | null>(null);

  const [
    showWinAnim,
    setShowWinAnim,
  ] = useState(false);

  const [
    liveUsers,
    setLiveUsers,
  ] = useState(12481);

  const timerRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  // REALTIME WALLET
  useEffect(() => {

    if (
      !currentUser?.uid
    )
      return;

    const unsubscribe =
      onSnapshot(
        doc(
          db,
          'wallets',
          currentUser.uid
        ),
        (snap) => {

          if (
            snap.exists()
          ) {

            setWalletData(snap.data()
            );
          }
        }
      );

    return () =>
      unsubscribe();

  }, [currentUser]);

  // LIVE USERS
  useEffect(() => {

    const userInterval =
      setInterval(() => {

        setLiveUsers(
          (prev) =>
            prev +
            Math.floor(
              Math.random() * 10
            ) -
            5
        );

      }, 2000);

    return () =>
      clearInterval(
        userInterval
      );

  }, []);

  // ROUND HISTORY
  useEffect(() => {

    const q = query(
      collection(
        db,
        'gameRounds'
      ),
      orderBy(
        'createdAt',
        'desc'
      ),
      limit(20)
    );

    const unsubscribe =
      onSnapshot(
        q,
        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          setRoundHistory(data);
          
           // AUTO ROUND NUMBER
      if (data.length > 0) {

        const latestRound =
          Number(
            data[0].roundNumber || 0
          );

        setRoundNumber(
          latestRound + 1
        );
      }
        },
        (error) => {
          console.error(
            error
          );
        }
      );

    return () =>
      unsubscribe();

  }, []);

  // GAME TIMER
  useEffect(() => {

    timerRef.current =
      setInterval(() => {

        setTimer(
          (prev) => {

            if (
              prev <= 1
            ) {

              handleRoundEnd();

              return ROUND_DURATION;
            }

            if (
              prev === 6
            ) {

              setPhase(
                'waiting'
              );
            }

            return prev - 1;
          }
        );

      }, 1000);

    return () => {

      if (
        timerRef.current
      ) {

        clearInterval(
          timerRef.current
        );
      }
    };

  }, []);

  // CLEANUP
  useEffect(() => {

    return () => {

      if (
        timerRef.current
      ) {

        clearInterval(
          timerRef.current
        );
      }
    };

  }, []);

  // ROUND END
  const handleRoundEnd =
    async () => {

      try {

        const colors: ColorChoice[] = [
          'red',
          'green',
          'violet',
          'red',
          'green',
          'red',
          'green',
        ];

        const res =
          colors[
            Math.floor(
              Math.random() *
                colors.length
            )
          ];

        setResult(
          res
        );

        setPhase(
          'result'
        );

        await addDoc(
          collection(
            db,
            'gameRounds'
          ),
          {
            roundNumber,
            result: res,
            totalBets:
              Math.floor(
                Math.random() *
                  50
              ) + 10,
            createdAt:
              serverTimestamp(),
          }
        );

        if (
          currentBet &&
          currentUser?.uid
        ) {

          const won =
            currentBet.color ===
            res;

          const payout =
            won
              ? currentBet.amount *
                MULTIPLIERS[
                  currentBet.color
                ]
              : 0;

          // WIN
          if (won) {

            await updateDoc(
              doc(
                db,
                'wallets',
                currentUser.uid
              ),
              {
                totalBalance:
                  increment(
                    payout
                  ),

                winningBalance:
                  increment(
                    payout
                  ),
              }
            );

            await addDoc(
              collection(
                db,
                'transactions'
              ),
              {
                userId:
                  currentUser.uid,

                type:
                  'game_win',

                amount:
                  payout,

                status:
                  'completed',

                game:
                  'color_prediction',

                createdAt:
                  serverTimestamp(),
              }
            );

            setShowWinAnim(
              true
            );

            toast.success(
              `🎉 You won ₹${payout.toFixed(
                0
              )}!`
            );

            setTimeout(
              () => {

                setShowWinAnim(
                  false
                );

              },
              3000
            );

          } else {

            await addDoc(
              collection(
                db,
                'transactions'
              ),
              {
                userId:
                  currentUser.uid,

                type:
                  'game_loss',

                amount:
                  -currentBet.amount,

                status:
                  'completed',

                game:
                  'color_prediction',

                createdAt:
                  serverTimestamp(),
              }
            );

            toast.error(
              `❌ You lost ₹${currentBet.amount}`
            );
          }

          setBetHistory(
            (prev) => [
              {
                round:
                  roundNumber,

                color:
                  currentBet.color,

                amount:
                  currentBet.amount,

                result:
                  res,

                won,

                payout,
              },

              ...prev.slice(
                0,
                9
              ),
            ]
          );
        }

        setTimeout(
          () => {

            setRoundNumber(
              (prev) =>
                prev + 1
            );

            setPhase(
              'betting'
            );

            setResult(
              null
            );

            setSelectedColor(
              null
            );

            setCurrentBet(
              null
            );

            setTimer(
              ROUND_DURATION
            );

          },
          3000
        );

      } catch (
        error: any
      ) {

        console.error(
          'ROUND END ERROR:',
          error
        );
      }
    };

  // PLACE BET
  const placeBet =
    async () => {

      if (
        !currentUser?.uid
      ) {

        return toast.error(
          'Login required'
        );
      }

      if (
        !selectedColor
      ) {

        return toast.error(
          'Select a color first!'
        );
      }

      if (
        betAmount <= 0
      ) {

        return toast.error(
          'Enter valid bet amount'
        );
      }

      if (
        betAmount >
        balance
      ) {

        return toast.error(
          'Insufficient balance!'
        );
      }

      if (
        phase !==
        'betting'
      ) {

        return toast.error(
          'Betting is closed'
        );
      }

      if (
        currentBet
      ) {

        return toast.error(
          'Bet already placed'
        );
      }

      try {

        // DEDUCT BALANCE
        await updateDoc(
          doc(
            db,
            'wallets',
            currentUser.uid
          ),
          {
            totalBalance:
              increment(
                -betAmount
              ),
          }
        );

        // SAVE BET
        await addDoc(
          collection(
            db,
            'bets'
          ),
          {
            userId:
              currentUser.uid,

            roundNumber,

            color:
              selectedColor,

            amount:
              betAmount,

            status:
              'pending',

            createdAt:
              serverTimestamp(),
          }
        );

        setCurrentBet({
          color:
            selectedColor,

          amount:
            betAmount,
        });

        toast.success(
          `✅ Bet placed on ${colorConfig[selectedColor].label}`
        );

      } catch (
        error: any
      ) {

        console.error(
          'PLACE BET ERROR:',
          error
        );

        toast.error(
          error?.message ||
          'Bet failed'
        );
      }
    };

const progressPercent =
  (
    (
      ROUND_DURATION -
      timer
    ) /
    ROUND_DURATION
  ) *
  100;

return (

  <div className="min-h-screen bg-[#0a0a0f] text-white p-4">

    {/* HEADER */}
    <div className="flex items-center justify-between mb-6">

      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-xl bg-white/5 border border-white/10"
      >
        <ChevronLeft size={22} />
      </button>

      <div className="text-center">

        <h1 className="text-2xl font-bold">
          Color Prediction
        </h1>

        <p className="text-white/50 text-sm">
          Round #{roundNumber}
        </p>
      </div>

      <div className="text-right">

        <p className="text-xs text-white/50">
          Balance
        </p>

        <p className="font-bold text-green-400">
          ₹{balance.toFixed(2)}
        </p>
      </div>
    </div>

    {/* TIMER */}
    <div className="mb-6">

      <div className="flex items-center justify-between mb-2">

        <div className="flex items-center gap-2 text-sm text-white/60">

          <Clock size={16} />

          <span>
            {
              phase === 'betting'
                ? 'Betting Time'
                : phase === 'waiting'
                ? 'Waiting Result'
                : 'Result'
            }
          </span>
        </div>

        <span className="font-bold text-lg">
          {timer}s
        </span>
      </div>

      <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">

        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-1000"
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </div>
    </div>

    {/* COLORS */}
    <div className="grid grid-cols-3 gap-4 mb-6">

      {(Object.keys(
        colorConfig
      ) as ColorChoice[]).map(
        (color) => {

          const cfg =
            colorConfig[color];

          return (

            <motion.button
              key={color}
              whileTap={{
                scale: 0.95,
              }}
              onClick={() =>
                setSelectedColor(
                  color
                )
              }
              className={`
                p-5 rounded-3xl border
                ${cfg.border}
                ${cfg.bg}
                ${
                  selectedColor ===
                  color
                    ? 'ring-4 ring-white/50 scale-105'
                    : ''
                }
              `}
            >

              <div className="text-4xl mb-2">
                {cfg.emoji}
              </div>

              <div className="font-bold text-lg">
                {cfg.label}
              </div>

              <div className="text-sm opacity-80">
                {cfg.multiplier}
              </div>
            </motion.button>
          );
        }
      )}
    </div>

    {/* BET INPUT */}
    <div className="mb-6">

      <input
        type="number"
        min={10}
        value={betAmount}
        onChange={(e) =>
          setBetAmount(
            Number(
              e.target.value
            )
          )
        }
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 outline-none"
        placeholder="Enter Bet Amount"
      />
    </div>

    {/* BET BUTTON */}
    <GlowButton
      onClick={placeBet}
      className="w-full mb-6"
    >
      Place Bet
    </GlowButton>

    {/* CURRENT BET */}
    {currentBet && (

      <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">

        <p className="text-sm text-white/50 mb-1">
          Current Bet
        </p>

        <div className="flex items-center justify-between">

          <span className="font-bold">

            {
              colorConfig[
                currentBet.color
              ].label
            }
          </span>

          <span className="text-green-400 font-bold">
            ₹{currentBet.amount}
          </span>
        </div>
      </div>
    )}

    {/* RESULT */}
    <AnimatePresence>

      {result && (

        <motion.div
          initial={{
            scale: 0.5,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          exit={{
            scale: 0.5,
            opacity: 0,
          }}
          className="mb-6 text-center"
        >

          <div
            className={`
              inline-flex items-center justify-center
              w-32 h-32 rounded-full
              ${colorConfig[result].bg}
            `}
          >

            <span className="text-6xl">
              {colorConfig[result].emoji}
            </span>
          </div>

          <h2 className="text-3xl font-bold mt-4">
            {colorConfig[result].label}
          </h2>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ROUND HISTORY */}
    <div className="space-y-3">

      <div className="flex items-center gap-2 mb-3">

        <TrendingUp size={18} />

        <h3 className="font-bold">
          Recent Results
        </h3>
      </div>

      <div className="flex gap-2 flex-wrap">

        {roundHistory
          .slice(0, 10)
          .map((r, i) => (

            <div
              key={i}
              className={`
                w-10 h-10 rounded-full
                flex items-center justify-center text-lg
                ${
                  colorConfig[
                    r.result as ColorChoice
                  ]?.bg
                }
              `}
            >

              {
                colorConfig[
                  r.result as ColorChoice
                ]?.emoji
              }
            </div>
          ))}
      </div>
    </div>

    {/* LIVE USERS */}
    <div className="mt-8 flex items-center justify-center gap-2 text-white/50 text-sm">

      <Users size={16} />

      <span>
        {liveUsers.toLocaleString()} users online
      </span>
    </div>

    {/* WIN POPUP */}
    <AnimatePresence>

      {showWinAnim && (

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.5,
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        >

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-10 text-center shadow-2xl">

            <Zap
              size={60}
              className="mx-auto mb-4"
            />

            <h2 className="text-4xl font-black mb-2">
              YOU WON!
            </h2>

            <p className="text-lg">
              Congratulations 🎉
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
};
