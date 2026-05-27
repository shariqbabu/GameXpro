// ============================================================
// COLOR PREDICTION GAME
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWallet } from '../../hooks/useWallet';
import {
  getOrCreateColorRound,
  placeColorBet,
  subscribeColorRounds,
} from '../../services/gameService';
import { ColorRound, ColorBet } from '../../types';
import { formatCurrency } from '../../utils/wallet';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const COLOR_CONFIG = {
  red: { label: 'Red', emoji: '🔴', multiplier: '2x', bg: 'color-btn-red', textColor: 'text-red-400', lightBg: 'bg-red-500/10 border-red-500/20' },
  green: { label: 'Green', emoji: '🟢', multiplier: '2x', bg: 'color-btn-green', textColor: 'text-green-400', lightBg: 'bg-green-500/10 border-green-500/20' },
  violet: { label: 'Violet', emoji: '🟣', multiplier: '4.5x', bg: 'color-btn-violet', textColor: 'text-purple-400', lightBg: 'bg-purple-500/10 border-purple-500/20' },
};

function CountdownTimer({ endTime }: { endTime: import('firebase/firestore').Timestamp | null }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (!endTime) return;
    const update = () => {
      const now = Date.now();
      const end = endTime.toMillis();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setSeconds(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const pct = (seconds / 30) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke={seconds <= 5 ? '#ef4444' : seconds <= 10 ? '#f5c842' : '#8b5cf6'}
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold font-casino ${seconds <= 5 ? 'text-red-400' : seconds <= 10 ? 'text-yellow-400' : 'text-white'}`}>
            {seconds}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-400">seconds left</p>
    </div>
  );
}

export function ColorGame() {
  const { user } = useAuthStore();
  const { wallet } = useWallet();
  const [rounds, setRounds] = useState<ColorRound[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState('50');
  const [selectedColor, setSelectedColor] = useState<ColorBet | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsub = subscribeColorRounds((r) => {
      setRounds(r);
      const betting = r.find((round) => round.status === 'betting');
      if (betting) {
        setActiveRoundId(betting.id);
      }
      setIsInitializing(false);
    }, 10);
    return () => unsub();
  }, []);

  useEffect(() => {
    // Initialize first round if none exists
    const timer = setTimeout(async () => {
      if (isInitializing) return;
      const betting = rounds.find((r) => r.status === 'betting');
      if (!betting) {
        try {
          const id = await getOrCreateColorRound();
          setActiveRoundId(id);
        } catch (err) {
          console.error('Failed to create round:', err);
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isInitializing, rounds]);

  const activeRound = rounds.find((r) => r.id === activeRoundId);
  const hasMyBet = activeRound?.players.some((p) => p.uid === user?.uid);
  const myBet = activeRound?.players.find((p) => p.uid === user?.uid);
  const finishedRounds = rounds.filter((r) => r.status === 'finished');

  const handleBet = async () => {
    if (!selectedColor) { toast.error('Select a color'); return; }
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) { toast.error('Minimum bet is ₹10'); return; }
    if ((wallet?.totalBalance || 0) < amt) { toast.error('Insufficient balance'); return; }
    if (!user?.uid || !activeRoundId) return;
    if (hasMyBet) { toast.error('You already placed a bet in this round'); return; }

    setIsPlacing(true);
    try {
      await placeColorBet(user.uid, user.name, selectedColor, amt, activeRoundId);
      toast.success(`Bet on ${selectedColor.toUpperCase()} for ${formatCurrency(amt)}`);
      setSelectedColor(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to place bet');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎨 Color Prediction</h1>
          <p className="text-slate-400 text-sm mt-1">Bet on Red, Green, or Violet</p>
        </div>
        {wallet && (
          <div className="glass-card-light px-4 py-2 rounded-xl">
            <p className="text-xs text-slate-400">Balance</p>
            <p className="text-yellow-400 font-semibold">{formatCurrency(wallet.totalBalance)}</p>
          </div>
        )}
      </div>

      {/* Active Round */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            {activeRound?.status === 'betting' ? 'Live Round' :
             activeRound?.status === 'revealing' ? 'Revealing...' :
             activeRound?.status === 'finished' ? 'Round Ended' : 'Starting...'}
          </h2>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Users className="w-3.5 h-3.5" />
            {activeRound?.players.length || 0} players
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Timer */}
          <div className="flex-shrink-0">
            {activeRound?.status === 'betting' && activeRound.endTime ? (
              <CountdownTimer endTime={activeRound.endTime} />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Result Display */}
          {activeRound?.status === 'finished' && activeRound.result ? (
            <div className="flex-1 ml-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl border ${COLOR_CONFIG[activeRound.result as ColorBet]?.lightBg}`}
              >
                <span className="text-4xl">{COLOR_CONFIG[activeRound.result as ColorBet]?.emoji}</span>
                <span className={`text-xl font-bold ${COLOR_CONFIG[activeRound.result as ColorBet]?.textColor}`}>
                  {COLOR_CONFIG[activeRound.result as ColorBet]?.label}
                </span>
                {myBet?.bet === activeRound.result && (
                  <span className="text-green-400 text-xs font-semibold">🏆 You Won!</span>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 ml-6 text-center">
              <div className="flex justify-center gap-2">
                {(['red', 'green', 'violet'] as ColorBet[]).map((c) => (
                  <div
                    key={c}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${
                      c === 'red' ? 'bg-red-500' : c === 'green' ? 'bg-green-500' : 'bg-purple-500'
                    } animate-pulse`}
                    style={{ animationDelay: `${['red','green','violet'].indexOf(c) * 0.3}s` }}
                  />
                ))}
              </div>
              <p className="text-slate-400 text-xs mt-2">Waiting for result...</p>
            </div>
          )}

          {/* Total Bet */}
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-400">Total Bets</p>
            <p className="text-yellow-400 font-bold">{formatCurrency(activeRound?.totalBet || 0)}</p>
          </div>
        </div>
      </div>

      {/* My Current Bet */}
      {hasMyBet && myBet && (
        <div className="glass-card p-4 bg-purple-500/5 border border-purple-500/20">
          <p className="text-purple-400 text-sm font-medium">
            ✅ Your Bet: {COLOR_CONFIG[myBet.bet]?.emoji} {COLOR_CONFIG[myBet.bet]?.label} • {formatCurrency(myBet.amount)}
          </p>
          <p className="text-slate-400 text-xs mt-1">Potential Win: {formatCurrency(myBet.amount * parseFloat(COLOR_CONFIG[myBet.bet]?.multiplier || '2') * 0.95)}</p>
        </div>
      )}

      {/* Color Betting Buttons */}
      {!hasMyBet && activeRound?.status === 'betting' && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Choose Your Color</h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {(Object.entries(COLOR_CONFIG) as [ColorBet, typeof COLOR_CONFIG.red][]).map(([color, cfg]) => (
              <motion.button
                key={color}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedColor(color)}
                className={`${cfg.bg} py-4 rounded-xl font-bold text-white transition-all border-2 ${
                  selectedColor === color
                    ? 'border-white scale-105 shadow-lg'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                <span className="text-2xl block mb-1">{cfg.emoji}</span>
                <span className="text-sm">{cfg.label}</span>
                <span className="text-xs opacity-75 block">{cfg.multiplier}</span>
              </motion.button>
            ))}
          </div>

          {/* Amount */}
          <div className="mb-3">
            <label className="block text-sm text-slate-300 mb-2">Bet Amount (₹)</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="input-casino"
              placeholder="Min ₹10"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[10, 50, 100, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt.toString())}
                className="px-3 py-1 rounded-lg text-xs glass-card-light text-slate-300 hover:text-white transition-all"
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {selectedColor && (
            <div className={`p-3 rounded-xl mb-3 border text-center text-sm ${COLOR_CONFIG[selectedColor].lightBg}`}>
              <p className={COLOR_CONFIG[selectedColor].textColor}>
                Betting {COLOR_CONFIG[selectedColor].emoji} {COLOR_CONFIG[selectedColor].label} •
                Win = {formatCurrency((parseFloat(betAmount) || 0) * parseFloat(COLOR_CONFIG[selectedColor].multiplier) * 0.95)}
              </p>
            </div>
          )}

          <button
            onClick={handleBet}
            disabled={isPlacing || !selectedColor}
            className="btn-primary w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
          >
            {isPlacing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Placing Bet...
              </div>
            ) : selectedColor ? (
              `Place Bet on ${COLOR_CONFIG[selectedColor].label}`
            ) : (
              'Select a Color to Bet'
            )}
          </button>
        </div>
      )}

      {/* Recent Results */}
      {finishedRounds.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Results</h2>
          <div className="flex flex-wrap gap-2">
            {finishedRounds.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
                  r.result === 'red' ? 'bg-red-500 border-red-400' :
                  r.result === 'green' ? 'bg-green-500 border-green-400' :
                  r.result === 'violet' ? 'bg-purple-600 border-purple-400' :
                  'bg-slate-700 border-slate-600'
                }`}
                title={r.result || 'Unknown'}
              >
                {COLOR_CONFIG[r.result as ColorBet]?.emoji || '?'}
              </div>
            ))}
          </div>

          {/* Result History Table */}
          <div className="mt-4 space-y-1.5 max-h-40 overflow-y-auto">
            {finishedRounds.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                <span className="text-slate-500">
                  {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'h:mm a') : ''}
                </span>
                <span className={`font-bold px-3 py-0.5 rounded-full ${
                  r.result === 'red' ? 'bg-red-500/20 text-red-400' :
                  r.result === 'green' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {COLOR_CONFIG[r.result as ColorBet]?.emoji} {r.result?.toUpperCase()}
                </span>
                <span className="text-slate-400">{formatCurrency(r.totalBet)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
