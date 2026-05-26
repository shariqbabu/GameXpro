import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTopLeaderboard } from '../services/userService';
import { formatCurrency } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { User } from '../types'; // ✅ Fix: any[] ki jagah User type

const Leaderboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [leaders, setLeaders] = useState<(User & { rank: number })[]>([]); // ✅ Fix: proper type
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wins' | 'earnings' | 'referrals'>('wins');

  useEffect(() => {
    getTopLeaderboard(20).then(data => {
      setLeaders(data as (User & { rank: number })[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (rank === 2) return 'text-gray-300 bg-gray-400/20 border-gray-400/30';
    if (rank === 3) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-gray-400 bg-white/5 border-white/10';
  };

  const sortedLeaders = [...leaders].sort((a, b) => {
    if (activeTab === 'wins') return (b.totalWins || 0) - (a.totalWins || 0);
    if (activeTab === 'earnings') return (b.winningAmount || 0) - (a.winningAmount || 0);
    return (b.referralEarnings || 0) - (a.referralEarnings || 0);
  }).map((u, i) => ({ ...u, rank: i + 1 }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <h1 className="text-3xl font-orbitron font-bold gradient-text">🏆 Leaderboard</h1>
        <p className="text-gray-400 text-sm mt-2">Top players of the platform</p>
      </motion.div>

      {/* Top 3 Podium */}
      {!loading && sortedLeaders.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-center gap-4 py-6"
        >
          {/* 2nd Place */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-2xl font-bold mb-2 mx-auto ring-2 ring-gray-400/30 overflow-hidden">
              {sortedLeaders[1]?.photoURL
                ? <img src={sortedLeaders[1].photoURL} className="w-full h-full object-cover" alt="" />
                : <span>{sortedLeaders[1]?.displayName?.[0]}</span>}
            </div>
            <div className="text-4xl mb-1">🥈</div>
            <p className="text-white text-xs font-medium">{sortedLeaders[1]?.displayName?.split(' ')[0]}</p>
            <p className="text-gray-400 text-xs">{sortedLeaders[1]?.totalWins || 0} wins</p>
            <div className="h-16 bg-gray-400/20 border border-gray-400/30 rounded-t-lg mt-2 w-20" />
          </div>

          {/* 1st Place */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-3xl font-bold mb-2 mx-auto ring-4 ring-yellow-400/40 animate-pulse-glow overflow-hidden">
              {sortedLeaders[0]?.photoURL
                ? <img src={sortedLeaders[0].photoURL} className="w-full h-full object-cover" alt="" />
                : <span>{sortedLeaders[0]?.displayName?.[0]}</span>}
            </div>
            <div className="text-5xl mb-1">🥇</div>
            <p className="text-white text-sm font-bold">{sortedLeaders[0]?.displayName?.split(' ')[0]}</p>
            <p className="text-yellow-400 text-xs">{sortedLeaders[0]?.totalWins || 0} wins</p>
            <div className="h-24 bg-yellow-400/20 border border-yellow-400/30 rounded-t-lg mt-2 w-20" />
          </div>

          {/* 3rd Place */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-xl font-bold mb-2 mx-auto ring-2 ring-orange-400/30 overflow-hidden">
              {sortedLeaders[2]?.photoURL
                ? <img src={sortedLeaders[2].photoURL} className="w-full h-full object-cover" alt="" />
                : <span>{sortedLeaders[2]?.displayName?.[0]}</span>}
            </div>
            <div className="text-3xl mb-1">🥉</div>
            <p className="text-white text-xs font-medium">{sortedLeaders[2]?.displayName?.split(' ')[0]}</p>
            <p className="text-gray-400 text-xs">{sortedLeaders[2]?.totalWins || 0} wins</p>
            <div className="h-10 bg-orange-400/20 border border-orange-400/30 rounded-t-lg mt-2 w-20" />
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {[
          { value: 'wins', label: '🏆 Most Wins' },
          { value: 'earnings', label: '💰 Top Earners' },
          { value: 'referrals', label: '🔗 Referrals' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as typeof activeTab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.value ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Full Leaderboard */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full spinning mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading leaderboard...</p>
          </div>
        ) : sortedLeaders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-gray-500">No players yet. Be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sortedLeaders.map((player, i) => {
              const isCurrentUser = player.uid === userProfile?.uid;
              return (
                <motion.div
                  key={player.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 px-4 py-3 transition-all hover:bg-white/5 ${isCurrentUser ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${getRankColor(player.rank)}`}>
                    {getRankBadge(player.rank)}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                    {player.photoURL
                      ? <img src={player.photoURL} className="w-full h-full object-cover" alt="" />
                      : <span>{player.displayName?.[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm truncate">{player.displayName}</p>
                      {isCurrentUser && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded flex-shrink-0">You</span>}
                    </div>
                    <p className="text-gray-500 text-xs">{player.totalGamesPlayed || 0} games played</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {activeTab === 'wins' && (
                      <>
                        <p className="text-yellow-400 font-bold text-sm">{player.totalWins || 0}</p>
                        <p className="text-gray-500 text-xs">Wins</p>
                      </>
                    )}
                    {activeTab === 'earnings' && (
                      <>
                        <p className="text-green-400 font-bold text-sm">{formatCurrency(player.winningAmount || 0)}</p>
                        <p className="text-gray-500 text-xs">Earned</p>
                      </>
                    )}
                    {activeTab === 'referrals' && (
                      <>
                        <p className="text-purple-400 font-bold text-sm">{formatCurrency(player.referralEarnings || 0)}</p>
                        <p className="text-gray-500 text-xs">Referral</p>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Leaderboard;
