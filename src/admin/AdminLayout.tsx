// ============================================================
// ADMIN LAYOUT
// ============================================================

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  LogOut,
  Menu,
  X,
  Crown,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { signOutUser } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { path: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { path: '/admin/transactions', label: 'Transactions', icon: History },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await signOutUser();
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen bg-casino-gradient">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0a0a1a] border-r border-yellow-900/30 min-h-screen fixed top-0 left-0 z-40">
        <div className="p-6 border-b border-yellow-900/30">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-casino text-lg text-yellow-400">Admin Panel</h1>
              <p className="text-xs text-slate-500">RoyalBet Casino</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map(({ path, label, icon: Icon, exact }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(path, exact)
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
              {isActive(path, exact) && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-400 hover:text-purple-400 hover:bg-purple-500/5 mt-4"
          >
            <Crown className="w-5 h-5" />
            <span className="text-sm">User Dashboard</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-yellow-900/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-0 left-0 w-64 h-full bg-[#0a0a1a] border-r border-yellow-900/30 z-50 flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-yellow-900/30">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <span className="font-casino text-yellow-400 text-sm">Admin Panel</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {adminNav.map(({ path, label, icon: Icon, exact }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(path, exact)
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{label}</span>
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0a0a1a]/95 backdrop-blur-lg border-b border-yellow-900/30 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 p-1">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            <span className="font-casino text-yellow-400 text-sm">Admin Panel</span>
          </div>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
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
    </div>
  );
}
