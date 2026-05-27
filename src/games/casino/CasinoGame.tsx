// ============================================================
// 2 PLAYER CARD CASINO GAME
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Loader2, Trophy, Swords } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWallet } from '../../hooks/useWallet';
import { joinCardRoom, subscribeRoom } from '../../services/gameService';
import { GameRoom } from '../../types';
import { formatCurrency } from '../../utils/wallet';
import toast from 'react-hot-toast';

const CARD_NAMES: Record<number, string> = {
  1: 'A', 11: 'J', 12: 'Q', 13: 'K',
};

function getCardLabel(card: number): string {
  return CARD_NAMES[card] || card.toString();
}

function isRedSuit(suit: string): boolean {
  return suit === '♥' || suit === '♦';
}

export function CasinoGame() {
  const { user } = useAuthStore();
  const { wallet } = useWallet();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeRoom(roomId, (r) => {
      setRoom(r);
      if (r?.status === 'finished') {
        setTimeout(() => setShowResult(true), 1000);
      }
    });
    return () => unsub();
  }, [roomId]);

  const handleJoin = async () => {
    if (!user?.uid) return;
    if ((wallet?.totalBalance || 0) < 50) {
      toast.error('Insufficient balance. Minimum ₹50 required.');
      return;
    }
    setIsJoining(true);
    try {
      const id = await joinCardRoom(user.uid, user.name);
      setRoomId(id);
      toast.success('Joined game room!');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePlayAgain = () => {
    setRoomId(null);
    setRoom(null);
    setShowResult(false);
  };

  const myPlayer = room?.players.find((p) => p.uid === user?.uid);
  const opponent = room?.players.find((p) => p.uid !== user?.uid);
  const isWinner = room?.winner === user?.uid;
  const isDraw = room?.status === 'finished' && !room?.winner;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🃏 Card Casino
          </h1>
          <p className="text-slate-400 text-sm mt-1">2-player card battle • ₹50 buy-in</p>
        </div>
        {wallet && (
          <div className="glass-card-light px-4 py-2 rounded-xl">
            <p className="text-xs text-slate-400">Balance</p>
            <p className="text-yellow-400 font-semibold">{formatCurrency(wallet.totalBalance)}</p>
          </div>
        )}
      </div>

      {/* Winner Popup */}
      <AnimatePresence>
        {showResult && room?.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-8 text-center max-w-sm w-full neon-glow-purple"
            >
              <div className="text-5xl mb-3">{isDraw ? '🤝' : isWinner ? '🏆' : '😢'}</div>
              <h2 className="text-2xl font-bold mb-2">
                {isDraw ? (
                  <span className="text-yellow-400">It's a Draw!</span>
                ) : isWinner ? (
                  <span className="text-green-400">You Win!</span>
                ) : (
                  <span className="text-red-400">You Lost!</span>
                )}
              </h2>
              <p className="text-slate-400 text-sm mb-1">
                {isDraw ? 'Both cards are equal' : isWinner ? `+${formatCurrency(50 * 2 * 0.95)} added to winning balance` : 'Better luck next time!'}
              </p>
              {myPlayer?.card && opponent?.card && (
                <div className="flex items-center justify-center gap-4 my-4">
                  <div className={`playing-card ${isRedSuit(myPlayer.cardSuit || '') ? 'red' : ''} text-center`}>
                    <span className="text-xl font-bold">{getCardLabel(myPlayer.card)}</span>
                    <span className="text-lg">{myPlayer.cardSuit}</span>
                  </div>
                  <Swords className="w-6 h-6 text-slate-500" />
                  <div className={`playing-card ${isRedSuit(opponent.cardSuit || '') ? 'red' : ''} text-center`}>
                    <span className="text-xl font-bold">{getCardLabel(opponent.card)}</span>
                    <span className="text-lg">{opponent.cardSuit}</span>
                  </div>
                </div>
              )}
              <button onClick={handlePlayAgain} className="btn-primary w-full py-3 rounded-xl font-semibold text-white mt-2">
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!roomId ? (
        /* ─── Join Screen ─────────────────────────── */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
          <div className="text-6xl mb-4 animate-float">🃏</div>
          <h2 className="text-xl font-bold text-white mb-2">2 Player Card Battle</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Get matched with another player. Draw a card — highest card wins 95% of the pot!
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Buy-in', value: '₹50' },
              { label: 'Winner Gets', value: '₹95' },
              { label: 'Players', value: '2' },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card-light p-3 rounded-xl">
                <p className="text-lg font-bold text-yellow-400">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="btn-primary px-10 py-3 rounded-xl font-bold text-white text-lg disabled:opacity-60"
          >
            {isJoining ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Joining...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Join Game (₹50)
              </div>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-3">₹50 will be deducted from your balance</p>
        </motion.div>
      ) : (
        /* ─── Game Board ──────────────────────────── */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Status */}
          <div className="glass-card p-4 text-center">
            {room?.status === 'waiting' ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                <p className="text-yellow-400 font-medium">Waiting for opponent...</p>
              </div>
            ) : room?.status === 'playing' ? (
              <p className="text-purple-400 font-medium flex items-center justify-center gap-2">
                <Swords className="w-5 h-5" /> Game in progress...
              </p>
            ) : (
              <p className="text-white font-medium flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> Game Over!
              </p>
            )}
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 gap-4">
            {/* Me */}
            <div className="glass-card p-5 text-center bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-white font-medium truncate">{user?.name} (You)</p>
              <div className="mt-3 flex justify-center">
                {myPlayer?.card ? (
                  <motion.div
                    initial={{ rotateY: 180 }}
                    animate={{ rotateY: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`playing-card ${isRedSuit(myPlayer.cardSuit || '') ? 'red' : ''}`}
                  >
                    <span className="text-xl font-bold block">{getCardLabel(myPlayer.card)}</span>
                    <span>{myPlayer.cardSuit}</span>
                  </motion.div>
                ) : (
                  <div className="w-16 h-24 rounded-lg bg-blue-900 border-2 border-blue-600 flex items-center justify-center text-2xl">
                    🂠
                  </div>
                )}
              </div>
            </div>

            {/* Opponent */}
            <div className="glass-card p-5 text-center bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20">
              <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              {opponent ? (
                <>
                  <p className="text-sm text-white font-medium truncate">{opponent.name}</p>
                  <div className="mt-3 flex justify-center">
                    {opponent.card ? (
                      <motion.div
                        initial={{ rotateY: 180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={`playing-card ${isRedSuit(opponent.cardSuit || '') ? 'red' : ''}`}
                      >
                        <span className="text-xl font-bold block">{getCardLabel(opponent.card)}</span>
                        <span>{opponent.cardSuit}</span>
                      </motion.div>
                    ) : (
                      <div className="w-16 h-24 rounded-lg bg-red-900 border-2 border-red-600 flex items-center justify-center text-2xl">
                        🂠
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-400">Waiting...</p>
                  <div className="mt-3 flex justify-center">
                    <div className="w-16 h-24 rounded-lg bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pot */}
          <div className="glass-card p-4 text-center">
            <p className="text-slate-400 text-sm">Prize Pool</p>
            <p className="text-2xl font-bold text-yellow-400">
              {room?.players.length === 2 ? formatCurrency((room.betAmount || 50) * 2) : formatCurrency(room?.betAmount || 50)}
            </p>
            <p className="text-xs text-slate-500">Winner takes 95% = {formatCurrency((room?.betAmount || 50) * 2 * 0.95)}</p>
          </div>

          {room?.status === 'finished' && (
            <button onClick={handlePlayAgain} className="btn-primary w-full py-3 rounded-xl font-semibold text-white">
              Play Again
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
