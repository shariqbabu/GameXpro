import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import { generateColorRoundHistory } from '../../utils/mockData';
import toast from 'react-hot-toast';
import {
  Clock,
  TrendingUp,
  Users,
  Zap,
  ChevronLeft,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

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

  const balance =
    Number(
      userProfile?.walletBalance ?? 0
    );

  const [
    betHistory,
    setBetHistory,
  ] = useState<BetHistory[]>([]);

  const [
    roundHistory,
    setRoundHistory,
  ] = useState(
    generateColorRoundHistory
  );

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

  // ROUND AUTO COUNT
  useEffect(() => {

    if (
      roundHistory.length > 0
    ) {

      const latestRound =
        Number(
          roundHistory[0]
            ?.roundNumber || 0
        );

      setRoundNumber(
        latestRound + 1
      );
    }

  }, []);

  // TIMER
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

  }, [
    currentBet,
    roundNumber,
  ]);

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
  const handleRoundEnd = () => {

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

    setResult(res);

    setPhase('result');

    if (currentBet) {

      const won =
        currentBet.color === res;

      const payout =
        won
          ? currentBet.amount *
            MULTIPLIERS[
              currentBet.color
            ]
          : 0;

      if (won) {

        setShowWinAnim(true);

        toast.success(
          `🎉 You won ₹${payout.toFixed(0)}!`,
          {
            duration: 3000,
          }
        );

        setTimeout(() => {

          setShowWinAnim(false);

        }, 3000);

      } else {

        toast.error(
          `❌ You lost ₹${currentBet.amount}`
        );
      }

      setBetHistory(
        (prev) => [
          {
            round: roundNumber,
            color: currentBet.color,
            amount: currentBet.amount,
            result: res,
            won,
            payout:
              won
                ? payout
                : 0,
          },

          ...prev.slice(0, 9),
        ]
      );
    }

    setRoundHistory(
      (prev) => [
        {
          id: `round${roundNumber}`,
          roundNumber,
          result: res,
          totalBets:
            Math.floor(
              Math.random() * 50
            ) + 10,
        },

        ...prev.slice(0, 19),
      ]
    );

    setTimeout(() => {

      setRoundNumber(
        (prev) =>
          prev + 1
      );

      setPhase('betting');

      setResult(null);

      setSelectedColor(null);

      setCurrentBet(null);

    }, 3000);
  };

  // PLACE BET
  const placeBet = () => {

    if (!selectedColor)
      return toast.error(
        'Select a color first!'
      );

    if (betAmount <= 0)
      return toast.error(
        'Enter valid bet amount'
      );

    if (betAmount > balance)
      return toast.error(
        'Insufficient balance!'
      );

    if (phase !== 'betting')
      return toast.error(
        'Betting is closed for this round'
      );

    if (currentBet)
      return toast.error(
        'Bet already placed for this round'
      );

    setCurrentBet({
      color: selectedColor,
      amount: betAmount,
    });

    toast.success(
      `✅ Bet placed! ₹${betAmount} on ${colorConfig[selectedColor].label}`
    );
  };

  const progressPercent =
    (
      (
        ROUND_DURATION -
        timer
      ) /
      ROUND_DURATION
    ) * 100;

  return (
    <div className="space-y-4 pb-4 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center gap-3">

        <button
          onClick={() =>
            navigate('/games')
          }
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div>

          <h1 className="text-xl font-bold font-sora text-white">
            🎨 Color Prediction
          </h1>

          <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">

            <span className="flex items-center gap-1">

              <Users className="w-3 h-3" />

              {liveUsers.toLocaleString()} online
            </span>

            <span className="badge-live">
              LIVE
            </span>
          </div>
        </div>
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
              scale: 1.5,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >

            <div className="text-center">

              <div className="text-8xl mb-4">
                🎉
              </div>

              <div className="text-4xl font-bold text-green-400 font-sora">
                YOU WON!
              </div>

              <div className="text-2xl text-white mt-2">

                ₹{
                  currentBet
                    ? (
                        currentBet.amount *
                        MULTIPLIERS[
                          currentBet.color
                        ]
                      ).toFixed(0)
                    : 0
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-4">

          {/* TIMER */}
          <div className="glass rounded-2xl p-5 border border-white/8">

            <div className="flex items-center justify-between mb-4">

              <div>

                <p className="text-xs text-white/40 uppercase tracking-wider">
                  Round
                </p>

                <p className="text-2xl font-bold font-sora text-white">
                  #{roundNumber}
                </p>
              </div>

              <div className="text-center">

                <div className={`text-4xl font-bold font-sora ${
                  timer <= 5
                    ? 'text-red-400 animate-pulse'
                    : timer <= 10
                    ? 'text-yellow-400'
                    : 'text-white'
                }`}>

                  {String(
                    Math.floor(timer / 60)
                  ).padStart(2, '0')}:

                  {String(
                    timer % 60
                  ).padStart(2, '0')}
                </div>

                <p className="text-xs text-white/40 mt-1">

                  {
                    phase === 'betting'
                      ? 'Place your bets'
                      : phase === 'waiting'
                      ? 'Bets closed'
                      : 'Round ended'
                  }
                </p>
              </div>

              <div className="flex items-center gap-2">

                <Clock className="w-4 h-4 text-purple-400" />

                <div className="text-right">

                  <p className="text-xs text-white/40">
                    Balance
                  </p>

                  <p className="text-sm font-bold text-green-400">
                    ₹{balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* PROGRESS */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">

              <motion.div
                className={`h-full rounded-full ${
                  timer <= 5
                    ? 'bg-red-500'
                    : timer <= 10
                    ? 'bg-yellow-500'
                    : 'bg-gradient-to-r from-purple-500 to-cyan-500'
                }`}
                animate={{
                  width: `${progressPercent}%`,
                }}
                transition={{
                  duration: 0.5,
                }}
              />
            </div>
          </div>

          {/* RESULT */}
          <AnimatePresence>

            {phase === 'result' &&
              result && (

              <motion.div
                initial={{
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                }}
                className={`rounded-2xl p-6 text-center border ${colorConfig[result].border}`}
              >

                <div className="text-6xl mb-2">
                  {colorConfig[result].emoji}
                </div>

                <h3 className="text-2xl font-bold font-sora text-white">

                  {colorConfig[result].label} Wins!
                </h3>

                {currentBet && (

                  <p className={`text-lg font-bold mt-2 ${
                    currentBet.color === result
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>

                    {
                      currentBet.color === result
                        ? `+₹${(
                            currentBet.amount *
                            MULTIPLIERS[
                              currentBet.color
                            ]
                          ).toFixed(0)}`
                        : `-₹${currentBet.amount}`
                    }
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
