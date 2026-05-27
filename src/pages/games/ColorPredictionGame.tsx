
// src/pages/games/ColorPredictionGame.tsx

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

const MULTIPLIERS: Record<ColorChoice, number> = {
  red: 2,
  green: 2,
  violet: 4.5,
};

const ROUND_DURATION = 30;

const colorConfig: Record<
  ColorChoice,
  {
    bg: string;
    glow: string;
    border: string;
    text: string;
    label: string;
    emoji: string;
    multiplier: string;
  }
> = {
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
  const { currentUser } = useAuth();

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

  // Refs to avoid stale closures in timer callback
  const currentBetRef = useRef<{ color: ColorChoice; amount: number } | null>(null);
  const roundNumberRef = useRef(101);
  const phaseRef = useRef<'betting' | 'waiting' | 'result'>('betting');
  const processingRef = useRef(false);

  useEffect(() => {
    currentBetRef.current = currentBet;
  }, [currentBet]);

  useEffect(() => {
    roundNumberRef.current = roundNumber;
  }, [roundNumber]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Real-time wallet listener
  useEffect(() => {
    if (!currentUser?.uid) return;
    setWalletLoading(true);

    const walletRef = doc(db, 'wallets', currentUser.uid);
    const unsubscribe = onSnapshot(
      walletRef,
      (snap) => {
        if (snap.exists()) {
          setWallet(snap.data() as WalletData);
        } else {
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
        console.error('Wallet snapshot error:', error);
        setWalletLoading(false);
        toast.error('Failed to load wallet');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Live users simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers((prev) => prev + Math.floor(Math.random() * 10) - 5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Credit winnings to wallet
  const safeWalletCredit = async (uid: string, amount: number): Promise<void> => {
    if (amount <= 0) return;
    const walletRef = doc(db, 'wallets', uid);
    const snap = await getDoc(walletRef);
    if (!snap.exists()) throw new Error('Wallet not found');
    await updateDoc(walletRef, {
      winningBalance: increment(amount),
      totalBalance: increment(amount),
    });
  };

  // Deduct bet from wallet — deposit first, then winning, then bonus
  const safeWalletDeduct = async (uid: string, amount: number): Promise<void> => {
    const walletRef = doc(db, 'wallets', uid);
    const snap = await getDoc(walletRef);
    if (!snap.exists()) throw new Error('Wallet not found');

    const data = snap.data() as WalletData;
    if (data.totalBalance < amount) throw new Error('Insufficient balance');

    let remaining = amount;
    const updates: Record<string, unknown> = {
      totalBalance: increment(-amount),
    };

    const fromDeposit = Math.min(remaining, data.depositBalance);
    if (fromDeposit > 0) {
      updates.depositBalance = increment(-fromDeposit);
      remaining -= fromDeposit;
    }

    if (remaining > 0) {
      const fromWinning = Math.min(remaining, data.winningBalance);
      if (fromWinning > 0) {
        updates.winningBalance = increment(-fromWinning);
        remaining -= fromWinning;
      }
    }

    if (remaining > 0) {
      const fromBonus = Math.min(remaining, data.bonusBalance);
      if (fromBonus > 0) {
        updates.bonusBalance = increment(-fromBonus);
        remaining -= fromBonus;
      }
    }

    if (remaining > 0.01) throw new Error('Balance calculation error');

    await updateDoc(walletRef, updates);
  };

  // Save bet record to Firestore — non-throwing
  const saveBetRecord = async (
    uid: string,
    round: number,
    betColor: ColorChoice,
    amount: number,
    resultColor: ColorChoice,
    won: boolean,
    payout: number
  ): Promise<void> => {
    const record = {
      userId: uid,
      gameType: 'color_prediction',
      roundNumber: round,
      betColor,
      amount,
      resultColor,
      won,
      payout,
      profit: won ? payout - amount : -amount,
      createdAt: serverTimestamp(),
    };

    await Promise.all([
      addDoc(collection(db, 'gameBets'), record).catch((e) =>
        console.error('gameBets write failed:', e)
      ),
      addDoc(collection(db, 'bets'), record).catch((e) =>
        console.error('bets write failed:', e)
      ),
    ]);
  };

  // Round end handler — uses refs to avoid stale closures
  const handleRoundEnd = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const colors: ColorChoice[] = ['red', 'green', 'violet', 'red', 'green', 'red', 'green'];
    const res = colors[Math.floor(Math.random() * colors.length)];
    const bet = currentBetRef.current;
    const round = roundNumberRef.current;
    const uid = currentUser?.uid;

    setResult(res);
    setPhase('result');

    if (bet && uid) {
      const won = bet.color === res;
      const payout = won ? Math.floor(bet.amount * MULTIPLIERS[bet.color]) : 0;

      try {
        if (won) {
          // Credit only net profit (bet was already deducted at placement)
          const netProfit = payout - bet.amount;
          await safeWalletCredit(uid, netProfit);
          setShowWinAnim(true);
          toast.success(`🎉 You won ₹${payout}!`, { duration: 3000 });
          setTimeout(() => setShowWinAnim(false), 3000);
        } else {
          toast.error(`❌ You lost ₹${bet.amount}`);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Wallet credit error:', msg);
        if (won) {
          toast.error('Win recorded — refresh if balance not updated');
        }
      }

      // Save record — never blocks the game
      saveBetRecord(uid, round, bet.color, bet.amount, res, won, payout).catch(
        console.error
      );

      setBetHistory((prev) => [
        { round, color: bet.color, amount: bet.amount, result: res, won, payout },
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
      processingRef.current = false;
    }, 3000);
  };

  // Game timer — empty deps, all state accessed via refs
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (!processingRef.current) {
            handleRoundEnd();
          }
          return ROUND_DURATION;
        }
        if (prev === 6) {
          setPhase('waiting');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeBet = async () => {
    if (!selectedColor) return toast.error('Select a color first!');
    if (betAmount < 10) return toast.error('Minimum bet is ₹10');
    if (!currentUser?.uid) return toast.error('Please login to play');
    if (walletLoading) return toast.error('Loading wallet, please wait...');
    if (betAmount > wallet.totalBalance)
      return toast.error(`Insufficient balance! You have ₹${wallet.totalBalance.toFixed(0)}`);
    if (phaseRef.current !== 'betting') return toast.error('Betting is closed for this round');
    if (currentBetRef.current) return toast.error('Bet already placed!');
    if (placingBet) return;

    setPlacingBet(true);
    try {
      await safeWalletDeduct(currentUser.uid, betAmount);
      setCurrentBet({ color: selectedColor, amount: betAmount });
      toast.success(`✅ ₹${betAmount} on ${colorConfig[selectedColor].label}!`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to place bet';
      console.error('Place bet error:', msg);
      toast.error(msg);
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
          <h1 className="text-xl font-bold font-sora text-white">🎨 Color Prediction</h1>
          <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {liveUsers.toLocaleString()} online
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
              <div className="text-4xl font-bold text-green-400 font-sora">YOU WON!</div>
              {currentBetRef.current && (
                <div className="text-2xl text-white mt-2">
                  ₹{Math.floor(currentBetRef.current.amount * MULTIPLIERS[currentBetRef.current.color])}
                </div>
              )}
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
                <p className="text-xs text-white/40 uppercase tracking-wider">Round</p>
                <p className="text-2xl font-bold font-sora text-white">#{roundNumber}</p>
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
                    : 'Calculating result...'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <div className="text-right">
                  <p className="text-xs text-white/40">Balance</p>
                  {walletLoading ? (
                    <p className="text-sm font-bold text-white/40">...</p>
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
                className={`glass rounded-2xl p-6 text-center border ${colorConfig[result].border}`}
              >
                <div className="text-6xl mb-2">{colorConfig[result].emoji}</div>
                <h3 className="text-2xl font-bold font-sora text-white">
                  {colorConfig[result].label} Wins!
                </h3>
                {currentBetRef.current && (
                  <p
                    className={`text-lg font-bold mt-2 ${
                      currentBetRef.current.color === result
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {currentBetRef.current.color === result
                      ? `+₹${Math.floor(
                          currentBetRef.current.amount * MULTIPLIERS[currentBetRef.current.color]
                        )}`
                      : `-₹${currentBetRef.current.amount}`}
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
                    onClick={() => phase === 'betting' && !currentBet && setSelectedColor(color)}
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
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-full ${config.bg} mx-auto mb-2 shadow-lg`} />
                    <p className="text-xs font-bold text-white text-center">{config.label}</p>
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
                disabled={!!currentBet}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center font-bold text-lg disabled:opacity-40"
              >
                −
              </button>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 10))}
                disabled={!!currentBet}
                className="input-gaming flex-1 text-center py-2.5 rounded-xl text-lg font-bold disabled:opacity-40"
              />
              <button
                onClick={() => setBetAmount((prev) => prev + 10)}
                disabled={!!currentBet}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center font-bold text-lg disabled:opacity-40"
              >
                +
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[10, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => !currentBet && setBetAmount(amt)}
                  disabled={!!currentBet || amt > wallet.totalBalance}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 ${
                    betAmount === amt
                      ? 'bg-purple-500/30 border border-purple-500/50 text-purple-400'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Wallet Breakdown */}
            {!walletLoading && (
              <div className="mb-3 p-3 rounded-xl bg-white/5 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-white/40">Deposit</p>
                  <p className="text-blue-400 font-semibold">
                    ₹{wallet.depositBalance.toFixed(0)}
                  </p>
                </div>
                <div className="text-center border-x border-white/10">
                  <p className="text-white/40">Winnings</p>
                  <p className="text-green-400 font-semibold">
                    ₹{wallet.winningBalance.toFixed(0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white/40">Bonus</p>
                  <p className="text-yellow-400 font-semibold">
                    ₹{wallet.bonusBalance.toFixed(0)}
                  </p>
                </div>
              </div>
            )}

            {/* Potential Win */}
            {selectedColor && !currentBet && (
              <div className="mb-4 p-3 rounded-xl bg-white/5 flex justify-between text-sm">
                <span className="text-white/50">Potential Win:</span>
                <span className="font-bold text-green-400">
                  ₹{Math.floor(betAmount * MULTIPLIERS[selectedColor])}
                </span>
              </div>
            )}

            {/* Insufficient balance warning */}
            {!walletLoading && betAmount > wallet.totalBalance && (
              <div className="mb-3 p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-center">
                ⚠️ Insufficient balance
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
                ? '⏳ Placing...'
                : currentBet
                ? `✅ ₹${currentBet.amount} on ${colorConfig[currentBet.color].label}`
                : phase !== 'betting'
                ? '⏳ Round in progress...'
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
                      className={`w-6 h-6 rounded-full flex-shrink-0 ${colorConfig[bet.result].bg}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white">
                        #{bet.round} • {colorConfig[bet.color].label}
                      </p>
                      <p className="text-[10px] text-white/40">₹{bet.amount}</p>
                    </div>
                    <span
                      className={`text-xs font-bold ${bet.won ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {bet.won ? `+₹${bet.payout}` : `-₹${bet.amount}`}
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
                    {round.result === 'red' ? 'R' : round.result === 'green' ? 'G' : 'V'}
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
                { user: 'R***j', color: 'red' as ColorChoice, amount: 500 },
                { user: 'P***a', color: 'green' as ColorChoice, amount: 200 },
                { user: 'A***t', color: 'violet' as ColorChoice, amount: 1000 },
                { user: 'N***a', color: 'red' as ColorChoice, amount: 150 },
                { user: 'S***n', color: 'green' as ColorChoice, amount: 300 },
              ].map((bet, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3"
                >
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 ${colorConfig[bet.color].bg}`} />
                  <span className="text-xs text-white/60 flex-1">{bet.user}</span>
                  <span className="text-xs font-semibold text-white">₹{bet.amount}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**What caused the build error:**

The Vercel build was failing because the previous response accidentally included ` ```tsx ` code fence markers **inside the file content** at lines 2-3, which is invalid TypeScript syntax that esbuild cannot parse.

**This clean version also includes:**
- Proper `Record<ColorChoice, number>` typing for `MULTIPLIERS`
- Proper `Record<ColorChoice, {...}>` typing for `colorConfig`  
- `error instanceof Error` checks instead of `any` for better TypeScript compliance
- `as ColorChoice` casts on the live bets array to avoid implicit `any`
