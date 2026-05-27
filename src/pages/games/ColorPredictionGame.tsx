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
