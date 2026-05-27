// src/services/ludoService.ts

import {
  doc, collection, getDoc, setDoc, updateDoc,
  onSnapshot, runTransaction, serverTimestamp,
  query, where, getDocs, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export type GotiPos = [number, number, number, number];

export interface LudoPlayer {
  uid: string;
  name: string;
  color: 'red' | 'blue';
  gotiPos: GotiPos;
  score: number;
  rolls: number;
}

export interface LudoGameDoc {
  gameId: string;
  entryFee: number;
  prizePool: number;
  status: 'in_progress' | 'finished';
  currentTurn: string;
  player1: LudoPlayer;
  player2: LudoPlayer | null;
  lastDice: number;
  timeLeft: number;
  winnerId: string | null;
  prizeSettled: boolean;
  createdAt: unknown;
  startedAt: unknown;
  finishedAt: unknown | null;
}

const PLATFORM_CUT = 0.05;
const GAME_DURATION = 300;

// ─── Wallet Helpers ───────────────────────────────────────────────────────────

export async function deductWallet(uid: string, amount: number, gameId: string): Promise<void> {
  const walletRef = doc(db, 'wallets', uid); // ← wallets collection
  const txRef     = doc(collection(db, 'transactions'));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(walletRef);
    if (!snap.exists()) throw new Error('Wallet not found');

    const data     = snap.data();
    const winning  = data.winningBalance ?? 0;
    const deposit  = data.depositBalance ?? 0;
    const bonus    = data.bonusBalance   ?? 0;
    const total    = winning + deposit + bonus;

    if (total < amount) throw new Error('Insufficient balance');

    // Deduct priority: deposit → bonus → winning
    let remaining  = amount;
    let newDeposit = deposit;
    let newBonus   = bonus;
    let newWinning = winning;

    if (newDeposit >= remaining) {
      newDeposit -= remaining; remaining = 0;
    } else {
      remaining -= newDeposit; newDeposit = 0;
    }
    if (remaining > 0) {
      if (newBonus >= remaining) {
        newBonus -= remaining; remaining = 0;
      } else {
        remaining -= newBonus; newBonus = 0;
      }
    }
    if (remaining > 0) {
      newWinning -= remaining;
    }

    tx.update(walletRef, {
      winningBalance: newWinning,
      depositBalance: newDeposit,
      bonusBalance:   newBonus,
      totalBalance:   newWinning + newDeposit + newBonus,
      updatedAt:      serverTimestamp(),
    });

    tx.set(txRef, {
      userId: uid,
      amount: -amount,
      type: 'game_entry',
      gameId,
      description: `Ludo entry fee ₹${amount}`,
      createdAt: serverTimestamp(),
    });
  });
}

export async function creditWallet(
  uid: string,
  amount: number,
  gameId: string,
  type = 'game_win'
): Promise<void> {
  const walletRef = doc(db, 'wallets', uid); // ← wallets collection
  const txRef     = doc(collection(db, 'transactions'));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(walletRef);
    if (!snap.exists()) throw new Error('Wallet not found');

    const data       = snap.data();
    const winning    = data.winningBalance ?? 0;
    const deposit    = data.depositBalance ?? 0;
    const bonus      = data.bonusBalance   ?? 0;

    // Prize aur refund → winningBalance mein jaata hai
    const newWinning = winning + amount;

    tx.update(walletRef, {
      winningBalance: newWinning,
      totalBalance:   newWinning + deposit + bonus,
      updatedAt:      serverTimestamp(),
    });

    tx.set(txRef, {
      userId: uid,
      amount,
      type,
      gameId,
      description:
        type === 'game_win'
          ? `Ludo prize ₹${amount}`
          : `Ludo refund ₹${amount}`,
      createdAt: serverTimestamp(),
    });
  });
}

// ─── Matchmaking ──────────────────────────────────────────────────────────────

export async function joinMatchmaking(
  uid: string,
  name: string,
  entryFee: number
): Promise<{ gameId: string; role: 'player1' | 'player2' }> {

  const mmQuery = query(
    collection(db, 'matchmaking'),
    where('entryFee', '==', entryFee)
  );
  const snap = await getDocs(mmQuery);
  const now  = Date.now();

  const waiting = snap.docs.filter(d => {
    const data = d.data();
    if (data.uid === uid) return false;
    const joinedMs = data.joinedAt?.toMillis?.() ?? 0;
    return (now - joinedMs) < 60_000;
  });

  if (waiting.length > 0) {
    const opponentDoc = waiting[0];
    const opponent    = opponentDoc.data();
    const gameId      = doc(collection(db, 'games')).id;
    const prize       = Math.floor(entryFee * 2 * (1 - PLATFORM_CUT));

    await deductWallet(opponent.uid, entryFee, gameId);
    await deductWallet(uid, entryFee, gameId);

    const p1: LudoPlayer = {
      uid: opponent.uid, name: opponent.name, color: 'red',
      gotiPos: [-1, -1, -1, -1], score: 0, rolls: 0,
    };
    const p2: LudoPlayer = {
      uid, name, color: 'blue',
      gotiPos: [-1, -1, -1, -1], score: 0, rolls: 0,
    };

    const gameData: LudoGameDoc = {
      gameId, entryFee, prizePool: prize,
      status: 'in_progress',
      currentTurn: opponent.uid,
      player1: p1, player2: p2,
      lastDice: 0, timeLeft: GAME_DURATION,
      winnerId: null, prizeSettled: false,
      createdAt: serverTimestamp(),
      startedAt: serverTimestamp(),
      finishedAt: null,
    };

    await setDoc(doc(db, 'games', gameId), gameData);
    await deleteDoc(opponentDoc.ref);

    return { gameId, role: 'player2' };

  } else {
    const placeholderGameId = doc(collection(db, 'games')).id;
    await deductWallet(uid, entryFee, placeholderGameId);

    await setDoc(doc(db, 'matchmaking', uid), {
      uid, name, entryFee,
      placeholderGameId,
      joinedAt: serverTimestamp(),
    });

    return { gameId: placeholderGameId, role: 'player1' };
  }
}

