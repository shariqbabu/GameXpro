import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import { generateColorRoundHistory } from '../../utils/mockData';
import toast from 'react-hot-toast';
import { Clock, TrendingUp, Users, Zap, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  increment,
} from 'firebase/firestore';

type ColorChoice = 'red' | 'green' | 'violet';

interface BetHistory {
  round: number;
  color: ColorChoice;
  amount: number;
  result: ColorChoice;
  won: boolean;
  payout: number;
}

interface WalletData {
  totalBalance: number;
  depositBalance: number;
  winningBalance: number;
  bonusBalance: number;
  lockedBalance: number;
  referralEarnings: number;
}

const MULTIPLIERS = { red: 2, green: 2, violet: 4.5 };
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
  const { userProfile, currentUser } = useAuth();
  const [timer, setTimer] = useState(ROUND_DURATION);
  const [roundNumber, setRoundNumber] = useState(101);
  const [phase, setPhase] = useState<'betting' | 'waiting' | 'result'>('betting');
  const [selectedColor, setSelectedColor] = useState<ColorChoice | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [result, setResult] = useState<ColorChoice | null>(null);
  const [wallet, setWallet] = useState<WalletData>({
    totalBalance: 0,
    depositBalance: 0,
    winningBalance: 0,
    bonusBalance: 0,
    lockedBalance: 0,
    referralEarnings: 0,
  });
  const [walletLoading, setWalletLoading] = useState(true);
  const [betHistory, setBetHistory] = useState<BetHistory[]>([]);
  const [roundHistory, setRoundHistory] = useState(generateColorRoundHistory);
  const [currentBet, setCurrentBet] = useState<{
    color: ColorChoice;
    amount: number;
  } | null>(null);
  const [showWinAnim, setShowWinAnim] = useState(false);
  const [liveUsers, setLiveUsers] = useState(12481);
  const [placingBet, setPlacingBet] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentBetRef = useRef(currentBet);
  const roundNumberRef = useRef(roundNumber);

  // Keep refs in sync
  useEffect(() => {
    currentBetRef.current = currentBet;
  }, [currentBet]);

  useEffect(() => {
    roundNumberRef.current = roundNumber;
  }, [roundNumber]);

  // Real-time wallet listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    const walletRef = doc(db, 'wallets', currentUser.uid);
    const unsubscribe = onSnapshot(
      walletRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as WalletData;
          setWallet(data);
        } else {
          // Wallet doc doesn't exist yet, use defaults
          setWallet({
            totalBalance: 0,
            depositBalance: 0,
            winningBalance: 0,
            bonusBalance: 0,
            lockedBalance: 0,
            referralEarnings: 0,
          });
        }
        setWalletLoading(false);
      },
      (error) => {
        console.error('Wallet listener error:', error);
        setWalletLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Live users simulation
  useEffect(() => {
    const userInterval = setInterval(() => {
      setLiveUsers((prev) => prev + Math.floor(Math.random() * 10) - 5);
    }, 2000);
    return () => clearInterval(userInterval);
  }, []);

  // Game timer
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // no deps — use refs for currentBet and roundNumber

  const handleRoundEnd = async () => {
    const colors: ColorChoice[] = [
      'red', 'green', 'violet', 'red', 'green', 'red', 'green',
    ];
    const res = colors[Math.floor(Math.random() * colors.length)];
    const bet = currentBetRef.current;
    const round = roundNumberRef.current;

    setResult(res);
    setPhase('result');

    if (bet && currentUser?.uid) {
      const won = bet.color === res;
      const payout = won ? bet.amount * MULTIPLIERS[bet.color] : 0;
      const profit = won ? payout - bet.amount : 0;

      try {
        const walletRef = doc(db, 'wallets', currentUser.uid);

        if (won) {
          // Add winnings back to wallet
          await updateDoc(walletRef, {
            winningBalance: increment(payout),
            totalBalance: increment(profit), // net profit added
          });
          setShowWinAnim(true);
          toast.success(`🎉 You won ₹${payout.toFixed(0)}!`, { duration: 3000 });
          setTimeout(() => setShowWinAnim(false), 3000);
        } else {
          toast.error(`❌ You lost ₹${bet.amount}`);
        }

        // Save result to gameBets collection
        await addDoc(collection(db, 'gameBets'), {
          userId: currentUser.uid,
          gameType: 'color_prediction',
          roundNumber: round,
          color: bet.color,
          amount: bet.amount,
          result: res,
          won,
          payout: won ? payout : 0,
          profit: won ? profit : -bet.amount,
          createdAt: serverTimestamp(),
        });

        // Also save to bets collection for compatibility
        await addDoc(collection(db, 'bets'), {
          userId: currentUser.uid,
          gameType: 'color_prediction',
          roundNumber: round,
          betColor: bet.color,
          amount: bet.amount,
          resultColor: res,
          won,
          payout: won ? payout : 0,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error updating wallet after round:', error);
        toast.error('Error processing result. Contact support.');
      }

      setBetHistory((prev) => [
        {
          round,
          color: bet.color,
          amount: bet.amount,
          result: res,
          won,
          payout: won ? payout : 0,
        },
        ...prev.slice(0, 9),
      ]);
    }

    setRoundHistory((prev) => [
      {
        id: `round${round}`,
        roundNumber: round,
        result: res,
        totalBets: Math.floor(Math.random() * 50) + 10,
      },
      ...prev.slice(0, 19),
    ]);

    setTimeout(() => {
      setRoundNumber((prev) => prev + 1);
      setPhase('betting');
      setResult(null);
      setSelectedColor(null);
      setCurrentBet(null);
    }, 3000);
  };

  const placeBet = async () => {
    if (!selectedColor) return toast.error('Select a color first!');
    if (betAmount <= 0) return toast.error('Enter valid bet amount');
    if (!currentUser?.uid) return toast.error('Please login to play');
    if (walletLoading) return toast.error('Loading wallet...');
    if (betAmount > wallet.totalBalance) return toast.error('Insufficient balance!');
    if (phase !== 'betting') return toast.error('Betting is closed for this round');
    if (currentBet) return toast.error('Bet already placed for this round');
    if (placingBet) return;

    setPlacingBet(true);
    try {
      const walletRef = doc(db, 'wallets', currentUser.uid);

      // Verify balance again before deducting (safety check)
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) {
        toast.error('Wallet not found!');
        setPlacingBet(false);
        return;
      }

      const currentWalletData = walletSnap.data() as WalletData;
      if (betAmount > currentWalletData.totalBalance) {
        toast.error('Insufficient balance!');
        setPlacingBet(false);
        return;
      }

      // Deduct bet amount from wallet
      // Deduct from depositBalance first, then winningBalance
      let remainingDeduct = betAmount;
      const updates: Record<string, unknown> = {
        totalBalance: increment(-betAmount),
      };

      if (currentWalletData.depositBalance >= remainingDeduct) {
        updates.depositBalance = increment(-remainingDeduct);
        remainingDeduct = 0;
      } else {
        updates.depositBalance = increment(-currentWalletData.depositBalance);
        remainingDeduct -= currentWalletData.depositBalance;
      }

      if (remainingDeduct > 0 && currentWalletData.winningBalance >= remainingDeduct) {
        updates.winningBalance = increment(-remainingDeduct);
        remainingDeduct = 0;
      } else if (remainingDeduct > 0) {
        updates.winningBalance = increment(-currentWalletData.winningBalance);
        remainingDeduct -= currentWalletData.winningBalance;
      }

      if (remainingDeduct > 0 && currentWalletData.bonusBalance >= remainingDeduct) {
        updates.bonusBalance = increment(-remainingDeduct);
      }

      await updateDoc(walletRef, updates);

      setCurrentBet({ color: selectedColor, amount: betAmount });
      toast.success(
        `✅ Bet placed! ₹${betAmount} on ${colorConfig[selectedColor].label}`
      );
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('Failed to place bet. Try again.');
    } finally {
      setPlacingBet(false);
    }
  };

  const progressPercent = ((ROUND_DURATION - timer) / ROUND_DURATION) * 100;

  return (
    <div className="space-y-4 pb-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/games')}
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
              <Users className="w-3 h-3" /> {liveUsers.toLocaleString()} online
            </span>
            <span className="badge-live">LIVE</span>
          </div>
        </div>
      </div>

      {/* Win Animation Overlay */}
      <AnimatePresence>
        {showWinAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <div className="text-8xl mb-4">🎉</div>
              <div className="text-4xl font-bold text-green-400 font-sora">
                YOU WON!
              </div>
              <div className="text-2xl text-white mt-2">
                ₹
                {currentBet
                  ? (currentBet.amount * MULTIPLIERS[currentBet.color]).toFixed(0)
                  : 0}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Area */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Game Board */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timer & Round */}
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
                <div
                  className={`text-4xl font-bold font-sora ${
                    timer <= 5
                      ? 'text-red-400 animate-pulse'
                      : timer <= 10
                      ? 'text-yellow-400'
                      : 'text-white'
                  }`}
                >
                  {String(Math.floor(timer / 60)).padStart(2, '0')}:
                  {String(timer % 60).padStart(2, '0')}
                </div>
                <p className="text-xs text-white/40 mt-1">
                  {phase === 'betting'
                    ? 'Place your bets'
                    : phase === 'waiting'
                    ? 'Bets closed'
                    : 'Round ended'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <div className="text-right">
                  <p className="text-xs text-white/40">Balance</p>
                  {walletLoading ? (
                    <p className="text-sm font-bold text-white/40">Loading...</p>
                  ) : (
                    <p className="text-sm font-bold text-green-400">
                      ₹{wallet.totalBalance.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  timer <= 5
                    ? 'bg-red-500'
                    : timer <= 10
                    ? 'bg-yellow-500'
                    : 'bg-gradient-to-r from-purple-500 to-cyan-500'
                }`}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Result Display */}
          <AnimatePresence>
            {phase === 'result' && result && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`rounded-2xl p-6 text-center border ${colorConfig[result].border} glass`}
              >
                <div className="text-6xl mb-2">{colorConfig[result].emoji}</div>
                <h3 className="text-2xl font-bold font-sora text-white">
                  {colorConfig[result].label} Wins!
                </h3>
                {currentBet && (
                  <p
                    className={`text-lg font-bold mt-2 ${
                      currentBet.color === result
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {currentBet.color === result
                      ? `+₹${(
                          currentBet.amount * MULTIPLIERS[currentBet.color]
                        ).toFixed(0)}`
                      : `-₹${currentBet.amount}`}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Color Selection */}
          <div className="glass rounded-2xl p-5 border border-white/8">
            <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
              Choose Color
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(colorConfig) as ColorChoice[]).map((color) => {
                const config = colorConfig[color];
                const isSelected = selectedColor === color;
                const hasBet = currentBet?.color === color;
                return (
                  <motion.button
                    key={color}
                    whileHover={{ scale: phase === 'betting' ? 1.05 : 1 }}
                    whileTap={{ scale: phase === 'betting' ? 0.95 : 1 }}
                    onClick={() =>
                      phase === 'betting' && !currentBet && setSelectedColor(color)
                    }
                    disabled={phase !== 'betting' || !!currentBet}
                    className={`
                      relative p-4 rounded-2xl border-2 transition-all
                      ${
                        isSelected || hasBet
                          ? `${config.border} shadow-xl ${config.glow}`
                          : 'border-white/10 hover:border-white/30'
                      }
                      ${
                        phase !== 'betting' || currentBet
                          ? 'cursor-not-allowed opacity-70'
                          : 'cursor-pointer'
                      }
                    `}
                  >
                    {hasBet && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                    <div
                      className={`w-12 h-12 rounded-full ${config.bg} mx-auto mb-2 shadow-lg`}
                    />
                    <p className="text-xs font-bold text-white text-center">
                      {config.label}
                    </p>
                    <p className={`text-xs ${config.text} text-center font-semibold`}>
                      {config.multiplier}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Bet Amount */}
          <div className="glass rounded-2xl p-5 border border-white/8">
            <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">
              Bet Amount
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setBetAmount((prev) => Math.max(10, prev - 10))}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center font-bold text-lg"
              >
                −
              </button>
              <input
                type="number"
                value={betAmount}
                onChange={(e) =>
                  setBetAmount(Math.max(10, parseInt(e.target.value) || 10))
                }
                className="input-gaming flex-1 text-center py-2.5 rounded-xl text-lg font-bold"
              />
              <button
                onClick={() => setBetAmount((prev) => prev + 10)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center font-bold text-lg"
              >
                +
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[10, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    betAmount === amt
                      ? 'bg-purple-500/30 border border-purple-500/50 text-purple-400'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Wallet breakdown */}
            {!walletLoading && (
              <div className="mb-3 p-3 rounded-xl bg-white/5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Deposit:</span>
                  <span className="text-blue-400 font-semibold">
                    ₹{wallet.depositBalance.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Winnings:</span>
                  <span className="text-green-400 font-semibold">
                    ₹{wallet.winningBalance.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Bonus:</span>
                  <span className="text-yellow-400 font-semibold">
                    ₹{wallet.bonusBalance.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Total:</span>
                  <span className="text-white font-bold">
                    ₹{wallet.totalBalance.toFixed(0)}
                  </span>
                </div>
              </div>
            )}

            {selectedColor && (
              <div className="mb-4 p-3 rounded-xl bg-white/5 flex justify-between text-sm">
                <span className="text-white/50">Potential Win:</span>
                <span className="font-bold text-green-400">
                  ₹{(betAmount * MULTIPLIERS[selectedColor]).toFixed(0)}
                </span>
              </div>
            )}

            {betAmount > wallet.totalBalance && !walletLoading && (
              <div className="mb-3 p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center">
                ⚠️ Insufficient balance. Please deposit funds.
              </div>
            )}

            <GlowButton
              fullWidth
              size="lg"
              onClick={placeBet}
              disabled={
                !selectedColor ||
                phase !== 'betting' ||
                !!currentBet ||
                placingBet ||
                walletLoading ||
                betAmount > wallet.totalBalance
              }
              variant={currentBet ? 'ghost' : 'purple'}
            >
              {placingBet
                ? '⏳ Placing Bet...'
                : currentBet
                ? `✅ Bet Placed — ₹${currentBet.amount} on ${colorConfig[currentBet.color].label}`
                : phase !== 'betting'
                ? '⏳ Waiting...'
                : `🎯 Place Bet — ₹${betAmount}`}
            </GlowButton>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* My Bets */}
          {betHistory.length > 0 && (
            <div className="glass rounded-2xl border border-white/8 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> My Bets
                </h3>
              </div>
              <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                {betHistory.map((bet, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div
                      className={`w-6 h-6 rounded-full ${colorConfig[bet.result].bg}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white">
                        #{bet.round} • {colorConfig[bet.color].label}
                      </p>
                      <p className="text-[10px] text-white/40">₹{bet.amount}</p>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        bet.won ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {bet.won ? `+₹${bet.payout.toFixed(0)}` : `-₹${bet.amount}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Round History */}
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> Round History
              </h3>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-2">
                {roundHistory.slice(0, 20).map((round) => (
                  <div
                    key={round.id}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                      round.result === 'red'
                        ? 'bg-red-500'
                        : round.result === 'green'
                        ? 'bg-green-500'
                        : 'bg-violet-500'
                    }`}
                    title={`Round #${round.roundNumber}: ${round.result}`}
                  >
                    {round.result === 'red'
                      ? 'R'
                      : round.result === 'green'
                      ? 'G'
                      : 'V'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Bets */}
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-semibold text-white">Live Bets</h3>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { user: 'R***j', color: 'red', amount: 500 },
                { user: 'P***a', color: 'green', amount: 200 },
                { user: 'A***t', color: 'violet', amount: 1000 },
                { user: 'N***a', color: 'red', amount: 150 },
                { user: 'S***n', color: 'green', amount: 300 },
              ].map((bet, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex-shrink-0 ${
                      colorConfig[bet.color as ColorChoice].bg
                    }`}
                  />
                  <span className="text-xs text-white/60 flex-1">{bet.user}</span>
                  <span className="text-xs font-semibold text-white">
                    ₹{bet.amount}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
