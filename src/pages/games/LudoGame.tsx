// src/pages/games/LudoGame.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';
import { ChevronLeft, Clock, Trophy, Shield, Users, Zap, RotateCcw, Wallet } from 'lucide-react';
import {
  joinMatchmaking, cancelMatchmaking, listenForMatch,
  listenToGame, submitRoll, tickTimer, forfeitGame,
  settlePrize, type LudoGameDoc,
} from '../../services/ludoService';

// ─── Board path: 52 cells, each = [col, row] on 15×15 grid ───────────────────
const PATH: [number, number][] = [
  [1,6],[2,6],[3,6],[4,6],[5,6],
  [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  [7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  [14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
  [7,14],[6,14],
  [6,13],[6,12],[6,11],[6,10],[6,9],
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  [0,7],[0,6],
];
const SAFE_IDX = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const P1_HOME: [number, number][] = [[1.5,1.5],[3.5,1.5],[1.5,3.5],[3.5,3.5]];
const P2_HOME: [number, number][] = [[9.5,1.5],[11.5,1.5],[9.5,3.5],[11.5,3.5]];
const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
const ENTRY_FEES = [50, 100, 200, 500, 1000, 2000];

// ─── Canvas board renderer ────────────────────────────────────────────────────
function drawBoard(canvas: HTMLCanvasElement, game: LudoGameDoc) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const S  = canvas.width;
  const cs = S / 15;

  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = '#12082A';
  ctx.beginPath();
  (ctx as any).roundRect?.(0, 0, S, S, 12);
  ctx.fill();

  // Cells
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const x = c * cs, y = r * cs;
      let fill = '#1A0A2E', stroke = 'rgba(200,168,75,0.12)';

      if (r < 6 && c < 6)  { fill = '#2D0A0A'; stroke = 'rgba(214,48,49,0.25)'; }
      if (r < 6 && c > 8)  { fill = '#0A1A2D'; stroke = 'rgba(9,132,227,0.25)'; }
      if (r > 8 && c < 6)  { fill = '#0A1A2D'; stroke = 'rgba(9,132,227,0.15)'; }
      if (r > 8 && c > 8)  { fill = '#2D0A0A'; stroke = 'rgba(214,48,49,0.15)'; }

      const pidx = PATH.findIndex(([pc, pr]) => pc === c && pr === r);
      if (pidx >= 0) { fill = '#22123E'; stroke = 'rgba(200,168,75,0.35)'; }
      if (pidx >= 0 && SAFE_IDX.has(pidx)) fill = '#1A3020';

      if (c === 7 && r >= 1 && r <= 5)  fill = '#2A1060';
      if (r === 7 && c >= 1 && c <= 5)  fill = '#2A1060';
      if (c === 7 && r >= 9 && r <= 13) fill = '#2A1060';
      if (r === 7 && c >= 9 && c <= 13) fill = '#2A1060';
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) { fill = '#2A1450'; stroke = 'rgba(200,168,75,0.5)'; }

      ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.rect(x + 0.5, y + 0.5, cs - 1, cs - 1); ctx.fill(); ctx.stroke();

      if (pidx >= 0 && SAFE_IDX.has(pidx)) {
        ctx.fillStyle = 'rgba(200,168,75,0.55)';
        ctx.font = `${cs * 0.46}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('★', x + cs / 2, y + cs / 2);
      }
    }
  }

  // Home base circles
  const homeCircles = (homes: [number,number][], col: 'red'|'blue') => {
    homes.forEach(([cx, cy]) => {
      ctx.beginPath(); ctx.arc(cx * cs, cy * cs, cs * 0.37, 0, Math.PI * 2);
      ctx.fillStyle = col === 'red' ? 'rgba(214,48,49,0.12)' : 'rgba(9,132,227,0.12)'; ctx.fill();
      ctx.strokeStyle = col === 'red' ? 'rgba(214,48,49,0.45)' : 'rgba(9,132,227,0.45)';
      ctx.lineWidth = 1; ctx.stroke();
    });
  };
  homeCircles(P1_HOME, 'red'); homeCircles(P2_HOME, 'blue');

  // Center triangles
  ctx.fillStyle = 'rgba(200,168,75,0.1)';
  const tri = (pts: [number,number][]) => {
    ctx.beginPath();
    pts.forEach(([x,y],i) => i === 0 ? ctx.moveTo(x*cs,y*cs) : ctx.lineTo(x*cs,y*cs));
    ctx.closePath(); ctx.fill();
  };
  tri([[7,6],[9,6],[8,8]]); tri([[7,9],[9,9],[8,7]]);
  tri([[6,7],[6,9],[8,8]]); tri([[9,7],[9,9],[7,8]]);
  ctx.font = `${cs * 1.1}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('♛', 8 * cs, 8 * cs);

  // Draw goti helper
  const drawGoti = (cx: number, cy: number, r: number, base: string, light: string, label: string, active: boolean) => {
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.3, r * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();

    const g = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, r * 0.05, cx, cy, r);
    g.addColorStop(0, light); g.addColorStop(0.45, base); g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = active ? 1.5 : 0.8; ctx.stroke();

    if (active) {
      ctx.beginPath(); ctx.arc(cx, cy, r + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = light; ctx.lineWidth = 1; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
    }

    ctx.beginPath(); ctx.arc(cx - r * 0.27, cy - r * 0.27, r * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = `bold ${r * 0.8}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, cx, cy + 1);
  };

  const p1Active = game.currentTurn === game.player1.uid;
  const p2Active = game.player2 && game.currentTurn === game.player2.uid;

  // P1 home gotis
  let p1hi = 0;
  game.player1.gotiPos.forEach((pos, i) => {
    if (pos === -1) { const [cx,cy] = P1_HOME[p1hi++]; drawGoti(cx*cs, cy*cs, cs*0.34, '#D63031','#FF7675', String(i+1), !!p1Active); }
  });

  // P2 home gotis
  let p2hi = 0;
  game.player2?.gotiPos.forEach((pos, i) => {
    if (pos === -1) { const [cx,cy] = P2_HOME[p2hi++]; drawGoti(cx*cs, cy*cs, cs*0.34, '#0984E3','#74B9FF', String(i+1), !!p2Active); }
  });

  // On-board gotis
  game.player1.gotiPos.forEach((pos, i) => {
    if (pos >= 0) { const [c,r] = PATH[pos]; drawGoti((c+0.5)*cs,(r+0.5)*cs, cs*0.37,'#D63031','#FF7675',String(i+1),!!p1Active); }
  });
  game.player2?.gotiPos.forEach((pos, i) => {
    if (pos >= 0) { const idx=(pos+26)%52; const [c,r]=PATH[idx]; drawGoti((c+0.5)*cs,(r+0.5)*cs,cs*0.37,'#0984E3','#74B9FF',String(i+1),!!p2Active); }
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
type UIPhase = 'lobby' | 'matchmaking' | 'in_game' | 'game_over';

export const LudoGame = () => {
  const navigate                        = useNavigate();
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const uid                             = currentUser?.uid ?? '';
  const uname                           = userProfile?.username ?? 'Player';

  const [uiPhase,   setUiPhase]   = useState<UIPhase>('lobby');
  const [entryFee,  setEntryFee]  = useState(50);
  const [gameDoc,   setGameDoc]   = useState<LudoGameDoc | null>(null);
  const [myRole,    setMyRole]    = useState<'player1'|'player2'>('player1');
  const [diceDisp,  setDiceDisp]  = useState('⚄');
  const [rolling,   setRolling]   = useState(false);
  const [mmSeconds, setMmSeconds] = useState(0); // matchmaking wait time
  const [log,       setLog]       = useState<{msg:string;type:'p1'|'p2'|'sys'}[]>([
    { msg: 'Game starting...', type: 'sys' }
  ]);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const logRef      = useRef<HTMLDivElement>(null);
  const unsubGame   = useRef<(()=>void)|null>(null);
  const unsubMatch  = useRef<(()=>void)|null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const mmTimerRef  = useRef<ReturnType<typeof setInterval>|null>(null);
  const settledRef  = useRef(false);
  const gameIdRef   = useRef<string>('');

  // Redraw board on game state change
  useEffect(() => {
    if (gameDoc && canvasRef.current) drawBoard(canvasRef.current, gameDoc);
  }, [gameDoc]);

  // Scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Cleanup on unmount
  useEffect(() => () => {
    unsubGame.current?.(); unsubMatch.current?.();
    if (timerRef.current) clearInterval(timerRef.current);
    if (mmTimerRef.current) clearInterval(mmTimerRef.current);
  }, []);

  const addLog = (msg: string, type: 'p1'|'p2'|'sys' = 'sys') =>
    setLog(prev => [...prev.slice(-24), { msg, type }]);

  // Handle game finish
  const handleGameFinish = useCallback(async (g: LudoGameDoc) => {
    if (settledRef.current) return;
    settledRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await settlePrize(g);
      await refreshProfile(); // refresh wallet balance
    } catch (e) {
      console.error('Prize settle error:', e);
    }
    setUiPhase('game_over');
  }, [refreshProfile]);

  // Start game listener
  const startGameListener = useCallback((gid: string) => {
    gameIdRef.current = gid;
    unsubGame.current = listenToGame(gid, (g) => {
      setGameDoc(g);

      if (g.status === 'finished' && !settledRef.current) {
        handleGameFinish(g);
        return;
      }

      // Only one client (player1) drives the timer to avoid double-tick
      // We check if it's our turn OR we are player1 to tick
    });

    // Timer: tick every second — both clients call tickTimer (Firestore tx makes it safe)
    timerRef.current = setInterval(async () => {
      try { await tickTimer(gid); } catch {}
    }, 1000);
  }, [handleGameFinish]);

  // ── Find Match ─────────────────────────────────────────────────────────────
  const findMatch = async () => {
    if (!uid) return toast.error('Please login first');
    const balance = userProfile?.walletBalance ?? 0;
    if (balance < entryFee) return toast.error(`Insufficient balance! Need ₹${entryFee}`);

    setUiPhase('matchmaking');
    setMmSeconds(0);
    mmTimerRef.current = setInterval(() => setMmSeconds(s => s + 1), 1000);
    addLog('Searching for opponent...', 'sys');

    try {
      const { gameId, role } = await joinMatchmaking(uid, uname, entryFee);
      setMyRole(role);
      settledRef.current = false;

      if (role === 'player2') {
        // Game already created — listen directly
        if (mmTimerRef.current) clearInterval(mmTimerRef.current);
        addLog('Opponent found! Game starting...', 'sys');
        toast.success('Opponent found! Game starting!');
        startGameListener(gameId);
        setUiPhase('in_game');
      } else {
        // We created a placeholder — wait for opponent via listener
        unsubMatch.current = listenForMatch(uid, (gid, foundRole) => {
          if (mmTimerRef.current) clearInterval(mmTimerRef.current);
          unsubMatch.current?.();
          setMyRole(foundRole);
          addLog('Opponent joined! Game starting...', 'sys');
          toast.success('Opponent found! Game starting!');
          startGameListener(gid);
          setUiPhase('in_game');
        });

        // Auto-cancel if waiting > 60 seconds
        setTimeout(async () => {
          if (uiPhase !== 'matchmaking') return;
          unsubMatch.current?.();
          if (mmTimerRef.current) clearInterval(mmTimerRef.current);
          await cancelMatchmaking(uid, entryFee);
          toast.error('No opponent found. Entry fee refunded.');
          setUiPhase('lobby');
        }, 60_000);
      }
    } catch (err: unknown) {
      if (mmTimerRef.current) clearInterval(mmTimerRef.current);
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(msg);
      setUiPhase('lobby');
    }
  };

  const cancelSearch = async () => {
    unsubMatch.current?.();
    if (mmTimerRef.current) clearInterval(mmTimerRef.current);
    try {
      await cancelMatchmaking(uid, entryFee);
      toast.success('Search cancelled. Entry fee refunded.');
    } catch {}
    setUiPhase('lobby');
  };

  // ── Roll Dice ──────────────────────────────────────────────────────────────
  const rollDice = useCallback(() => {
    if (!gameDoc || rolling) return;
    if (gameDoc.currentTurn !== uid) return toast.error("It's not your turn!");

    setRolling(true);
    let count = 0;
    const iv = setInterval(async () => {
      setDiceDisp(DICE_FACES[Math.floor(Math.random() * 6)]);
      count++;
      if (count >= 10) {
        clearInterval(iv);
        const val = (Math.floor(Math.random() * 6) + 1) as 1|2|3|4|5|6;
        setDiceDisp(DICE_FACES[val - 1]);
        try {
          await submitRoll(gameDoc.gameId, uid, val);
          const myType = myRole === 'player1' ? 'p1' : 'p2';
          addLog(
            val === 6
              ? `You rolled 6! Extra turn + goti released 🎉`
              : `You rolled ${val}`,
            myType
          );
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Roll failed';
          toast.error(msg);
        }
        setRolling(false);
      }
    }, 80);
  }, [gameDoc, rolling, uid, myRole]);

  const doForfeit = async () => {
    if (!gameDoc) return;
    try {
      await forfeitGame(gameDoc.gameId, uid);
      toast.error('You forfeited the match.');
    } catch {}
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

  const balance  = userProfile?.walletBalance ?? 0;
  const prize    = Math.floor(entryFee * 2 * 0.95);
  const isMyTurn = gameDoc?.currentTurn === uid;
  const timerWarn = (gameDoc?.timeLeft ?? 999) <= 30;
  const opponentName = gameDoc
    ? (myRole === 'player1' ? gameDoc.player2?.name : gameDoc.player1.name) ?? 'Opponent'
    : 'Opponent';

  // ── Determine winner info for game over screen ─────────────────────────────
  const getResultInfo = () => {
    if (!gameDoc) return null;
    const myPlayer   = myRole === 'player1' ? gameDoc.player1 : gameDoc.player2!;
    const oppPlayer  = myRole === 'player1' ? gameDoc.player2! : gameDoc.player1;
    const iWon       = gameDoc.winnerId === uid;
    const isDraw     = gameDoc.winnerId === null;
    return { myPlayer, oppPlayer, iWon, isDraw, prize: gameDoc.prizePool };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ════════════════════════════════════════════════════════════════════════════
  if (uiPhase === 'lobby') return (
    <div className="space-y-4 pb-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/games')} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-sora text-white">🎲 Ludo Battle</h1>
          <p className="text-xs text-white/40">Real-time 1v1 • Winner takes all</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-sm">
          <Wallet className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-bold">₹{balance.toFixed(0)}</span>
        </div>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }}
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/20">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">🎲</div>
        <h2 className="text-xl font-bold text-white font-sora">Win Real Cash in Ludo!</h2>
        <p className="text-white/50 text-sm mt-1">Beat a random opponent. Highest dice score in 5 min wins!</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 8,234 online</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-400" /> Fair play</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Instant payout</span>
        </div>
      </motion.div>

      {/* Entry fee selector */}
      <div className="glass rounded-2xl p-5 border border-white/8 space-y-4">
        <h3 className="font-semibold text-white text-sm">Select Entry Fee</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {ENTRY_FEES.map(fee => (
            <button key={fee} onClick={() => setEntryFee(fee)}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                entryFee === fee
                  ? 'bg-purple-500/30 border-2 border-purple-500/60 text-purple-300 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border border-white/10 text-white hover:border-purple-500/30'
              }`}>
              ₹{fee}
            </button>
          ))}
        </div>

        {/* Prize breakdown */}
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Entry Fee</span>
            <span className="text-white font-semibold">₹{entryFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Prize Pool</span>
            <span className="text-green-400 font-bold">₹{prize}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Platform Fee</span>
            <span className="text-white/40">5%</span>
          </div>
        </div>

        {balance < entryFee && (
          <p className="text-xs text-red-400 text-center">
            Insufficient balance.{' '}
            <button onClick={() => navigate('/wallet')} className="text-purple-400 underline">Add Money</button>
          </p>
        )}

        <GlowButton fullWidth size="lg" onClick={findMatch} disabled={balance < entryFee}>
          <Zap className="w-4 h-4" /> Find Opponent — ₹{entryFee}
        </GlowButton>
      </div>

      {/* How to win */}
      <div className="glass rounded-2xl p-4 border border-white/8">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" /> How to Win
        </h3>
        <ul className="space-y-1.5 text-xs text-white/50">
          <li>• Game lasts <span className="text-white/70">5 minutes</span></li>
          <li>• Roll dice — score adds up each roll</li>
          <li>• Roll 6 to bring a goti onto the board + extra turn</li>
          <li>• Highest total score when timer ends <span className="text-green-400 font-semibold">WINS</span></li>
          <li>• Winner gets <span className="text-green-400 font-semibold">₹{prize}</span></li>
        </ul>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MATCHMAKING
  // ════════════════════════════════════════════════════════════════════════════
  if (uiPhase === 'matchmaking') return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-4">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center text-5xl">
          🎲
        </div>
      </motion.div>

      <div className="text-center">
        <h2 className="text-2xl font-bold font-sora text-white">Finding Opponent...</h2>
        <p className="text-white/40 mt-1">Entry: ₹{entryFee} • Prize: ₹{prize}</p>
        <p className="text-white/25 text-sm mt-2">Waiting {mmSeconds}s...</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-white/30">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Matching you with a real player
      </div>

      <GlowButton variant="ghost" onClick={cancelSearch}>
        <RotateCcw className="w-4 h-4" /> Cancel Search
      </GlowButton>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // GAME OVER
  // ════════════════════════════════════════════════════════════════════════════
  if (uiPhase === 'game_over') {
    const result = getResultInfo();
    if (!result) return null;
    const { myPlayer, oppPlayer, iWon, isDraw } = result;

    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6">
        <div className="text-7xl">{isDraw ? '🤝' : iWon ? '🏆' : '😔'}</div>
        <div>
          <h2 className="text-3xl font-bold font-sora text-white">
            {isDraw ? 'Draw!' : iWon ? 'You Won!' : 'You Lost!'}
          </h2>
          <p className="text-white/40 mt-1">
            {isDraw ? 'Entry fee refunded (minus 5%)'
              : iWon ? `₹${result.prize} credited to your wallet!`
              : 'Better luck next time!'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { p: myPlayer, label: 'You', isWinner: iWon || (isDraw), borderClass: 'border-purple-500/40' },
            { p: oppPlayer, label: opponentName, isWinner: !iWon && !isDraw, borderClass: 'border-white/10' },
          ].map(({ p, label, isWinner, borderClass }) => (
            <div key={label} className={`glass rounded-2xl p-5 border-2 ${isWinner && !isDraw ? 'border-yellow-500/50' : borderClass}`}>
              {isWinner && !isDraw && <div className="text-xs text-yellow-400 font-bold tracking-widest mb-2">👑 WINNER</div>}
              <div className="text-sm text-white/50 mb-1">{label}</div>
              <div className="text-3xl font-black text-white">{p.score}</div>
              <div className="text-xs text-white/30 mt-1">{p.rolls} rolls</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <GlowButton variant="ghost" onClick={() => { setGameDoc(null); setUiPhase('lobby'); }}>
            Back to Lobby
          </GlowButton>
          <GlowButton onClick={() => { setGameDoc(null); settledRef.current = false; setUiPhase('lobby'); setTimeout(findMatch, 100); }}>
            <Trophy className="w-4 h-4" /> Play Again
          </GlowButton>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // IN GAME
  // ════════════════════════════════════════════════════════════════════════════
  if (!gameDoc) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="spin-loader w-10 h-10 mx-auto" />
        <p className="text-white/40 text-sm">Loading game...</p>
      </div>
    </div>
  );

  const myPlayer  = myRole === 'player1' ? gameDoc.player1 : gameDoc.player2!;
  const oppPlayer = myRole === 'player1' ? gameDoc.player2! : gameDoc.player1;

  return (
    <div className="space-y-3 pb-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/games')} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold font-sora text-white">🎲 Ludo Battle</h1>
          <p className="text-xs text-white/40">
            Prize: <span className="text-green-400 font-bold">₹{gameDoc.prizePool}</span>
          </p>
        </div>

        {/* Timer */}
        <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-bold text-lg transition-all ${
          timerWarn ? 'bg-red-900/30 border-red-500/50 text-red-400 animate-pulse'
                    : 'bg-yellow-900/10 border-yellow-700/25 text-yellow-400'
        }`}>
          <Clock className="w-4 h-4" />
          {formatTime(gameDoc.timeLeft)}
        </div>
      </div>

      {/* Score bar */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { p: myPlayer,  label: 'You',         isActive: isMyTurn,  col:'#FF7675', border: isMyTurn  ? 'border-red-500'  : 'border-red-900/30'  },
          { p: oppPlayer, label: opponentName,   isActive: !isMyTurn, col:'#74B9FF', border: !isMyTurn ? 'border-blue-500' : 'border-blue-900/30' },
        ].map(({ p, label, isActive, col, border }) => (
          <div key={label} className={`flex items-center justify-between px-4 py-3 glass rounded-2xl border-2 transition-all ${border}`}>
            <div>
              <p className="text-[9px] tracking-widest font-bold mb-0.5" style={{ color: col, opacity: 0.65 }}>
                {label.toUpperCase()}
                {isActive && <span className="ml-1 text-yellow-400">▶</span>}
              </p>
              <p className="text-sm font-bold text-white">{p?.name ?? '...'}</p>
              <p className="text-[10px] text-white/25">{p?.rolls ?? 0} rolls</p>
            </div>
            <div className="text-3xl font-black" style={{ color: col }}>{p?.score ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Board + controls */}
      <div className="grid lg:grid-cols-3 gap-3">

        {/* Board */}
        <div className="lg:col-span-2 glass rounded-2xl p-4 border border-white/8">
          <canvas
            ref={canvasRef}
            width={320} height={320}
            className="w-full rounded-xl"
            style={{ aspectRatio: '1' }}
          />
        </div>

        {/* Right panel */}
        <div className="space-y-3">

          {/* Dice */}
          <div className="glass rounded-2xl p-4 border border-white/8 text-center space-y-3">
            <p className="text-[9px] tracking-[3px] text-white/30">
              {isMyTurn ? '▶ YOUR TURN' : '⏳ WAIT'}
            </p>

            <motion.button
              onClick={rollDice}
              disabled={rolling || !isMyTurn}
              whileTap={{ scale: 0.88 }}
              animate={rolling ? { rotate: 360 } : { rotate: 0 }}
              transition={rolling ? { repeat: Infinity, duration: 0.4, ease:'linear' } : {}}
              className={`w-20 h-20 mx-auto rounded-2xl text-5xl font-bold border-2 transition-all flex items-center justify-center ${
                isMyTurn && !rolling
                  ? 'border-purple-500/60 bg-purple-500/15 hover:bg-purple-500/25 cursor-pointer text-yellow-400'
                  : 'border-white/10 bg-white/5 cursor-not-allowed opacity-40 text-white/40'
              }`}>
              {diceDisp}
            </motion.button>

            <p className="text-xs text-white/30">
              {rolling ? 'Rolling...' : isMyTurn ? 'Tap to roll!' : `${oppPlayer?.name ?? 'Opponent'}'s turn`}
            </p>
            {gameDoc.lastDice > 0 && (
              <p className="text-xs text-white/25">
                Last roll: {DICE_FACES[gameDoc.lastDice - 1]} {gameDoc.lastDice}
              </p>
            )}
          </div>

          {/* Round */}
          <div className="glass rounded-xl px-4 py-2.5 border border-white/5 flex justify-between items-center">
            <span className="text-[9px] tracking-widest text-white/25">ROUND</span>
            <span className="font-bold text-yellow-500/80">{gameDoc.player1.rolls + (gameDoc.player2?.rolls ?? 0)}</span>
          </div>

          {/* Log */}
          <div ref={logRef} className="glass rounded-xl p-3 border border-white/5 overflow-y-auto space-y-1" style={{ maxHeight: 120 }}>
            <AnimatePresence>
              {log.map((entry, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-[11px] leading-tight ${
                    i === log.length - 1
                      ? entry.type === 'p1' ? 'text-red-400/90 font-semibold'
                        : entry.type === 'p2' ? 'text-blue-400/90 font-semibold'
                        : 'text-yellow-500/80 font-semibold'
                      : 'text-white/25'
                  }`}>
                  {entry.msg}
                </motion.p>
              ))}
            </AnimatePresence>
          </div>

          {/* Forfeit */}
          <button onClick={doForfeit}
            className="w-full py-2 rounded-xl text-[11px] tracking-widest text-red-400/40 border border-red-900/20 hover:border-red-500/30 hover:text-red-400/60 transition-all font-semibold">
            FORFEIT MATCH
          </button>
        </div>
      </div>
    </div>
  );
};
