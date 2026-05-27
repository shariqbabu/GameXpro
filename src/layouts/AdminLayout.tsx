import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, CreditCard, ArrowDownCircle, ArrowUpCircle,
  GamepadIcon, Settings, LogOut, Menu, X, Crown, Bell, Shield,
  ChevronDown, BarChart3, Gift, Megaphone
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/admin/deposits', icon: ArrowDownCircle, label: 'Deposits', badge: '3' },
      { path: '/admin/withdrawals', icon: ArrowUpCircle, label: 'Withdrawals', badge: '2' },
      { path: '/admin/transactions', icon: CreditCard, label: 'Transactions' },
    ],
  },
  {
    label: 'Users',
    items: [
      { path: '/admin/users', icon: Users, label: 'All Users' },
    ],
  },
  {
    label: 'Games',
    items: [
      { path: '/admin/games', icon: GamepadIcon, label: 'Game Control' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { path: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
      { path: '/admin/rewards', icon: Gift, label: 'Rewards Config' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold font-sora text-white">Admin Panel</h1>
            <p className="text-[10px] text-yellow-400 uppercase tracking-widest">RoyalWin Control</p>
          </div>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="p-4 mx-3 mt-3 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{userProfile?.username || 'Admin'}</p>
            <p className="text-xs text-yellow-400">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
        {adminNavGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <button
              onClick={() => toggleGroup(group.label)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider hover:text-white/50 transition-colors"
            >
              {group.label}
              <motion.div animate={{ rotate: collapsedGroups[group.label] ? -90 : 0 }}>
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </button>
            <AnimatePresence>
              {!collapsedGroups[group.label] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-0.5"
                >
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.exact}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border-l-2 border-yellow-400 text-yellow-400'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Back to site + Logout */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-purple-400 hover:bg-purple-500/10 transition-all"
        >
          <Crown className="w-4 h-4" />
          User Dashboard
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 fixed left-0 top-0 h-full z-40 border-r border-white/5 bg-[#0d0d1a]">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 z-50 border-r border-white/5 bg-[#0d0d1a] lg:hidden"
            >
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-3 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/60">Admin Control Center</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              ADMIN MODE
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
