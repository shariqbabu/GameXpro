import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { GlowButton } from '../../components/ui/GlowButton';

import {
  Wallet,
  Trophy,
  Gamepad2,
  TrendingUp,
  Zap,
  Crown,
  Gift,
  ArrowRight,
  Users,
  Star,
  Bell,
  ChevronRight,
  Play,
} from 'lucide-react';

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '../../firebase/config';

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

const earningsData = [
  { day: 'Mon', amount: 200 },
  { day: 'Tue', amount: 450 },
  { day: 'Wed', amount: 320 },
  { day: 'Thu', amount: 780 },
  { day: 'Fri', amount: 590 },
  { day: 'Sat', amount: 920 },
  { day: 'Sun', amount: 750 },
];

const games = [
  {
    id: 'color',
    name: 'Color Prediction',
    icon: '🎨',
    description:
      'Predict Red, Green, or Violet',
    path: '/games/color',
    players: '12.4K',
    minBet: '₹10',
    gradient:
      'from-red-500/20 via-green-500/20 to-violet-500/20',
    border: 'border-purple-500/30',
    badge: 'LIVE',
  },

  {
    id: 'ludo',
    name: 'Ludo Battle',
    icon: '🎲',
    description:
      'Real-time 1v1 multiplayer betting',
    path: '/games/ludo',
    players: '8.2K',
    minBet: '₹50',
    gradient:
      'from-blue-500/20 via-purple-500/20 to-pink-500/20',
    border: 'border-cyan-500/30',
    badge: 'HOT',
  },
];

