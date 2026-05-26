import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, addTransaction } from '../services/userService';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const segments = [
  { label: '₹10', value: 10, color: '#ef4444', prob: 0.3 },
  { label: '₹50', value: 50, color: '#f59e0b', prob: 0.25 },
  { label: '₹100', value: 100, color: '#22c55e', prob: 0.2 },
  { label: '₹200', value: 200, color: '#3b82f6', prob: 0.12 },
  { label: '₹500', value: 500, color: '#7c3aed', prob: 0.08 },
  { label: '₹1000', value: 1000, color: '#ec4899', prob: 0.04 },
  { label: 'Try Again', value: 0, color: '#6b7280', prob: 0.01 },
];

const SpinWheel: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof segments[0] | null>(null);
  const [spinsToday, setSpinsToday] = useState(0);
  const [history, setHistory] = useState<{ label: string; value: number; time: string }[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);
  const MAX_SPINS = 3;

  const getWeightedResult = () => {
    const rand = Math.random();
    let cumulative = 0;
    for (const segment of segments) {
      cumulative += segment.prob;
      if (rand <= cumulative) return segment;
    }
    return segments[0];
  };

  const spin = async () => {
    if (spinning || spinsToday >= MAX_SPINS || !userProfile) return;
    setSpinning(true);
    setResult(null);

    const winner = getWeightedResult();
    const winnerIndex = segments.indexOf(winner);
    const segmentAngle = 360 / segments.length;
    const targetAngle = 360 - (winnerIndex * segmentAngle + segmentAngle / 2);
    const spins = 5 + Math.random() * 5;
    const finalRotation = rotation + spins * 360 + targetAngle;

    setRotation(finalRotation);

    setTimeout(async () => {
      setResult(winner);
      setSpinning(false);
      setSpinsToday(prev => prev + 1);

      if (winner.value > 0 && userProfile) {
        try {
          await updateUserProfile(userProfile.uid, {
            walletBalance: (userProfile.walletBalance || 0) + winner.value,
            bonusAmount: (userProfile.bonusAmount || 0) + winner.value,
            totalPoints: (userProfile.totalPoints || 0) + winner.value,
          });
          await addTransaction(userProfile.uid, 'bonus', winner.value, `Spin wheel reward - ${winner.label}`);
          await refreshProfile();
          toast.success(`🎉 You won ${winner.label}!`);
        } catch {
          toast.error('Error processing reward');
        }
      } else if (winner.value === 0) {
        toast('Better luck next time! 🍀');
      }

      setHistory(prev => [
        { label: winner.label, value: winner.value, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9)
      ]);
    }, 4000);
  };

  const segmentAngle = 360 / segments.length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <h1 className="text-2xl font-bold text-white font-orbitron">🎡 Spin Wheel</h1>
        <p className="text-gray-400 text-sm mt-1">Spin the wheel to win amazing rewards!</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wheel */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/10 rounded-2xl p-6 text-center"
          >
            {/* Spins remaining */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: MAX_SPINS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${i < spinsToday ? 'bg-gray-600' : 'bg-purple-500 glow-purple'}`}
                />
              ))}
              <span className="text-gray-400 text-xs ml-2">{MAX_SPINS - spinsToday} spins left</span>
            </div>

            {/* Wheel Container */}
            <div className="relative inline-block">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0" style={{
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: '24px solid #7c3aed',
                  filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.8))'
                }} />
              </div>

              {/* Wheel */}
              <div
                ref={wheelRef}
                className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full shadow-2xl"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute inset-0">
                  {segments.map((seg, i) => {
                    const startAngle = (i * segmentAngle * Math.PI) / 180;
                    const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;
                    const x1 = 100 + 95 * Math.cos(startAngle);
                    const y1 = 100 + 95 * Math.sin(startAngle);
                    const x2 = 100 + 95 * Math.cos(endAngle);
                    const y2 = 100 + 95 * Math.sin(endAngle);
                    const midAngle = ((i + 0.5) * segmentAngle * Math.PI) / 180;
                    const textX = 100 + 65 * Math.cos(midAngle);
                    const textY = 100 + 65 * Math.sin(midAngle);

                    return (
                      <g key={i}>
                        <path
                          d={`M 100 100 L ${x1} ${y1} A 95 95 0 0 1 ${x2} ${y2} Z`}
                          fill={seg.color}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth="1"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill="white"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${(i + 0.5) * segmentAngle + 90}, ${textX}, ${textY})`}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                  {/* Center circle */}
                  <circle cx="100" cy="100" r="15" fill="#1a1a2e" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                  <text x="100" y="105" textAnchor="middle" fill="white" fontSize="12">🎮</text>
                </svg>
              </div>
            </div>

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mt-4 p-4 rounded-xl ${result.value > 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-500/20 border border-gray-500/30'}`}
              >
                <p className={`text-xl font-orbitron font-bold ${result.value > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                  {result.value > 0 ? `🎉 You Won ${result.label}!` : '😔 Try Again!'}
                </p>
              </motion.div>
            )}

            <button
              onClick={spin}
              disabled={spinning || spinsToday >= MAX_SPINS}
              className="mt-6 px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg transition-all hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
            >
              {spinning ? '🌀 Spinning...' : spinsToday >= MAX_SPINS ? '🔒 No Spins Left Today' : '🎡 SPIN NOW!'}
            </button>

            {spinsToday >= MAX_SPINS && (
              <p className="text-gray-500 text-xs mt-2">Daily spins reset at midnight</p>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass border border-white/10 rounded-2xl p-4"
          >
            <p className="text-gray-400 text-sm mb-1">Current Balance</p>
            <p className="text-green-400 font-orbitron font-bold text-2xl">{formatCurrency(userProfile?.walletBalance || 0)}</p>
          </motion.div>

          {/* Prizes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass border border-white/10 rounded-2xl p-4"
          >
            <h3 className="text-white font-semibold mb-3">🎁 Possible Prizes</h3>
            <div className="space-y-1.5">
              {segments.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-white text-sm">{seg.label}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{Math.round(seg.prob * 100)}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Spin History */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="glass border border-white/10 rounded-2xl p-4"
            >
              <h3 className="text-white font-semibold mb-3">📜 Spin History</h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className={h.value > 0 ? 'text-green-400' : 'text-gray-400'}>{h.label}</span>
                    <span className="text-gray-500 text-xs">{h.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
