import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { User } from '../types';
import { createUserProfile, getUserProfile } from '../services/userService';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isAdmin: boolean;
  signup: (email: string, password: string, name: string, referralCode?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const refreshProfile = useCallback(async () => {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      if (profile) {
        setUserProfile(profile);
        setIsAdmin(profile.role === 'admin');
      }
    }
  }, [currentUser]);

  // ✅ Fix: sirf onAuthStateChanged se currentUser set karo
  // onSnapshot wala listener profile real-time sync karega — duplicate getUserProfile() call hataya
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // ✅ Fix: Firestore real-time listener — yahi kaafi hai, getUserProfile() alag se nahi chahiye
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          const profile = snap.data() as User;
          setUserProfile(profile);
          setIsAdmin(profile.role === 'admin');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const signup = async (email: string, password: string, name: string, referralCode?: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await createUserProfile(user.uid, email, name, referralCode);
      toast.success('Account created successfully! Welcome bonus added! 🎉');
      navigate('/dashboard'); // ✅ Fix: signup ke baad redirect
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Signup failed';
      toast.error(msg.replace('Firebase: ', '').replace('(auth/', '').replace(')', ''));
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back! 🎮');
      navigate('/dashboard'); // ✅ Fix: login ke baad redirect
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      toast.error(msg.replace('Firebase: ', '').replace('(auth/', '').replace(')', ''));
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsAdmin(false);
    toast.success('Logged out successfully');
    navigate('/auth'); // ✅ Fix: logout ke baad auth page pe bhejo
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Reset failed';
      toast.error(msg);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    isAdmin,
    signup,
    login,
    logout,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
