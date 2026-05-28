// ============================================================
// GAME SERVICE - REALTIME MULTIPLAYER GAMES
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { GameRoom, RoomPlayer, DiceRound, ColorRound, DiceBet, ColorBet } from '../types';
import { deductBetAmount, addWinAmount } from './walletService';

// ══════════════════════════════════════════════════════════════
// CARD CASINO GAME
// ══════════════════════════════════════════════════════════════

const CARD_BET_AMOUNT = 50;

// ─── Join or Create Room ──────────────────────────────────────
export async function joinCardRoom(uid: string, userName: string): Promise<string> {
  // Check if user is already in a room
  const existingQuery = query(
    collection(db, 'rooms'),
    where('status', 'in', ['waiting', 'playing'])
  );
  const existingSnap = await getDocs(existingQuery);

  for (const roomDoc of existingSnap.docs) {
    const room = roomDoc.data() as GameRoom;
    const isInRoom = room.players.some((p) => p.uid === uid);
    if (isInRoom) {
      return roomDoc.id; // Already in a room
    }
  }

  // Find a waiting room
  const waitingQuery = query(
    collection(db, 'rooms'),
    where('status', '==', 'waiting'),
    orderBy('createdAt', 'asc'),
    limit(1)
  );
  const waitingSnap = await getDocs(waitingQuery);

  let roomId: string;

  if (!waitingSnap.empty) {
    const waitingRoom = waitingSnap.docs[0];
    const roomData = waitingRoom.data() as GameRoom;

    // Don't join if room already has 2 players
    if (roomData.players.length >= 2) {
      roomId = await createNewCardRoom(uid, userName);
    } else {
      roomId = waitingRoom.id;
      // Join existing room
      const player: RoomPlayer = {
        uid,
        name: userName,
        ready: false,
      };

      await runTransaction(db, async (tx) => {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await tx.get(roomRef);
        if (!roomSnap.exists()) throw new Error('Room not found');

        const room = roomSnap.data() as GameRoom;
        if (room.players.length >= 2) throw new Error('Room full');
        if (room.players.some((p) => p.uid === uid)) return; // Already joined

        // Deduct bet
        const deducted = await deductBetAmount(uid, CARD_BET_AMOUNT, 'Card Casino Game bet');
        if (!deducted) throw new Error('Insufficient balance');

        const updatedPlayers = [...room.players, player];
        tx.update(roomRef, {
          players: updatedPlayers,
          status: updatedPlayers.length === 2 ? 'playing' : 'waiting',
        });
      });

      // If room is now playing, assign cards and determine winner
      const updatedRoom = await getDoc(doc(db, 'rooms', roomId));
      if (updatedRoom.data()?.status === 'playing') {
        await playCardGame(roomId);
      }
    }
  } else {
    roomId = await createNewCardRoom(uid, userName);
  }

  return roomId;
}

async function createNewCardRoom(uid: string, userName: string): Promise<string> {
  const deducted = await deductBetAmount(uid, CARD_BET_AMOUNT, 'Card Casino Game bet');
  if (!deducted) throw new Error('Insufficient balance');

  const roomRef = doc(collection(db, 'rooms'));
  const player: RoomPlayer = { uid, name: userName, ready: false };

  await setDoc(roomRef, {
    roomId: roomRef.id,
    status: 'waiting',
    players: [player],
    winner: '',
    betAmount: CARD_BET_AMOUNT,
    createdAt: serverTimestamp(),
  });

  return roomRef.id;
}

// ─── Play Card Game ───────────────────────────────────────────
async function playCardGame(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;

  const room = roomSnap.data() as GameRoom;
  if (room.players.length < 2) return;

  // Assign random cards (1-13)
  const card1 = Math.floor(Math.random() * 13) + 1;
  const card2 = Math.floor(Math.random() * 13) + 1;

  const suits = ['♠', '♥', '♦', '♣'];
  const suit1 = suits[Math.floor(Math.random() * 4)];
  const suit2 = suits[Math.floor(Math.random() * 4)];

  const players = room.players.map((p, i) => ({
    ...p,
    card: i === 0 ? card1 : card2,
    cardSuit: i === 0 ? suit1 : suit2,
    ready: true,
  }));

  let winnerUid = '';
  if (card1 > card2) {
    winnerUid = room.players[0].uid;
  } else if (card2 > card1) {
    winnerUid = room.players[1].uid;
  }
  // Draw = no winner, both lose

  await updateDoc(roomRef, { players, winner: winnerUid, status: 'finished' });

  // Award winner
  if (winnerUid) {
    const winAmount = CARD_BET_AMOUNT * 2 * 0.95; // 5% house edge
    await addWinAmount(winnerUid, winAmount, 'Card Casino Game win');
  }

  // Update game stats for all players
  for (const player of room.players) {
    const userRef = doc(db, 'users', player.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        totalPlayed: (userSnap.data().totalPlayed || 0) + 1,
      });
    }
  }
}

