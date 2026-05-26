import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  increment,
  getDoc,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Deposit, Withdrawal } from '../types';
import { addTransaction } from './userService';

export const submitDeposit = async (
  userId: string,
  userName: string,
  userEmail: string,
  amount: number,
  utrNumber: string,
  screenshotUrl?: string
): Promise<string> => {
  const depRef = doc(collection(db, 'deposits'));
  const deposit: Deposit = {
    id: depRef.id,
    userId,
    userName,
    userEmail,
    amount,
    utrNumber,
    screenshotUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(depRef, deposit);
  return depRef.id;
};

export const approveDeposit = async (depositId: string, adminNote?: string): Promise<void> => {
  const depRef = doc(db, 'deposits', depositId);
  const depSnap = await getDoc(depRef);
  if (!depSnap.exists()) throw new Error('Deposit not found');
  const deposit = depSnap.data() as Deposit;

  await updateDoc(depRef, {
    status: 'approved',
    adminNote: adminNote || '',
    updatedAt: new Date().toISOString(),
  });

  await updateDoc(doc(db, 'users', deposit.userId), {
    walletBalance: increment(deposit.amount),
    depositAmount: increment(deposit.amount),
  });

  await addTransaction(deposit.userId, 'deposit', deposit.amount, `Deposit approved - UTR: ${deposit.utrNumber}`);
};

export const rejectDeposit = async (depositId: string, adminNote?: string): Promise<void> => {
  await updateDoc(doc(db, 'deposits', depositId), {
    status: 'rejected',
    adminNote: adminNote || '',
    updatedAt: new Date().toISOString(),
  });
};

export const getUserDeposits = async (userId: string): Promise<Deposit[]> => {
  const q = query(
    collection(db, 'deposits'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Deposit);
};

export const getAllDeposits = async (): Promise<Deposit[]> => {
  const q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Deposit);
};

export const getPendingDeposits = async (): Promise<Deposit[]> => {
  const q = query(
    collection(db, 'deposits'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Deposit);
};

export const submitWithdrawal = async (
  userId: string,
  userName: string,
  userEmail: string,
  amount: number,
  paymentDetails: { upiId?: string; bankAccount?: string; ifscCode?: string; accountName?: string }
): Promise<string> => {
  const wdRef = doc(collection(db, 'withdrawals'));
  const withdrawal: Withdrawal = {
    id: wdRef.id,
    userId,
    userName,
    userEmail,
    amount,
    ...paymentDetails,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(wdRef, withdrawal);

  await updateDoc(doc(db, 'users', userId), {
    walletBalance: increment(-amount),
    winningAmount: increment(-Math.min(amount, 0)),
  });

  return wdRef.id;
};

export const approveWithdrawal = async (withdrawalId: string, adminNote?: string): Promise<void> => {
  await updateDoc(doc(db, 'withdrawals', withdrawalId), {
    status: 'approved',
    adminNote: adminNote || '',
    updatedAt: new Date().toISOString(),
  });
  const wdSnap = await getDoc(doc(db, 'withdrawals', withdrawalId));
  if (wdSnap.exists()) {
    const wd = wdSnap.data() as Withdrawal;
    await addTransaction(wd.userId, 'withdrawal', -wd.amount, `Withdrawal approved`);
  }
};

export const rejectWithdrawal = async (withdrawalId: string, adminNote?: string): Promise<void> => {
  const wdRef = doc(db, 'withdrawals', withdrawalId);
  const wdSnap = await getDoc(wdRef);
  if (!wdSnap.exists()) throw new Error('Withdrawal not found');
  const wd = wdSnap.data() as Withdrawal;

  await updateDoc(wdRef, {
    status: 'rejected',
    adminNote: adminNote || '',
    updatedAt: new Date().toISOString(),
  });

  await updateDoc(doc(db, 'users', wd.userId), {
    walletBalance: increment(wd.amount),
  });
};

export const getUserWithdrawals = async (userId: string): Promise<Withdrawal[]> => {
  const q = query(
    collection(db, 'withdrawals'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Withdrawal);
};

export const getAllWithdrawals = async (): Promise<Withdrawal[]> => {
  const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Withdrawal);
};

export const getPendingWithdrawals = async (): Promise<Withdrawal[]> => {
  const q = query(
    collection(db, 'withdrawals'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Withdrawal);
};
