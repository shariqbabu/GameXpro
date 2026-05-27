// ============================================================
// DICE EVEN/ODD GAME
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWallet } from '../../hooks/useWallet';
import { placeDiceBet, subscribeDiceRounds } from '../../services/gameService';
import { DiceRound, DiceBet } from '../../types';
import { formatCurrency } from '../../utils/wallet';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DICE_DOTS: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DiceDisplay({ value, rolling }: { value: number; rolling?: boolean }) {
  const dots = DICE_DOTS[value] || [];
  return (
    <div className={`relative w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-2 ${rolling ? 'animate-spin-dice' : ''}`}>
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
        {Array.from({ length: 9 }).map((_, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const hasDot = dots.some(([r, c]) => r === row && c === col);
          return (
            <div key={idx} className="flex items-center justify-center">
              {hasDot && <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-900" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DiceGame() {
  const { user } = useAuthStore();
  const { wallet } = useWallet();
  const [rounds, setRounds] = useState<DiceRound[]>([]);
  const [betAmount, setBetAmount] = useState('50');
  const [selectedBet, setSelectedBet] = useState<DiceBet | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [myBetRoundId, setMyBetRoundId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeDiceRounds((r) => setRounds(r), 10);
    return () => unsub();
  }, []);

  const currentRound = rounds.find((r) => r.status === 'betting') || rounds[0];
  const myBetRound = rounds.find((r) => r.id === myBetRoundId);
  const hasMyBet = currentRound?.players.some((p) => p.uid === user?.uid);

  const handleBet = async () => {
    if (!selectedBet) { toast.error('Select Even or Odd'); return; }
    const amt = parseFloat(betAmount);
    if (isNaN(amt) || amt < 10) { toast.error('Minimum bet is ₹10'); return; }
    if ((wallet?.totalBalance || 0) < amt) { toast.error('Insufficient balance'); return; }
    if (!user?.uid) return;

    setIsPlacing(true);
    try {
      const roundId = await placeDiceBet(user.uid, user.name, selectedBet, amt);
      setMyBetRoundId(roundId);
      toast.success(`Bet placed: ${selectedBet.toUpperCase()} for ${formatCurrency(amt)}`);
      setSelectedBet(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to place bet');
    } finally {
      setIsPlacing(false);
    }
  };

  const latestFinished = rounds.filter((r) => r.status === 'finished');

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎲 Dice Even/Odd</h1>
          <p className="text-slate-400 text-sm mt-1">Bet on even or odd • Win 1.9x</p>
        </div>
        {wallet && (
          <div className="glass-card-light px-4 py-2 rounded-xl">
            <p className="text-xs text-slate-400">Balance</p>
            <p className="text-yellow-400 font-semibold">{formatCurrency(wallet.totalBalance)}</p>
          </div>
        )}
      </div>

      {/* Current Round / Dice Display */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {currentRound?.status === 'betting' ? 'Active Round' :
             currentRound?.status === 'rolling' ? 'Rolling...' :
             currentRound?.status === 'finished' ? 'Round Result' : 'No Active Round'}
          </h2>
          {currentRound?.status === 'betting' && (
            <div className="flex items-center gap-1.5 text-yellow-400 text-sm">
              <Clock className="w-4 h-4" />
              Betting Open
            </div>
          )}
        </div>

        {/* Dice */}
        <div className="flex items-center justify-center gap-6 my-6">
          <DiceDisplay
            value={currentRound?.dice1 || 1}
            rolling={currentRound?.status === 'rolling'}
          />
          <div className="text-3xl font-bold text-slate-500">+</div>
          <DiceDisplay
            value={currentRound?.dice2 || 1}
            rolling={currentRound?.status === 'rolling'}
          />
          {currentRound?.status === 'finished' && (
            <>
              <div className="text-3xl font-bold text-slate-500">=</div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{currentRound.total}</p>
                <p className={`text-sm font-bold mt-1 ${currentRound.result === 'even' ? 'text-blue-400' : 'text-red-400'}`}>
                  {currentRound.result?.toUpperCase()}
                </p>
              </div>
            </>
          )}
        </div>

        {currentRound?.status === 'finished' && currentRound.result && (
          <div className={`text-center p-3 rounded-xl mb-4 ${
            currentRound.result === 'even' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <p className="text-lg font-bold">
              {currentRound.dice1} + {currentRound.dice2} = {currentRound.total} →{' '}
              <span className={currentRound.result === 'even' ? 'text-blue-400' : 'text-red-400'}>
                {currentRound.result.toUpperCase()}
              </span>
            </p>
            {currentRound.winnerUids?.includes(user?.uid || '') && (
              <p className="text-green-400 font-semibold mt-1">🏆 You Won!</p>
            )}
          </div>
        )}
      </div>

      {/* Betting Controls */}
      {!hasMyBet ? (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Place Your Bet</h2>

          {/* Even/Odd Selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedBet('even')}
              className={`py-4 rounded-xl font-bold text-lg transition-all border-2 ${
                selectedBet === 'even'
                  ? 'bg-blue-600 border-blue-400 text-white neon-glow-purple'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
              }`}
            >
              Even
              <p className="text-xs font-normal mt-0.5 opacity-70">1.9x Payout</p>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedBet('odd')}
              className={`py-4 rounded-xl font-bold text-lg transition-all border-2 ${
                selectedBet === 'odd'
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
            >
              Odd
              <p className="text-xs font-normal mt-0.5 opacity-70">1.9x Payout</p>
            </motion.button>
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

          {/* Quick Amounts */}
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

          <button
            onClick={handleBet}
            disabled={isPlacing || !selectedBet}
            className="btn-primary w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
          >
            {isPlacing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Placing Bet...
              </div>
            ) : (
              selectedBet
                ? `Bet ${selectedBet.toUpperCase()} - ${formatCurrency(parseFloat(betAmount) || 0)}`
                : 'Select Even or Odd'
            )}
          </button>
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-white font-semibold">Bet Placed!</p>
          <p className="text-slate-400 text-sm mt-1">Waiting for dice to roll...</p>
          {myBetRound && (
            <p className="text-purple-400 text-sm mt-2">
              Your bet: {myBetRound.players.find((p) => p.uid === user?.uid)?.bet?.toUpperCase()} •{' '}
              {formatCurrency(myBetRound.players.find((p) => p.uid === user?.uid)?.amount || 0)}
            </p>
          )}
        </div>
      )}

      {/* Recent Results */}
      {latestFinished.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Results</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {latestFinished.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">
                    {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'h:mm a') : ''}
                  </span>
                  <span className="text-white">{r.dice1} + {r.dice2} = {r.total}</span>
                </div>
                <span className={`font-bold px-3 py-0.5 rounded-full text-xs ${
                  r.result === 'even' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {r.result?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
