// ============================================================
// MAIN LAYOUT - SIDEBAR + BOTTOM NAV + HEADER
// ============================================================

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Gamepad2,
  History,
  LogOut,
  Menu,
  X,
  Crown,
  ChevronRight,
  Home,
  Settings,
  Shield,
} from 'lucide-react';
import { signOutUser } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/wallet';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { path: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { path: '/games', label: 'Games', icon: Gamepad2 },
  { path: '/referral', label: 'Referral', icon: Users },
  { path: '/transactions', label: 'History', icon: History },
  { path: '/profile', label: 'Profile', icon: Settings },
];

const bottomNavItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/games', label: 'Games', icon: Gamepad2 },
  { path: '/referral', label: 'Refer', icon: Users },
  { path: '/profile', label: 'Profile', icon: Settings },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { wallet } = useWallet();

  const handleLogout = async () => {
    try {
      await signOutUser();
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-casino-gradient">
      {/* ─── Desktop Sidebar ──────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0d0d22] border-r border-purple-900/30 min-h-screen fixed top-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-purple-900/30">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Crown className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-casino text-lg text-yellow-400 neon-text-gold">RoyalBet</h1>
              <p className="text-xs text-slate-500">Premium Casino</p>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-purple-900/20">
          <div className="glass-card-light p-3 rounded-xl">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <div className="mt-2 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">
                {wallet ? formatCurrency(wallet.totalBalance) : '₹0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(path)
                  ? 'bg-purple-600/20 text-purple-300 neon-glow-purple border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
              {isActive(path) && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}

          {user?.isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-4 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/5'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-purple-900/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Sidebar Overlay ──────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 left-0 w-72 h-full bg-[#0d0d22] border-r border-purple-900/30 z-50 flex flex-col lg:hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-purple-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-black" />
                  </div>
                  <span className="font-casino text-yellow-400">RoyalBet</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-purple-900/20">
                <div className="glass-card-light p-3 rounded-xl">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400">
                      {wallet ? formatCurrency(wallet.totalBalance) : '₹0.00'}
                    </span>
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(path)
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{label}</span>
                  </Link>
                ))}

                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-yellow-400 hover:bg-yellow-500/10 transition-all mt-2"
                  >
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Admin Panel</span>
                  </Link>
                )}
              </nav>

              <div className="p-4 border-t border-purple-900/20">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ──────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0d0d22]/95 backdrop-blur-lg border-b border-purple-900/30 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 p-1">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="font-casino text-yellow-400 text-sm">RoyalBet</span>
          </div>
          <div className="flex items-center gap-1">
            <Wallet className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">
              {wallet ? formatCurrency(wallet.totalBalance) : '₹0'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation ──────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d22]/95 backdrop-blur-lg border-t border-purple-900/30 z-30 pb-safe">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                isActive(path) ? 'text-purple-400' : 'text-slate-500'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(path) ? 'text-purple-400' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
              {isActive(path) && (
                <div className="w-1 h-1 rounded-full bg-purple-400" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
