import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {

  const {
    currentUser,
    userProfile,
    loading,
  } = useAuth();

  // LOADING SCREEN
  if (loading) {

    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">

        <div className="text-center space-y-4">

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto animate-pulse">

            <span className="text-2xl">
              👑
            </span>

          </div>

          <div className="space-y-2">

            <div className="w-32 h-2 bg-white/10 rounded mx-auto animate-pulse" />

            <div className="w-20 h-2 bg-white/5 rounded mx-auto animate-pulse" />

          </div>

          <p className="text-white/30 text-sm">
            Loading RoyalWin...
          </p>
        </div>
      </div>
    );
  }

  // NOT LOGGED IN
  if (!currentUser) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ADMIN CHECK
  if (
    requireAdmin &&
    userProfile?.role !== 'admin'
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // ALLOW ACCESS
  return <>{children}</>;
};
