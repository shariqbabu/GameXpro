// src/firebase/dragonTiger.ts

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';
import { addFunds, deductFunds } from './wallet';
import { DragonTigerBetType, DragonTigerCard, DragonTigerTable } from '../types';

// ===================== CARD HELPER =====================

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = [
  { value: 'A', numeric: 1 },
  { value: '2', numeric: 2 },
  { value: '3', numeric: 3 },
  { value: '4', numeric: 4 },
  { value: '5', numeric: 5 },
  { value: '6', numeric: 6 },
  { value: '7', numeric: 7 },
  { value: '8', numeric: 8 },
  { value: '9', numeric: 9 },
  { value: '10', numeric: 10 },
  { value: 'J', numeric: 11 },
  { value: 'Q', numeric: 12 },
  { value: 'K', numeric: 13 },
];

const getRandomCard = (): DragonTigerCard => {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const val = VALUES[Math.floor(Math.random() * VALUES.length)];
  return {
    suit,
    value: val.value,
    numericValue: val.numeric,
  };
};

// ===================== CREATE TABLE =====================

export const createDragonTigerTable = async (
  uid: string,
  username: string,
  tableName: string,
  minBet: number = 50,
  maxBet: number = 5000
): Promise<string> => {
  const ref = await addDoc(collection(db, 'dragonTigerTables'), {
    name: tableName,
    stage: 'betting',
    hostUid: uid,
    currentRound: 1,
    roundTimer: 30,
    pot: 0,
    minBet,
    maxBet,
    dragonCard: null,
    tigerCard: null,
    winner: null,
    bets: [],
    dragonTotal: 0,
    tigerTotal: 0,
    tieTotal: 0,
    players: [uid],
    spectators: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

// ===================== GET TABLES =====================

export const getActiveTables = (
  callback: (tables: DragonTigerTable[]) => void
) => {
  const q = query(
    collection(db, 'dragonTigerTables'),
    where('stage', 'in', ['betting', 'waiting', 'result']),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as DragonTigerTable))
    );
  });
};

// ===================== SUBSCRIBE TABLE =====================

export const subscribeDragonTigerTable = (
  tableId: string,
  callback: (table: DragonTigerTable | null) => void
) => {
  return onSnapshot(
    doc(db, 'dragonTigerTables', tableId),
    (snap) => {
      callback(
        snap.exists()
          ? ({ id: snap.id, ...snap.data() } as DragonTigerTable)
          : null
      );
    }
  );
};

// ===================== JOIN TABLE =====================

export const joinDragonTigerTable = async (
  tableId: string,
  uid: string
) => {
  const tableRef = doc(db, 'dragonTigerTables', tableId);
  const tableSnap = await getDoc(tableRef);
  if (!tableSnap.exists()) throw new Error('Table not found');

  const table = tableSnap.data() as DragonTigerTable;
  if (!table.players.includes(uid)) {
    await updateDoc(tableRef, {
      players: [...table.players, uid],
      updatedAt: serverTimestamp(),
    });
  }
};

// ===================== PLACE BET =====================

export const placeDragonTigerBet = async (
  tableId: string,
  uid: string,
  username: string,
  betType: DragonTigerBetType,
  amount: number
) => {
  const tableRef = doc(db, 'dragonTigerTables', tableId);
  const tableSnap = await getDoc(tableRef);
  if (!tableSnap.exists()) throw new Error('Table not found');

  const table = tableSnap.data() as DragonTigerTable;
  if (table.stage !== 'betting') throw new Error('Betting is closed');
  if (amount < table.minBet) {
    throw new Error(`Minimum bet is ₹${table.minBet}`);
  }
  if (amount > table.maxBet) {
    throw new Error(`Maximum bet is ₹${table.maxBet}`);
  }

  // Deduct funds
  await deductFunds(uid, amount, 'GAME_LOSS', `Dragon Tiger bet - ${betType}`);

  // Update table
  const newBet = { uid, username, betType, amount };
  const newBets = [...(table.bets || []), newBet];
  const newDragonTotal = betType === 'dragon'
    ? (table.dragonTotal || 0) + amount
    : (table.dragonTotal || 0);
  const newTigerTotal = betType === 'tiger'
    ? (table.tigerTotal || 0) + amount
    : (table.tigerTotal || 0);
  const newTieTotal = betType === 'tie'
    ? (table.tieTotal || 0) + amount
    : (table.tieTotal || 0);

  await updateDoc(tableRef, {
    bets: newBets,
    dragonTotal: newDragonTotal,
    tigerTotal: newTigerTotal,
    tieTotal: newTieTotal,
    pot: (table.pot || 0) + amount,
    updatedAt: serverTimestamp(),
  });
};

// ===================== REVEAL CARDS =====================

export const revealDragonTiger = async (tableId: string) => {
  const tableRef = doc(db, 'dragonTigerTables', tableId);
  const tableSnap = await getDoc(tableRef);
  if (!tableSnap.exists()) throw new Error('Table not found');

  const table = tableSnap.data() as DragonTigerTable;
  if (table.stage !== 'betting') return;

  const dragonCard = getRandomCard();
  const tigerCard = getRandomCard();

  let winner: DragonTigerBetType;
  if (dragonCard.numericValue > tigerCard.numericValue) {
    winner = 'dragon';
  } else if (tigerCard.numericValue > dragonCard.numericValue) {
    winner = 'tiger';
  } else {
    winner = 'tie';
  }

  // Update table with result
  await updateDoc(tableRef, {
    stage: 'result',
    dragonCard,
    tigerCard,
    winner,
    updatedAt: serverTimestamp(),
  });

  // Settle bets
  await settleDragonTigerBets(tableId, table, winner);

  // Start next round after 5 seconds
  setTimeout(async () => {
    await startNextRound(tableId, table.currentRound || 1);
  }, 5000);
};

// ===================== SETTLE BETS =====================

const settleDragonTigerBets = async (
  tableId: string,
  table: DragonTigerTable,
  winner: DragonTigerBetType
) => {
  const bets = table.bets || [];

  for (const bet of bets) {
    if (bet.betType === winner) {
      const multiplier = winner === 'tie' ? 8 : 2;
      const payout = bet.amount * multiplier;
      const platformFee = payout * 0.05;
      const finalPayout = payout - platformFee;

      await addFunds(
        bet.uid,
        finalPayout,
        'winningBalance',
        `Dragon Tiger win - ${winner} (₹${finalPayout})`
      );
    }
  }
};

// ===================== NEXT ROUND =====================

const startNextRound = async (
  tableId: string,
  currentRound: number
) => {
  await updateDoc(doc(db, 'dragonTigerTables', tableId), {
    stage: 'betting',
    currentRound: currentRound + 1,
    roundTimer: 30,
    dragonCard: null,
    tigerCard: null,
    winner: null,
    bets: [],
    dragonTotal: 0,
    tigerTotal: 0,
    tieTotal: 0,
    pot: 0,
    updatedAt: serverTimestamp(),
  });
};
