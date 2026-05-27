import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import { LUDO_ROOMS } from '../../utils/mockData';
import toast from 'react-hot-toast';
import { ChevronLeft, Users, Plus, Zap, Trophy, Clock, Shield } from 'lucide-react';

type GamePhase = 'lobby' | 'room_created' | 'in_game' | 'game_over';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const LudoBoard = ({ currentPlayer }: { currentPlayer: 'red' | 'blue' }) => {
  const cells = Array.from({ length: 15 * 15 }, (_, i) => i);
  const isPath = (i: number) => {
    const r = Math.floor(i / 15);
    const c = i % 15;
    // Simplified path check
    return (r >= 6 && r <= 8) || (c >= 6 && c <= 8);
  };
  const isHomeRed = (i: number) => { const r = Math.floor(i / 15); const c = i % 15; return r < 6 && c < 6; };
  const isHomeBlue = (i: number) => { const r = Math.floor(i / 15); const c = i % 15; return r < 6 && c >= 9; };
  const isCenter = (i: number) => { const r = Math.floor(i / 15); const c = i % 15; return r >= 6 && r <= 8 && c >= 6 && c <= 8; };

  return (
    <div className="relative">
      <div className="grid grid-cols-15 gap-0.5 w-full aspect-square max-w-xs mx-auto"
        style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
        {cells.map((i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm text-[4px] flex items-center justify-center ${
              isCenter(i) ? 'bg-gradient-to-br from-purple-500 to-cyan-500' :
              isHomeRed(i) ? 'bg-red-500/20 border border-red-500/20' :
              isHomeBlue(i) ? 'bg-blue-500/20 border border-blue-500/20' :
              isPath(i) ? 'bg-white/10 border border-white/10' :
              'bg-white/3 border border-white/5'
            }`}
          >
            {isCenter(i) && i === 112 ? '👑' : ''}
          </div>
        ))}
      </div>
      {/* Player pieces overlay */}
      <div className="absolute inset-0 flex items-end justify-center pb-2">
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${currentPlayer === 'red' ? 'bg-red-500/30 text-red-400' : 'bg-blue-500/30 text-blue-400'}`}>
          {currentPlayer === 'red' ? '🔴 Your Turn' : '🔵 Opponent\'s Turn'}
        </div>
      </div>
    </div>
  );
};

export const LudoGame = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [selectedFee, setSelectedFee] = useState(50);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<'red' | 'blue'>('red');
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [gameTimer, setGameTimer] = useState(0);
  const [movesMade, setMovesMade] = useState(0);
  const liveRooms = LUDO_ROOMS;
  const [tab, setTab] = useState<'join' | 'create' | 'rooms'>('rooms');

  useEffect(() => {
    if (phase === 'in_game') {
      const t = setInterval(() => setGameTimer(prev => prev + 1), 1000);
      return () => clearInterval(t);
    }
  }, [phase]);

  // Simulate opponent joining
  useEffect(() => {
    if (waitingForOpponent) {
      const timer = setTimeout(() => {
        setOpponentJoined(true);
        setWaitingForOpponent(false);
        toast.success('Opponent joined! Game starting...');
        setTimeout(() => setPhase('in_game'), 1500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [waitingForOpponent]);

  const createRoom = () => {
    const balance = userProfile?.walletBalance || 1250;
    if (selectedFee > balance) return toast.error('Insufficient balance!');
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setPhase('room_created');
    setWaitingForOpponent(true);
    toast.success(`Room created! Code: ${code}`);
  };

  const joinRoom = () => {
    if (!joinCode.trim()) return toast.error('Enter room code');
    toast.success('Joining room...');
    setTimeout(() => {
      setPhase('in_game');
      setCurrentPlayer('blue');
    }, 1500);
  };

  const rollDice = () => {
    if (isRolling || currentPlayer !== 'red') return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        setMovesMade(prev => prev + 1);
        // Simulate opponent turn
        setTimeout(() => {
          setCurrentPlayer('blue');
          setTimeout(() => setCurrentPlayer('red'), 2000);
        }, 1000);
      }
    }, 80);
  };

  const formatTime = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4 pb-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => phase === 'lobby' ? navigate('/games') : setPhase('lobby')} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-sora text-white">🎲 Ludo Battle</h1>
          <p className="text-xs text-white/40">Real-time 1v1 Multiplayer</p>
        </div>
        {phase === 'in_game' && (
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <Clock className="w-3 h-3" /> {formatTime(gameTimer)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              Prize: <span className="text-green-400 font-bold">₹{(selectedFee * 2 * 0.95).toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Lobby */}
        {phase === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/20">
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-15">🎲</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-sora">Win Real Cash in Ludo!</h2>
                  <p className="text-white/50 text-sm mt-1">1v1 live matches. Entry fee-based. Winner takes all.</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 8,234 online</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-400" /> Anti-cheat active</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Instant payout</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/8">
              {(['rooms', 'create', 'join'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white' : 'text-white/50 hover:text-white'}`}>
                  {t === 'rooms' ? '🏠 Live Rooms' : t === 'create' ? '➕ Create' : '🔗 Join'}
                </button>
              ))}
            </div>

            {/* Rooms */}
            {tab === 'rooms' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Available Rooms</h3>
                  <span className="text-xs text-white/40">{liveRooms.filter(r => r.status === 'waiting').length} waiting</span>
                </div>
                {liveRooms.map((room, i) => (
                  <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 glass rounded-2xl border border-white/8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl">🎲</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">Entry: ₹{room.entryFee}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${room.status === 'waiting' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {room.status === 'waiting' ? 'OPEN' : 'PLAYING'}
                        </span>
                      </div>
                      <p className="text-xs text-white/40">{room.players.length}/{room.maxPlayers} players • Prize: ₹{room.prizePool}</p>
                      <div className="flex gap-1 mt-1">
                        {room.players.map((p, pi) => (
                          <span key={pi} className="text-[10px] text-purple-400">{p}</span>
                        ))}
                        {room.players.length === 0 && <span className="text-[10px] text-white/30">Waiting for players</span>}
                      </div>
                    </div>
                    {room.status === 'waiting' && (
                      <GlowButton size="sm" onClick={() => { setSelectedFee(room.entryFee); createRoom(); }}>
                        Join
                      </GlowButton>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Create Room */}
            {tab === 'create' && (
              <div className="glass rounded-2xl p-6 border border-white/8 space-y-5">
                <h3 className="font-semibold text-white">Create a New Room</h3>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-3">Select Entry Fee</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[50, 100, 200, 500, 1000, 2000].map((fee) => (
                      <button key={fee} onClick={() => setSelectedFee(fee)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${selectedFee === fee ? 'bg-purple-500/30 border border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/20' : 'bg-white/5 border border-white/10 text-white hover:border-purple-500/30'}`}>
                        ₹{fee}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-white/60">Entry Fee</span><span className="text-white font-semibold">₹{selectedFee}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-white/60">Prize Pool</span><span className="text-green-400 font-bold">₹{(selectedFee * 2 * 0.95).toFixed(0)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-white/60">Platform Fee</span><span className="text-white/40">5%</span></div>
                </div>
                <GlowButton fullWidth size="lg" onClick={createRoom}>
                  <Plus className="w-4 h-4" /> Create Room — ₹{selectedFee}
                </GlowButton>
              </div>
            )}

            {/* Join Room */}
            {tab === 'join' && (
              <div className="glass rounded-2xl p-6 border border-white/8 space-y-5">
                <h3 className="font-semibold text-white">Join with Room Code</h3>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Room Code</label>
                  <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    className="input-gaming w-full px-4 py-3 rounded-xl text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <GlowButton fullWidth size="lg" variant="cyan" onClick={joinRoom}>
                  🔗 Join Room
                </GlowButton>
              </div>
            )}
          </motion.div>
        )}

        {/* Room Created / Waiting */}
        {phase === 'room_created' && (
          <motion.div key="waiting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="text-center space-y-6 py-10">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center text-5xl">🎲</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-sora text-white">Room Created!</h2>
              <p className="text-white/50 mt-2">Share this code with your opponent</p>
              <div className="inline-flex items-center gap-3 mt-4 px-6 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                <span className="text-3xl font-bold font-mono tracking-widest text-purple-400">{roomCode}</span>
                <button onClick={() => { navigator.clipboard.writeText(roomCode); toast.success('Copied!'); }}
                  className="text-white/40 hover:text-white transition-colors">📋</button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-sm text-white/50">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {opponentJoined ? 'Opponent joined! Starting...' : 'Waiting for opponent...'}
            </div>
            <div className="text-sm text-white/40">Entry Fee: <span className="text-white">₹{selectedFee}</span> • Prize: <span className="text-green-400 font-bold">₹{(selectedFee * 2 * 0.95).toFixed(0)}</span></div>
          </motion.div>
        )}

        {/* In Game */}
        {phase === 'in_game' && (
          <motion.div key="ingame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Board */}
              <div className="lg:col-span-2 space-y-4">
                <div className="glass rounded-2xl p-5 border border-white/8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${currentPlayer === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-white/20'}`} />
                      <span className="text-xs text-white/60">{userProfile?.username || 'You'}</span>
                    </div>
                    <span className="text-xs text-white/40 font-mono">{formatTime(gameTimer)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/60">Opponent</span>
                      <div className={`w-3 h-3 rounded-full ${currentPlayer === 'blue' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-white/20'}`} />
                    </div>
                  </div>
                  <LudoBoard currentPlayer={currentPlayer} />
                </div>

                {/* Dice + Controls */}
                <div className="glass rounded-2xl p-5 border border-white/8 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Moves made</p>
                    <p className="text-2xl font-bold text-white">{movesMade}</p>
                  </div>
                  <motion.button
                    onClick={rollDice}
                    disabled={isRolling || currentPlayer !== 'red'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    animate={isRolling ? { rotate: [0, 360] } : { rotate: 0 }}
                    transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
                    className={`w-24 h-24 rounded-2xl text-5xl font-bold transition-all ${currentPlayer === 'red' ? 'bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30 cursor-pointer' : 'bg-white/5 border border-white/10 cursor-not-allowed opacity-50'}`}
                  >
                    {DICE_FACES[diceValue - 1]}
                  </motion.button>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-1">Prize Pool</p>
                    <p className="text-2xl font-bold text-green-400">₹{(selectedFee * 2 * 0.95).toFixed(0)}</p>
                  </div>
                </div>
              </div>

              {/* Side Panel */}
              <div className="space-y-3">
                {/* Players */}
                <div className="glass rounded-2xl p-4 border border-white/8">
                  <h3 className="text-sm font-semibold text-white mb-3">Players</h3>
                  <div className="space-y-3">
                    {[
                      { name: userProfile?.username || 'You', color: 'red', isYou: true },
                      { name: 'Opponent', color: 'blue', isYou: false },
                    ].map((p) => (
                      <div key={p.name} className={`flex items-center gap-3 p-3 rounded-xl ${currentPlayer === p.color ? 'bg-white/5 border border-white/10' : ''}`}>
                        <div className={`w-8 h-8 rounded-full ${p.color === 'red' ? 'bg-red-500/30' : 'bg-blue-500/30'} flex items-center justify-center text-sm`}>
                          {p.color === 'red' ? '🔴' : '🔵'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{p.name} {p.isYou && '(You)'}</p>
                          <p className="text-xs text-white/40">{currentPlayer === p.color ? 'Playing...' : 'Waiting'}</p>
                        </div>
                        {currentPlayer === p.color && <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game Rules */}
                <div className="glass rounded-2xl p-4 border border-white/8">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-green-400" /> Rules</h3>
                  <ul className="space-y-1.5 text-xs text-white/50">
                    <li>• Roll 6 to enter pieces</li>
                    <li>• Reach home to win</li>
                    <li>• 30s per turn limit</li>
                    <li>• Disconnect = forfeit</li>
                    <li>• Anti-cheat monitored</li>
                  </ul>
                </div>

                <GlowButton fullWidth variant="red" onClick={() => { setPhase('game_over'); toast.error('You forfeited the match'); }}>
                  ⚠️ Forfeit Match
                </GlowButton>
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Over */}
        {phase === 'game_over' && (
          <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="text-center space-y-6 py-10">
            <div className="text-7xl">🎲</div>
            <div>
              <h2 className="text-3xl font-bold font-sora text-white">Game Over!</h2>
              <p className="text-white/50 mt-2">Better luck next time!</p>
            </div>
            <div className="glass rounded-2xl p-5 border border-white/8 max-w-sm mx-auto space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-white/50">Duration</span><span className="text-white">{formatTime(gameTimer)}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Moves Made</span><span className="text-white">{movesMade}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Entry Fee</span><span className="text-red-400">-₹{selectedFee}</span></div>
            </div>
            <div className="flex gap-3 justify-center">
              <GlowButton variant="ghost" onClick={() => { setPhase('lobby'); setMovesMade(0); setGameTimer(0); }}>
                Back to Lobby
              </GlowButton>
              <GlowButton onClick={() => { setPhase('lobby'); setTimeout(createRoom, 100); }}>
                <Trophy className="w-4 h-4" /> Play Again
              </GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
