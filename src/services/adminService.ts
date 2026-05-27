// ============================================================
// ADMIN SERVICE - FIRESTORE ADMIN OPERATIONS
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  runTransaction,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Deposit, Withdrawal, Transaction, AdminStats } from '../types';

// ─── Get All Users ────────────────────────────────────────────
export async function getAllUsers(limitCount = 50): Promise<User[]> {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as User);
}

// ─── Subscribe Users ──────────────────────────────────────────
export function subscribeUsers(callback: (users: User[]) => void, limitCount = 50) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(limitCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as User));
  });
}

// ─── Ban/Unban User ───────────────────────────────────────────
export async function toggleUserBan(uid: string, ban: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    status: ban ? 'banned' : 'active',
  });
}

// ─── Admin Wallet Adjustment ──────────────────────────────────
export async function adminAdjustWallet(
  uid: string,
  amount: number,
  balanceType: 'depositBalance' | 'winningBalance' | 'bonusBalance',
  description: string,
  adminUid: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const walletRef = doc(db, 'wallets', uid);
    const walletSnap = await tx.get(walletRef);

    if (!walletSnap.exists()) throw new Error('Wallet not found');

    const wallet = walletSnap.data();
    const currentBalance = wallet[balanceType] || 0;
    const newBalance = currentBalance + amount;

    if (newBalance < 0) throw new Error('Balance cannot be negative');

    tx.update(walletRef, { [balanceType]: newBalance });

    // Create transaction record
    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      uid,
      type: 'admin_adjustment',
      amount,
      balanceType,
      status: 'completed',
      description: `Admin adjustment by ${adminUid}: ${description}`,
      createdAt: serverTimestamp(),
    });
  });
}

// ─── Get Pending Deposits ─────────────────────────────────────
export async function getPendingDeposits(): Promise<Deposit[]> {
  const q = query(
    collection(db, 'deposits'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  const deposits = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Deposit));

  // Enrich with user data
  const enriched = await Promise.all(
    deposits.map(async (dep) => {
      const userSnap = await getDoc(doc(db, 'users', dep.uid));
      if (userSnap.exists()) {
        const user = userSnap.data() as User;
        return { ...dep, userName: user.name, userEmail: user.email };
      }
      return dep;
    })
  );
  return enriched;
}

// ─── Subscribe Deposits ───────────────────────────────────────
export function subscribeDeposits(callback: (deposits: Deposit[]) => void) {
  const q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, async (snap) => {
    const deposits = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Deposit));
    const enriched = await Promise.all(
      deposits.map(async (dep) => {
        const userSnap = await getDoc(doc(db, 'users', dep.uid));
        if (userSnap.exists()) {
          const user = userSnap.data() as User;
          return { ...dep, userName: user.name, userEmail: user.email };
        }
        return dep;
      })
    );
    callback(enriched);
  });
}

// ─── Approve Deposit ──────────────────────────────────────────
export async function approveDeposit(depositId: string, adminUid: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const depRef = doc(db, 'deposits', depositId);
    const depSnap = await tx.get(depRef);

    if (!depSnap.exists()) throw new Error('Deposit not found');

    const deposit = depSnap.data() as Deposit;
    if (deposit.status !== 'pending') throw new Error('Deposit already processed');

    const walletRef = doc(db, 'wallets', deposit.uid);
    const walletSnap = await tx.get(walletRef);

    if (!walletSnap.exists()) throw new Error('Wallet not found');

    const wallet = walletSnap.data();

    tx.update(depRef, { status: 'approved', verifiedBy: adminUid });
    tx.update(walletRef, {
      depositBalance: (wallet.depositBalance || 0) + deposit.amount,
    });

    // Update user stats
    const userRef = doc(db, 'users', deposit.uid);
    const userSnap = await tx.get(userRef);
    if (userSnap.exists()) {
      tx.update(userRef, {
        totalDeposit: (userSnap.data().totalDeposit || 0) + deposit.amount,
      });
    }

    // Create transaction record
    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      uid: deposit.uid,
      type: 'deposit',
      amount: deposit.amount,
      balanceType: 'depositBalance',
      status: 'completed',
      description: `Deposit approved (UTR: ${deposit.utrNumber})`,
      createdAt: serverTimestamp(),
    });
  });
}

// ─── Reject Deposit ───────────────────────────────────────────
export async function rejectDeposit(depositId: string, adminUid: string): Promise<void> {
  await updateDoc(doc(db, 'deposits', depositId), {
    status: 'rejected',
    verifiedBy: adminUid,
  });
}

// ─── Get Pending Withdrawals ──────────────────────────────────
export async function getPendingWithdrawals(): Promise<Withdrawal[]> {
  const q = query(
    collection(db, 'withdrawals'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  const withdrawals = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Withdrawal));

  const enriched = await Promise.all(
    withdrawals.map(async (w) => {
      const userSnap = await getDoc(doc(db, 'users', w.uid));
      if (userSnap.exists()) {
        const user = userSnap.data() as User;
        return { ...w, userName: user.name, userEmail: user.email };
      }
      return w;
    })
  );
  return enriched;
}

