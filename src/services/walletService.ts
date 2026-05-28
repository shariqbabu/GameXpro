// ============================================================
// WALLET SERVICE - FIRESTORE
// ============================================================

import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  collection,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Wallet, WalletWithTotal, Transaction } from '../types';
import { computeTotalBalance } from '../utils/wallet';

// ─── Get Wallet (one-time) ────────────────────────────────────
export async function getWallet(uid: string): Promise<WalletWithTotal | null> {
  const snap = await getDoc(doc(db, 'wallets', uid));
  if (snap.exists()) {
    return computeTotalBalance(snap.data() as Wallet);
  }
  return null;
}

// ─── Realtime Wallet Listener ─────────────────────────────────
export function subscribeWallet(
  uid: string,
  callback: (wallet: WalletWithTotal | null) => void
) {
  return onSnapshot(doc(db, 'wallets', uid), (snap) => {
    if (snap.exists()) {
      callback(computeTotalBalance(snap.data() as Wallet));
    } else {
      callback(null);
    }
  });
}

// ─── Get Transactions ─────────────────────────────────────────
export async function getUserTransactions(uid: string, limitCount = 20): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
}

// ─── Subscribe Transactions ───────────────────────────────────
export function subscribeTransactions(
  uid: string,
  callback: (txns: Transaction[]) => void,
  limitCount = 20
) {
  const q = query(
    collection(db, 'transactions'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
  });
}

// ─── Deduct Bet Amount ────────────────────────────────────────
export async function deductBetAmount(
  uid: string,
  amount: number,
  gameDescription: string
): Promise<boolean> {
  try {
    await runTransaction(db, async (tx) => {
      const walletRef = doc(db, 'wallets', uid);
      const walletSnap = await tx.get(walletRef);

      if (!walletSnap.exists()) throw new Error('Wallet not found');

      const wallet = walletSnap.data() as Wallet;
      const total = wallet.depositBalance + wallet.winningBalance + wallet.bonusBalance;

      if (total < amount) throw new Error('Insufficient balance');

      // Deduct from depositBalance first, then winningBalance, then bonusBalance
      let remaining = amount;
      let newDeposit = wallet.depositBalance;
      let newWinning = wallet.winningBalance;
      let newBonus = wallet.bonusBalance;

      if (newDeposit >= remaining) {
        newDeposit -= remaining;
        remaining = 0;
      } else {
        remaining -= newDeposit;
        newDeposit = 0;
      }

      if (remaining > 0 && newWinning >= remaining) {
        newWinning -= remaining;
        remaining = 0;
      } else if (remaining > 0) {
        remaining -= newWinning;
        newWinning = 0;
      }

      if (remaining > 0 && newBonus >= remaining) {
        newBonus -= remaining;
        remaining = 0;
      } else if (remaining > 0) {
        throw new Error('Insufficient balance');
      }

      tx.update(walletRef, {
        depositBalance: newDeposit,
        winningBalance: newWinning,
        bonusBalance: newBonus,
      });

      // Create transaction record
      const txRef = doc(collection(db, 'transactions'));
      tx.set(txRef, {
        uid,
        type: 'game_bet',
        amount,
        balanceType: 'depositBalance',
        status: 'completed',
        description: gameDescription,
        createdAt: serverTimestamp(),
      });
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Add Win Amount ───────────────────────────────────────────
export async function addWinAmount(
  uid: string,
  amount: number,
  description: string
): Promise<boolean> {
  try {
    await runTransaction(db, async (tx) => {
      const walletRef = doc(db, 'wallets', uid);
      const walletSnap = await tx.get(walletRef);

      if (!walletSnap.exists()) throw new Error('Wallet not found');

      const wallet = walletSnap.data() as Wallet;

      tx.update(walletRef, {
        winningBalance: wallet.winningBalance + amount,
      });

      // Create win transaction
      const txRef = doc(collection(db, 'transactions'));
      tx.set(txRef, {
        uid,
        type: 'game_win',
        amount,
        balanceType: 'winningBalance',
        status: 'completed',
        description,
        createdAt: serverTimestamp(),
      });

      // Update user stats
      const userRef = doc(db, 'users', uid);
      const userSnap = await tx.get(userRef);
      if (userSnap.exists()) {
        tx.update(userRef, {
          totalWon: (userSnap.data().totalWon || 0) + amount,
        });
      }
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Create Deposit Request ────────────────────────────────────
export async function createDeposit(
  uid: string,
  amount: number,
  utrNumber: string,
  screenshot: string
): Promise<string> {
  const depositRef = doc(collection(db, 'deposits'));
  await setDoc(depositRef, {
    uid,
    amount,
    utrNumber,
    screenshot,
    status: 'pending',
    verifiedBy: '',
    createdAt: serverTimestamp(),
  });
  return depositRef.id;
}

// ─── Create Withdrawal Request ────────────────────────────────
export async function createWithdrawal(
  uid: string,
  amount: number,
  upiId: string
): Promise<boolean> {
  try {
    await runTransaction(db, async (tx) => {
      const walletRef = doc(db, 'wallets', uid);
      const walletSnap = await tx.get(walletRef);

      if (!walletSnap.exists()) throw new Error('Wallet not found');

      const wallet = walletSnap.data() as Wallet;

      // Only from winning balance
      if (wallet.winningBalance < amount) {
        throw new Error('Insufficient winning balance');
      }

      tx.update(walletRef, {
        winningBalance: wallet.winningBalance - amount,
      });

      const withdrawRef = doc(collection(db, 'withdrawals'));
      tx.set(withdrawRef, {
        uid,
        amount,
        upiId,
        status: 'pending',
        approvedBy: '',
        createdAt: serverTimestamp(),
      });

      // Create pending transaction
      const txRef = doc(collection(db, 'transactions'));
      tx.set(txRef, {
        uid,
        type: 'withdraw',
        amount,
        balanceType: 'winningBalance',
        status: 'pending',
        description: `Withdrawal request to UPI: ${upiId}`,
        createdAt: serverTimestamp(),
      });
    });
    return true;
  } catch {
    return false;
  }
}
