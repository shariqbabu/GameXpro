import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as User);
      }
    } catch {
      // Demo mode - create mock profile
      const mockProfile: User = {
        uid,
        email: 'demo@royalwin.com',
        username: 'DemoPlayer',
        displayName: 'Demo Player',
        photoURL: '',
        role: 'user',
        referralCode: 'DEMO123',
        walletBalance: 1250.00,
        winningBalance: 750.00,
        depositBalance: 500.00,
        bonusBalance: 100.00,
        referralEarnings: 150.00,
        lockedBalance: 0,
        totalPoints: 8500,
        totalMatches: 47,
        accountStatus: 'active',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        achievements: ['first_win', 'referral_king'],
      };
      setUserProfile(mockProfile);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isAdmin = userProfile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, isAdmin, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
