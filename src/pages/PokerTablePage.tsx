import React from 'react';
import { motion } from 'framer-motion';
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

const PlayingCard: React.FC<{ card: any }> = ({ card }) => {
  if (!card || card.faceDown) {
    return (
      <div className="w-12 h-[72px] bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-blue-400">♠</span>
      </div>
    );
  }
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit] || '♠';
  return (
    <div className="w-12 h-[72px] bg-white rounded-lg flex flex-col justify-between p-1 relative">
      <div className={`text-xs font-bold ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        {card.value}{symbol}
      </div>
      <div className={`text-xs font-bold rotate-180 ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        {card.value}{symbol}
      </div>
    </div>
  );
};

export const PokerTablePage: React.FC = () => {
  const { firebaseUser, user, wallet, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const uid = firebaseUser?.uid || '';
  const userName = (user as any)?.username || (user as any)?.name || firebaseUser?.displayName || 'Player';
  const photoURL = (user as any)?.photoURL || firebaseUser?.photoURL || '';
  const walletBalance = (wallet?.depositBalance || 0) + (wallet?.winningBalance || 0);

  const [gameState, setGameState] = useState<'table-select' | 'matchmaking' | 'playing'>('table-select');
  const [selectedFee, setSelectedFee] = useState(0);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [raiseAmount, setRaiseAmount] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);

  const matchmakingInterval = useRef<any>(null);
  const unsubQueue = useRef<(() => void) | null>(null);
  const unsubRoom = useRef<(() => void) | null>(null);

  const TABLES = [
    { id: 't1', name: 'Beginner', entryFee: 50 },
    { id: 't2', name: 'Classic', entryFee: 200 },
    { id: 't3', name: 'High Rollers', entryFee: 1000 },
  ];

  useEffect(() => {
    return () => {
      if (matchmakingInterval.current) clearInterval(matchmakingInterval.current);
      if (unsubQueue.current) unsubQueue.current();
      if (unsubRoom.current) unsubRoom.current();
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing' || !room || room.currentTurn !== uid) return;
    if (timeLeft <= 0) { handleAction('fold'); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameState, room, uid]);

  useEffect(() => {
    if (room?.currentTurn === uid) setTimeLeft(30);
  }, [room?.currentTurn]);

  const subscribeRoom = (rId: string) => {
    if (unsubRoom.current) unsubRoom.current();
    unsubRoom.current = subscribePokerRoom(rId, (roomData: any) => {
      setRoom(roomData);
      if (roomData?.status === 'FINISHED') {
        toast.success(roomData.winner === uid ? '🏆 You Won!' : `😔 ${roomData.winnerName} wins!`, { duration: 5000 });
      }
    });
  };

  const handleJoinTable = async (entryFee: number) => {
    if (authLoading) { toast.error('Loading...'); return; }
    if (!uid) { toast.error('Please login first'); return; }
    if (walletBalance < entryFee) { toast.error('Insufficient balance'); return; }

    try {
      toast.loading('Joining...', { id: 'queue' });
      const qId = await joinPokerQueue(uid, userName, photoURL, entryFee);
      setQueueId(qId);
      setSelectedFee(entryFee);
      setGameState('matchmaking');
      toast.success('Searching...', { id: 'queue' });

      unsubQueue.current = subscribePokerQueue(qId, (entry: any) => {
        if (entry?.status === 'MATCHED' && entry?.roomId) {
          if (matchmakingInterval.current) clearInterval(matchmakingInterval.current);
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
            subscribeRoom(foundRoomId);
            setGameState('playing');
          }
        } catch (err) { console.error(err); }
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed', { id: 'queue' });
    }
  };

  const handleCancelMatchmaking = async () => {
    if (matchmakingInterval.current) clearInterval(matchmakingInterval.current);
    if (unsubQueue.current) unsubQueue.current();
    if (queueId) await cancelPokerQueue(queueId, uid, selectedFee);
    setGameState('table-select');
    setQueueId(null);
    toast('Left queue', { icon: '👋' });
  };

  const handleAction = async (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in') => {
    if (!room) return;
    if (room.currentTurn !== uid) { toast.error('Not your turn!'); return; }
    try {
      await performPokerAction(room.id, uid, action, action === 'raise' ? raiseAmount : undefined);
      toast(action === 'fold' ? '🃏 Fold' : action === 'check' ? '✓ Check' : action === 'call' ? '📞 Call' : action === 'raise' ? `📈 Raise ₹${raiseAmount}` : '🚀 All-In!');
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  const myData = room?.player1?.uid === uid ? room?.player1 : room?.player2;
  const opponentData = room?.player1?.uid === uid ? room?.player2 : room?.player1;
  const isMyTurn = room?.currentTurn === uid;

  if (gameState === 'table-select') {
    return (
      <div className="space-y-6 p-4">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎰</div>
          <h1 className="text-3xl font-bold text-white">Poker Tables</h1>
          <p className="text-gray-400">Real 2-player poker</p>
        </div>
        {TABLES.map(t => (
          <div key={t.id} className="glass rounded-2xl p-6 flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-lg">{t.name}</h3>
              <p className="text-amber-400 font-bold">Entry: ₹{t.entryFee}</p>
            </div>
            <button onClick={() => handleJoinTable(t.entryFee)} disabled={authLoading} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl disabled:bg-gray-500">
              Join
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (gameState === 'matchmaking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="text-6xl animate-spin">🎰</div>
        <h2 className="text-2xl font-bold text-white">Finding Opponent...</h2>
        <button onClick={handleCancelMatchmaking} className="px-8 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl">Cancel</button>
      </div>
    );
  }

  if (gameState === 'playing' && room) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${isMyTurn ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {isMyTurn ? `⚡ Your Turn (${timeLeft}s)` : `⏳ ${opponentData?.name}'s turn`}
          </span>
          <span className="text-amber-400 font-bold capitalize">{room.phase}</span>
        </div>

        <div className="bg-green-900 rounded-3xl border-8 border-amber-900/60 p-6 min-h-[400px] flex flex-col justify-between">
          <div className="text-center">
            <p className="text-gray-300 text-sm">{opponentData?.name}</p>
            <div className="flex gap-2 justify-center my-2">
              {opponentData?.cards?.map((c: any, i: number) => (
                <PlayingCard key={i} card={room.status === 'FINISHED' ? { ...c, faceDown: false } : { ...c, faceDown: true }} />
              ))}
            </div>
            <p className="text-emerald-400 font-mono text-sm">₹{opponentData?.chips?.toLocaleString()}</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2 flex-wrap justify-center">
              {room.communityCards?.length > 0
                ? room.communityCards.map((c: any, i: number) => <PlayingCard key={i} card={c} />)
                : Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-12 h-[72px] rounded-lg border-2 border-dashed border-white/20" />)}
            </div>
            <div className="px-6 py-2 rounded-full bg-black/50 border border-amber-500/40 text-amber-400 font-bold text-lg">
              🏆 POT: ₹{room.pot?.toLocaleString()}
            </div>
          </div>

          <div className="text-center">
            <div className="flex gap-2 justify-center my-2">
              {myData?.cards?.map((c: any, i: number) => <PlayingCard key={i} card={{ ...c, faceDown: false }} />)}
            </div>
            <p className="text-amber-400 text-sm font-bold">YOU</p>
            <p className="text-emerald-400 font-mono font-bold">₹{myData?.chips?.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          {room.status === 'FINISHED' ? (
            <div className="text-center space-y-3">
              <p className="text-xl font-bold text-white">{room.winner === uid ? '🏆 You Won!' : `😔 ${room.winnerName} wins!`}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setGameState('table-select'); setRoom(null); }} className="px-6 py-2 bg-gray-600 text-white font-bold rounded-xl">Leave</button>
                <button onClick={() => handleJoinTable(selectedFee)} className="px-6 py-2 bg-amber-500 text-black font-bold rounded-xl">Play Again</button>
              </div>
            </div>
          ) : isMyTurn ? (
            <div className="space-y-3">
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={() => handleAction('fold')} className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-xl">Fold</button>
                <button onClick={() => handleAction('check')} className="px-5 py-2.5 bg-gray-600 text-white font-bold rounded-xl">Check</button>
                <button onClick={() => handleAction('call')} className="px-5 py-2.5 bg-blue-500 text-white font-bold rounded-xl">Call</button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setRaiseAmount(r => Math.max(100, r - 50))} className="w-10 h-10 bg-white/10 text-white rounded-lg font-bold">−</button>
                <button onClick={() => handleAction('raise')} className="flex-1 py-2.5 bg-amber-500 text-black font-bold rounded-xl">Raise ₹{raiseAmount}</button>
                <button onClick={() => setRaiseAmount(r => Math.min(myData?.chips || 0, r + 50))} className="w-10 h-10 bg-white/10 text-white rounded-lg font-bold">+</button>
                <button onClick={() => handleAction('all-in')} className="px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl">All-In</button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">Waiting for {opponentData?.name}...</div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default PokerTablePage;
