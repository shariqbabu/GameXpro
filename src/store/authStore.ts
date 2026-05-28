// ============================================================
// AUTH STORE - ZUSTAND
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: { uid: string; email: string | null } | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: { uid: string; email: string | null } | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      firebaseUser: null,
      isLoading: true,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      logout: () => set({ user: null, firebaseUser: null }),
    }),
    {
      name: 'royalbet-auth',
      partialize: (state) => ({ firebaseUser: state.firebaseUser }),
    }
  )
);