export const DashboardPage = () => {

  const { userProfile, currentUser } =
    useAuth();

  const navigate = useNavigate();

  const [liveStats, setLiveStats] =
    useState({
      onlineUsers: 14285,
      activeBets: 3847,
    });

  const [recentGames, setRecentGames] =
    useState<any[]>([]);

  const [notifications, setNotifications] =
    useState<any[]>([]);

  const [leaderboard, setLeaderboard] =
    useState<any[]>([]);

  // LIVE STATS
  useEffect(() => {

    const interval = setInterval(() => {

      if (
        document.visibilityState !==
        'visible'
      ) {
        return;
      }

      setLiveStats((prev) => ({
        onlineUsers:
          prev.onlineUsers +
          Math.floor(Math.random() * 10) -
          5,

        activeBets:
          prev.activeBets +
          Math.floor(Math.random() * 6) -
          3,
      }));

    }, 3000);

    return () =>
      clearInterval(interval);

  }, []);

  // RECENT GAMES
  useEffect(() => {

    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'transactions'),
      where(
        'userId',
        '==',
        currentUser.uid
      ),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const data =
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        setRecentGames(data);
      }
    );

    return () => unsubscribe();

  }, [currentUser]);

  // NOTIFICATIONS
  useEffect(() => {

    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where(
        'userId',
        '==',
        currentUser.uid
      ),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const data =
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        setNotifications(data);
      }
    );

    return () => unsubscribe();

  }, [currentUser]);

  // LEADERBOARD
  useEffect(() => {

    const q = query(
      collection(db, 'users'),
      orderBy('totalPoints', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const data =
          snapshot.docs.map(
            (doc, index) => ({
              id: doc.id,
              rank: index + 1,
              ...doc.data(),
            })
          );

        setLeaderboard(data);
      }
    );

    return () => unsubscribe();

  }, []);

  // BALANCES
  const totalBalance =
    Number(
      userProfile?.walletBalance || 0
    );

  const winBalance =
    Number(
      userProfile?.winningBalance || 0
    );

  const totalMatches =
    Number(
      userProfile?.totalMatches || 0
    );

  const totalPoints =
    Number(
      userProfile?.totalPoints || 0
    );

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white text-lg font-semibold">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">

      {/* BANNER */}
      <motion.div
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-gradient-to-r from-purple-900/50 via-purple-800/30 to-cyan-900/30 border border-purple-500/20"
      >

        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="absolute bottom-0 left-1/2 w-96 h-32 bg-cyan-500/10 rounded-full blur-2xl" />

        <div className="absolute right-4 top-4 text-6xl opacity-20 select-none">
          👑
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>

            <div className="flex items-center gap-2 mb-2">

              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />

              <span className="text-xs text-white/50 uppercase tracking-wider">
                Online & Ready
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold font-sora text-white">
              Hey,{' '}
              {userProfile?.username ??
                'User'}
              ! 👋
            </h1>

            <p className="text-white/50 text-sm mt-1">
              Ready to win big today?
            </p>

            <div className="flex items-center gap-4 mt-3">

              <div className="flex items-center gap-1.5 text-xs text-white/40">

                <Users className="w-3.5 h-3.5" />

                <span className="text-green-400 font-semibold">
                  {liveStats.onlineUsers.toLocaleString()}
                </span>

                online
              </div>

              <div className="flex items-center gap-1.5 text-xs text-white/40">

                <Zap className="w-3.5 h-3.5" />

                <span className="text-yellow-400 font-semibold">
                  {liveStats.activeBets.toLocaleString()}
                </span>

                active bets
              </div>
            </div>
          </div>

          <div className="flex gap-3">

            <GlowButton
              onClick={() =>
                navigate('/wallet')
              }
              variant="cyan"
              size="md"
            >
              <Wallet className="w-4 h-4" />

              Add Money
            </GlowButton>

            <GlowButton
              onClick={() =>
                navigate('/games')
              }
              size="md"
            >
              <Play className="w-4 h-4" />

              Play Now
            </GlowButton>
          </div>
        </div>
      </motion.div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Total Balance"
          value={totalBalance}
          prefix="₹"
          icon={
            <Wallet className="w-5 h-5" />
          }
          color="purple"
          decimals={2}
          delay={0.1}
        />

        <StatCard
          title="Winnings"
          value={winBalance}
          prefix="₹"
          icon={
            <Trophy className="w-5 h-5" />
          }
          color="green"
          decimals={2}
          delay={0.2}
        />

        <StatCard
          title="Total Matches"
          value={totalMatches}
          icon={
            <Gamepad2 className="w-5 h-5" />
          }
          color="cyan"
          delay={0.3}
        />

        <StatCard
          title="Total Points"
          value={totalPoints}
          icon={
            <Star className="w-5 h-5" />
          }
          color="gold"
          delay={0.4}
        />
      </div>

      {/* GAMES + CHART */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* GAMES */}
        <div className="lg:col-span-2 space-y-4">

          <div className="flex items-center justify-between">

            <h2 className="text-lg font-bold font-sora text-white">
              🎮 Live Games
            </h2>

            <button
              onClick={() =>
                navigate('/games')
              }
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View All

              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid gap-4">

            {games.map((game, i) => (

              <motion.div
                key={game.id}
                initial={{
                  opacity: 0,
                  x: -20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay:
                    0.3 + i * 0.1,
                }}
                onClick={() =>
                  navigate(game.path)
                }
                className={`cursor-pointer rounded-2xl p-5 bg-gradient-to-r ${game.gradient} border ${game.border} relative overflow-hidden`}
              >

                <div className="absolute top-3 right-3">

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 text-white">
                    {game.badge}
                  </span>
                </div>

                <div className="flex items-start gap-4">

                  <div className="text-4xl">
                    {game.icon}
                  </div>

                  <div className="flex-1">

                    <h3 className="font-bold text-white font-sora">
                      {game.name}
                    </h3>

                    <p className="text-xs text-white/50 mt-0.5">
                      {game.description}
                    </p>

                    <div className="flex items-center gap-4 mt-3">

                      <div className="text-xs text-white/40">

                        <span className="text-green-400 font-semibold">
                          {game.players}
                        </span>

                        {' '}playing
                      </div>

                      <div className="text-xs text-white/40">

                        Min bet:{' '}

                        <span className="text-yellow-400 font-semibold">
                          {game.minBet}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/30" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CHART */}
        <motion.div
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            delay: 0.4,
          }}
          className="rounded-2xl p-5 glass border border-white/8"
        >

          <div className="flex items-center justify-between mb-4">

            <h3 className="font-bold text-white font-sora">
              Weekly Earnings
            </h3>

            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>

          <div className="text-2xl font-bold text-green-400 mb-1">
            ₹3,010
          </div>

          <p className="text-xs text-white/40 mb-4">
            +23% from last week
          </p>

          <ResponsiveContainer
            width="100%"
            height={120}
          >
            <LineChart
              data={earningsData}
            >

              <XAxis
                dataKey="day"
                tick={{
                  fill:
                    'rgba(255,255,255,0.3)',
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="amount"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
