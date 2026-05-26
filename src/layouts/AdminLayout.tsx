import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const adminNavItems = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/deposits', icon: '💳', label: 'Deposits' },
  { to: '/admin/withdrawals', icon: '🏧', label: 'Withdrawals' },
  { to: '/admin/games', icon: '🎮', label: 'Games' },
  { to: '/admin/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/admin/settings', icon: '⚙️', label: 'Settings' },
];

const AdminLayout: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col h-screen sticky top-0 bg-[#0d0d1a] border-r border-yellow-500/10">
        <div className="p-6 border-b border-yellow-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xl">⚙️</div>
            <div>
              <h1 className="font-orbitron text-white font-bold text-base leading-none">Admin Panel</h1>
              <span className="text-yellow-400 text-xs">GameZone Pro</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-base font-bold">
              {userProfile?.displayName?.[0] || 'A'}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{userProfile?.displayName}</p>
              <p className="text-yellow-400 text-xs">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {adminNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-white border border-yellow-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button onClick={() => navigate('/dashboard')} className="w-full bg-white/5 border border-white/10 text-gray-400 text-sm py-2.5 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all">
            🎮 User Panel
          </button>
          <button onClick={() => logout().then(() => navigate('/auth'))} className="w-full bg-white/5 border border-white/10 text-gray-400 text-sm py-2.5 rounded-xl font-medium hover:bg-red-500/10 hover:text-red-400 transition-all">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 left-0 h-full w-64 bg-[#0d0d1a] border-r border-yellow-500/10 z-50 flex flex-col"
          >
            <div className="p-6 border-b border-yellow-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">⚙️</div>
                <span className="font-orbitron text-white font-bold">Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {adminNavItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${isActive ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-white border border-yellow-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="lg:hidden glass-dark border-b border-yellow-500/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-white/5 text-white">☰</button>
          <span className="font-orbitron text-yellow-400 font-bold">Admin Panel</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={window.location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="min-h-full">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
