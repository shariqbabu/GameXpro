import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/profile', icon: '👤', label: 'Profile' },
  { to: '/games/color', icon: '🎨', label: 'Color Game' },
  { to: '/games/ludo', icon: '🎲', label: 'Ludo Game' },
  { to: '/games/spin', icon: '🎡', label: 'Spin Wheel' },
  { to: '/wallet', icon: '💰', label: 'Wallet' },
  { to: '/transactions', icon: '📊', label: 'Transactions' },
  { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
];

const DashboardLayout: React.FC = () => {
  const { userProfile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          initial={false}
          animate={{ x: sidebarOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 left-0 h-full w-64 glass-dark border-r border-white/5 z-50 flex flex-col lg:translate-x-0 lg:static lg:z-auto"
        >
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl">
                🎮
              </div>
              <div>
                <h1 className="font-orbitron text-white font-bold text-lg leading-none">GameZone</h1>
                <span className="text-purple-400 text-xs font-rajdhani">PRO GAMING</span>
              </div>
            </div>
          </div>

          {/* User Info */}
          {userProfile && (
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold overflow-hidden">
                  {userProfile.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    userProfile.displayName?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{userProfile.displayName}</p>
                  <p className="text-green-400 text-xs font-orbitron">{formatCurrency(userProfile.walletBalance || 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/20 active'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}

            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/20 mt-4"
              >
                <span className="text-lg">⚙️</span>
                <span className="font-medium">Admin Panel</span>
              </NavLink>
            )}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-white/5 space-y-2">
            <button
              onClick={() => { navigate('/wallet/add'); setSidebarOpen(false); }}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm py-2.5 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              💳 Add Money
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full bg-white/5 border border-white/10 text-gray-400 text-sm py-2.5 rounded-xl font-medium hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
            >
              {loggingOut ? '...' : '🚪 Logout'}
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col glass-dark border-r border-white/5 h-screen sticky top-0">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl animate-pulse-glow">
              🎮
            </div>
            <div>
              <h1 className="font-orbitron text-white font-bold text-lg leading-none">GameZone</h1>
              <span className="text-purple-400 text-xs font-rajdhani">PRO GAMING</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        {userProfile && (
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userProfile.displayName?.[0]?.toUpperCase() || '?'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{userProfile.displayName}</p>
                <p className="text-green-400 text-xs font-orbitron">{formatCurrency(userProfile.walletBalance || 0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/20 active'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 text-yellow-400 hover:bg-yellow-500/10 border border-yellow-500/20 mt-4"
            >
              <span className="text-lg">⚙️</span>
              <span className="font-medium">Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => navigate('/wallet/add')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm py-2.5 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            💳 Add Money
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full bg-white/5 border border-white/10 text-gray-400 text-sm py-2.5 rounded-xl font-medium hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
          >
            {loggingOut ? '...' : '🚪 Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden glass-dark border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all"
          >
            <span className="text-xl">{sidebarOpen ? '✕' : '☰'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <span className="font-orbitron text-white font-bold">GameZone</span>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 px-3 py-1.5 rounded-lg"
          >
            <span className="text-green-400 text-xs font-orbitron font-bold">
              {formatCurrency(userProfile?.walletBalance || 0)}
            </span>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
