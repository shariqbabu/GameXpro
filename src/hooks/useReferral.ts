// ============================================================
// REFERRAL HOOK
// ============================================================

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Referral } from '../types';
import { useAuthStore } from '../store/authStore';

export function useReferral() {
  const { user } = useAuthStore();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setReferral(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'referrals', user.uid), (snap) => {
      if (snap.exists()) {
        setReferral(snap.data() as Referral);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return { referral, isLoading };
}
