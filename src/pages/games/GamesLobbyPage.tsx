import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlowButton } from '../../components/ui/GlowButton';
import { Users, Zap, Trophy, ArrowRight } from 'lucide-react';

const games = [
  {
    id: 'color',
    name: 'Color Prediction',
    emoji: '🎨',
    description: 'Predict Red, Green, or Violet and win up to 9x your bet! Live rounds every 3 minutes.',
    path: '/games/color',
    players: '12,481',
    minBet: '₹10',
    maxBet: '₹10,000',
    winMultiplier: '9x',
    badge: 'LIVE',
    badgeColor: 'bg-red-500',
    gradient: 'from-red-500/20 via-pink-500/10 to-purple-500/20',
    border: 'border-purple-500/30',
    features: ['Live rounds every 3 min', 'Up to 9x multiplier', 'Instant results', 'Real-time chat'],
    stats: { winRate: '47%', avgPayout: '₹285', totalRounds: '24,891' },
  },
  {
    id: 'ludo',
    name: 'Ludo Battle',
    emoji: '🎲',
    description: 'Challenge real players in 1v1 Ludo. Pay entry fee, winner takes all! Real-time multiplayer.',
    path: '/games/ludo',
    players: '8,234',
    minBet: '₹50',
    maxBet: '₹5,000',
    winMultiplier: '1.9x',
    badge: 'HOT',
    badgeColor: 'bg-orange-500',
    gradient: 'from-blue-500/20 via-purple-500/10 to-cyan-500/20',
    border: 'border-cyan-500/30',
    features: ['1v1 Real-time', 'Winner takes all', 'Anti-cheat system', 'Reconnect support'],
    stats: { winRate: '50%', avgPayout: '₹190', totalRounds: '12,456' },
  },
];

const upcomingGames = [
  { name: 'Teen Patti', emoji: '🃏', status: 'Coming Soon', color: 'text-yellow-400' },
  { name: 'Rummy', emoji: '🀄', status: 'Coming Soon', color: 'text-green-400' },
  { name: 'Spin Wheel', emoji: '🎡', status: 'Coming Soon', color: 'text-pink-400' },
];

export const GamesLobbyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-purple-900/40 to-cyan-900/20 border border-purple-500/20"
      >
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-15 select-none">🎮</div>
        <h1 className="text-2xl font-bold font-sora gradient-text">Game Lobby</h1>
        <p className="text-white/50 text-sm mt-1">Choose your game and start winning real cash</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold">20,715</span> players online
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">₹4.2L+</span> won today
          </div>
        </div>
      </motion.div>

      {/* Active Games */}
      <div>
        <h2 className="text-lg font-bold font-sora text-white mb-4">🔥 Available Games</h2>
        <div className="grid gap-5">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl overflow-hidden bg-gradient-to-br ${game.gradient} border ${game.border} relative`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{game.emoji}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold font-sora text-white">{game.name}</h3>
                        <span className={`${game.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                          {game.badge}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 max-w-md">{game.description}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-black/20 text-center">
                    <p className="text-xs text-white/40 mb-1">Players</p>
                    <p className="text-sm font-bold text-green-400 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" /> {game.players}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 text-center">
                    <p className="text-xs text-white/40 mb-1">Win Up To</p>
                    <p className="text-sm font-bold text-yellow-400">{game.winMultiplier}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-black/20 text-center">
                    <p className="text-xs text-white/40 mb-1">Min Bet</p>
                    <p className="text-sm font-bold text-white">{game.minBet}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {game.features.map((feat, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-xs text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>

                {/* Additional stats */}
                <div className="flex items-center gap-4 text-xs text-white/30 mb-5">
                  <span>Win Rate: <span className="text-white/60">{game.stats.winRate}</span></span>
                  <span>Avg Payout: <span className="text-white/60">{game.stats.avgPayout}</span></span>
                  <span>Rounds: <span className="text-white/60">{game.stats.totalRounds}</span></span>
                </div>

                <GlowButton onClick={() => navigate(game.path)} size="lg">
                  <Zap className="w-4 h-4" /> Play {game.name} <ArrowRight className="w-4 h-4" />
                </GlowButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <h2 className="text-lg font-bold font-sora text-white mb-4">🚀 Coming Soon</h2>
        <div className="grid grid-cols-3 gap-3">
          {upcomingGames.map((game, i) => (
            <motion.div
              key={game.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass rounded-2xl p-4 border border-white/8 text-center opacity-60"
            >
              <div className="text-3xl mb-2">{game.emoji}</div>
              <p className="text-sm font-semibold text-white">{game.name}</p>
              <p className={`text-xs font-medium mt-1 ${game.color}`}>{game.status}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Responsible Gaming */}
      <div className="p-4 rounded-2xl bg-white/3 border border-white/5 text-center">
        <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
        <p className="text-xs text-white/30">
          Play responsibly. RoyalWin promotes fair gaming. All games use certified random algorithms.
          You must be 18+ to participate.
        </p>
      </div>
    </div>
  );
};
