import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { UserLayout } from './layouts/UserLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';

// User Pages
import { DashboardPage } from './pages/user/DashboardPage';
import { WalletPage } from './pages/user/WalletPage';
import { LeaderboardPage } from './pages/user/LeaderboardPage';
import { ReferralPage } from './pages/user/ReferralPage';
import { ProfilePage } from './pages/user/ProfilePage';
import { NotificationsPage } from './pages/user/NotificationsPage';
import { RewardsPage } from './pages/user/RewardsPage';

// Game Pages
import { GamesLobbyPage } from './pages/games/GamesLobbyPage';
import { ColorPredictionGame } from './pages/games/ColorPredictionGame';
import { LudoGame } from './pages/games/LudoGame';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminDepositsPage } from './pages/admin/AdminDepositsPage';
import { AdminWithdrawalsPage } from './pages/admin/AdminWithdrawalsPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminGamesPage } from './pages/admin/AdminGamesPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

function App() {
  // Set demo mode for development/demo purposes
  if (typeof window !== 'undefined') {
    localStorage.setItem('royalwin_demo', 'true');
    localStorage.setItem('royalwin_demo_admin', 'true');
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#13131f',
              color: '#fff',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
              style: { border: '1px solid rgba(34, 197, 94, 0.3)' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              style: { border: '1px solid rgba(239, 68, 68, 0.3)' },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* User Routes */}
          <Route path="/dashboard" element={<UserLayout><DashboardPage /></UserLayout>} />
          <Route path="/wallet" element={<UserLayout><WalletPage /></UserLayout>} />
          <Route path="/games" element={<UserLayout><GamesLobbyPage /></UserLayout>} />
          <Route path="/games/color" element={<UserLayout><ColorPredictionGame /></UserLayout>} />
          <Route path="/games/ludo" element={<UserLayout><LudoGame /></UserLayout>} />
          <Route path="/leaderboard" element={<UserLayout><LeaderboardPage /></UserLayout>} />
          <Route path="/referral" element={<UserLayout><ReferralPage /></UserLayout>} />
          <Route path="/profile" element={<UserLayout><ProfilePage /></UserLayout>} />
          <Route path="/notifications" element={<UserLayout><NotificationsPage /></UserLayout>} />
          <Route path="/rewards" element={<UserLayout><RewardsPage /></UserLayout>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/analytics" element={<AdminLayout><AdminAnalyticsPage /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><AdminUsersPage /></AdminLayout>} />
          <Route path="/admin/deposits" element={<AdminLayout><AdminDepositsPage /></AdminLayout>} />
          <Route path="/admin/withdrawals" element={<AdminLayout><AdminWithdrawalsPage /></AdminLayout>} />
          <Route path="/admin/transactions" element={<AdminLayout><AdminTransactionsPage /></AdminLayout>} />
          <Route path="/admin/games" element={<AdminLayout><AdminGamesPage /></AdminLayout>} />
          <Route path="/admin/notifications" element={<AdminLayout><AdminNotificationsPage /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><AdminSettingsPage /></AdminLayout>} />
          <Route path="/admin/announcements" element={<AdminLayout><AdminNotificationsPage /></AdminLayout>} />
          <Route path="/admin/rewards" element={<AdminLayout><AdminSettingsPage /></AdminLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
