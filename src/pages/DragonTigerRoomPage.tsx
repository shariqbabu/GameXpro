// src/pages/DragonTigerRoomPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Trophy, Clock,
  TrendingUp, Zap, Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeDragonTigerTable,
  joinDragonTigerTable,
  placeDragonTigerBet,
  revealDragonTiger,
} from '../firebase/dragonTiger';
import {
  DragonTigerTable,
  DragonTigerBetType,
} from '../types';
import toast from 'react-hot-toast';

const BET_AMOUNTS = [50, 100, 500, 1000, 5000];

// Card Display Component
const CardDisplay: React.FC<{
  card: any;
  hidden?: boolean;
}> = ({ card, hidden }) => {
  if (hidden || !card) {
    return (
      <div className="w-16 h-24 bg-gradient-to-br from-blue-800 
                      to-blue-900 border-2 border-blue-600 rounded-xl 
                      flex items-center justify-center shadow-lg">
        <span className="text-blue-400 text-2xl opacity-50">♠</span>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = {
    hearts: '♥', diamonds: '♦',
    clubs: '♣', spades: '♠'
  }[card.suit] || '♠';

  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.5 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      className="w-16 h-24 bg-white rounded-xl flex flex-col 
                 justify-between p-2 shadow-xl"
    >
      <div className={`text-sm font-bold leading-none 
                       ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        <div>{card.value}</div>
        <div>{suitSymbol}</div>
      </div>
      <div className={`text-sm font-bold leading-none rotate-180 
                       ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        <div>{card.value}</div>
        <div>{suitSymbol}</div>
      </div>
    </motion.div>
  );
};

export const DragonTigerRoomPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const isSpectator = searchParams.get('spectate') === 'true';
  const uid = userProfile?.uid || '';
  const username = userProfile?.username || userProfile?.name || 'Player';

  const [table, setTable] = useState<DragonTigerTable | null>(null);
  const [selectedBet, setSelectedBet] = useState<DragonTigerBetType | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  // Subscribe to table
  useEffect(() => {
    if (!tableId) return;
    const unsub = subscribeDragonTigerTable(tableId, (t) => {
      setTable(t);
      if (t?.roundTimer !== undefined) setTimer(t.roundTimer);
    });
    return () => unsub();
  }, [tableId]);

  // Join table
  useEffect(() => {
    if (!tableId || !uid || isSpectator) return;
    joinDragonTigerTable(tableId, uid).catch(console.error);
  }, [tableId, uid, isSpectator]);

  // Timer countdown - only host reveals
  useEffect(() => {
    if (!table || !uid) return;
    if (table.hostUid !== uid) return;
    if (table.stage !== 'betting') return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (tableId) revealDragonTiger(tableId).catch(console.error);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [table?.stage, table?.hostUid, uid, tableId]);

  const handleBet = useCallback(async () => {
    if (!selectedBet || !uid || !tableId) return;
    if (!table) return;

    const walletBalance =
      (userProfile as any)?.wallet?.depositBalance +
      (userProfile as any)?.wallet?.winningBalance || 0;

    if (betAmount > walletBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      await placeDragonTigerBet(
        tableId, uid, username, selectedBet, betAmount
      );
      toast.success(`₹${betAmount} placed on ${selectedBet.toUpperCase()}!`);
      setSelectedBet(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  }, [selectedBet, uid, tableId, betAmount, username, table]);

  const userBets = table?.bets?.filter((b) => b.uid === uid) || [];
  const totalUserBet = userBets.reduce((sum, b) => sum + b.amount, 0);
  const showResult = table?.stage === 'result';

  if (!table) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400/30 
                          border-t-amber-400 rounded-full animate-spin 
                          mx-auto mb-4" />
          <p className="text-gray-400">Loading table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dragon-tiger')}
            className="p-2 rounded-xl hover:bg-white/10 
                       text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-white font-bold">{table.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              table.stage === 'betting'
                ? 'bg-emerald-500/20 text-emerald-400'
                : table.stage === 'result'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {table.stage === 'betting'
                ? '🟢 Betting Open'
                : table.stage === 'result'
                ? '🏆 Result'
                : '⏳ Waiting'
              }
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
          timer <= 10
            ? 'bg-red-500/20 border border-red-500/30'
            : 'bg-white/5'
        }`}>
          <Clock className={`w-4 h-4 ${
            timer <= 10 ? 'text-red-400' : 'text-gray-400'
          }`} />
          <span className={`font-bold text-sm ${
            timer <= 10 ? 'text-red-400' : 'text-white'
          }`}>
            {timer}s
          </span>
        </div>
      </div>

      {/* Game Table */}
      <div className="relative bg-gradient-to-br from-green-950 to-green-900 
                      border border-white/10 rounded-3xl p-6 overflow-hidden">

        {/* Result Overlay */}
        <AnimatePresence>
          {showResult && table.winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center 
                         justify-center bg-black/60 backdrop-blur-sm 
                         rounded-3xl"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-7xl mb-3"
                >
                  {table.winner === 'dragon'
                    ? '🐉'
                    : table.winner === 'tiger'
                    ? '🐯'
                    : '🤝'
                  }
                </motion.div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  {table.winner === 'tie'
                    ? "IT'S A TIE!"
                    : `${table.winner.toUpperCase()} WINS!`
                  }
                </h2>
                <p className="text-amber-400 font-bold text-lg">
                  Pot: ₹{table.pot?.toLocaleString()}
                </p>
                {userBets.some((b) => b.betType === table.winner) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 bg-emerald-500/20 border 
                               border-emerald-500/30 rounded-xl px-6 py-2"
                  >
                    <p className="text-emerald-400 font-bold text-xl">
                      🎉 YOU WON!
                    </p>
                  </motion.div>
                )}
                <p className="text-gray-400 text-sm mt-3">
                  Next round starting...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dragon vs Tiger */}
        <div className="grid grid-cols-3 gap-4 items-center">

          {/* Dragon */}
          <div className={`flex flex-col items-center gap-3 p-5 
                           rounded-2xl border-2 transition-all ${
            selectedBet === 'dragon'
              ? 'bg-red-500/20 border-red-400 shadow-lg shadow-red-500/20'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="text-4xl">🐉</div>
            <h3 className="text-xl font-bold text-red-400">DRAGON</h3>

            <CardDisplay card={table.dragonCard} hidden={!table.dragonCard} />

            <div className="text-center">
              <p className="text-white font-bold text-lg">
                ₹{(table.dragonTotal || 0).toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs">Total bets</p>
            </div>

            {!isSpectator && table.stage === 'betting' && (
              <button
                onClick={() => setSelectedBet(
                  selectedBet === 'dragon' ? null : 'dragon'
                )}
                className={`w-full py-2 rounded-xl text-sm font-bold 
                            transition-all ${
                  selectedBet === 'dragon'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                }`}
              >
                Bet Dragon (1:1)
              </button>
            )}
          </div>

          {/* Center - TIE + Timer */}
          <div className="flex flex-col items-center gap-4">
            <div className="text-3xl font-black text-white/30">VS</div>

            <div className={`p-3 rounded-xl border-2 text-center 
                            transition-all cursor-pointer w-full ${
              selectedBet === 'tie'
                ? 'bg-amber-500/20 border-amber-400'
                : 'bg-white/5 border-white/10'
            }`}>
              <p className="text-amber-400 font-bold text-sm">TIE</p>
              <p className="text-gray-500 text-xs">8:1</p>
              <p className="text-white font-bold mt-1">
                ₹{(table.tieTotal || 0).toLocaleString()}
              </p>
              {!isSpectator && table.stage === 'betting' && (
                <button
                  onClick={() => setSelectedBet(
                    selectedBet === 'tie' ? null : 'tie'
                  )}
                  className={`w-full mt-2 py-1.5 rounded-lg text-xs 
                              font-bold transition-all ${
                    selectedBet === 'tie'
                      ? 'bg-amber-500 text-black'
                      : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  }`}
                >
                  Bet Tie
                </button>
              )}
            </div>

            {/* Timer Ring */}
            <div className={`w-14 h-14 rounded-full border-4 flex 
                            items-center justify-center ${
              timer <= 10
                ? 'border-red-400 bg-red-400/10'
                : 'border-white/20 bg-white/5'
            }`}>
              <span className={`text-lg font-black ${
                timer <= 10 ? 'text-red-400' : 'text-white'
              }`}>
                {timer}
              </span>
            </div>
          </div>

          {/* Tiger */}
          <div className={`flex flex-col items-center gap-3 p-5 
                           rounded-2xl border-2 transition-all ${
            selectedBet === 'tiger'
              ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="text-4xl">🐯</div>
            <h3 className="text-xl font-bold text-blue-400">TIGER</h3>

            <CardDisplay card={table.tigerCard} hidden={!table.tigerCard} />

            <div className="text-center">
              <p className="text-white font-bold text-lg">
                ₹{(table.tigerTotal || 0).toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs">Total bets</p>
            </div>

            {!isSpectator && table.stage === 'betting' && (
              <button
                onClick={() => setSelectedBet(
                  selectedBet === 'tiger' ? null : 'tiger'
                )}
                className={`w-full py-2 rounded-xl text-sm font-bold 
                            transition-all ${
                  selectedBet === 'tiger'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                }`}
              >
                Bet Tiger (1:1)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Betting Panel */}
      {!isSpectator && table.stage === 'betting' && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Place Your Bet</h3>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Zap className="w-4 h-4 text-amber-400" />
              Balance:
              <span className="text-amber-400 font-bold ml-1">
                ₹{(
                  ((userProfile as any)?.wallet?.depositBalance || 0) +
                  ((userProfile as any)?.wallet?.winningBalance || 0)
                ).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Amount Chips */}
          <div className="flex gap-2 flex-wrap mb-4">
            {BET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                className={`px-4 py-2 rounded-xl text-sm font-bold 
                            transition-all ${
                  betAmount === amount
                    ? 'bg-amber-400 text-black'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                }`}
              >
                ₹{amount}
              </button>
            ))}
          </div>

          {/* Selected Bet */}
          {selectedBet && (
            <div className="flex items-center gap-3 p-3 bg-amber-400/10 
                            border border-amber-400/20 rounded-xl mb-4">
              <span className="text-2xl">
                {selectedBet === 'dragon'
                  ? '🐉'
                  : selectedBet === 'tiger'
                  ? '🐯'
                  : '🤝'
                }
              </span>
              <div className="flex-1">
                <p className="text-amber-400 font-bold">
                  ₹{betAmount.toLocaleString()} on{' '}
                  {selectedBet.toUpperCase()}
                </p>
              </div>
              <button
                onClick={handleBet}
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 
                           text-black font-bold rounded-xl transition-colors 
                           disabled:opacity-50"
              >
                {loading ? 'Placing...' : 'Place Bet'}
              </button>
            </div>
          )}

          {/* User Bets */}
          {userBets.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-2">Your Active Bets</p>
              <div className="flex flex-wrap gap-2">
                {userBets.map((bet, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-white/5 
                               rounded-lg px-3 py-1.5"
                  >
                    <span>
                      {bet.betType === 'dragon'
                        ? '🐉'
                        : bet.betType === 'tiger'
                        ? '🐯'
                        : '🤝'
                      }
                    </span>
                    <span className="text-white text-sm capitalize">
                      {bet.betType}
                    </span>
                    <span className="text-amber-400 text-sm font-bold">
                      ₹{bet.amount}
                    </span>
                  </div>
                ))}
                <div className="flex items-center px-3 py-1.5 
                               bg-amber-400/10 rounded-lg">
                  <span className="text-amber-400 text-xs font-bold">
                    Total: ₹{totalUserBet}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Betting Stats */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          Live Betting Stats
        </h3>
        <div className="space-y-3">
          {(['dragon', 'tiger', 'tie'] as DragonTigerBetType[]).map((side) => {
            const total = side === 'dragon'
              ? table.dragonTotal
              : side === 'tiger'
              ? table.tigerTotal
              : table.tieTotal;
            const grandTotal =
              (table.dragonTotal || 0) +
              (table.tigerTotal || 0) +
              (table.tieTotal || 0);
            const pct = grandTotal > 0
              ? Math.round(((total || 0) / grandTotal) * 100)
              : 0;

            return (
              <div key={side}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400 capitalize">
                    {side === 'dragon'
                      ? '🐉 Dragon'
                      : side === 'tiger'
                      ? '🐯 Tiger'
                      : '🤝 Tie'
                    }
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{pct}%</span>
                    <span className="text-sm text-amber-400 font-bold">
                      ₹{(total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className={`h-full rounded-full ${
                      side === 'dragon'
                        ? 'bg-red-500'
                        : side === 'tiger'
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Players */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          Players ({table.players?.length || 0})
        </h3>
        <div className="space-y-2">
          {(table.bets || [])
            .reduce(
              (
                acc: { uid: string; username: string; total: number }[],
                bet
              ) => {
                const existing = acc.find((a) => a.uid === bet.uid);
                if (existing) {
                  existing.total += bet.amount;
                } else {
                  acc.push({
                    uid: bet.uid,
                    username: bet.username,
                    total: bet.amount,
                  });
                }
                return acc;
              },
              []
            )
            .map((player) => (
              <div
                key={player.uid}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br 
                                  from-violet-500 to-purple-700 flex 
                                  items-center justify-center text-xs 
                                  font-bold text-white">
                    {player.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300">
                    {player.username}
                    {player.uid === uid && (
                      <span className="text-amber-400 ml-1">(You)</span>
                    )}
                    {player.uid === table.hostUid && (
                      <Crown className="inline w-3 h-3 ml-1 text-amber-400" />
                    )}
                  </span>
                </div>
                <span className="text-xs text-amber-400 font-medium">
                  ₹{player.total}
                </span>
              </div>
            ))}
          {(table.bets || []).length === 0 && (
            <p className="text-gray-600 text-xs text-center py-3">
              No bets placed yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
