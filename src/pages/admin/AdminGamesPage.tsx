import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlowButton } from '../../components/ui/GlowButton';
import { generateColorRoundHistory, LUDO_ROOMS } from '../../utils/mockData';
import toast from 'react-hot-toast';
import { Gamepad2, Play, Pause, RefreshCw, Users, DollarSign, TrendingUp, ToggleRight, ToggleLeft } from 'lucide-react';

export const AdminGamesPage = () => {
  const [colorActive, setColorActive] = useState(true);
  const [ludoActive, setLudoActive] = useState(true);
  const roundHistory = generateColorRoundHistory().slice(0, 10);

  const colorStats = {
    totalRounds: 24891,
    todayRounds: 847,
    totalBets: '₹4,82,000',
    houseEdge: '5%',
    activePlayers: 12481,
  };

  const ludoStats = {
    activeRooms: LUDO_ROOMS.filter(r => r.status === 'playing').length,
    waitingRooms: LUDO_ROOMS.filter(r => r.status === 'waiting').length,
    totalRooms: LUDO_ROOMS.length,
    activePlayer: 8234,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-purple-400" /> Game Control
        </h1>
        <p className="text-white/40 text-sm mt-1">Monitor and control live games</p>
      </div>

      {/* Color Prediction */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎨</div>
              <div>
                <h3 className="font-bold text-white font-sora">Color Prediction</h3>
                <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${colorActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {colorActive ? 'Active - Round #101 in progress' : 'Paused'}
                </div>
              </div>
            </div>
            <button onClick={() => { setColorActive(!colorActive); toast.success(`Color Prediction ${!colorActive ? 'activated' : 'paused'}`); }}
              className={colorActive ? 'text-green-400' : 'text-white/30'}>
              {colorActive ? <ToggleRight className="w-12 h-12" /> : <ToggleLeft className="w-12 h-12" />}
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Total Rounds', value: colorStats.totalRounds.toLocaleString(), icon: TrendingUp, color: 'text-purple-400' },
              { label: 'Today Rounds', value: colorStats.todayRounds.toString(), icon: RefreshCw, color: 'text-cyan-400' },
              { label: 'Total Bets', value: colorStats.totalBets, icon: DollarSign, color: 'text-green-400' },
              { label: 'House Edge', value: colorStats.houseEdge, icon: TrendingUp, color: 'text-yellow-400' },
              { label: 'Live Players', value: colorStats.activePlayers.toLocaleString(), icon: Users, color: 'text-pink-400' },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/8 text-center">
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Rounds */}
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Recent Round History</h4>
          <div className="flex flex-wrap gap-2">
            {roundHistory.map((round) => (
              <div key={round.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                  round.result === 'red' ? 'bg-red-500' : round.result === 'green' ? 'bg-green-500' : 'bg-violet-500'
                }`}
                title={`Round #${round.roundNumber}: ${round.result}`}
              >
                {round.result === 'red' ? 'R' : round.result === 'green' ? 'G' : 'V'}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <GlowButton size="sm" variant="ghost" onClick={() => toast.success('Game reset for next round')}>
              <RefreshCw className="w-3.5 h-3.5" /> Force Reset
            </GlowButton>
            <GlowButton size="sm" variant={colorActive ? 'red' : 'green'} onClick={() => setColorActive(!colorActive)}>
              {colorActive ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
            </GlowButton>
          </div>
        </div>
      </motion.div>

      {/* Ludo */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎲</div>
              <div>
                <h3 className="font-bold text-white font-sora">Ludo Battle</h3>
                <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${ludoActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {ludoActive ? `${ludoStats.activeRooms} rooms active` : 'Paused'}
                </div>
              </div>
            </div>
            <button onClick={() => { setLudoActive(!ludoActive); toast.success(`Ludo ${!ludoActive ? 'activated' : 'paused'}`); }}
              className={ludoActive ? 'text-green-400' : 'text-white/30'}>
              {ludoActive ? <ToggleRight className="w-12 h-12" /> : <ToggleLeft className="w-12 h-12" />}
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Active Rooms', value: String(ludoStats.activeRooms), icon: Gamepad2, color: 'text-green-400' },
              { label: 'Waiting Rooms', value: String(ludoStats.waitingRooms), icon: Users, color: 'text-yellow-400' },
              { label: 'Total Rooms', value: String(ludoStats.totalRooms), icon: TrendingUp, color: 'text-purple-400' },
              { label: 'Live Players', value: ludoStats.activePlayer.toLocaleString(), icon: Users, color: 'text-cyan-400' },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/8 text-center">
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Active Rooms */}
          <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Live Rooms</h4>
          <div className="space-y-2">
            {LUDO_ROOMS.map((room, i) => (
              <div key={room.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${room.status === 'playing' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                <div className="flex-1">
                  <span className="text-xs text-white">Room #{i + 1}</span>
                  <span className="text-xs text-white/40 ml-2">Entry: ₹{room.entryFee}</span>
                  <span className="text-xs text-white/40 ml-2">Players: {room.players.length}/{room.maxPlayers}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${room.status === 'playing' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {room.status.toUpperCase()}
                </span>
                <GlowButton size="sm" variant="red" onClick={() => toast.success('Room closed')}>Close</GlowButton>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
