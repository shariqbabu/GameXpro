// ============================================================
// GAMES LOBBY PAGE
// ============================================================

import { Link } from 'react-router-dom';
import { StatCard, GlowButton } from '../components';
import { motion } from 'framer-motion';
import { Gamepad2, Users, Zap, Clock } from 'lucide-react';

const games = [
  {
    title: '2 Player Card Casino',
    description: 'Real-time 2-player card battle. The player with the highest card wins the pot!',
    longDesc: 'Draw a card from a shuffled deck. Higher card wins 95% of the pot. Auto-matched with another player.',
    icon: '🃏',
    path: '/games/casino',
    gradient: 'from-yellow-500/20 via-orange-500/10 to-red-500/5',
    border: 'border-yellow-500/30',
    glow: 'neon-glow-gold',
    badge: '2 Players',
    badgeIcon: Users,
    features: ['Auto Matchmaking', 'Animated Cards', '₹50 Buy-in', '95% Payout'],
    betLabel: '₹50 per game',
    playerCount: '2',
  },
  {
    title: 'Dice Even/Odd',
    description: 'Roll two dice and bet whether the total will be even or odd. Win 1.9x your bet!',
    longDesc: 'Two dice are rolled every 15 seconds. Predict even or odd to win 1.9x your bet amount.',
    icon: '🎲',
    path: '/games/dice',
    gradient: 'from-blue-500/20 via-cyan-500/10 to-teal-500/5',
    border: 'border-blue-500/30',
    glow: '',
    badge: 'Live Rounds',
    badgeIcon: Zap,
    features: ['1.9x Payout', '15s Rounds', 'Min ₹10 Bet', 'Result History'],
    betLabel: 'Min ₹10',
    playerCount: 'Unlimited',
  },
  {
    title: 'Color Prediction',
    description: 'Predict Red, Green, or Violet. Win 2x-4.5x your bet in 30-second live rounds!',
    longDesc: 'Bet on Red (2x), Green (2x), or Violet (4.5x). Results every 30 seconds with live countdown.',
    icon: '🎨',
    path: '/games/color',
    gradient: 'from-purple-500/20 via-pink-500/10 to-fuchsia-500/5',
    border: 'border-purple-500/30',
    glow: 'neon-glow-purple',
    badge: 'Realtime',
    badgeIcon: Clock,
    features: ['Up to 4.5x Win', '30s Countdown', 'Live Rounds', 'Auto Next Round'],
    betLabel: 'Min ₹10',
    playerCount: 'Live',
  },
];

export function GamesPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-purple-400" /> Games Lobby
        </h1>
        <p className="text-slate-400 text-sm mt-1">Choose your game and start winning</p>
      </motion.div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map((game, i) => (
          <motion.div
            key={game.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={game.path}
              className={`block glass-card bg-gradient-to-br ${game.gradient} border ${game.border} ${game.glow} hover:scale-[1.02] transition-all duration-300 group overflow-hidden`}
            >
              {/* Game Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {game.icon}
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-white/10 text-white px-2 py-1 rounded-full">
                    <game.badgeIcon className="w-3 h-3" />
                    {game.badge}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mb-2">{game.title}</h2>
                <p className="text-slate-400 text-sm">{game.description}</p>
              </div>

              {/* Features */}
              <div className="px-6 py-3 border-t border-white/5">
                <div className="grid grid-cols-2 gap-1.5">
                  {game.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Bet Amount</p>
                  <p className="text-sm font-semibold text-yellow-400">{game.betLabel}</p>
                </div>
                <div className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold text-white group-hover:opacity-90 transition-all">
                  Play Now →
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-5 border border-yellow-500/20 bg-yellow-500/5"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-yellow-400 font-semibold text-sm">Gaming Responsibly</p>
            <p className="text-slate-400 text-xs mt-1">
              All games use secure Firestore transactions. Results are determined server-side to ensure fairness.
              Minimum balance required to participate. Please play responsibly.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