export async function cancelMatchmaking(uid: string, entryFee: number): Promise<void> {
  const ref  = doc(db, 'matchmaking', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const { placeholderGameId } = snap.data();
  await deleteDoc(ref);
  await creditWallet(uid, entryFee, placeholderGameId, 'game_refund');
}

export function listenForMatch(
  uid: string,
  onMatched: (gameId: string, role: 'player1' | 'player2') => void
): () => void {
  const ref = collection(db, 'games');

  const unsub1 = onSnapshot(
    query(ref, where('player1.uid', '==', uid), where('status', '==', 'in_progress')),
    (snap) => { if (!snap.empty) onMatched(snap.docs[0].id, 'player1'); }
  );
  const unsub2 = onSnapshot(
    query(ref, where('player2.uid', '==', uid), where('status', '==', 'in_progress')),
    (snap) => { if (!snap.empty) onMatched(snap.docs[0].id, 'player2'); }
  );

  return () => { unsub1(); unsub2(); };
}

export function listenToGame(gameId: string, onUpdate: (g: LudoGameDoc) => void): () => void {
  return onSnapshot(doc(db, 'games', gameId), (snap) => {
    if (snap.exists()) onUpdate(snap.data() as LudoGameDoc);
  });
}

export async function submitRoll(gameId: string, uid: string, diceVal: number): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref  = doc(db, 'games', gameId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Game not found');

    const game = snap.data() as LudoGameDoc;
    if (game.status !== 'in_progress') throw new Error('Game not active');
    if (game.currentTurn !== uid)      throw new Error('Not your turn');

    const isP1    = game.player1.uid === uid;
    const pKey    = isP1 ? 'player1' : 'player2';
    const player  = { ...(isP1 ? game.player1 : game.player2!) };
    const gotiPos = [...player.gotiPos] as GotiPos;

    player.score += diceVal;
    player.rolls += 1;

    const activeIdx = gotiPos.findIndex(p => p >= 0);
    const homeIdx   = gotiPos.findIndex(p => p === -1);

    if (diceVal === 6 && homeIdx >= 0) {
      gotiPos[homeIdx] = 0;
    } else if (activeIdx >= 0) {
      gotiPos[activeIdx] = (gotiPos[activeIdx] + diceVal) % 52;
    }
    player.gotiPos = gotiPos;

    const extraTurn = diceVal === 6;
    const opponent  = isP1 ? game.player2! : game.player1;
    const nextTurn  = extraTurn ? uid : opponent.uid;

    tx.update(ref, {
      [pKey]: player,
      currentTurn: nextTurn,
      lastDice: diceVal,
    });
  });
}

export async function tickTimer(gameId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref  = doc(db, 'games', gameId);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const game = snap.data() as LudoGameDoc;
    if (game.status !== 'in_progress') return;

    const newTime = Math.max(0, game.timeLeft - 1);

    if (newTime === 0) {
      const p1s = game.player1.score;
      const p2s = game.player2?.score ?? 0;
      const winnerId = p1s > p2s ? game.player1.uid
                     : p2s > p1s && game.player2 ? game.player2.uid
                     : null;
      tx.update(ref, { timeLeft: 0, status: 'finished', winnerId, finishedAt: serverTimestamp() });
    } else {
      tx.update(ref, { timeLeft: newTime });
    }
  });
}

export async function forfeitGame(gameId: string, uid: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref  = doc(db, 'games', gameId);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const game = snap.data() as LudoGameDoc;
    if (game.status !== 'in_progress') return;
    const winnerId = game.player1.uid === uid ? game.player2!.uid : game.player1.uid;
    tx.update(ref, { status: 'finished', winnerId, finishedAt: serverTimestamp() });
  });
}

// ─── settlePrize ─────────────────────────────────────────────────────────────

export async function settlePrize(game: LudoGameDoc): Promise<void> {
  const gameRef = doc(db, 'games', game.gameId);

  let alreadySettled = false;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(gameRef);
    if (!snap.exists()) throw new Error('Game not found');
    const fresh = snap.data() as LudoGameDoc;

    if (fresh.prizeSettled) {
      alreadySettled = true;
      return;
    }

    tx.update(gameRef, { prizeSettled: true });
  });

  if (alreadySettled) return;

  try {
    if (game.winnerId) {
      await creditWallet(game.winnerId, game.prizePool, game.gameId, 'game_win');
    } else {
      const refAmt = Math.floor(game.entryFee * (1 - PLATFORM_CUT));
      await creditWallet(game.player1.uid, refAmt, game.gameId, 'game_refund');
      if (game.player2) {
        await creditWallet(game.player2.uid, refAmt, game.gameId, 'game_refund');
      }
    }
  } catch (err) {
    await updateDoc(gameRef, { prizeSettled: false }).catch(() => {});
    throw err;
  }
}
