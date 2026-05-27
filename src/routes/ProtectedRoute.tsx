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

  // MAIN LOADING
  if (loading) {

    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">

        <div className="text-center space-y-5">

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center mx-auto shadow-2xl animate-pulse">

            <span className="text-3xl">
              👑
            </span>

          </div>

          <div className="space-y-3">

            <div className="w-40 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">

              <div className="h-full w-1/2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-pulse" />

            </div>

            <div className="w-28 h-2 bg-white/5 rounded-full mx-auto animate-pulse" />

          </div>

          <div className="space-y-1">

            <p className="text-white/80 text-sm font-medium">
              Loading RoyalWin...
            </p>

            <p className="text-white/30 text-xs">
              Please wait
            </p>

          </div>

        </div>

      </div>
    );
  }

  // USER NOT LOGGED IN
  if (!currentUser) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // WAIT FOR FIREBASE PROFILE
  if (!userProfile) {

    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">

        <div className="text-center space-y-4">

          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />

          <div>

            <p className="text-white/80 text-sm">
              Loading Profile...
            </p>

            <p className="text-white/30 text-xs mt-1">
              Syncing account data
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ADMIN ACCESS CHECK
  if (
    requireAdmin &&
    userProfile.role !== 'admin'
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // ACCESS GRANTED
  return <>{children}</>;
};
