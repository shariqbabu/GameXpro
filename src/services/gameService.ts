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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { GameRound, GameBet } from '../types';
import { addTransaction } from './userService';
import { getRandomColor } from '../utils/helpers';

export const getCurrentRound = async (): Promise<GameRound | null> => {
  const q = query(
    collection(db, 'gameRounds'),
    where('status', '!=', 'completed'),
    orderBy('status'),
    orderBy('startTime', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as GameRound;
};

export const createNewRound = async (): Promise<GameRound> => {
  const roundRef = doc(collection(db, 'gameRounds'));
  const roundNumberQuery = query(
    collection(db, 'gameRounds'),
    orderBy('roundNumber', 'desc'),
    limit(1)
  );
  const roundSnap = await getDocs(roundNumberQuery);
  const lastRoundNumber = roundSnap.empty ? 0 : (roundSnap.docs[0].data() as GameRound).roundNumber;

  const round: GameRound = {
    id: roundRef.id,
    roundNumber: lastRoundNumber + 1,
    status: 'betting',
    startTime: new Date().toISOString(),
    totalBets: 0,
    totalAmount: 0,
  };

  await setDoc(roundRef, round);
  return round;
};

export const placeBet = async (
  userId: string,
  userName: string,
  roundId: string,
  color: 'red' | 'green' | 'violet',
  amount: number
): Promise<void> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) throw new Error('User not found');
  const user = userDoc.data();
  
  if (user.walletBalance < amount) throw new Error('Insufficient balance');
  if (amount < 10) throw new Error('Minimum bet is ₹10');

  await updateDoc(doc(db, 'users', userId), {
    walletBalance: increment(-amount),
  });

  const betRef = doc(collection(db, 'gameBets'));
  const bet: GameBet = {
    id: betRef.id,
    userId,
    userName,
    roundId,
    color,
    amount,
    createdAt: new Date().toISOString(),
  };
  await setDoc(betRef, bet);

  await updateDoc(doc(db, 'gameRounds', roundId), {
    totalBets: increment(1),
    totalAmount: increment(amount),
  });
};

export const processRoundResult = async (roundId: string): Promise<'red' | 'green' | 'violet'> => {
  const result = getRandomColor();
  
  await updateDoc(doc(db, 'gameRounds', roundId), {
    status: 'processing',
    result,
  });

  const betsQuery = query(
    collection(db, 'gameBets'),
    where('roundId', '==', roundId)
  );
  const betsSnap = await getDocs(betsQuery);
  const bets = betsSnap.docs.map(d => d.data() as GameBet);

  const settingsDoc = await getDoc(doc(db, 'adminSettings', 'config'));
  const settings = settingsDoc.exists() ? settingsDoc.data() : {};
  const multipliers = (settings.colorGameMultiplier as { red: number; green: number; violet: number }) || { red: 2, green: 2, violet: 3 };

  for (const bet of bets) {
    const isWin = bet.color === result;
    const multiplier = multipliers[result] || 2;
    const winAmount = isWin ? bet.amount * multiplier : 0;

    await updateDoc(doc(db, 'gameBets', bet.id), {
      result: isWin ? 'win' : 'loss',
      winAmount,
    });

    if (isWin) {
      await updateDoc(doc(db, 'users', bet.userId), {
        walletBalance: increment(winAmount),
        winningAmount: increment(winAmount),
        totalPoints: increment(winAmount),
        totalWins: increment(1),
        totalGamesPlayed: increment(1),
      });
      await addTransaction(bet.userId, 'game_win', winAmount, `Won ${bet.color} prediction - Round #${roundId.slice(-4)}`);
    } else {
      await updateDoc(doc(db, 'users', bet.userId), {
        totalGamesPlayed: increment(1),
      });
      await addTransaction(bet.userId, 'game_loss', -bet.amount, `Lost ${bet.color} prediction - Round #${roundId.slice(-4)}`);
    }
  }

  await updateDoc(doc(db, 'gameRounds', roundId), {
    status: 'completed',
    endTime: new Date().toISOString(),
  });

  return result;
};

export const getRecentRounds = async (limitCount: number = 10): Promise<GameRound[]> => {
  const q = query(
    collection(db, 'gameRounds'),
    where('status', '==', 'completed'),
    orderBy('startTime', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as GameRound);
};

export const getUserBets = async (userId: string): Promise<GameBet[]> => {
  const q = query(
    collection(db, 'gameBets'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as GameBet);
};

export const subscribeToRound = (
  roundId: string,
  callback: (round: GameRound) => void
): (() => void) => {
  return onSnapshot(doc(db, 'gameRounds', roundId), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as GameRound);
    }
  });
};