// ─── Subscribe Room ────────────────────────────────────────────
export function subscribeRoom(roomId: string, callback: (room: GameRoom | null) => void) {
  return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as GameRoom);
    } else {
      callback(null);
    }
  });
}

// ──────────────────────────────────────────────────────────────
// DICE EVEN/ODD GAME
// ──────────────────────────────────────────────────────────────

// ─── Place Dice Bet ────────────────────────────────────────────
export async function placeDiceBet(
  uid: string,
  userName: string,
  bet: DiceBet,
  amount: number
): Promise<string> {
  if (amount < 10) throw new Error('Minimum bet is ₹10');

  // Check existing active round
  const activeQuery = query(
    collection(db, 'gameRounds'),
    where('status', '==', 'betting'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const activeSnap = await getDocs(activeQuery);

  let roundId: string;

  if (!activeSnap.empty) {
    roundId = activeSnap.docs[0].id;
    const round = activeSnap.docs[0].data() as DiceRound;

    // Check if user already bet in this round
    if (round.players.some((p) => p.uid === uid)) {
      throw new Error('You already placed a bet in this round');
    }

    // Deduct bet
    const deducted = await deductBetAmount(uid, amount, `Dice Game bet - ${bet}`);
    if (!deducted) throw new Error('Insufficient balance');

    // Add player to round
    await runTransaction(db, async (tx) => {
      const roundRef = doc(db, 'gameRounds', roundId);
      const roundSnap = await tx.get(roundRef);
      if (!roundSnap.exists()) throw new Error('Round not found');

      const roundData = roundSnap.data() as DiceRound;
      const player = { uid, name: userName, bet, amount };
      tx.update(roundRef, {
        players: [...roundData.players, player],
        betAmount: (roundData.betAmount || 0) + amount,
      });
    });
  } else {
    // Create new round
    const deducted = await deductBetAmount(uid, amount, `Dice Game bet - ${bet}`);
    if (!deducted) throw new Error('Insufficient balance');

    const roundRef = doc(collection(db, 'gameRounds'));
    roundId = roundRef.id;

    await setDoc(roundRef, {
      roomId: roundId,
      players: [{ uid, name: userName, bet, amount }],
      dice1: 0,
      dice2: 0,
      total: 0,
      result: '',
      winnerUids: [],
      betAmount: amount,
      status: 'betting',
      createdAt: serverTimestamp(),
    });

    // Auto-roll after 15 seconds
    setTimeout(() => rollDice(roundId), 15000);
  }

  return roundId;
}

// ─── Roll Dice ─────────────────────────────────────────────────
export async function rollDice(roundId: string): Promise<void> {
  const roundRef = doc(db, 'gameRounds', roundId);
  const roundSnap = await getDoc(roundRef);

  if (!roundSnap.exists()) return;

  const round = roundSnap.data() as DiceRound;
  if (round.status !== 'betting') return;

  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const total = dice1 + dice2;
  const result: DiceBet = total % 2 === 0 ? 'even' : 'odd';

  const winners = round.players.filter((p) => p.bet === result);

  await updateDoc(roundRef, {
    dice1,
    dice2,
    total,
    result,
    winnerUids: winners.map((w) => w.uid),
    status: 'finished',
  });

  // Award winners (1.9x bet)
  for (const winner of winners) {
    await addWinAmount(winner.uid, winner.amount * 1.9, `Dice Game win - ${result}`);
  }

  // Update stats
  for (const player of round.players) {
    const userRef = doc(db, 'users', player.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        totalPlayed: (userSnap.data().totalPlayed || 0) + 1,
      });
    }
  }
}

