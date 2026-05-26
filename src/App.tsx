import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy loaded pages
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ColorGame = lazy(() => import('./pages/ColorGame'));
const LudoGame = lazy(() => import('./pages/LudoGame'));
const Wallet = lazy(() => import('./pages/Wallet'));
const AddMoney = lazy(() => import('./pages/AddMoney'));
const Withdraw = lazy(() => import('./pages/Withdraw'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const SpinWheel = lazy(() => import('./pages/SpinWheel'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminDeposits = lazy(() => import('./pages/admin/AdminDeposits'));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminGames = lazy(() => import('./pages/admin/AdminGames'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full spinning"></div>
      </div>
      <p className="font-orbitron text-purple-400 text-lg animate-pulse">LOADING...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
        
        {/* User Routes */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="games/color" element={<ColorGame />} />
          <Route path="games/ludo" element={<LudoGame />} />
          <Route path="games/spin" element={<SpinWheel />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="wallet/add" element={<AddMoney />} />
          <Route path="wallet/withdraw" element={<Withdraw />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="leaderboard" element={<Leaderboard />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="deposits" element={<AdminDeposits />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="games" element={<AdminGames />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 15, 25, 0.95)',
              color: '#fff',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              backdropFilter: 'blur(10px)',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </Router>
  );
};

export default App;
