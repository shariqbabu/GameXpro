// src/pages/DragonTigerLobbyPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Trophy, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getActiveTables, createDragonTigerTable } from '../firebase/dragonTiger';
import { DragonTigerTable } from '../types';
import toast from 'react-hot-toast';

export const DragonTigerLobbyPage: React.FC = () => {
  const { firebaseUser, user, wallet, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState<DragonTigerTable[]>([]);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [tableName, setTableName] = useState('');
  const [minBet, setMinBet] = useState(50);
  const [maxBet, setMaxBet] = useState(5000);

  const uid = firebaseUser?.uid || user?.id || (user as any)?.uid ||'';
  const userName =
  (user as any)?.username ||
  (user as any)?.name ||
  firebaseUser?.displayName ||
  firebaseUser?.email?.split('@')[0] ||
  'Player';

  const photoURL =
  (user as any)?.photoURL ||
  (user as any)?.avatar ||
  firebaseUser?.photoURL ||
  '';

  const walletBalance =
  (wallet?.depositBalance || 0) +
  (wallet?.winningBalance || 0) +
  (wallet?.referralBalance || 0) +
  (wallet?.bonusBalance || 0);

  useEffect(() => {
    const unsub = getActiveTables((t) => setTables(t));
    return () => unsub();
  }, []);

  const handleCreateTable = async () => {
    if (!uid) { toast.error('Please login'); return; }
    if (!tableName.trim()) { toast.error('Table name required'); return; }

    setCreating(true);
    try {
      const tableId = await createDragonTigerTable(
        uid, username, tableName, minBet, maxBet
      );
      toast.success('Table created!');
      navigate(`/dragon-tiger/${tableId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create table');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="text-6xl mb-3">🐉🐯</div>
        <h1 className="text-3xl font-bold text-white mb-2">Dragon Tiger</h1>
        <p className="text-gray-400">
          Simple & Fast card game — Dragon vs Tiger
        </p>
      </motion.div>

      {/* Create Table Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 
                     hover:bg-amber-600 text-black font-bold rounded-xl 
                     transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Table
        </button>
      </div>

      {/* Create Table Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 space-y-4"
        >
          <h3 className="text-white font-bold text-lg">Create New Table</h3>

          <div className="space-y-3">
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Table name..."
              className="w-full bg-white/5 border border-white/10 rounded-xl 
                         px-4 py-2.5 text-white placeholder:text-gray-500 
                         focus:outline-none focus:border-amber-400/50"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  Min Bet (₹)
                </label>
                <input
                  type="number"
                  value={minBet}
                  onChange={(e) => setMinBet(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 
                             rounded-xl px-4 py-2.5 text-white 
                             focus:outline-none focus:border-amber-400/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  Max Bet (₹)
                </label>
                <input
                  type="number"
                  value={maxBet}
                  onChange={(e) => setMaxBet(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 
                             rounded-xl px-4 py-2.5 text-white 
                             focus:outline-none focus:border-amber-400/50"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 
                         text-gray-400 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTable}
              disabled={creating}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 
                         text-black font-bold rounded-xl transition-colors 
                         disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Table'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Tables List */}
      <div className="space-y-3">
        <h2 className="text-white font-bold">
          Live Tables ({tables.length})
        </h2>

        {tables.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🎴</div>
            <p>No active tables</p>
            <p className="text-sm mt-1">Create one to start playing!</p>
          </div>
        ) : (
          tables.map((table, i) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 hover:bg-white/8 
                         transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Status */}
                  <div className={`w-3 h-3 rounded-full ${
                    table.stage === 'betting'
                      ? 'bg-emerald-400 animate-pulse'
                      : table.stage === 'result'
                      ? 'bg-amber-400'
                      : 'bg-gray-500'
                  }`} />

                  <div>
                    <h3 className="text-white font-bold">{table.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {table.players?.length || 0} players
                      </span>
                      <span className="text-amber-400 text-xs flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        ₹{table.pot?.toLocaleString() || 0} pot
                      </span>
                      <span className="text-gray-500 text-xs">
                        Round #{table.currentRound || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-500 text-xs">
                        Min: ₹{table.minBet}
                      </span>
                      <span className="text-gray-500 text-xs">•</span>
                      <span className="text-gray-500 text-xs">
                        Max: ₹{table.maxBet}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(
                      `/dragon-tiger/${table.id}?spectate=true`
                    )}
                    className="flex items-center gap-1 px-3 py-2 
                               bg-white/5 hover:bg-white/10 text-gray-400 
                               rounded-xl text-sm transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Watch
                  </button>
                  <button
                    onClick={() => navigate(`/dragon-tiger/${table.id}`)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 
                               text-black font-bold rounded-xl text-sm 
                               transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
