import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Home, Wallet, GamepadIcon, Trophy, Users, Bell, Settings,
  LogOut, Menu, X, Zap, Crown,
  Gift, Star, Shield
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard', badge: null },
  { path: '/wallet', icon: Wallet, label: 'Wallet', badge: null },
  { path: '/games', icon: GamepadIcon, label: 'Games', badge: 'NEW' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard', badge: null },
  { path: '/referral', icon: Users, label: 'Referral', badge: null },
  { path: '/rewards', icon: Gift, label: 'Rewards', badge: null },
  { path: '/notifications', icon: Bell, label: 'Notifications', badge: '3' },
  { path: '/profile', icon: Settings, label: 'Profile', badge: null },
];

const APP_NAME = import.meta.env.VITE_APP_NAME || 'RoyalWin';

export const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const totalBalance = (userProfile?.walletBalance || 0) +
    (userProfile?.winningBalance || 0) +
    (userProfile?.bonusBalance || 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-full z-40 border-r border-white/5 bg-[#0d0d1a]">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-sora gradient-text">{APP_NAME}</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Premium Gaming</p>
            </div>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="p-4 mx-3 mt-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
              {(userProfile?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userProfile?.username || 'Player'}</p>
              <p className="text-xs text-white/40">Level 12 • Pro</p>
            </div>
            <div className="text-yellow-400">
              <Star className="w-4 h-4 fill-yellow-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Balance</span>
              <span className="text-sm font-bold text-green-400">₹{totalBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'active text-purple-400' : 'text-white/50 hover:text-white'}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badge === 'NEW' ? 'bg-green-500/20 text-green-400' : 'bg-red-500 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admin Link */}
        {userProfile?.role === 'admin' && (
          <div className="p-3">
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </NavLink>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-72 z-50 border-r border-white/5 bg-[#0d0d1a] lg:hidden flex flex-col"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-base font-bold gradient-text">{APP_NAME}</h1>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 mx-3 mt-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {(userProfile?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{userProfile?.username || 'Player'}</p>
                    <p className="text-xs text-green-400 font-semibold">₹{totalBalance.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'active text-purple-400' : 'text-white/50'}`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badge === 'NEW' ? 'bg-green-500/20 text-green-400' : 'bg-red-500 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="p-3 border-t border-white/5">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className={`sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-3 transition-all ${scrolled ? 'bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-white/40 text-sm">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Live Games Active</span>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Balance Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
              <Wallet className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-bold text-green-400">₹{totalBalance.toFixed(0)}</span>
            </div>

            {/* Add Money */}
            <button
              onClick={() => navigate('/wallet')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 text-xs font-bold text-white hover:from-purple-500 hover:to-purple-700 transition-all"
            >
              + Add Money
            </button>

            {/* Notification */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm"
            >
              {(userProfile?.username || 'U')[0].toUpperCase()}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0d0d1a]/95 backdrop-blur-xl border-t border-white/5 px-2 py-2">
          <div className="flex items-center justify-around">
            {[
              { path: '/dashboard', icon: Home, label: 'Home' },
              { path: '/wallet', icon: Wallet, label: 'Wallet' },
              { path: '/games', icon: GamepadIcon, label: 'Games' },
              { path: '/leaderboard', icon: Trophy, label: 'Ranks' },
              { path: '/profile', icon: Settings, label: 'Profile' },
            ].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `mobile-nav-item flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl ${isActive ? 'active' : 'text-white/40'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                    <span className={`text-[10px] font-medium ${isActive ? 'text-purple-400' : ''}`}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="h-16 lg:hidden" />
      </div>
    </div>
  );
};
