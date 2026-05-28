// ============================================================
// PROTECTED ROUTE COMPONENT
// ============================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, firebaseUser, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-casino-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-300 font-casino">Loading RoyalBet...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.status === 'banned') {
    return (
      <div className="min-h-screen bg-casino-gradient flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Account Banned</h2>
          <p className="text-slate-400">Your account has been suspended. Contact support.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