// ─── Subscribe Withdrawals ────────────────────────────────────
export function subscribeWithdrawals(callback: (withdrawals: Withdrawal[]) => void) {
  const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, async (snap) => {
    const withdrawals = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Withdrawal));
    const enriched = await Promise.all(
      withdrawals.map(async (w) => {
        const userSnap = await getDoc(doc(db, 'users', w.uid));
        if (userSnap.exists()) {
          const user = userSnap.data() as User;
          return { ...w, userName: user.name, userEmail: user.email };
        }
        return w;
      })
    );
    callback(enriched);
  });
}

// ─── Approve Withdrawal ───────────────────────────────────────
export async function approveWithdrawal(withdrawId: string, adminUid: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const wRef = doc(db, 'withdrawals', withdrawId);
    const wSnap = await tx.get(wRef);

    if (!wSnap.exists()) throw new Error('Withdrawal not found');

    const withdrawal = wSnap.data() as Withdrawal;
    if (withdrawal.status !== 'pending') throw new Error('Already processed');

    tx.update(wRef, { status: 'approved', approvedBy: adminUid });

    // Update user stats
    const userRef = doc(db, 'users', withdrawal.uid);
    const userSnap = await tx.get(userRef);
    if (userSnap.exists()) {
      tx.update(userRef, {
        totalWithdraw: (userSnap.data().totalWithdraw || 0) + withdrawal.amount,
      });
    }

    // Update transaction status
    const txQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', withdrawal.uid),
      where('type', '==', 'withdraw'),
      where('status', '==', 'pending'),
      limit(1)
    );
    const txSnap = await getDocs(txQuery);
    if (!txSnap.empty) {
      tx.update(txSnap.docs[0].ref, { status: 'completed' });
    }
  });
}

// ─── Reject Withdrawal ────────────────────────────────────────
export async function rejectWithdrawal(withdrawId: string, adminUid: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const wRef = doc(db, 'withdrawals', withdrawId);
    const wSnap = await tx.get(wRef);

    if (!wSnap.exists()) throw new Error('Withdrawal not found');

    const withdrawal = wSnap.data() as Withdrawal;
    if (withdrawal.status !== 'pending') throw new Error('Already processed');

    tx.update(wRef, { status: 'rejected', approvedBy: adminUid });

    // Refund to winning balance
    const walletRef = doc(db, 'wallets', withdrawal.uid);
    const walletSnap = await tx.get(walletRef);
    if (walletSnap.exists()) {
      tx.update(walletRef, {
        winningBalance: (walletSnap.data().winningBalance || 0) + withdrawal.amount,
      });
    }

    // Create refund transaction
    const txRef = doc(collection(db, 'transactions'));
    tx.set(txRef, {
      uid: withdrawal.uid,
      type: 'admin_adjustment',
      amount: withdrawal.amount,
      balanceType: 'winningBalance',
      status: 'completed',
      description: `Withdrawal rejected and refunded by admin ${adminUid}`,
      createdAt: serverTimestamp(),
    });
  });
}

// ─── Get Admin Stats ──────────────────────────────────────────
export async function getAdminStats(): Promise<AdminStats> {
  const [usersSnap, depositsSnap, withdrawalsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'deposits')),
    getDocs(collection(db, 'withdrawals')),
  ]);

  const users = usersSnap.docs.map((d) => d.data() as User);
  const deposits = depositsSnap.docs.map((d) => d.data() as Deposit);
  const withdrawals = withdrawalsSnap.docs.map((d) => d.data() as Withdrawal);

  const totalDeposit = deposits
    .filter((d) => d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalWithdraw = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingDeposits = deposits.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending').length;

  const totalGamesPlayed = users.reduce((sum, u) => sum + (u.totalPlayed || 0), 0);

  return {
    totalUsers: users.length,
    totalDeposit,
    totalWithdraw,
    totalRevenue: totalDeposit - totalWithdraw,
    activeUsers: users.filter((u) => u.status === 'active').length,
    pendingDeposits,
    pendingWithdrawals,
    totalGamesPlayed,
  };
}

// ─── Subscribe Admin Stats ────────────────────────────────────
export function subscribeAdminStats(callback: (stats: AdminStats) => void) {
  return onSnapshot(collection(db, 'users'), async () => {
    const stats = await getAdminStats();
    callback(stats);
  });
}

// ─── Get All Transactions ─────────────────────────────────────
export async function getAllTransactions(limitCount = 100): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
}

// ─── Make User Admin ──────────────────────────────────────────
export async function makeUserAdmin(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { isAdmin: true });
}

// ─── Update User Profile ──────────────────────────────────────
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<User, 'name' | 'phone' | 'photoURL'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}
