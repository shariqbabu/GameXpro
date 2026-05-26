import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { createNewRound, getCurrentRound, placeBet, processRoundResult, getRecentRounds } from '../services/gameService';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';
import type { GameRound } from '../types';

const ROUND_DURATION = 30;

const ColorGame: React.FC = () => {
  const { userProfile } = useAuth();
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [selectedColor, setSelectedColor] = useState<'red' | 'green' | 'violet' | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [betPlaced, setBetPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<'red' | 'green' | 'violet' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [recentRounds, setRecentRounds] = useState<GameRound[]>([]);
  const [gamePhase, setGamePhase] = useState<'betting' | 'processing' | 'result'>('betting');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processedRef = useRef(false);

  const loadRecentRounds = useCallback(async () => {
    try {
      const rounds = await getRecentRounds(10);
      setRecentRounds(rounds);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const startNewRound = useCallback(async () => {
    processedRef.current = false;
    setBetPlaced(false);
    setSelectedColor(null);
    setShowResult(false);
    setGamePhase('betting');
    try {
      const round = await createNewRound();
      setCurrentRound(round);
      setTimeLeft(ROUND_DURATION);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTimerEnd = useCallback(async () => {
    if (processedRef.current || !currentRound) return;
    processedRef.current = true;
    setGamePhase('processing');

    try {
      const result = await processRoundResult(currentRound.id);
      setLastResult(result);
      setShowResult(true);
      setGamePhase('result');
      await loadRecentRounds();

      setTimeout(() => {
        setShowResult(false);
        startNewRound();
      }, 4000);
    } catch (e) {
      console.error(e);
      setTimeout(startNewRound, 2000);
    }
  }, [currentRound, loadRecentRounds, startNewRound]);

  useEffect(() => {
    const init = async () => {
      await loadRecentRounds();
      const existing = await getCurrentRound();
      if (existing) {
        setCurrentRound(existing);
        setTimeLeft(ROUND_DURATION);
      } else {
        await startNewRound();
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!currentRound || gamePhase !== 'betting') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound?.id, gamePhase]);

  const handlePlaceBet = async () => {
    if (!selectedColor || !currentRound || betPlaced || !userProfile) return;
    if (betAmount < 10) { toast.error('Minimum bet is ₹10'); return; }
    if (betAmount > (userProfile.walletBalance || 0)) { toast.error('Insufficient balance'); return; }
    if (timeLeft < 5) { toast.error('Betting closed! Wait for next round'); return; }

    setLoading(true);
    try {
      await placeBet(userProfile.uid, userProfile.displayName, currentRound.id, selectedColor, betAmount);
      setBetPlaced(true);
      toast.success(`Bet placed on ${selectedColor.toUpperCase()}! 🎯`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [10, 50, 100, 200, 500, 1000];

  const colorConfig = {
    red: { gradient: 'from-red-600 to-red-500', glow: 'shadow-red-500/50', label: 'RED', multiplier: '2x', emoji: '🔴' },
    green: { gradient: 'from-green-600 to-green-500', glow: 'shadow-green-500/50', label: 'GREEN', multiplier: '2x', emoji: '🟢' },
    violet: { gradient: 'from-purple-600 to-violet-500', glow: 'shadow-purple-500/50', label: 'VIOLET', multiplier: '3x', emoji: '🟣' },
  };

  const timerPct = (timeLeft / ROUND_DURATION) * 100;
  const timerColor = timeLeft > 15 ? '#22c55e' : timeLeft > 7 ? '#f59e0b' : '#ef4444';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">🎨 Color Prediction</h1>
          <p className="text-gray-400 text-sm">Predict the winning color and multiply your points!</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Balance</p>
          <p className="text-green-400 font-orbitron font-bold text-lg">{formatCurrency(userProfile?.walletBalance || 0)}</p>
        </div>
      </motion.div>

      {/* Game Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Round #{currentRound?.roundNumber || '...'}</span>
              <span className="text-purple-400 text-sm font-medium">
                {gamePhase === 'betting' ? '🟢 Betting Open' : gamePhase === 'processing' ? '⏳ Processing...' : '🎉 Result!'}
              </span>
            </div>

            {/* Circular Timer */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={timerColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - timerPct / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl font-orbitron font-bold timer-glow" style={{ color: timerColor }}>
                      {gamePhase === 'betting' ? timeLeft : gamePhase === 'processing' ? '⏳' : '✅'}
                    </span>
                    {gamePhase === 'betting' && <p className="text-gray-400 text-xs">seconds</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(to right, ${timerColor}, ${timerColor}aa)`, width: `${timerPct}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </motion.div>

          {/* Result Overlay */}
          <AnimatePresence>
            {showResult && lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={`glass border rounded-2xl p-8 text-center bg-gradient-to-br ${colorConfig[lastResult].gradient} bg-opacity-20`}
              >
                <div className="text-6xl mb-4 animate-bounce">{colorConfig[lastResult].emoji}</div>
                <h2 className="text-3xl font-orbitron font-bold text-white mb-2">
                  {colorConfig[lastResult].label} WINS!
                </h2>
                <p className="text-gray-300">
                  {betPlaced && selectedColor === lastResult ? '🎉 You Won!' : betPlaced ? '😔 Better luck next time!' : 'Round Complete!'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Color Selection */}
          {!showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-white font-semibold mb-4">Choose Color</h3>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(colorConfig) as ('red' | 'green' | 'violet')[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => !betPlaced && setSelectedColor(color)}
                    disabled={betPlaced || gamePhase !== 'betting'}
                    className={`relative p-4 rounded-xl font-bold text-white transition-all duration-300 bg-gradient-to-br ${colorConfig[color].gradient} ${
                      selectedColor === color
                        ? `ring-2 ring-white shadow-lg shadow-lg ${colorConfig[color].glow} scale-105`
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="text-3xl mb-1">{colorConfig[color].emoji}</div>
                    <div className="font-orbitron text-sm">{colorConfig[color].label}</div>
                    <div className="text-xs opacity-80">{colorConfig[color].multiplier}</div>
                    {selectedColor === color && (
                      <motion.div
                        layoutId="selected"
                        className="absolute inset-0 rounded-xl ring-2 ring-white"
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bet Amount */}
          {!showResult && !betPlaced && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-white font-semibold mb-4">Bet Amount</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  value={betAmount}
                  onChange={e => setBetAmount(Math.max(10, Number(e.target.value)))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-orbitron focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      betAmount === amount
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePlaceBet}
                disabled={!selectedColor || loading || gamePhase !== 'betting' || timeLeft < 5}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg transition-all hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:scale-98"
              >
                {loading ? '⏳ Placing...' : !selectedColor ? '👆 Select a Color First' : `🎯 Place ₹${betAmount} on ${selectedColor.toUpperCase()}`}
              </button>
            </motion.div>
          )}

          {betPlaced && !showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass border border-green-500/30 rounded-2xl p-5 text-center bg-green-500/10"
            >
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-white font-bold text-lg">Bet Placed Successfully!</h3>
              <p className="text-gray-400 text-sm mt-1">
                ₹{betAmount} on {selectedColor?.toUpperCase()} — Waiting for result...
              </p>
              <div className="mt-3 flex justify-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Result History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass border border-white/10 rounded-2xl p-5 h-fit"
        >
          <h3 className="text-white font-semibold mb-4">📜 Result History</h3>
          
          {/* Color balls grid */}
          <div className="flex flex-wrap gap-2 mb-4">
            {recentRounds.slice(0, 20).map((round) => (
              <div
                key={round.id}
                title={`Round ${round.roundNumber}: ${round.result}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                  round.result === 'red' ? 'bg-red-500 shadow-red-500/30' :
                  round.result === 'green' ? 'bg-green-500 shadow-green-500/30' :
                  'bg-purple-500 shadow-purple-500/30'
                }`}
              >
                {round.result?.[0].toUpperCase()}
              </div>
            ))}
          </div>

          {/* Stats */}
          {recentRounds.length > 0 && (
            <div className="space-y-2">
              {['red', 'green', 'violet'].map(color => {
                const count = recentRounds.filter(r => r.result === color).length;
                const pct = Math.round((count / recentRounds.length) * 100);
                return (
                  <div key={color} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      color === 'red' ? 'bg-red-500' : color === 'green' ? 'bg-green-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-gray-400 text-xs capitalize flex-1">{color}</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          color === 'red' ? 'bg-red-500' : color === 'green' ? 'bg-green-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-white text-xs w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Results List */}
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {recentRounds.map((round) => (
              <div key={round.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-gray-500 text-xs">#{round.roundNumber}</span>
                <div className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                  round.result === 'red' ? 'bg-red-500/20 text-red-400' :
                  round.result === 'green' ? 'bg-green-500/20 text-green-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  {round.result?.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ColorGame;
