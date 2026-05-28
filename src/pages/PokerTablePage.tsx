// pages/PokerTablePage.tsx
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

export const PokerTablePage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // ── States ──────────────────────────────────────────────
  const [gameState, setGameState] = useState<
    'table-select' | 'matchmaking' | 'playing'
  >('table-select');

  const [selectedFee, setSelectedFee] = useState(0);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [raiseAmount, setRaiseAmount] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);

  const matchmakingInterval = useRef<NodeJS.Timeout | null>(null);
  const unsubQueue = useRef<(() => void) | null>(null);
  const unsubRoom = useRef<(() => void) | null>(null);

  const uid = userProfile?.uid || '';
  const userName = userProfile?.username || 'Player';
  const photoURL = userProfile?.photoURL || '';

  const TABLES = [
    { id: 't1', name: 'Beginner Table', blinds: '₹5/₹10', entryFee: 50 },
    { id: 't2', name: 'Classic Texas', blinds: '₹25/₹50', entryFee: 200 },
    { id: 't3', name: 'High Rollers', blinds: '₹100/₹200', entryFee: 1000 },
  ];

  // ── Cleanup on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (matchmakingInterval.current) 
        clearInterval(matchmakingInterval.current);
      if (unsubQueue.current) unsubQueue.current();
      if (unsubRoom.current) unsubRoom.current();
    };
  }, []);

  // ── Timer countdown ──────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing' || !room) return;
    if (room.currentTurn !== uid) return;
    
    if (timeLeft <= 0) {
      handleAction('fold');
      return;
    }
    
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameState, room, uid]);

  // Reset timer when turn changes
  useEffect(() => {
    if (room?.currentTurn === uid) {
      setTimeLeft(30);
    }
  }, [room?.currentTurn]);

  // ── Join Queue ───────────────────────────────────────────
  const handleJoinTable = async (entryFee: number) => {
    if (!uid) {
      toast.error('Please login first');
      return;
    }

    try {
      toast.loading('Joining queue...', { id: 'queue' });
      
      const qId = await joinPokerQueue(uid, userName, photoURL, entryFee);
      setQueueId(qId);
      setSelectedFee(entryFee);
      setGameState('matchmaking');

      toast.success('Searching for opponent...', { id: 'queue' });

      // Queue subscribe karo - roomId milega jab match ho
      unsubQueue.current = subscribePokerQueue(qId, (entry) => {
        if (entry?.status === 'MATCHED' && entry?.roomId) {
          // Match mil gaya!
          clearInterval(matchmakingInterval.current!);
          setRoomId(entry.roomId);
          subscribeRoom(entry.roomId);
          setGameState('playing');
          toast.success('🎰 Opponent found! Game starting...', { id: 'queue' });
        }
      });

      // Har 3 second mein match dhundo
      matchmakingInterval.current = setInterval(async () => {
        try {
          const foundRoomId = await findPokerMatch(uid, qId, entryFee);
          if (foundRoomId) {
            clearInterval(matchmakingInterval.current!);
            setRoomId(foundRoomId);
            subscribeRoom(foundRoomId);
            setGameState('playing');
          }
        } catch (err) {
          console.error('Match finding error:', err);
        }
      }, 3000);

    } catch (err: any) {
      toast.error(err.message || 'Failed to join queue', { id: 'queue' });
    }
  };

  // ── Subscribe Room ───────────────────────────────────────
  const subscribeRoom = (rId: string) => {
    if (unsubRoom.current) unsubRoom.current();
    
    unsubRoom.current = subscribePokerRoom(rId, (roomData) => {
      setRoom(roomData);
      
      if (roomData?.status === 'FINISHED') {
        toast.success(
          roomData.winner === uid 
            ? '🏆 You Won!' 
            : `😔 ${roomData.winnerName} wins!`,
          { duration: 5000 }
        );
      }
    });
  };

  // ── Cancel Matchmaking ───────────────────────────────────
  const handleCancelMatchmaking = async () => {
    if (matchmakingInterval.current) 
      clearInterval(matchmakingInterval.current);
    if (unsubQueue.current) unsubQueue.current();
    
    if (queueId) {
      await cancelPokerQueue(queueId, uid, selectedFee);
    }
    
    setGameState('table-select');
    setQueueId(null);
    toast('Left the queue', { icon: '👋' });
  };

  // ── Player Action ────────────────────────────────────────
  const handleAction = async (
    action: 'fold' | 'check' | 'call' | 'raise' | 'all-in'
  ) => {
    if (!roomId || !room) return;
    if (room.currentTurn !== uid) {
      toast.error('Not your turn!');
      return;
    }

    try {
      await performPokerAction(
        roomId, uid, action,
        action === 'raise' ? raiseAmount : undefined
      );

      const messages: Record<string, string> = {
        fold: '🃏 You folded',
        check: '✓ Checked',
        call: `📞 Called ₹50`,
        raise: `📈 Raised ₹${raiseAmount}`,
        'all-in': '🚀 ALL IN!',
      };
      toast(messages[action]);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  // ── My data from room ────────────────────────────────────
  const isPlayer1 = room?.player1?.uid === uid;
  const myData = isPlayer1 ? room?.player1 : room?.player2;
  const opponentData = isPlayer1 ? room?.player2 : room?.player1;
  const isMyTurn = room?.currentTurn === uid;

  // ═══════════════════════════════════════════════════════
  // TABLE SELECTION VIEW
  // ═══════════════════════════════════════════════════════
  if (gameState === 'table-select') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="text-6xl mb-4">🎰</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Choose Your Table
          </h1>
          <p className="text-gray-400">Real 2-player poker with real money</p>
        </motion.div>

        <div className="grid gap-4">
          {TABLES.map((table, i) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 cursor-pointer hover:bg-white/8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">{table.name}</h3>
                  <p className="text-gray-400 text-sm">Blinds: {table.blinds}</p>
                  <p className="text-amber-400 text-sm font-bold">
                    Entry: ₹{table.entryFee}
                  </p>
                </div>
                <button
                  onClick={() => handleJoinTable(table.entryFee)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 
                             text-black font-bold rounded-xl transition-colors"
                >
                  Join Table
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // MATCHMAKING VIEW
  // ═══════════════════════════════════════════════════════
  if (gameState === 'matchmaking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          🎰
        </motion.div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Finding Opponent...
          </h2>
          <p className="text-gray-400">Entry Fee: ₹{selectedFee}</p>
          <p className="text-gray-500 text-sm mt-1">
            Please wait while we find you a match
          </p>
        </div>

        {/* Dots animation */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-3 h-3 bg-amber-400 rounded-full"
            />
          ))}
        </div>

        <button
          onClick={handleCancelMatchmaking}
          className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 
                     text-red-400 border border-red-500/30 rounded-xl 
                     font-medium transition-colors"
        >
          Cancel Search
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // GAME VIEW (Tumhara existing UI with real data)
  // ═══════════════════════════════════════════════════════
  if (gameState === 'playing' && room) {
    return (
      <div className="relative">
        {/* Table Info Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">
              {isMyTurn ? (
                <span className="text-amber-400 animate-pulse">
                  ⚡ Your Turn ({timeLeft}s)
                </span>
              ) : (
                <span className="text-gray-400">
                  ⏳ {opponentData?.name}'s turn...
                </span>
              )}
            </span>
          </div>
          <span className="text-amber-400 font-mono font-bold">
            Phase: {room.phase?.toUpperCase()}
          </span>
        </div>

        {/* POKER TABLE */}
        <div className="poker-felt rounded-[40px] border-8 border-amber-900/60 
                        p-6 shadow-2xl min-h-[500px]">
          
          {/* OPPONENT (Top) */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="text-gray-400 text-sm">
                {opponentData?.name || 'Opponent'}
              </div>
              {/* Opponent Cards */}
              <div className="flex gap-2">
                {opponentData?.cards?.map((card: any, i: number) => (
                  <PlayingCard
                    key={i}
                    card={
                      room.status === 'FINISHED'
                        ? { ...card, faceDown: false }
                        : { ...card, faceDown: true }
                    }
                    size="md"
                  />
                ))}
              </div>
              <div className="text-emerald-400 font-mono">
                ₹{opponentData?.chips?.toLocaleString()}
              </div>
              {opponentData?.action && (
                <span className="px-3 py-1 bg-blue-500/50 rounded-full 
                                 text-white text-xs font-bold uppercase">
                  {opponentData.action}
                </span>
              )}
            </div>
          </div>

          {/* CENTER - Community Cards + Pot */}
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Community Cards */}
            <div className="flex gap-2">
              {room.communityCards?.length > 0 ? (
                room.communityCards.map((card: any, i: number) => (
                  <PlayingCard key={i} card={card} size="md" />
                ))
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-12 rounded-lg border-2 border-dashed 
                               border-white/20"
                    style={{ height: '72px' }}
                  />
                ))
              )}
            </div>

            {/* Pot */}
            <div className="px-6 py-2 rounded-full bg-black/40 
                            border border-amber-500/40 text-amber-400 
                            font-mono font-bold text-lg">
              🏆 POT: ₹{room.pot?.toLocaleString()}
            </div>
          </div>

          {/* MY PLAYER (Bottom) */}
          <div className="flex justify-center mt-8">
            <div className="flex flex-col items-center gap-2">
              {/* My Cards */}
              <div className="flex gap-2">
                {myData?.cards?.map((card: any, i: number) => (
                  <PlayingCard
                    key={i}
                    card={{ ...card, faceDown: false }}
                    size="lg"
                  />
                ))}
              </div>
              <div className="text-amber-400 text-sm font-bold">YOU</div>
              <div className="text-emerald-400 font-mono font-bold">
                ₹{myData?.chips?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-4 glass rounded-2xl p-4">
          {isMyTurn && room.status === 'PLAYING' ? (
            <div className="space-y-3">
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleAction('fold')}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 
                             text-white font-bold rounded-xl transition-colors"
                >
                  Fold
                </button>
                <button
                  onClick={() => handleAction('check')}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 
                             text-white font-bold rounded-xl transition-colors"
                >
                  Check
                </button>
                <button
                  onClick={() => handleAction('call')}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 
                             text-white font-bold rounded-xl transition-colors"
                >
                  Call ₹50
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRaiseAmount((r) => 
                    Math.max(100, r - 50))}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 
                             text-white rounded-lg font-bold"
                >
                  -
                </button>
                <button
                  onClick={() => handleAction('raise')}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 
                             text-black font-bold rounded-xl transition-colors"
                >
                  Raise ₹{raiseAmount}
                </button>
                <button
                  onClick={() => setRaiseAmount((r) => 
                    Math.min(myData?.chips || 0, r + 50))}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 
                             text-white rounded-lg font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => handleAction('all-in')}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 
                             text-white font-bold rounded-xl transition-colors"
                >
                  All-In
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              {room.status === 'FINISHED' ? (
                <div className="space-y-3">
                  <p className="text-xl font-bold text-white">
                    {room.winner === uid ? '🏆 You Won!' : `😔 ${room.winnerName} wins!`}
                  </p>
                  <button
                    onClick={() => setGameState('table-select')}
                    className="px-8 py-3 bg-amber-500 text-black 
                               font-bold rounded-xl"
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span>Waiting for {opponentData?.name}...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default PokerTablePage;
