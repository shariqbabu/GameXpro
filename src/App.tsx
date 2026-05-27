import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import {
  Toaster,
} from 'react-hot-toast';

import {
  AuthProvider,
} from './context/AuthContext';

import {
  ProtectedRoute,
} from './routes/ProtectedRoute';

import {
  UserLayout,
} from './layouts/UserLayout';

import {
  AdminLayout,
} from './layouts/AdminLayout';

// AUTH PAGES
import {
  LoginPage,
} from './pages/auth/LoginPage';

import {
  SignupPage,
} from './pages/auth/SignupPage';

// USER PAGES
import {
  DashboardPage,
} from './pages/user/DashboardPage';

import {
  WalletPage,
} from './pages/user/WalletPage';

import {
  LeaderboardPage,
} from './pages/user/LeaderboardPage';

import {
  ReferralPage,
} from './pages/user/ReferralPage';

import {
  ProfilePage,
} from './pages/user/ProfilePage';

import {
  NotificationsPage,
} from './pages/user/NotificationsPage';

import {
  RewardsPage,
} from './pages/user/RewardsPage';

// GAME PAGES
import {
  GamesLobbyPage,
} from './pages/games/GamesLobbyPage';

import {
  ColorPredictionGame,
} from './pages/games/ColorPredictionGame';

import {
  LudoGame,
} from './pages/games/LudoGame';

// ADMIN PAGES
import {
  AdminDashboard,
} from './pages/admin/AdminDashboard';

import {
  AdminUsersPage,
} from './pages/admin/AdminUsersPage';

import {
  AdminDepositsPage,
} from './pages/admin/AdminDepositsPage';

import {
  AdminWithdrawalsPage,
} from './pages/admin/AdminWithdrawalsPage';

import {
  AdminTransactionsPage,
} from './pages/admin/AdminTransactionsPage';

import {
  AdminSettingsPage,
} from './pages/admin/AdminSettingsPage';

import {
  AdminGamesPage,
} from './pages/admin/AdminGamesPage';

import {
  AdminNotificationsPage,
} from './pages/admin/AdminNotificationsPage';

import {
  AdminAnalyticsPage,
} from './pages/admin/AdminAnalyticsPage';

function App() {

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
              border:
                '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily:
                'Inter, sans-serif',
            },

            success: {

              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },

              style: {
                border:
                  '1px solid rgba(34, 197, 94, 0.3)',
              },
            },

            error: {

              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },

              style: {
                border:
                  '1px solid rgba(239, 68, 68, 0.3)',
              },
            },
          }}
        />

        <Routes>

          {/* PUBLIC ROUTES */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/signup"
            element={<SignupPage />}
          />

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {/* USER ROUTES */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <DashboardPage />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/wallet"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <WalletPage />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/games"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <GamesLobbyPage />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/games/color"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <ColorPredictionGame />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/games/ludo"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <LudoGame />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <LeaderboardPage />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/referral"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <ReferralPage />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <ProfilePage />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <NotificationsPage />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/rewards"
            element={
              <ProtectedRoute>

                <UserLayout>
                  <RewardsPage />
                </UserLayout>

              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminAnalyticsPage />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminUsersPage />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/deposits"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminDepositsPage />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/withdrawals"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminWithdrawalsPage />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/transactions"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminTransactionsPage />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/games"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminGamesPage />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminNotificationsPage />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute
                requireAdmin
              >

                <AdminLayout>
                  <AdminSettingsPage />
                </AdminLayout>

              </ProtectedRoute>
            }
          />

          {/* FALLBACK */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
