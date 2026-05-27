import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Clock, Trophy, Shield, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type GamePhase = 'lobby' | 'in_game' | 'game_over';

interface PlayerState {
  name: string;
  score: number;
  rolls: number;
  // 4 gotis: -1 = at home base, 0..51 = on board path
  gotiPos: [number, number, number, number];
}

interface GameState {
  phase: GamePhase;
  currentPlayer: 1 | 2;
  p1: PlayerState;
  p2: PlayerState;
  timeLeft: number;
  round: number;
  lastDice: number;
  rolling: boolean;
  log: { msg: string; player: 0 | 1 | 2 }[];
}

// ─── Board Path (15×15 grid, 52 cells) ───────────────────────────────────────
// Each entry: [col, row] — Red starts at index 0, Blue offset by 26
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

// Home base positions for 4 gotis each player
const P1_HOME: [number, number][] = [[1.5,1.5],[3.5,1.5],[1.5,3.5],[3.5,3.5]];
const P2_HOME: [number, number][] = [[9.5,1.5],[11.5,1.5],[9.5,3.5],[11.5,3.5]];

const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
const TOTAL_SECS = 300;

// ─── Canvas Board Renderer ────────────────────────────────────────────────────

function drawBoard(
  canvas: HTMLCanvasElement,
  p1: PlayerState,
  p2: PlayerState,
  currentPlayer: 1 | 2
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const S = canvas.width;
  const cs = S / 15;

  ctx.clearRect(0, 0, S, S);

  // Board background
  ctx.fillStyle = '#12082A';
  ctx.beginPath();
  (ctx as any).roundRect?.(0, 0, S, S, 12);
  ctx.fill();

  // Draw each cell
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const x = c * cs, y = r * cs;
      let fill = '#1A0A2E';
      let stroke = 'rgba(200,168,75,0.12)';

      // Home quadrants
      if (r < 6 && c < 6)  { fill = '#2D0A0A'; stroke = 'rgba(214,48,49,0.25)'; }
      if (r < 6 && c > 8)  { fill = '#0A1A2D'; stroke = 'rgba(9,132,227,0.25)'; }
      if (r > 8 && c < 6)  { fill = '#0A1A2D'; stroke = 'rgba(9,132,227,0.15)'; }
      if (r > 8 && c > 8)  { fill = '#2D0A0A'; stroke = 'rgba(214,48,49,0.15)'; }

      // Path cells
      const pidx = PATH.findIndex(([pc, pr]) => pc === c && pr === r);
      if (pidx >= 0) {
        fill = '#22123E';
        stroke = 'rgba(200,168,75,0.35)';
        if (SAFE_IDX.has(pidx)) fill = '#1A3020';
      }

      // Home stretch lanes
      if (c === 7 && r >= 1 && r <= 5) fill = '#2A1060';
      if (r === 7 && c >= 1 && c <= 5) fill = '#2A1060';
      if (c === 7 && r >= 9 && r <= 13) fill = '#2A1060';
      if (r === 7 && c >= 9 && c <= 13) fill = '#2A1060';

      // Center 3×3
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
        fill = '#2A1450'; stroke = 'rgba(200,168,75,0.5)';
      }

      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.rect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      ctx.fill();
      ctx.stroke();

      // Safe star
      if (pidx >= 0 && SAFE_IDX.has(pidx)) {
        ctx.fillStyle = 'rgba(200,168,75,0.55)';
        ctx.font = `${cs * 0.48}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', x + cs / 2, y + cs / 2);
      }
    }
  }

  // Home base circles
  const drawHomeCircles = (homes: [number, number][], color: string) => {
    homes.forEach(([cx, cy]) => {
      const x = cx * cs, y = cy * cs, r = cs * 0.38;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color === 'red' ? 'rgba(214,48,49,0.12)' : 'rgba(9,132,227,0.12)';
      ctx.fill();
      ctx.strokeStyle = color === 'red' ? 'rgba(214,48,49,0.45)' : 'rgba(9,132,227,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };
  drawHomeCircles(P1_HOME, 'red');
  drawHomeCircles(P2_HOME, 'blue');

  // Center triangles
  ctx.fillStyle = 'rgba(200,168,75,0.1)';
  const tri = (pts: [number,number][]) => {
    ctx.beginPath();
    pts.forEach(([x,y],i)=> i===0 ? ctx.moveTo(x*cs,y*cs) : ctx.lineTo(x*cs,y*cs));
    ctx.closePath(); ctx.fill();
  };
  tri([[7,6],[9,6],[8,8]]); tri([[7,9],[9,9],[8,7]]);
  tri([[6,7],[6,9],[8,8]]); tri([[9,7],[9,9],[7,8]]);

  // Crown center
  ctx.font = `${cs * 1.1}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♛', 8 * cs, 8 * cs);

  // ── Draw Gotis ──
  const drawGoti = (
    cx: number, cy: number, radius: number,
    baseColor: string, lightColor: string,
    label: string, isActive: boolean
  ) => {
    // Drop shadow
    ctx.beginPath();
    ctx.arc(cx, cy + radius * 0.3, radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();

    // Body gradient
    const grad = ctx.createRadialGradient(
      cx - radius * 0.28, cy - radius * 0.28, radius * 0.05,
      cx, cy, radius
    );
    grad.addColorStop(0, lightColor);
    grad.addColorStop(0.45, baseColor);
    grad.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim
    ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = isActive ? 1.5 : 0.8;
    ctx.stroke();

    // Active glow ring
    if (isActive) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = lightColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Shine
    ctx.beginPath();
    ctx.arc(cx - radius * 0.27, cy - radius * 0.27, radius * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `bold ${radius * 0.82}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy + 1);
  };

  // P1 home gotis
  let p1hi = 0;
  p1.gotiPos.forEach((pos, i) => {
    if (pos === -1) {
      const [cx, cy] = P1_HOME[p1hi++];
      drawGoti(cx * cs, cy * cs, cs * 0.34, '#D63031', '#FF7675', String(i + 1), currentPlayer === 1);
    }
  });

  // P2 home gotis
  let p2hi = 0;
  p2.gotiPos.forEach((pos, i) => {
    if (pos === -1) {
      const [cx, cy] = P2_HOME[p2hi++];
      drawGoti(cx * cs, cy * cs, cs * 0.34, '#0984E3', '#74B9FF', String(i + 1), currentPlayer === 2);
    }
  });

  // P1 on-board gotis
  p1.gotiPos.forEach((pos, i) => {
    if (pos >= 0 && pos < PATH.length) {
      const [c, r] = PATH[pos];
      drawGoti((c + 0.5) * cs, (r + 0.5) * cs, cs * 0.37, '#D63031', '#FF7675', String(i + 1), currentPlayer === 1);
    }
  });

  // P2 on-board gotis (offset 26)
  p2.gotiPos.forEach((pos, i) => {
    if (pos >= 0 && pos < PATH.length) {
      const idx = (pos + 26) % 52;
      const [c, r] = PATH[idx];
      drawGoti((c + 0.5) * cs, (r + 0.5) * cs, cs * 0.37, '#0984E3', '#74B9FF', String(i + 1), currentPlayer === 2);
    }
  });
}

// ─── Initial State ────────────────────────────────────────────────────────────

const makePlayer = (name: string): PlayerState => ({
  name,
  score: 0,
  rolls: 0,
  gotiPos: [-1, -1, -1, -1],
});

const initState = (p1name: string, p2name: string): GameState => ({
  phase: 'in_game',
  currentPlayer: 1,
  p1: makePlayer(p1name),
  p2: makePlayer(p2name),
  timeLeft: TOTAL_SECS,
  round: 1,
  lastDice: 0,
  rolling: false,
  log: [{ msg: 'Game started! Roll the dice.', player: 0 }],
});

// ─── Main Component ───────────────────────────────────────────────────────────

export const LudoGame = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [p1name, setP1name] = useState(userProfile?.username || 'Player 1');
  const [p2name, setP2name] = useState('Player 2');

  const [gs, setGs] = useState<GameState | null>(null);
  const [diceDisplay, setDiceDisplay] = useState('⚄');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Redraw board whenever game state changes
  useEffect(() => {
    if (!gs || !canvasRef.current) return;
    drawBoard(canvasRef.current, gs.p1, gs.p2, gs.currentPlayer);
  }, [gs]);

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [gs?.log]);

  // Timer
  useEffect(() => {
    if (!gs || gs.phase !== 'in_game') return;
    timerRef.current = setInterval(() => {
      setGs(prev => {
        if (!prev) return prev;
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current!);
          return { ...prev, timeLeft: 0, phase: 'game_over' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gs?.phase]);

  const startGame = () => {
    const state = initState(p1name || 'Player 1', p2name || 'Player 2');
    setGs(state);
    setPhase('in_game');
    setDiceDisplay('⚄');
  };

  const rollDice = useCallback(() => {
    if (!gs || gs.rolling || gs.phase !== 'in_game') return;

    setGs(prev => prev ? { ...prev, rolling: true } : prev);

    let count = 0;
    const iv = setInterval(() => {
      setDiceDisplay(DICE_FACES[Math.floor(Math.random() * 6)]);
      count++;
      if (count >= 10) {
        clearInterval(iv);
        const val = (Math.floor(Math.random() * 6) + 1) as 1|2|3|4|5|6;
        setDiceDisplay(DICE_FACES[val - 1]);

        setGs(prev => {
          if (!prev) return prev;
          const cp = prev.currentPlayer;
          const pKey = cp === 1 ? 'p1' : 'p2';
          const player = { ...prev[pKey] };
          const gotiPos = [...player.gotiPos] as [number,number,number,number];

          player.score += val;
          player.rolls += 1;

          // Goti movement logic
          const activeIdx = gotiPos.findIndex(p => p >= 0);
          const homeIdx   = gotiPos.findIndex(p => p === -1);
          let logMsg = `${player.name} rolled ${val}.`;
          let logPlayer: 0|1|2 = cp;

          if (val === 6 && homeIdx >= 0) {
            gotiPos[homeIdx] = 0;
            logMsg = `${player.name} rolled 6! Goti ${homeIdx + 1} enters the board!`;
          } else if (activeIdx >= 0) {
            gotiPos[activeIdx] = (gotiPos[activeIdx] + val) % 52;
            logMsg = `${player.name} rolled ${val}. Goti ${activeIdx + 1} moves forward.`;
          } else {
            logMsg = `${player.name} rolled ${val}. Need 6 to release a goti!`;
          }

          const extraTurn = val === 6;
          if (extraTurn) logMsg += ' 🎉 Extra turn!';

          const updatedPlayer = { ...player, gotiPos };
          const nextPlayer: 1|2 = extraTurn ? cp : (cp === 1 ? 2 : 1);

          return {
            ...prev,
            [pKey]: updatedPlayer,
            currentPlayer: nextPlayer,
            round: prev.round + (extraTurn ? 0 : 1),
            lastDice: val,
            rolling: false,
            log: [...prev.log, { msg: logMsg, player: logPlayer }].slice(-25),
          };
        });
      }
    }, 80);
  }, [gs]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const resetToLobby = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGs(null);
    setPhase('lobby');
  };

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0520] via-[#1A0A2E] to-[#0D0520] flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Back */}
          <button onClick={() => navigate('/games')}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-6 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to Games
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-[6px] text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #8B6914, #C8A84B, #F0D080, #C8A84B, #8B6914)', fontFamily: 'Georgia, serif' }}>
              LUDO
            </h1>
            <p className="text-[11px] tracking-[8px] text-yellow-600/60 mt-1">ROYAL BATTLE</p>
            <div className="flex justify-center gap-3 mt-4">
              {['⚀','⚂','⚄','⚅'].map((d, i) => (
                <div key={i} className="w-9 h-9 rounded-lg border border-yellow-700/40 flex items-center justify-center text-xl text-yellow-500/70 bg-yellow-900/10">
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Player inputs */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* P1 */}
            <div className="bg-white/[0.04] border border-red-900/40 rounded-2xl p-4">
              <p className="text-[10px] tracking-[3px] text-red-400/70 mb-3 font-semibold">🔴 PLAYER 1</p>
              <input
                value={p1name}
                onChange={e => setP1name(e.target.value)}
                maxLength={10}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold text-center outline-none focus:border-red-500/50 transition-colors"
              />
              <div className="flex justify-center gap-1.5 mt-3">
                {[0,1,2,3].map(i => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-red-400/40"
                    style={{ background: 'radial-gradient(circle at 35% 35%, #FF7675, #D63031, #6B0000)' }} />
                ))}
              </div>
            </div>
            {/* P2 */}
            <div className="bg-white/[0.04] border border-blue-900/40 rounded-2xl p-4">
              <p className="text-[10px] tracking-[3px] text-blue-400/70 mb-3 font-semibold">🔵 PLAYER 2</p>
              <input
                value={p2name}
                onChange={e => setP2name(e.target.value)}
                maxLength={10}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold text-center outline-none focus:border-blue-500/50 transition-colors"
              />
              <div className="flex justify-center gap-1.5 mt-3">
                {[0,1,2,3].map(i => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-blue-400/40"
                    style={{ background: 'radial-gradient(circle at 35% 35%, #74B9FF, #0984E3, #003A75)' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Info strip */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: <Clock className="w-4 h-4" />, label: '5 MIN GAME' },
              { icon: <Trophy className="w-4 h-4" />, label: 'SCORE WINS' },
              { icon: <Shield className="w-4 h-4" />, label: '2 PLAYERS' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-2 rounded-xl bg-yellow-900/10 border border-yellow-700/20">
                <span className="text-yellow-600/70">{icon}</span>
                <span className="text-[9px] tracking-[1px] text-yellow-600/50 font-semibold">{label}</span>
              </div>
            ))}
          </div>

          {/* Start */}
          <button onClick={startGame}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-[4px] text-[#1A0A2E] transition-transform active:scale-95 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #8B6914, #C8A84B, #F0D080, #C8A84B, #8B6914)', fontFamily: 'Georgia, serif' }}>
            ⚔ START BATTLE ⚔
          </button>
        </div>
      </div>
    );
  }

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (gs && (gs.phase === 'game_over' || phase === 'game_over')) {
    const p1wins = gs.p1.score > gs.p2.score;
    const draw   = gs.p1.score === gs.p2.score;
    const winner = draw ? null : (p1wins ? gs.p1 : gs.p2);
    const loser  = draw ? null : (p1wins ? gs.p2 : gs.p1);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D0520] via-[#1A0A2E] to-[#0D0520] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">

          {/* Trophy */}
          <div className="text-7xl mb-3">{draw ? '🤝' : '🏆'}</div>
          <h2 className="text-4xl font-black tracking-[4px] mb-1"
            style={{ fontFamily: 'Georgia, serif', color: draw ? '#C8A84B' : (p1wins ? '#FF7675' : '#74B9FF') }}>
            {draw ? 'DRAW!' : 'VICTORY!'}
          </h2>
          <p className="text-sm tracking-[4px] text-white/30 mb-8">
            {draw ? 'EQUAL SCORES' : `${winner?.name?.toUpperCase()} WINS`}
          </p>

          {/* Result cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[gs.p1, gs.p2].map((p, i) => {
              const isWinner = !draw && ((i === 0 && p1wins) || (i === 1 && !p1wins));
              const color = i === 0 ? '#FF7675' : '#74B9FF';
              const borderColor = i === 0 ? 'border-red-500/40' : 'border-blue-500/40';
              return (
                <div key={i}
                  className={`rounded-2xl p-5 border-2 ${isWinner ? (i===0?'border-red-400':'border-blue-400') : borderColor} bg-white/[0.04]`}>
                  {isWinner && <div className="text-xs tracking-[3px] font-bold mb-2" style={{ color }}>👑 WINNER</div>}
                  <div className="text-xs tracking-[2px] mb-1" style={{ color, opacity: 0.7 }}>
                    {i === 0 ? '🔴' : '🔵'} {i === 0 ? 'PLAYER 1' : 'PLAYER 2'}
                  </div>
                  <div className="text-lg font-bold text-white mb-2">{p.name}</div>
                  <div className="text-4xl font-black mb-1" style={{ color }}>{p.score}</div>
                  <div className="text-xs text-white/30">SCORE</div>
                  <div className="mt-2 text-xs text-white/30">{p.rolls} rolls</div>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={resetToLobby}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors text-sm font-semibold">
              <RotateCcw className="w-4 h-4" /> Lobby
            </button>
            <button onClick={startGame}
              className="flex-1 py-3 rounded-xl font-black tracking-[2px] text-sm text-[#1A0A2E] hover:brightness-110 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #8B6914, #C8A84B, #F0D080, #C8A84B, #8B6914)' }}>
              ⚔ REMATCH
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── IN GAME ────────────────────────────────────────────────────────────────
  if (!gs) return null;

  const cp = gs.currentPlayer;
  const currentName = cp === 1 ? gs.p1.name : gs.p2.name;
  const timerWarn = gs.timeLeft <= 30;
  const canRoll = !gs.rolling && gs.phase === 'in_game';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0520] via-[#1A0A2E] to-[#0D0520] p-3">
      <div className="max-w-2xl mx-auto space-y-3">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={resetToLobby}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-[3px] text-yellow-500/90" style={{ fontFamily: 'Georgia, serif' }}>
              🎲 LUDO ROYAL
            </h1>
            <p className="text-[10px] tracking-[2px] text-white/25">2 PLAYER BATTLE</p>
          </div>

          {/* Timer */}
          <div className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl transition-all ${
            timerWarn
              ? 'bg-red-900/30 border-red-500/50 text-red-400 animate-pulse'
              : 'bg-yellow-900/15 border-yellow-700/30 text-yellow-400'
          }`}>
            <Clock className="w-4 h-4" />
            {formatTime(gs.timeLeft)}
          </div>
        </div>

        {/* Score Bar */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { p: gs.p1, side: 1, col: '#FF7675', border: cp===1 ? 'border-red-500' : 'border-red-900/30' },
            { p: gs.p2, side: 2, col: '#74B9FF', border: cp===2 ? 'border-blue-500' : 'border-blue-900/30' },
          ].map(({ p, side, col, border }) => (
            <div key={side}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl bg-white/[0.04] border-2 transition-all ${border}`}>
              <div>
                <p className="text-[9px] tracking-[2px] font-bold mb-0.5" style={{ color, opacity: 0.65 }}>
                  {side === 1 ? '🔴' : '🔵'} {side === 1 ? 'PLAYER 1' : 'PLAYER 2'}
                  {cp === side && <span className="ml-2 text-yellow-400">▶</span>}
                </p>
                <p className="text-sm font-bold text-white leading-tight">{p.name}</p>
                <p className="text-[10px] text-white/25">{p.rolls} rolls</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black" style={{ color }}>{p.score}</div>
                <div className="text-[9px] tracking-[1px] text-white/25">SCORE</div>
              </div>
            </div>
          ))}
        </div>

        {/* Board + Controls */}
        <div className="flex gap-3 items-start">
          {/* Canvas Board */}
          <div className="flex-shrink-0">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="rounded-2xl border border-yellow-700/25"
              style={{ width: '100%', maxWidth: 340, aspectRatio: '1' }}
            />
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">

            {/* Turn + Dice */}
            <div className="bg-white/[0.04] border border-yellow-700/20 rounded-2xl p-4 text-center">
              <p className="text-[9px] tracking-[3px] text-white/25 mb-1">CURRENT TURN</p>
              <p className="text-sm font-black mb-3 truncate"
                style={{ color: cp === 1 ? '#FF7675' : '#74B9FF' }}>
                {currentName}
              </p>

              {/* Dice Button */}
              <button
                onClick={rollDice}
                disabled={!canRoll}
                className={`w-16 h-16 rounded-2xl text-4xl mx-auto block mb-3 border-2 transition-all font-bold ${
                  canRoll
                    ? 'border-yellow-600/50 bg-yellow-900/15 hover:bg-yellow-900/30 active:scale-90 cursor-pointer text-yellow-400'
                    : 'border-white/10 bg-white/5 cursor-not-allowed opacity-35 text-white/40'
                } ${gs.rolling ? 'animate-spin' : ''}`}>
                {diceDisplay}
              </button>

              <p className="text-[10px] text-white/30">
                {gs.rolling ? 'Rolling...' : canRoll ? 'Tap to roll!' : 'Wait...'}
              </p>
              {gs.lastDice > 0 && !gs.rolling && (
                <p className="text-xs font-bold mt-1" style={{ color: cp === 1 ? '#74B9FF' : '#FF7675' }}>
                  Last: {DICE_FACES[gs.lastDice - 1]} {gs.lastDice}
                </p>
              )}
            </div>

            {/* Round */}
            <div className="bg-white/[0.04] border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-[9px] tracking-[2px] text-white/25">ROUND</span>
              <span className="text-lg font-black text-yellow-500/80">{gs.round}</span>
            </div>

            {/* Log */}
            <div
              ref={logRef}
              className="bg-black/25 border border-white/5 rounded-xl p-3 overflow-y-auto flex flex-col gap-1"
              style={{ maxHeight: 130 }}>
              {gs.log.map((entry, i) => (
                <p key={i}
                  className={`text-[11px] leading-tight ${
                    i === gs.log.length - 1
                      ? entry.player === 1 ? 'text-red-400/90 font-semibold'
                        : entry.player === 2 ? 'text-blue-400/90 font-semibold'
                        : 'text-yellow-500/80 font-semibold'
                      : 'text-white/25'
                  }`}>
                  {entry.msg}
                </p>
              ))}
            </div>

            {/* Forfeit */}
            <button
              onClick={() => { setGs(prev => prev ? { ...prev, phase: 'game_over' } : prev); toast.error('Match forfeited'); }}
              className="w-full py-2 rounded-xl text-[11px] tracking-[2px] text-red-400/50 border border-red-900/30 hover:border-red-500/40 hover:text-red-400/70 transition-all font-semibold">
              FORFEIT
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
