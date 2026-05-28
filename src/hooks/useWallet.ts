// ============================================================
// WALLET HOOK - REALTIME WALLET UPDATES
// ============================================================

import { useEffect } from 'react';
import { subscribeWallet } from '../services/walletService';
import { useWalletStore } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';

export function useWallet() {
  const { user } = useAuthStore();
  const { wallet, isLoading, setWallet, setLoading } = useWalletStore();

  useEffect(() => {
    if (!user?.uid) {
      setWallet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeWallet(user.uid, (w) => {
      setWallet(w);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, setWallet, setLoading]);

  return { wallet, isLoading };
}
