import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';

import {
  Camera,
  Edit3,
  Save,
  Shield,
  Star,
  Trophy,
  Gamepad2,
  Crown,
  ChevronRight,
  Bell,
  LogOut,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const achievements = [
  {
    id: 'first_win',
    label: 'First Win',
    emoji: '🏆',
    desc: 'Won your first game',
  },
  {
    id: 'high_roller',
    label: 'High Roller',
    emoji: '💰',
    desc: 'Deposited ₹5,000+',
  },
  {
    id: 'referral_king',
    label: 'Referral King',
    emoji: '👑',
    desc: '5+ referrals',
  },
  {
    id: 'lucky_streak',
    label: 'Lucky Streak',
    emoji: '⚡',
    desc: '5 consecutive wins',
  },
  {
    id: 'champion',
    label: 'Champion',
    emoji: '🎖️',
    desc: 'Won 100+ games',
  },
];

export const ProfilePage = () => {
  const { userProfile, logout } = useAuth();

  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);

  const [username, setUsername] = useState(
    userProfile?.username ?? ''
  );

  const handleSave = async () => {
    try {
      // TODO: FIREBASE UPDATE PROFILE

      toast.success('Profile updated!');
      setEditMode(false);

    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();

      toast.success('Logged out');

      navigate('/login');

    } catch (error) {
      console.error(error);
      toast.error('Logout failed');
    }
  };

  const userAchievements =
    userProfile?.achievements ?? [];

  const totalBalance =
    (userProfile?.walletBalance ?? 0) +
    (userProfile?.winningBalance ?? 0) +
    (userProfile?.bonusBalance ?? 0);

  return (
    <div className="space-y-5 pb-4 max-w-2xl mx-auto">
      {/* PROFILE CARD */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-cyan-900/20 border border-purple-500/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="flex flex-col sm:flex-row sm:items-start gap-5 relative z-10">
          {/* AVATAR */}
          <div className="relative mx-auto sm:mx-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-purple-500/30">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                (userProfile?.username?.[0] ?? 'U').toUpperCase()
              )}
            </div>

            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-purple-500 flex items-center justify-center hover:bg-purple-400 transition-colors shadow-lg">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* USER INFO */}
          <div className="flex-1 text-center sm:text-left">
            {editMode ? (
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                className="input-gaming text-xl font-bold px-3 py-1 rounded-xl mb-1 w-full sm:w-auto"
              />
            ) : (
              <h2 className="text-2xl font-bold font-sora text-white">
                {userProfile?.username ?? 'User'}
              </h2>
            )}

            <p className="text-white/50 text-sm">
              {userProfile?.email ?? 'No Email'}
            </p>

            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/20">
                <Crown className="w-3 h-3 text-yellow-400" />

                <span className="text-xs text-yellow-400 font-semibold">
                  Pro Player
                </span>
              </div>

              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  userProfile?.accountStatus ===
                  'active'
                    ? 'bg-green-500/20 border border-green-500/20'
                    : 'bg-red-500/20 border border-red-500/20'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    userProfile?.accountStatus ===
                    'active'
                      ? 'bg-green-400'
                      : 'bg-red-400'
                  } animate-pulse`}
                />

                <span
                  className={`text-xs font-semibold capitalize ${
                    userProfile?.accountStatus ===
                    'active'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {userProfile?.accountStatus ??
                    'inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* EDIT BUTTON */}
          <div>
            {editMode ? (
              <div className="flex gap-2">
                <GlowButton
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </GlowButton>

                <GlowButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditMode(false);
                    setUsername(
                      userProfile?.username ?? ''
                    );
                  }}
                >
                  Cancel
                </GlowButton>
              </div>
            ) : (
              <GlowButton
                size="sm"
                variant="ghost"
                onClick={() => setEditMode(true)}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </GlowButton>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mt-5 relative z-10">
          {[
            {
              label: 'Total Balance',
              value: `₹${totalBalance.toFixed(0)}`,
              color: 'text-green-400',
            },
            {
              label: 'Total Matches',
              value: String(
                userProfile?.totalMatches ?? 0
              ),
              color: 'text-cyan-400',
            },
            {
              label: 'Total Points',
              value: (
                userProfile?.totalPoints ?? 0
              ).toLocaleString(),
              color: 'text-yellow-400',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center p-3 rounded-xl bg-black/20"
            >
              <p
                className={`text-lg font-bold font-sora ${stat.color}`}
              >
                {stat.value}
              </p>

              <p className="text-[10px] text-white/40">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* REFERRAL */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4 border border-white/8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Your Referral Code
            </p>

            <p className="text-xl font-bold font-mono text-purple-400 mt-1">
              {userProfile?.referralCode ?? 'N/A'}
            </p>

            <p className="text-xs text-white/40 mt-0.5">
              Earn rewards for referrals
            </p>
          </div>

          <GlowButton
            size="sm"
            onClick={() => navigate('/referral')}
          >
            Share
            <ChevronRight className="w-3.5 h-3.5" />
          </GlowButton>
        </div>
      </motion.div>

      {/* ACHIEVEMENTS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            Achievements
          </h3>
        </div>

        <div className="p-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
          {achievements.map((ach) => {
            const unlocked =
              userAchievements.includes(ach.id);

            return (
              <div
                key={ach.id}
                title={ach.desc}
                className={`text-center p-3 rounded-xl border transition-all ${
                  unlocked
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-white/3 border-white/5 opacity-40'
                }`}
              >
                <div className="text-2xl mb-1">
                  {ach.emoji}
                </div>

                <p className="text-[10px] font-medium text-white truncate">
                  {ach.label}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* SETTINGS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl border border-white/8 overflow-hidden"
      >
        {[
          {
            icon: Shield,
            label: 'Security & Privacy',
            desc: 'Password, 2FA',
            onClick: () =>
              toast('Coming soon!'),
          },
          {
            icon: Bell,
            label: 'Notifications',
            desc: 'Manage alerts',
            onClick: () =>
              navigate('/notifications'),
          },
          {
            icon: Gamepad2,
            label: 'Game History',
            desc: 'View all matches',
            onClick: () =>
              navigate('/wallet'),
          },
          {
            icon: Trophy,
            label: 'Leaderboard',
            desc: 'Your ranking',
            onClick: () =>
              navigate('/leaderboard'),
          },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/3 transition-colors border-b border-white/5 last:border-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-white/60" />
            </div>

            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">
                {item.label}
              </p>

              <p className="text-xs text-white/40">
                {item.desc}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-white/30" />
          </button>
        ))}
      </motion.div>

      {/* LOGOUT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <GlowButton
          fullWidth
          variant="red"
          onClick={handleLogout}
          size="lg"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </GlowButton>
      </motion.div>
    </div>
  );
};
