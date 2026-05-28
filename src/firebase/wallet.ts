import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { Wallet, Transaction, TransactionType } from '../types';
import { calculateUsableBalance } from '../utils/helpers';

export const getWallet = async (uid: string): Promise<Wallet | null> => {
  const snap = await getDoc(doc(db, 'wallets', uid));
  if (!snap.exists()) return null;
  return snap.data() as Wallet;
};

export const subscribeWallet = (uid: string, callback: (wallet: Wallet | null) => void) => {
  return onSnapshot(doc(db, 'wallets', uid), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as Wallet);
    } else {
      callback(null);
    }
  });
};

export const addFunds = async (
  uid: string,
  amount: number,
  type: 'depositBalance' | 'winningBalance' | 'bonusBalance' | 'referralBalance' = 'depositBalance',
  description: string = 'Deposit approved'
) => {
  if (amount <= 0) throw new Error('Amount must be positive');

  await runTransaction(db, async (tx) => {
    const walletRef = doc(db, 'wallets', uid);
    const walletSnap = await tx.get(walletRef);

    if (!walletSnap.exists()) {
      throw new Error('Wallet not found');
    }

    const wallet = walletSnap.data() as Wallet;
    const previousBalance = wallet.totalBalance;
    const newBalance = previousBalance + amount;
    const newTypeBalance = (wallet[type] || 0) + amount;

    tx.update(walletRef, {
      [type]: newTypeBalance,
      totalBalance: newBalance,
      updatedAt: serverTimestamp(),
    });

    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      uid,
      type: type === 'depositBalance' ? 'DEPOSIT' : type === 'winningBalance' ? 'GAME_WIN' : type === 'bonusBalance' ? 'BONUS' : 'REFERRAL',
      amount,
      previousBalance,
      currentBalance: newBalance,
      status: 'COMPLETED',
      description,
      createdAt: serverTimestamp(),
    });
  });
};

export const deductFunds = async (
  uid: string,
  amount: number,
  type: TransactionType,
  description: string
) => {
  if (amount <= 0) throw new Error('Amount must be positive');

  await runTransaction(db, async (tx) => {
    const walletRef = doc(db, 'wallets', uid);
    const walletSnap = await tx.get(walletRef);

    if (!walletSnap.exists()) {
      throw new Error('Wallet not found');
    }

    const wallet = walletSnap.data() as Wallet;
    const usable = calculateUsableBalance(wallet);

    if (usable < amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from winning balance first, then referral, then bonus (10% only)
    let remaining = amount;
    let newWinning = wallet.winningBalance;
    let newReferral = wallet.referralBalance;
    let newBonus = wallet.bonusBalance;

    const fromWinning = Math.min(newWinning, remaining);
    newWinning -= fromWinning;
    remaining -= fromWinning;

    if (remaining > 0) {
      const fromReferral = Math.min(newReferral, remaining);
      newReferral -= fromReferral;
      remaining -= fromReferral;
    }

    if (remaining > 0) {
      const maxBonus = wallet.bonusBalance * 0.1;
      const fromBonus = Math.min(maxBonus, remaining);
      newBonus -= fromBonus;
      remaining -= fromBonus;
    }

    if (remaining > 0) {
      throw new Error('Insufficient usable balance');
    }

    const previousBalance = wallet.totalBalance;
    const newTotal = wallet.totalBalance - amount;

    tx.update(walletRef, {
      winningBalance: newWinning,
      referralBalance: newReferral,
      bonusBalance: newBonus,
      totalBalance: newTotal,
      updatedAt: serverTimestamp(),
    });

    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      uid,
      type,
      amount: -amount,
      previousBalance,
      currentBalance: newTotal,
      status: 'COMPLETED',
      description,
      createdAt: serverTimestamp(),
    });
  });
};

export const withdrawFunds = async (uid: string, amount: number, upiId: string) => {
  if (amount < 100) throw new Error('Minimum withdrawal is ₹100');

  await runTransaction(db, async (tx) => {
    const walletRef = doc(db, 'wallets', uid);
    const walletSnap = await tx.get(walletRef);

    if (!walletSnap.exists()) throw new Error('Wallet not found');

    const wallet = walletSnap.data() as Wallet;

    // Only winning balance can be withdrawn
    if (wallet.winningBalance < amount) {
      throw new Error('Insufficient winning balance for withdrawal');
    }

    const previousBalance = wallet.totalBalance;
    const newWinning = wallet.winningBalance - amount;
    const newTotal = wallet.totalBalance - amount;

    tx.update(walletRef, {
      winningBalance: newWinning,
      totalBalance: newTotal,
      updatedAt: serverTimestamp(),
    });

    const userRef = doc(db, 'users', uid);
    const userSnap = await tx.get(userRef);
    const userData = userSnap.data();

    const withdrawalRef = doc(collection(db, 'withdrawals'));
    tx.set(withdrawalRef, {
      uid,
      userName: userData?.name || 'Unknown',
      userEmail: userData?.email || '',
      amount,
      upiId,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      uid,
      type: 'WITHDRAWAL',
      amount: -amount,
      previousBalance,
      currentBalance: newTotal,
      status: 'PENDING',
      description: `Withdrawal to ${upiId}`,
      createdAt: serverTimestamp(),
    });
  });
};

export const getTransactions = async (uid: string, limitCount = 20): Promise<Transaction[]> => {
  const q = query(
    collection(db, 'transactions'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
};

export const subscribeTransactions = (
  uid: string,
  callback: (txs: Transaction[]) => void
) => {
  const q = query(
    collection(db, 'transactions'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    callback(txs);
  });
};

export const createDeposit = async (
  uid: string,
  amount: number,
  screenshotUrl: string,
  utrNumber: string
) => {
  const userSnap = await getDoc(doc(db, 'users', uid));
  const userData = userSnap.data();

  await addDoc(collection(db, 'deposits'), {
    uid,
    userName: userData?.name || 'Unknown',
    userEmail: userData?.email || '',
    amount,
    screenshotUrl,
    utrNumber,
    status: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
