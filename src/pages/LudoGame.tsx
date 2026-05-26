import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const BOARD_SIZE = 15;

type PieceColor = 'red' | 'blue' | 'green' | 'yellow';

interface Piece {
  id: string;
  color: PieceColor;
  position: number;
  home: boolean;
}

const pieceColors: Record<PieceColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
};

const LudoGame: React.FC = () => {
  const { userProfile } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [entryFee, setEntryFee] = useState(100);
  const [diceValue, setDiceValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('red');
  const [pieces, setPieces] = useState<Piece[]>([
    { id: 'r1', color: 'red', position: -1, home: false },
    { id: 'b1', color: 'blue', position: -1, home: false },
    { id: 'g1', color: 'green', position: -1, home: false },
    { id: 'y1', color: 'yellow', position: -1, home: false },
  ]);
  const [winnerDeclared, setWinnerDeclared] = useState(false);
  const [matchHistory] = useState([
    { id: 1, result: 'Won', amount: 200, date: '2024-01-15', opponent: 'Player2' },
    { id: 2, result: 'Lost', amount: -100, date: '2024-01-14', opponent: 'Player3' },
    { id: 3, result: 'Won', amount: 150, date: '2024-01-13', opponent: 'Player1' },
  ]);

  const rollDice = async () => {
    if (rolling) return;
    setRolling(true);
    
    // Animate dice roll
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setRolling(false);

        // Move piece
        setPieces(prev => prev.map(p => {
          if (p.color === currentTurn) {
            const newPos = Math.min(57, p.position + finalValue);
            if (newPos >= 57 && !winnerDeclared) {
              setWinnerDeclared(true);
              toast.success(`🏆 ${currentTurn.toUpperCase()} wins!`);
            }
            return { ...p, position: newPos };
          }
          return p;
        }));

        // Change turn
        const colors: PieceColor[] = ['red', 'blue', 'green', 'yellow'];
        const idx = colors.indexOf(currentTurn);
        setCurrentTurn(colors[(idx + 1) % colors.length]);
      }
    }, 80);
  };

  const startGame = () => {
    if ((userProfile?.walletBalance || 0) < entryFee) {
      toast.error('Insufficient balance');
      return;
    }
    setGameStarted(true);
    setWinnerDeclared(false);
    setPieces([
      { id: 'r1', color: 'red', position: 0, home: false },
      { id: 'b1', color: 'blue', position: 14, home: false },
      { id: 'g1', color: 'green', position: 28, home: false },
      { id: 'y1', color: 'yellow', position: 42, home: false },
    ]);
    toast.success('Game started! Roll the dice! 🎲');
  };

  const diceFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  // Simple Ludo Board Representation
  const renderBoard = () => {
    const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => i);
    
    return (
      <div 
        className="relative mx-auto"
        style={{ width: '100%', maxWidth: 360, aspectRatio: '1' }}
      >
        <div
          className="grid w-full h-full border border-white/20 rounded-lg overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
        >
          {cells.map((i) => {
            const row = Math.floor(i / BOARD_SIZE);
            const col = i % BOARD_SIZE;
            
            // Home zones
            const isRedHome = row < 6 && col < 6;
            const isBlueHome = row < 6 && col > 8;
            const isGreenHome = row > 8 && col > 8;
            const isYellowHome = row > 8 && col < 6;
            const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;

            let bg = 'bg-white/5';
            if (isRedHome) bg = 'bg-red-500/30';
            else if (isBlueHome) bg = 'bg-blue-500/30';
            else if (isGreenHome) bg = 'bg-green-500/30';
            else if (isYellowHome) bg = 'bg-yellow-500/30';
            else if (isCenter) bg = 'bg-gradient-to-br from-purple-500/30 to-blue-500/30';

            const piece = pieces.find(p => {
              const pos = p.position % (BOARD_SIZE * BOARD_SIZE);
              return pos === i;
            });

            return (
              <div key={i} className={`ludo-cell ${bg} flex items-center justify-center relative`}>
                {piece && (
                  <div
                    className="w-3/4 h-3/4 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                    style={{ backgroundColor: pieceColors[piece.color] }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Center Star */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-2xl">⭐</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">🎲 Ludo Game</h1>
          <p className="text-gray-400 text-sm">Classic multiplayer board game</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Balance</p>
          <p className="text-green-400 font-orbitron font-bold">{formatCurrency(userProfile?.walletBalance || 0)}</p>
        </div>
      </motion.div>

      {!gameStarted ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Join Game */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-white font-bold text-xl mb-6 text-center">🎮 Start a Match</h3>
            
            <div className="text-6xl text-center mb-6 animate-bounce">🎲</div>
            
            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-2 block">Entry Fee</label>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200, 500, 1000, 2000].map(fee => (
                  <button
                    key={fee}
                    onClick={() => setEntryFee(fee)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      entryFee === fee ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    ₹{fee}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Entry Fee</span>
                <span className="text-white font-medium">{formatCurrency(entryFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prize Pool</span>
                <span className="text-green-400 font-bold">{formatCurrency(entryFee * 3.5)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Platform Fee</span>
                <span className="text-yellow-400">10%</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg transition-all hover:from-purple-700 hover:to-blue-700 hover:-translate-y-1"
            >
              🚀 Start Game
            </button>
          </motion.div>

          {/* Match History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-white font-semibold mb-4">📜 Match History</h3>
            <div className="space-y-3">
              {matchHistory.map(match => (
                <div key={match.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">vs {match.opponent}</p>
                    <p className="text-gray-500 text-xs">{match.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${match.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {match.amount > 0 ? '+' : ''}{formatCurrency(match.amount)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${match.result === 'Won' ? 'status-badge-success' : 'status-badge-error'}`}>
                      {match.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Board */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass border border-white/10 rounded-2xl p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold">Game Board</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-bold`} style={{ backgroundColor: `${pieceColors[currentTurn]}20`, color: pieceColors[currentTurn] }}>
                  {currentTurn.toUpperCase()}'s turn
                </span>
              </div>

              {renderBoard()}

              {/* Players */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {(Object.entries(pieceColors) as [PieceColor, string][]).map(([color, hex]) => {
                  const piece = pieces.find(p => p.color === color);
                  return (
                    <div key={color} className={`text-center p-2 rounded-lg ${currentTurn === color ? 'ring-2' : ''}`} style={{ borderColor: hex, borderWidth: currentTurn === color ? 2 : 0 }}>
                      <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: hex }} />
                      <p className="text-xs capitalize" style={{ color: hex }}>{color}</p>
                      <p className="text-white text-xs">{piece?.position ?? 0}/57</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Dice */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass border border-white/10 rounded-2xl p-5 text-center"
            >
              <h3 className="text-white font-semibold mb-4">🎲 Roll Dice</h3>
              <div className={`text-8xl mb-4 transition-all ${rolling ? 'animate-bounce' : ''}`}>
                {diceFaces[diceValue]}
              </div>
              <p className="text-gray-400 text-sm mb-4">Value: {diceValue}</p>
              <button
                onClick={rollDice}
                disabled={rolling || winnerDeclared}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold transition-all hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {rolling ? '🎲 Rolling...' : '🎲 Roll Dice'}
              </button>
            </motion.div>

            {/* Game Info */}
            <div className="glass border border-white/10 rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-3">Game Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Fee</span>
                  <span className="text-white">{formatCurrency(entryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prize</span>
                  <span className="text-green-400">{formatCurrency(entryFee * 3.5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Players</span>
                  <span className="text-white">4 (vs AI)</span>
                </div>
              </div>
            </div>

            {winnerDeclared && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="glass border border-yellow-500/30 rounded-2xl p-4 text-center bg-yellow-500/10"
              >
                <div className="text-4xl mb-2">🏆</div>
                <h3 className="text-yellow-400 font-bold">Game Over!</h3>
                <button
                  onClick={() => { setGameStarted(false); setWinnerDeclared(false); }}
                  className="mt-3 w-full bg-yellow-500 text-black py-2 rounded-lg font-bold text-sm"
                >
                  Play Again
                </button>
              </motion.div>
            )}

            <button
              onClick={() => setGameStarted(false)}
              className="w-full bg-white/5 border border-white/10 text-gray-400 py-2.5 rounded-xl text-sm hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              Exit Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LudoGame;
