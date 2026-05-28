// src/App.tsx

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { Toaster } from 'react-hot-toast';

// CONTEXT
import { AuthProvider } from './contexts/AuthContext';

// ROUTES
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

// LAYOUTS
import UserLayout from './layouts/UserLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// AUTH PAGES
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// DASHBOARD
import DashboardPage from './pages/dashboard/DashboardPage';

// GAMES
import GamesPage from './pages/games/GamesPage';
import CasinoPage from './pages/games/CasinoPage';
import DicePage from './pages/games/DicePage';

// PROFILE
import ProfilePage from './pages/profile/ProfilePage';

// REFERRAL
import ReferralPage from './pages/referral/ReferralPage';

// TRANSACTIONS
import TransactionsPage from './pages/transactions/TransactionsPage';

// WALLET
import WalletPage from './pages/wallet/WalletPage';
import DepositPage from './pages/wallet/DepositPage';
import WithdrawPage from './pages/wallet/WithdrawPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Toaster
          position="top-right"
          reverseOrder={false}
        />

        <Routes>

          {/* DEFAULT */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {/* AUTH ROUTES */}
          <Route
            element={<AuthLayout />}
          >
            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/signup"
              element={<SignupPage />}
            />

            <Route
              path="/forgot-password"
              element={<ForgotPasswordPage />}
            />
          </Route>

          {/* USER ROUTES */}
          <Route
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >

            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/games"
              element={<GamesPage />}
            />

            <Route
              path="/games/casino"
              element={<CasinoPage />}
            />

            <Route
              path="/games/dice"
              element={<DicePage />}
            />

            <Route
              path="/wallet"
              element={<WalletPage />}
            />

            <Route
              path="/wallet/deposit"
              element={<DepositPage />}
            />

            <Route
              path="/wallet/withdraw"
              element={<WithdrawPage />}
            />

            <Route
              path="/transactions"
              element={<TransactionsPage />}
            />

            <Route
              path="/profile"
              element={<ProfilePage />}
            />

            <Route
              path="/referral"
              element={<ReferralPage />}
            />

          </Route>

          {/* ADMIN ROUTES */}
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >

            <Route
              path="/admin"
              element={
                <div className="p-6 text-white">
                  Admin Dashboard
                </div>
              }
            />

          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="h-screen bg-black text-white flex items-center justify-center text-3xl font-bold">
                404 | Page Not Found
              </div>
            }
          />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}
