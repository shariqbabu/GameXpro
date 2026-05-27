// src/pages/games/LudoGame.tsx

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  GlowButton,
} from '../../components/ui/GlowButton';

import toast from 'react-hot-toast';

import {
  ChevronLeft,
  Clock,
  Trophy,
  Shield,
  Users,
  Zap,
  RotateCcw,
  Wallet,
  Swords,
} from 'lucide-react';

import {
  doc,
  onSnapshot,
} from 'firebase/firestore';

import {
  db,
} from '../../firebase/config';

import {
  joinMatchmaking,
  cancelMatchmaking,
  listenForMatch,
  listenToGame,
  submitRoll,
  tickTimer,
  forfeitGame,
  settlePrize,
  type LudoGameDoc,
} from '../../services/ludoService';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const ENTRY_FEES = [50, 100, 200, 500, 1000, 2000];

type UIPhase = 'lobby' | 'matchmaking' | 'in_game' | 'game_over';

export const LudoGame = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser, refreshProfile } = useAuth();

  const uid = currentUser?.uid ?? '';
  const uname = userProfile?.username ?? 'Player';

  const [walletData, setWalletData] = useState<any>(null);
  const [uiPhase, setUiPhase] = useState<UIPhase>('lobby');
  const [entryFee, setEntryFee] = useState(50);
  const [gameDoc, setGameDoc] = useState<LudoGameDoc | null>(null);
  const [myRole, setMyRole] = useState<'player1' | 'player2'>('player1');
  const [diceDisp, setDiceDisp] = useState('⚄');
  const [rolling, setRolling] = useState(false);
  const [mmSeconds, setMmSeconds] = useState(0);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [log, setLog] = useState<
    { msg: string; type: 'p1' | 'p2' | 'sys' }[]
  >([{ msg: 'Game starting...', type: 'sys' }]);

  const timerRef = useRef<any>(null);
  const mmTimerRef = useRef<any>(null);
  const cancelTimerRef = useRef<any>(null);
  const settledRef = useRef(false);
  const gameDocRef = useRef<LudoGameDoc | null>(null);
  const myRoleRef = useRef<'player1' | 'player2'>('player1');

  // Keep refs in sync
  useEffect(() => {
    gameDocRef.current = gameDoc;
  }, [gameDoc]);

  useEffect(() => {
    myRoleRef.current = myRole;
  }, [myRole]);

  // REALTIME WALLET
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(doc(db, 'wallets', uid), (snap) => {
      if (snap.exists()) setWalletData(snap.data());
    });
    return () => unsubscribe();
  }, [uid]);

  // REAL BALANCE from wallets collection
  const balance = Number(
    walletData?.totalBalance ?? userProfile?.walletBalance ?? 0
  );

  const prize = Math.floor(entryFee * 2 * 0.95);

  const addLog = (msg: string, type: 'p1' | 'p2' | 'sys' = 'sys') => {
    setLog((prev) => [...prev.slice(-25), { msg, type }]);
  };

  // Derived player data based on myRole
  const myData =
    myRole === 'player1' ? gameDoc?.player1 : gameDoc?.player2;
  const opponentData =
    myRole === 'player1' ? gameDoc?.player2 : gameDoc?.player1;

  // GAME FINISH
  const handleGameFinish = useCallback(
    async (g: LudoGameDoc) => {
      if (settledRef.current) return;
      settledRef.current = true;

      if (timerRef.current) clearInterval(timerRef.current);

      try {
        await settlePrize(g);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await refreshProfile();

        const isWinner = g.winnerId === uid;
        const isDraw = g.winnerId === null;

        if (isDraw) {
          toast.success('Match Draw! Entry fee refunded.');
        } else if (isWinner) {
          toast.success(`🏆 ₹${g.prizePool} added to wallet!`);
        } else {
          toast.error('You lost the match. Better luck next time!');
        }

        setUiPhase('game_over');
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'Prize settlement failed');
        settledRef.current = false;
      }
    },
    [refreshProfile, uid]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mmTimerRef.current) clearInterval(mmTimerRef.current);
      if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    };
  }, []);

  // FIND MATCH
  const findMatch = useCallback(async () => {
    if (!uid) return toast.error('Please login first');
    if (balance < entryFee)
      return toast.error(`Insufficient balance! Need ₹${entryFee}`);

    setUiPhase('matchmaking');
    setMmSeconds(0);
    setLog([{ msg: 'Searching for opponent...', type: 'sys' }]);

    mmTimerRef.current = setInterval(() => {
      setMmSeconds((s) => s + 1);
    }, 1000);

    try {
      const { gameId, role } = await joinMatchmaking(uid, uname, entryFee);
      setMyRole(role);
      myRoleRef.current = role;
      settledRef.current = false;

      const setupGameListener = (gid: string) => {
        listenToGame(gid, (g) => {
          setGameDoc(g);
          if (g.status === 'finished' && !settledRef.current) {
            handleGameFinish(g);
          }
          // Log opponent rolls
          if (g.lastRoll && g.lastRollBy && g.lastRollBy !== uid) {
            addLog(
              `Opponent rolled ${g.lastRoll}`,
              myRoleRef.current === 'player1' ? 'p2' : 'p1'
            );
          }
        });
      };

      if (role === 'player2') {
        if (mmTimerRef.current) clearInterval(mmTimerRef.current);
        if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
        toast.success('Opponent found! Game starting...');
        setupGameListener(gameId);
        setUiPhase('in_game');
      } else {
        // player1 waits for player2
        listenForMatch(uid, (gid, foundRole) => {
          if (mmTimerRef.current) clearInterval(mmTimerRef.current);
          if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
          setMyRole(foundRole);
          myRoleRef.current = foundRole;
          toast.success('Opponent joined! Game starting...');
          setupGameListener(gid);
          setUiPhase('in_game');
        });

        // Auto-cancel after 60 seconds
        cancelTimerRef.current = setTimeout(async () => {
          if (mmTimerRef.current) clearInterval(mmTimerRef.current);
          try {
            await cancelMatchmaking(uid, entryFee);
          } catch {}
          toast.error('No opponent found. Entry fee refunded.');
          setUiPhase('lobby');
        }, 60000);
      }
    } catch (err: any) {
      console.error(err);
      if (mmTimerRef.current) clearInterval(mmTimerRef.current);
      toast.error(err?.message || 'Failed to find match');
      setUiPhase('lobby');
    }
  }, [uid, uname, entryFee, balance, handleGameFinish]);

  // ROLL DICE
  const rollDice = async () => {
    if (!gameDoc || rolling) return;
    if (gameDoc.currentTurn !== uid) {
      return toast.error("It's not your turn!");
    }
    if (gameDoc.status !== 'active') {
      return toast.error('Game is not active!');
    }

    setRolling(true);
    let count = 0;

    const iv = setInterval(async () => {
      setDiceDisp(DICE_FACES[Math.floor(Math.random() * 6)]);
      count++;

      if (count >= 10) {
        clearInterval(iv);

        const val = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
        setDiceDisp(DICE_FACES[val - 1]);
        setLastRoll(val);

        try {
          await submitRoll(gameDoc.gameId, uid, val);
          addLog(`You rolled ${val} 🎲`, 'p1');
        } catch (e: any) {
          toast.error(e?.message || 'Roll failed. Try again.');
          // Revert dice display
          setDiceDisp('⚄');
        } finally {
          setRolling(false);
        }
      }
    }, 80);
  };

  // FORFEIT
  const doForfeit = async () => {
    if (!gameDoc) return;
    const confirmed = window.confirm(
      'Are you sure you want to forfeit? You will lose your entry fee.'
    );
    if (!confirmed) return;

    try {
      await forfeitGame(gameDoc.gameId, uid);
      toast.error('You forfeited the match.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to forfeit');
    }
  };

  // TIMER — only player1 ticks to avoid double-tick
  useEffect(() => {
    if (!gameDoc || gameDoc.status !== 'active') return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(async () => {
      try {
        // Only player1 drives the server timer to avoid race conditions
        if (myRoleRef.current === 'player1') {
          await tickTimer(gameDoc.gameId);
        }
      } catch (e) {
        // Silently ignore tick errors
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameDoc?.gameId, gameDoc?.status]);

  // ─── MATCHMAKING SCREEN ───────────────────────────────────────────
  if (uiPhase === 'matchmaking') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center text-6xl"
        >
          🎲
        </motion.div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Finding Opponent...</h2>
          <p className="text-white/40">Searching for {mmSeconds}s</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/10 text-center">
          <p className="text-xs text-white/40 mb-1">Entry Fee Locked</p>
          <p className="text-xl font-bold text-purple-400">₹{entryFee}</p>
        </div>

        <GlowButton
          variant="ghost"
          onClick={async () => {
            if (mmTimerRef.current) clearInterval(mmTimerRef.current);
            if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
            try {
              await cancelMatchmaking(uid, entryFee);
            } catch {}
            setUiPhase('lobby');
          }}
        >
          <RotateCcw className="w-4 h-4" />
          Cancel Search
        </GlowButton>
      </div>
    );
  }

  // ─── GAME OVER SCREEN ─────────────────────────────────────────────
  if (uiPhase === 'game_over' && gameDoc) {
    const isWinner = gameDoc.winnerId === uid;
    const isDraw = gameDoc.winnerId === null;

    const myFinalScore = myData?.score ?? 0;
    const oppFinalScore = opponentData?.score ?? 0;

    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-7xl"
        >
          {isDraw ? '🤝' : isWinner ? '🏆' : '😔'}
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white">
            {isDraw ? "It's a Draw!" : isWinner ? 'You Won!' : 'You Lost!'}
          </h2>
          <p className="text-white/40 mt-2">
            {isDraw
              ? 'Entry fee has been refunded'
              : isWinner
              ? `₹${gameDoc.prizePool} added to your wallet`
              : 'Better luck next time!'}
          </p>
        </div>

        {/* Final Score */}
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">Final Score</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40">You</p>
              <p className="text-3xl font-black text-white">{myFinalScore}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Opponent</p>
              <p className="text-3xl font-black text-white">{oppFinalScore}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <GlowButton
            variant="ghost"
            fullWidth
            onClick={() => {
              setGameDoc(null);
              setLastRoll(null);
              setLog([{ msg: 'Game starting...', type: 'sys' }]);
              setUiPhase('lobby');
            }}
          >
            Back To Lobby
          </GlowButton>
          <GlowButton
            fullWidth
            onClick={() => {
              setGameDoc(null);
              setLastRoll(null);
              setLog([{ msg: 'Game starting...', type: 'sys' }]);
              findMatch();
            }}
          >
            Play Again
          </GlowButton>
        </div>
      </div>
    );
  }

  // ─── IN-GAME SCREEN ───────────────────────────────────────────────
  if (uiPhase === 'in_game' && gameDoc) {
    const myTurn = gameDoc.currentTurn === uid;
    const myScore = myData?.score ?? 0;
    const oppScore = opponentData?.score ?? 0;
    const myName = myData?.username ?? 'You';
    const oppName = opponentData?.username ?? 'Opponent';
    const timeLeft = gameDoc.timeLeft ?? 300;
    const timePercent = (timeLeft / 300) * 100;

    return (
      <div className="space-y-4 pb-6 max-w-4xl mx-auto">
        {/* TOP BAR */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/games')}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">🎲 Ludo Battle</h1>
            <p className="text-xs text-white/40">
              Prize:{' '}
              <span className="text-green-400 font-bold">₹{gameDoc.prizePool}</span>
            </p>
          </div>
          <div
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl font-bold border ${
              timeLeft <= 30
                ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                : timeLeft <= 60
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>

        {/* Timer Progress Bar */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors ${
              timeLeft <= 30 ? 'bg-red-500' : timeLeft <= 60 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            animate={{ width: `${timePercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* SCORE BOARD */}
        <div className="grid grid-cols-2 gap-3">
          {/* MY SCORE */}
          <div
            className={`glass rounded-2xl p-4 border-2 transition-all ${
              myTurn ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-purple-400 text-xs font-bold uppercase">You</p>
              {myTurn && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  Your Turn
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 truncate">{myName}</p>
            <h2 className="text-5xl font-black text-white mt-2">{myScore}</h2>
          </div>

          {/* OPPONENT SCORE */}
          <div
            className={`glass rounded-2xl p-4 border-2 transition-all ${
              !myTurn ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-blue-400 text-xs font-bold uppercase">Opponent</p>
              {!myTurn && (
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full animate-pulse">
                  Rolling...
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 truncate">{oppName}</p>
            <h2 className="text-5xl font-black text-white mt-2">{oppScore}</h2>
          </div>
        </div>

        {/* VS INDICATOR */}
        <div className="flex items-center justify-center gap-2 text-white/20 text-sm">
          <div className="flex-1 h-px bg-white/10" />
          <Swords className="w-4 h-4 text-white/30" />
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* DICE AREA */}
        <div className="glass rounded-3xl p-8 border border-white/10 text-center space-y-6">
          <motion.button
            onClick={rollDice}
            disabled={rolling || !myTurn || gameDoc.status !== 'active'}
            whileTap={{ scale: myTurn && !rolling ? 0.9 : 1 }}
            className={`w-32 h-32 mx-auto rounded-3xl text-7xl flex items-center justify-center transition-all select-none ${
              myTurn && !rolling
                ? 'bg-purple-500/20 border-2 border-purple-500 hover:bg-purple-500/30 cursor-pointer shadow-lg shadow-purple-500/20'
                : 'bg-white/5 border border-white/10 opacity-50 cursor-not-allowed'
            }`}
          >
            <motion.span
              animate={rolling ? { rotate: 360 } : {}}
              transition={rolling ? { repeat: Infinity, duration: 0.3 } : {}}
              className="block"
            >
              {diceDisp}
            </motion.span>
          </motion.button>

          <div>
            <p
              className={`font-semibold text-sm ${
                myTurn ? 'text-purple-300' : 'text-blue-300'
              }`}
            >
              {rolling
                ? 'Rolling...'
                : myTurn
                ? '🎯 Tap to Roll!'
                : `⏳ ${oppName}'s Turn`}
            </p>
            {lastRoll && (
              <p className="text-white/30 text-xs mt-1">
                Your last roll: {lastRoll}
              </p>
            )}
            <p className="text-white/20 text-xs mt-1">
              Each roll adds to your score
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <GlowButton variant="ghost" fullWidth onClick={doForfeit}>
          Forfeit Match
        </GlowButton>

        {/* MATCH LOG */}
        <div className="glass rounded-2xl p-4 border border-white/10 space-y-2 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-bold text-white sticky top-0">
            Match Log
          </h3>
          <AnimatePresence initial={false}>
            {[...log].reverse().map((entry, i) => (
              <motion.div
                key={log.length - i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xs ${
                  entry.type === 'p1'
                    ? 'text-purple-300'
                    : entry.type === 'p2'
                    ? 'text-blue-300'
                    : 'text-white/40'
                }`}
              >
                {entry.msg}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─── LOBBY SCREEN ─────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-4 max-w-2xl mx-auto">
      {/* TOP BAR */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/games')}
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">🎲 Ludo Battle</h1>
          <p className="text-xs text-white/40">Real-time 1v1 betting</p>
        </div>
        <div className="ml-auto glass rounded-xl px-3 py-2 flex items-center gap-2 border border-white/10">
          <Wallet className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-[10px] text-white/40">Balance</p>
            <p className="text-sm font-bold text-green-400">₹{balance.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* HERO BANNER */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/20 relative overflow-hidden">
        <div className="absolute right-4 top-4 text-6xl opacity-20">🎲</div>
        <h2 className="text-2xl font-bold text-white">Win Real Cash</h2>
        <p className="text-white/50 mt-1 text-sm">
          Highest dice score after 5 minutes wins
        </p>
        <div className="flex items-center gap-4 mt-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> 8.2K online
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-400" /> Fair play
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" /> Instant payout
          </span>
        </div>
      </div>

      {/* HOW TO PLAY */}
      <div className="glass rounded-2xl p-4 border border-white/10">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
          How to Play
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '💰', title: 'Pay Entry', desc: 'Select fee & join' },
            { icon: '🎲', title: 'Roll Dice', desc: 'Take turns rolling' },
            { icon: '🏆', title: 'High Score', desc: 'Winner takes prize' },
          ].map((item) => (
            <div key={item.title} className="space-y-1">
              <div className="text-2xl">{item.icon}</div>
              <p className="text-xs font-semibold text-white">{item.title}</p>
              <p className="text-[10px] text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ENTRY FEE SELECTION */}
      <div className="glass rounded-3xl p-5 border border-white/10 space-y-5">
        <h3 className="font-bold text-white">Select Entry Fee</h3>
        <div className="grid grid-cols-3 gap-3">
          {ENTRY_FEES.map((fee) => (
            <button
              key={fee}
              onClick={() => setEntryFee(fee)}
              className={`py-4 rounded-2xl font-bold transition-all ${
                entryFee === fee
                  ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              } ${balance < fee ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={balance < fee}
            >
              <div className="text-sm">₹{fee}</div>
              {balance < fee && (
                <div className="text-[10px] text-red-400 mt-0.5">Low bal</div>
              )}
            </button>
          ))}
        </div>

        {/* Prize Info */}
        <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Entry Fee</span>
            <span className="text-white font-semibold">₹{entryFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Prize Pool</span>
            <span className="text-white font-semibold">₹{entryFee * 2}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-sm">
            <span className="text-white/50">You Win</span>
            <span className="text-green-400 font-bold text-base">₹{prize}</span>
          </div>
          <p className="text-[10px] text-white/20 text-right">5% platform fee</p>
        </div>

        {balance < entryFee && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
            <p className="text-red-400 text-sm">
              Insufficient balance.{' '}
              <button
                onClick={() => navigate('/wallet')}
                className="underline text-red-300"
              >
                Add funds →
              </button>
            </p>
          </div>
        )}

        <GlowButton
          fullWidth
          size="lg"
          onClick={findMatch}
          disabled={balance < entryFee}
        >
          <Trophy className="w-4 h-4" />
          Play Match — ₹{entryFee}
        </GlowButton>
      </div>
    </div>
  );
};
