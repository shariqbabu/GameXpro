import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, AdminSettings } from '../types';
import { generateReferralCode } from '../utils/helpers';

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string,
  referralCode?: string
): Promise<User> => {
  const userReferralCode = generateReferralCode(uid);
  const settingsDoc = await getDoc(doc(db, 'adminSettings', 'config'));
  const settings: Partial<AdminSettings> = settingsDoc.exists() ? settingsDoc.data() as AdminSettings : {};
  const signupBonus = settings.signupBonus || 50;

  let referrerId: string | undefined;
  let referralBonus = 0;

  if (referralCode) {
    const q = query(collection(db, 'users'), where('referralCode', '==', referralCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      referrerId = snap.docs[0].id;
      referralBonus = settings.refereeBonus || 25;
      const refBonus = settings.referralBonus || 50;
      await updateDoc(doc(db, 'users', referrerId), {
        referralEarnings: increment(refBonus),
        bonusAmount: increment(refBonus),
        walletBalance: increment(refBonus),
        totalPoints: increment(refBonus),
      });
      await addTransaction(referrerId, 'referral', refBonus, `Referral bonus for inviting ${displayName}`);
    }
  }

  const totalBonus = signupBonus + referralBonus;
  const now = new Date().toISOString();

  const userData: User = {
    uid,
    email,
    displayName,
    photoURL: '',
    referralCode: userReferralCode,
    referredBy: referrerId,
    role: 'user',
    isBlocked: false,
    createdAt: now,
    lastLogin: now,
    totalPoints: totalBonus,
    walletBalance: totalBonus,
    winningAmount: 0,
    bonusAmount: totalBonus,
    depositAmount: 0,
    referralEarnings: 0,
    totalGamesPlayed: 0,
    totalWins: 0,
  };

  await setDoc(doc(db, 'users', uid), userData);
  
  if (totalBonus > 0) {
    await addTransaction(uid, 'bonus', totalBonus, `Signup bonus + referral bonus`);
  }

  return userData;
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return docSnap.data() as User;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<User>): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as User);
};

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  const allUsers = await getAllUsers();
  return allUsers.filter(u =>
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.includes(searchTerm)
  );
};

export const addTransaction = async (
  userId: string,
  type: string,
  amount: number,
  description: string
): Promise<void> => {
  const txRef = doc(collection(db, 'transactions'));
  await setDoc(txRef, {
    id: txRef.id,
    userId,
    type,
    amount,
    status: 'completed',
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const getUserTransactions = async (userId: string) => {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

export const getAdminSettings = async (): Promise<AdminSettings> => {
  const docSnap = await getDoc(doc(db, 'adminSettings', 'config'));
  if (docSnap.exists()) {
    return docSnap.data() as AdminSettings;
  }
  // Default settings
  const defaults: AdminSettings = {
    signupBonus: 50,
    referralBonus: 100,
    refereeBonus: 25,
    minDeposit: 100,
    maxDeposit: 50000,
    minWithdrawal: 100,
    maxWithdrawal: 10000,
    paymentQrUrl: '',
    upiId: 'gamezone@upi',
    colorGameEnabled: true,
    ludoGameEnabled: true,
    spinWheelEnabled: true,
    maintenanceMode: false,
    announcement: 'Welcome to GameZone Pro! Play and win amazing prizes!',
    colorGameTimer: 30,
    colorGameMultiplier: { red: 2, green: 2, violet: 3 },
    dailyRewardEnabled: true,
    dailyRewardAmount: 10,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'adminSettings', 'config'), defaults);
  return defaults;
};

export const updateAdminSettings = async (settings: Partial<AdminSettings>): Promise<void> => {
  await updateDoc(doc(db, 'adminSettings', 'config'), {
    ...settings,
    updatedAt: new Date().toISOString(),
  });
};

export const getTopLeaderboard = async (limitCount: number = 10) => {
  const q = query(
    collection(db, 'users'),
    orderBy('totalWins', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({
    ...d.data(),
    rank: i + 1,
  }));
};

// Suppress unused variable warning for Timestamp
void Timestamp;
void serverTimestamp;
