import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import {
  Trophy,
  Star,
  TrendingUp,
  Crown,
} from 'lucide-react';

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const tabs = ['All Time', 'Weekly', 'Monthly'];

const rankBadge = (rank: number) => {
  if (rank === 1) {
    return {
      emoji: '🥇',
      bg: 'from-yellow-400 to-yellow-600',
      text: 'text-yellow-900',
    };
  }

  if (rank === 2) {
    return {
      emoji: '🥈',
      bg: 'from-gray-300 to-gray-500',
      text: 'text-gray-900',
    };
  }

  if (rank === 3) {
    return {
      emoji: '🥉',
      bg: 'from-orange-400 to-orange-600',
      text: 'text-orange-900',
    };
  }

  return {
    emoji: `#${rank}`,
    bg: 'from-white/10 to-white/5',
    text: 'text-white/60',
  };
};

export const LeaderboardPage = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] =
    useState('All Time');

  const [leaderboard, setLeaderboard] =
    useState<any[]>([]);

  const [myRank, setMyRank] = useState<number | null>(
    null
  );

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalPoints', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc, index) => ({
            id: doc.id,
            rank: index + 1,
            ...doc.data(),
          })
        );

        setLeaderboard(data);

        if (currentUser?.uid) {
          const currentIndex = data.findIndex(
            (u: any) =>
              u.uid === currentUser.uid
          );

          if (currentIndex !== -1) {
            setMyRank(currentIndex + 1);
          }
        }
      },
      (error) => {
        console.error(
          'Leaderboard Error:',
          error
        );
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const top3 = leaderboard.slice(0, 3);

  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6 pb-4">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/20 border border-yellow-500/20"
      >
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">
          🏆
        </div>

        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-yellow-400" />

          <h1 className="text-2xl font-bold font-sora gradient-text-gold">
            Leaderboard
          </h1>
        </div>

        <p className="text-white/50 text-sm">
          Top players competing for glory
        </p>
      </motion.div>

      {/* TABS */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TOP 3 */}
      <div className="grid grid-cols-3 gap-3 items-end">
        {/* 2ND */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="mb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-2xl mx-auto shadow-xl">
              {top3[1]?.username?.[0] ?? 'P'}
            </div>

            <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold text-gray-900 mx-auto -mt-2">
              2
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-400/20 to-transparent rounded-2xl p-3 border border-gray-400/20">
            <p className="text-xs font-bold text-white truncate">
              {top3[1]?.username ?? 'Player'}
            </p>

            <p className="text-xs text-gray-400 font-semibold">
              ₹
              {(
                top3[1]?.totalEarnings ?? 0
              ).toLocaleString()}
            </p>

            <p className="text-[10px] text-white/30">
              {top3[1]?.totalWins ?? 0} wins
            </p>
          </div>
        </motion.div>

        {/* 1ST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2 float-anim" />

          <div className="mb-2">
            <div className="rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl mx-auto shadow-2xl shadow-yellow-500/30 w-16 h-16">
              {top3[0]?.username?.[0] ?? 'P'}
            </div>

            <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900 mx-auto -mt-3">
              1
            </div>
          </div>

          <div className="bg-gradient-to-b from-yellow-400/20 to-transparent rounded-2xl p-3 border border-yellow-400/30">
            <p className="text-sm font-bold text-white">
              {top3[0]?.username ?? 'Player'}
            </p>

            <p className="text-sm text-yellow-400 font-bold">
              ₹
              {(
                top3[0]?.totalEarnings ?? 0
              ).toLocaleString()}
            </p>

            <p className="text-xs text-white/40">
              {top3[0]?.totalWins ?? 0} wins
            </p>
          </div>
        </motion.div>

        {/* 3RD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="mb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center text-2xl mx-auto shadow-xl">
              {top3[2]?.username?.[0] ?? 'P'}
            </div>

            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white mx-auto -mt-2">
              3
            </div>
          </div>

          <div className="bg-gradient-to-b from-orange-500/20 to-transparent rounded-2xl p-3 border border-orange-500/20">
            <p className="text-xs font-bold text-white truncate">
              {top3[2]?.username ?? 'Player'}
            </p>

            <p className="text-xs text-orange-400 font-semibold">
              ₹
              {(
                top3[2]?.totalEarnings ?? 0
              ).toLocaleString()}
            </p>

            <p className="text-[10px] text-white/30">
              {top3[2]?.totalWins ?? 0} wins
            </p>
          </div>
        </motion.div>
      </div>

      {/* REST */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white">
            Rankings
          </h3>
        </div>

        <div className="divide-y divide-white/5">
          {rest.map((player, i) => {
            const badge = rankBadge(
              player.rank
            );

            return (
              <motion.div
                key={player.id}
                initial={{
                  opacity: 0,
                  x: -20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: 0.1 + i * 0.05,
                }}
                className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${badge.bg} flex items-center justify-center text-xs font-bold ${badge.text}`}
                >
                  {player.rank}
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {player.username?.[0] ?? 'U'}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {player.username ??
                      'Unknown'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {player.totalWins ?? 0}{' '}
                      wins
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">
                    ₹
                    {(
                      player.totalEarnings ??
                      0
                    ).toLocaleString()}
                  </p>

                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />

                    <span className="text-xs text-yellow-400">
                      {(
                        player.totalPoints ??
                        0
                      ).toLocaleString()}{' '}
                      pts
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* MY RANK */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl p-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border border-purple-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white">
              Y
            </div>

            <div>
              <p className="text-sm font-semibold text-white">
                Your Position
              </p>

              <p className="text-xs text-white/40">
                Keep playing to climb
                ranks
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-purple-400">
              #{myRank ?? '--'}
            </p>

            <div className="flex items-center gap-1 text-xs text-green-400">
              <TrendingUp className="w-3 h-3" />
              Live Ranking
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
