// ============================================================
// WALLET STORE - ZUSTAND
// ============================================================

import { create } from 'zustand';
import { WalletWithTotal } from '../types';

interface WalletState {
  wallet: WalletWithTotal | null;
  isLoading: boolean;
  setWallet: (wallet: WalletWithTotal | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  wallet: null,
  isLoading: true,
  setWallet: (wallet) => set({ wallet }),
  setLoading: (isLoading) => set({ isLoading }),
}));