// ─── Subscribe Dice Rounds ─────────────────────────────────────
export function subscribeDiceRounds(callback: (rounds: DiceRound[]) => void, limitCount = 10) {
  const q = query(
    collection(db, 'gameRounds'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DiceRound)));
  });
}

// ──────────────────────────────────────────────────────────────
// COLOR PREDICTION GAME
// ──────────────────────────────────────────────────────────────

const COLOR_ROUND_DURATION = 30; // seconds

// ─── Get or Create Active Color Round ─────────────────────────
export async function getOrCreateColorRound(): Promise<string> {
  const activeQuery = query(
    collection(db, 'colorRounds'),
    where('status', '==', 'betting'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(activeQuery);

  if (!snap.empty) {
    return snap.docs[0].id;
  }

  // Create new round
  const roundRef = doc(collection(db, 'colorRounds'));
  const now = Timestamp.now();
  const endTime = Timestamp.fromMillis(now.toMillis() + COLOR_ROUND_DURATION * 1000);

  await setDoc(roundRef, {
    roundId: roundRef.id,
    result: '',
    players: [],
    totalBet: 0,
    status: 'betting',
    startTime: now,
    endTime,
    createdAt: serverTimestamp(),
  });

  // Auto-reveal after duration
  setTimeout(() => revealColorResult(roundRef.id), COLOR_ROUND_DURATION * 1000);

  return roundRef.id;
}

// ─── Place Color Bet ───────────────────────────────────────────
export async function placeColorBet(
  uid: string,
  userName: string,
  bet: ColorBet,
  amount: number,
  roundId: string
): Promise<void> {
  if (amount < 10) throw new Error('Minimum bet is ₹10');

  const roundRef = doc(db, 'colorRounds', roundId);
  const roundSnap = await getDoc(roundRef);

  if (!roundSnap.exists()) throw new Error('Round not found');

  const round = roundSnap.data() as ColorRound;

  if (round.status !== 'betting') throw new Error('Betting is closed');
  if (round.players.some((p) => p.uid === uid)) {
    throw new Error('You already bet in this round');
  }

  const deducted = await deductBetAmount(uid, amount, `Color Game bet - ${bet}`);
  if (!deducted) throw new Error('Insufficient balance');

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(roundRef);
    if (!snap.exists()) throw new Error('Round not found');
    const roundData = snap.data() as ColorRound;

    tx.update(roundRef, {
      players: [...roundData.players, { uid, name: userName, bet, amount }],
      totalBet: (roundData.totalBet || 0) + amount,
    });
  });
}

// ─── Reveal Color Result ───────────────────────────────────────
export async function revealColorResult(roundId: string): Promise<void> {
  const roundRef = doc(db, 'colorRounds', roundId);
  const roundSnap = await getDoc(roundRef);

  if (!roundSnap.exists()) return;

  const round = roundSnap.data() as ColorRound;
  if (round.status !== 'betting') return;

  // Random result with weighted probability
  const rand = Math.random();
  let result: ColorBet;
  if (rand < 0.4) result = 'red';
  else if (rand < 0.8) result = 'green';
  else result = 'violet';

  await updateDoc(roundRef, { result, status: 'finished' });

  // Award winners
  const multipliers: Record<ColorBet, number> = {
    red: 2,
    green: 2,
    violet: 4.5,
  };

  const winners = round.players.filter((p) => p.bet === result);

  for (const winner of winners) {
    const winAmount = winner.amount * multipliers[result] * 0.95; // 5% house edge
    await addWinAmount(winner.uid, winAmount, `Color Game win - ${result}`);
  }

  // Update stats
  for (const player of round.players) {
    const userRef = doc(db, 'users', player.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        totalPlayed: (userSnap.data().totalPlayed || 0) + 1,
      });
    }
  }

  // Create next round after 5 seconds
  setTimeout(() => getOrCreateColorRound(), 5000);
}

// ─── Subscribe Color Rounds ────────────────────────────────────
export function subscribeColorRounds(callback: (rounds: ColorRound[]) => void, limitCount = 10) {
  const q = query(
    collection(db, 'colorRounds'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ColorRound)));
  });
}
