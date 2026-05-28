import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  joinPokerQueue,
  cancelPokerQueue,
  subscribePokerQueue,
  findPokerMatch,
  subscribePokerRoom,
  performPokerAction,
} from '../firebase/poker';

// ============================================================
// PLAYING CARD COMPONENT
// ============================================================
const PlayingCard: React.FC<{
  card: any;
  size?: 'sm' | 'md' | 'lg';
}> = ({ card, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-12 text-xs',
    md: 'w-12 h-18 text-sm',
    lg: 'w-16 h-24 text-base',
  };

  const suitSymbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };

  if (!card || card.faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-600 rounded-lg flex items-center justify-center shadow-lg`}
      >
        <span className="text-blue-400 opacity-50">♠</span>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = suitSymbols[card.suit] || '♠';

  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.5 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      className={`${sizeClasses[size]} bg-white rounded-lg flex flex-col justify-between p-1 shadow-xl relative overflow-hidden`}
    >
      <div className={`text-xs font-bold leading-none ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        <div>{card.value}</div>
        <div>{symbol}</div>
      </div>
      <div className={`text-xs font-bold leading-none rotate-180 ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        <div>{card.value}</div>
        <div>{symbol}</div>
      </div>
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
    </motion.div>
  );
};

// ============================================================
// MAIN POKER TABLE PAGE
// ============================================================
export const PokerTablePage: React.FC = () => {
  const { firebaseUser, user, wallet, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // User data
  const uid = firebaseUser?.uid || '';
  const userName = (user as any)?.username || (user as any)?.name || firebaseUser?.displayName || 'Player';
  const photoURL = (user as any)?.photoURL || firebaseUser?.photoURL || '';
  const walletBalance =
    (wallet?.depositBalance || 0) +
    (wallet?.winningBalance || 0) +
    (wallet?.referralBalance || 0) +
    (wallet?.bonusBalance || 0);

  // Game state
  const [gameState, setGameState] = useState<'table-select' | 'matchmaking' | 'playing'>('table-select');
  const [selectedFee, setSelectedFee] = useState(0);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [raiseAmount, setRaiseAmount] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);

  const matchmakingInterval = useRef<any>(null);
  const unsubQueue = useRef<(() => void) | null>(null);
  const unsubRoom = useRef<(() => void) | null>(null);

  const TABLES = [
    { id: 't1', name: 'Beginner Table', blinds: '₹5/₹10', entryFee: 50, difficulty: 'Easy' as const },
    { id: 't2', name: 'Classic Texas', blinds: '₹25/₹50', entryFee: 200, difficulty: 'Medium' as const },
    { id: 't3', name: 'High Rollers', blinds: '₹100/₹200', entryFee: 1000, difficulty: 'Hard' as const },
  ];

  // Cleanup
  useEffect(() => {
    return () => {
      if (matchmakingInterval.current) clearInterval(matchmakingInterval.current);
      if (unsubQueue.current) unsubQueue.current();
      if (unsubRoom.current) unsubRoom.current();
    };
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || !room || room.currentTurn !== uid) return;
    if (timeLeft <= 0) {
      handleAction('fold');
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameState, room, uid]);

  // Reset timer on turn change
  useEffect(() => {
    if (room?.currentTurn === uid) setTimeLeft(30);
  }, [room?.currentTurn]);

  const subscribeRoom = (rId: string) => {
    if (unsubRoom.current) unsubRoom.current();
    unsubRoom.current = subscribePokerRoom(rId, (roomData: any) => {
      setRoom(roomData);
      if (roomData?.status === 'FINISHED') {
        toast.success(
          roomData.winner === uid ? '🏆 You Won!' : `😔 ${roomData.winnerName} wins!`,
          { duration: 5000 }
        );
      }
    });
  };

  const handleJoinTable = async (entryFee: number) => {
    if (authLoading) {
      toast.error('Please wait, loading account...');
      return;
    }

    if (!uid) {
      toast.error('Please login first');
      return;
    }

    if (walletBalance < entryFee) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      toast.loading('Joining queue...', { id: 'queue' });
      const qId = await joinPokerQueue(uid, userName, photoURL, entryFee);
      setQueueId(qId);
      setSelectedFee(entryFee);
      setGameState('matchmaking');
      toast.success('Searching for opponent...', { id: 'queue' });

      unsubQueue.current = subscribePokerQueue(qId, (entry: any) => {
        if (entry?.status === 'MATCHED' && entry?.roomId) {
          if (matchmakingInterval.current) clearInterval(matchmakingInterval.current);
          setRoomId(entry.roomId);
          subscribeRoom(entry.roomId);
          setGameState('playing');
          toast.success('🎰 Opponent found!', { id: 'queue' });
        }
      });

      matchmakingInterval.current = setInterval(async () => {
        try {
          const foundRoomId = await findPokerMatch(uid, qId, entryFee);
          if (foundRoomId) {
            if (matchmakingInterval.current) clearInterval(matchmakingInterval.current);
            setRoomId(foundRoomId);
            subscribeRoom(foundRoomId);
            setGameState('playing');
          }
        } catch (err) {
          console.error('Match finding error:', err);
        }
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to join table', { id: 'queue' });
    }
  };

  const handleCancelMatchmaking = async () => {
    if (matchmakingInterval.current) clearInterval(matchmakingInterval.current);
    if (unsubQueue.current) unsubQueue.current();
    if (queueId) await cancelPokerQueue(queueId, uid, selectedFee);
    setGameState('table-select');
    setQueueId(null);
    toast('Left the queue', { icon: '👋' });
  };

  const handleAction = async (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in') => {
    if (!roomId || !room) return;
    if (room.currentTurn !== uid) {
      toast.error('Not your turn!');
      return;
    }
    try {
      await performPokerAction(roomId, uid, action, action === 'raise' ? raiseAmount : undefined);
      const messages: Record<string, string> = {
        fold: '🃏 You folded',
        check: '✓ Checked',
        call: '📞 Called ₹50',
        raise: `📈 Raised ₹${raiseAmount}`,
        'all-in': '🚀 ALL IN!',
      };
      toast(messages[action]);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const isPlayer1 = room?.player1?.uid === uid;
  const myData = isPlayer1 ? room?.player1 : room?.player2;
  const opponentData = isPlayer1 ? room?.player2 : room?.player1;
  const isMyTurn = room?.currentTurn === uid;

  // ==================== TABLE SELECTION ====================
  if (gameState === 'table-select') {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
          <div className="text-6xl mb-4">🎰</div>
          <h1 className="text-3xl font-bold text-white mb-2">Poker Tables</h1>
          <p className="text-gray-400">Real 2-player poker — win real money!</p>
        </motion.div>

        <div className="grid gap-4">
          {TABLES.map((table, i) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 hover:bg-white/8 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-900 flex items-center justify-center text-2xl border border-emerald-700/50">
                    ♠
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{table.name}</h3>
                    <p className="text-gray-400 text-sm">Blinds: {table.blinds}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        table.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' :
                        table.difficulty === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {table.difficulty}
                      </span>
                      <span className="text-amber-400 text-sm font-bold">Entry: ₹{table.entryFee}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinTable(table.entryFee)}
                  disabled={authLoading}
                  className={`px-6 py-3 rounded-xl font-bold transition-colors whitespace-nowrap ${
                    authLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-black'
                  }`}
                >
                  {authLoading ? 'Loading...' : 'Join Table'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== MATCHMAKING ====================
  if (gameState === 'matchmaking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-6xl">
          🎰
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Finding Opponent...</h2>
          <p className="text-gray-400">Entry Fee: ₹{selectedFee}</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} animate={{ y: [-10, 10, -10] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-3 h-3 bg-amber-400 rounded-full" />
          ))}
        </div>
        <button onClick={handleCancelMatchmaking} className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-medium">
          Cancel Search
        </button>
      </div>
    );
  }

  // ==================== PLAYING ====================
  if (gameState === 'playing' && room) {
    return (
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${isMyTurn ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-gray-500/20 text-gray-400'}`}>
            {isMyTurn ? `⚡ Your Turn (${timeLeft}s)` : `⏳ ${opponentData?.name}'s turn`}
          </span>
          <span className="text-amber-400 font-mono font-bold capitalize">{room.phase}</span>
        </div>

        <div className="bg-green-900 rounded-[40px] border-8 border-amber-900/60 p-6 shadow-2xl min-h-[480px] flex flex-col justify-between">
          {/* Opponent */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-gray-300 text-sm font-medium">{opponentData?.name || 'Opponent'}</span>
              <div className="flex gap-2">
                {opponentData?.cards?.map((card: any, i: number) => (
                  <PlayingCard key={i} card={room.status === 'FINISHED' ? { ...card, faceDown: false } : { ...card, faceDown: true }} size="md" />
                ))}
              </div>
              <span className="text-emerald-400 font-mono text-sm">₹{opponentData?.chips?.toLocaleString() || 0}</span>
            </div>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2 flex-wrap justify-center">
              {room.communityCards?.length > 0
                ? room.communityCards.map((card: any, i: number) => <PlayingCard key={i} card={card} size="md" />)
                : Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-12 h-[72px] rounded-lg border-2 border-dashed border-white/20" />)}
            </div>
            <div className="px-6 py-2 rounded-full bg-black/50 border border-amber-500/40 text-amber-400 font-mono font-bold text-lg">
              🏆 POT: ₹{room.pot?.toLocaleString() || 0}
            </div>
          </div>

          {/* My Player */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {myData?.cards?.map((card: any, i: number) => <PlayingCard key={i} card={{ ...card, faceDown: false }} size="lg" />)}
              </div>
              <span className="text-amber-400 text-sm font-bold">YOU</span>
              <span className="text-emerald-400 font-mono font-bold">₹{myData?.chips?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="glass rounded-2xl p-4">
          {room.status === 'FINISHED' ? (
            <div className="text-center space-y-3 py-2">
              <p className="text-xl font-bold text-white">{room.winner === uid ? '🏆 You Won!' : `😔 ${room.winnerName} wins!`}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setGameState('table-select'); setRoom(null); }} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl">Leave</button>
                <button onClick={() => handleJoinTable(selectedFee)} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl">Play Again</button>
              </div>
            </div>
          ) : isMyTurn ? (
            <div className="space-y-3">
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={() => handleAction('fold')} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl">Fold</button>
                <button onClick={() => handleAction('check')} className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl">Check</button>
                <button onClick={() => handleAction('call')} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl">Call ₹50</button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setRaiseAmount((r) => Math.max(100, r - 50))} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold flex-shrink-0">−</button>
                <button onClick={() => handleAction('raise')} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl">Raise ₹{raiseAmount}</button>
                <button onClick={() => setRaiseAmount((r) => Math.min(myData?.chips || 0, r + 50))} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold flex-shrink-0">+</button>
                <button onClick={() => handleAction('all-in')} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex-shrink-0">All-In</button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-sm">Waiting for {opponentData?.name}...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default PokerTablePage;
