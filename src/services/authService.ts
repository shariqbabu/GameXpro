// ============================================================
// AUTH SERVICE - FIREBASE AUTHENTICATION
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { SignupForm, User } from '../types';
import { generateReferralCode } from '../utils/wallet';

// ─── Sign Up ─────────────────────────────────────────────────
export async function signUpUser(formData: SignupForm): Promise<void> {
  const { name, email, phone, password, referralCode } = formData;

  // Prevent self-referral check handled during referral lookup
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  // Update Firebase Auth profile
  await updateProfile(credential.user, { displayName: name });

  // Generate unique referral code
  const userReferralCode = generateReferralCode(name, uid);

  // Resolve referral
  let referredBy = '';
  if (referralCode && referralCode.trim()) {
    const refQuery = query(
      collection(db, 'referrals'),
      where('code', '==', referralCode.trim().toUpperCase())
    );
    const refSnap = await getDocs(refQuery);
    if (!refSnap.empty) {
      const refData = refSnap.docs[0].data();
      if (refData.uid !== uid) {
        referredBy = refData.uid;
      }
    }
  }

  const now = serverTimestamp();

  // Create user document
  const userDoc: Omit<User, 'createdAt' | 'lastLogin'> & { createdAt: unknown; lastLogin: unknown } = {
    uid,
    name,
    email,
    phone,
    photoURL: '',
    referralCode: userReferralCode,
    referredBy,
    isAdmin: false,
    status: 'active',
    totalDeposit: 0,
    totalWithdraw: 0,
    totalPlayed: 0,
    totalWon: 0,
    createdAt: now,
    lastLogin: now,
  };

  await setDoc(doc(db, 'users', uid), userDoc);

  // Create wallet document
  await setDoc(doc(db, 'wallets', uid), {
    uid,
    depositBalance: 0,
    winningBalance: 0,
    bonusBalance: referredBy ? 50 : 0, // ₹50 signup bonus if referred
  });

  // Create referral document
  await setDoc(doc(db, 'referrals', uid), {
    uid,
    code: userReferralCode,
    totalReferrals: 0,
    totalEarned: 0,
  });

  // If referred by someone, update their referral stats and reward
  if (referredBy) {
    const refDocRef = doc(db, 'referrals', referredBy);
    const refDoc = await getDoc(refDocRef);
    if (refDoc.exists()) {
      await updateDoc(refDocRef, {
        totalReferrals: (refDoc.data().totalReferrals || 0) + 1,
        totalEarned: (refDoc.data().totalEarned || 0) + 100,
      });
    }

    // Give referrer bonus
    const refWalletRef = doc(db, 'wallets', referredBy);
    const refWallet = await getDoc(refWalletRef);
    if (refWallet.exists()) {
      await updateDoc(refWalletRef, {
        bonusBalance: (refWallet.data().bonusBalance || 0) + 100,
      });
    }

    // Create referral bonus transaction for referrer
    const txRef = doc(collection(db, 'transactions'));
    await setDoc(txRef, {
      uid: referredBy,
      type: 'referral_bonus',
      amount: 100,
      balanceType: 'bonusBalance',
      status: 'completed',
      description: `Referral bonus for inviting ${name}`,
      createdAt: now,
    });
  }
}

// ─── Sign In ─────────────────────────────────────────────────
export async function signInUser(email: string, password: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  // Update last login
  await updateDoc(doc(db, 'users', uid), {
    lastLogin: serverTimestamp(),
  });
}

// ─── Sign Out ─────────────────────────────────────────────────
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// ─── Forgot Password ─────────────────────────────────────────
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ─── Get User Data ─────────────────────────────────────────────
export async function getUserData(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return snap.data() as User;
  }
  return null;
}

// ─── Auth State Observer ─────────────────────────────────────
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
