// ============================================================
// AUTH HOOK
// ============================================================

import { useEffect } from 'react';
import { onAuthStateChange, getUserData } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, firebaseUser, isLoading, isInitialized, setUser, setFirebaseUser, setLoading, setInitialized, logout } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser({ uid: fbUser.uid, email: fbUser.email });
        try {
          const userData = await getUserData(fbUser.uid);
          setUser(userData);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setFirebaseUser, setLoading, setInitialized]);

  return { user, firebaseUser, isLoading, isInitialized, logout };
}
