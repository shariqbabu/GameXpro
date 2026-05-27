// src/services/ludoService.ts
// Drop-in Firebase service for Ludo online matchmaking + wallet

import {
  doc, collection, getDoc, setDoc, updateDoc,
  onSnapshot, runTransaction, serverTimestamp,
  query, where, getDocs, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config'; // ← your existing config path

// ─── Types ────────────────────────────────────────────────────────────────────

export type GotiPos = [number, number, number, number]; // -1=home, 0..51=board

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
  currentTurn: string;        // uid of player whose turn it is
  player1: LudoPlayer;        // created the game
  player2: LudoPlayer | null; // joined the game
  lastDice: number;
  timeLeft: number;
  winnerId: string | null;
  prizeSettled: boolean;
  createdAt: unknown;
  startedAt: unknown;
  finishedAt: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_CUT = 0.05;   // 5% platform fee
const GAME_DURATION = 300;   // 5 minutes

// ─── Wallet Helpers ───────────────────────────────────────────────────────────

// Deduct entry fee — uses Firestore transaction to prevent race conditions
export async function deductWallet(uid: string, amount: number, gameId: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const txRef   = doc(collection(db, 'transactions'));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error('User not found');
    const balance: number = snap.data().walletBalance ?? 0;
    if (balance < amount) throw new Error('Insufficient balance');

    tx.update(userRef, { walletBalance: balance - amount });
    tx.set(txRef, {
      uid,
      amount: -amount,
      type: 'game_entry',
      gameId,
      description: `Ludo entry fee ₹${amount}`,
      createdAt: serverTimestamp(),
    });
  });
}

// Credit prize to winner
export async function creditWallet(uid: string, amount: number, gameId: string, type = 'game_win'): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const txRef   = doc(collection(db, 'transactions'));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error('User not found');
    const balance: number = snap.data().walletBalance ?? 0;

    tx.update(userRef, { walletBalance: Number(balance) + Number(amount) });
    tx.set(txRef, {
  userId: uid,
  amount,
  type,
  gameId,
  description:
    type === 'game_win'
      ? `Ludo prize ₹${amount}`
      : `Ludo refund ₹${amount}`,
  createdAt: Timestamp.now(),
});
  });
}

// ─── Matchmaking ──────────────────────────────────────────────────────────────

// Join queue — if someone is already waiting, create the game immediately
// Returns: { gameId, role: 'player1' | 'player2' }
export async function joinMatchmaking(
  uid: string,
  name: string,
  entryFee: number
): Promise<{ gameId: string; role: 'player1' | 'player2' }> {

  // Look for a waiting player with the same entry fee (not yourself, not stale >60s)
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
    // ── Match found ──
    const opponentDoc = waiting[0];
    const opponent    = opponentDoc.data();
    const gameId      = doc(collection(db, 'games')).id;
    const prize       = Math.floor(entryFee * 2 * (1 - PLATFORM_CUT));

    // Deduct fees from both
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
      currentTurn: opponent.uid,  // player1 goes first
      player1: p1, player2: p2,
      lastDice: 0, timeLeft: GAME_DURATION,
      winnerId: null, prizeSettled: false,
      createdAt: serverTimestamp(),
      startedAt: serverTimestamp(),
      finishedAt: null,
    };

    await setDoc(doc(db, 'games', gameId), gameData);
    await deleteDoc(opponentDoc.ref); // remove opponent from queue

    return { gameId, role: 'player2' };

  } else {
    // ── No opponent yet — join queue ──
    // Deduct fee now; refund if no match in 60s (handled by cancelMatchmaking)
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

// Cancel matchmaking and refund
export async function cancelMatchmaking(uid: string, entryFee: number): Promise<void> {
  const ref  = doc(db, 'matchmaking', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const { placeholderGameId } = snap.data();
  await deleteDoc(ref);
  await creditWallet(uid, entryFee, placeholderGameId, 'game_refund');
}

// Listen until this uid appears in an in_progress game as player1 or player2
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

// ─── Live Game ────────────────────────────────────────────────────────────────

export function listenToGame(gameId: string, onUpdate: (g: LudoGameDoc) => void): () => void {
  return onSnapshot(doc(db, 'games', gameId), (snap) => {
    if (snap.exists()) onUpdate(snap.data() as LudoGameDoc);
  });
}

// Submit dice roll — only currentTurn player can call this
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

    // Move goti: 6 brings one home piece out, else advance first active piece
    const activeIdx = gotiPos.findIndex(p => p >= 0);
    const homeIdx   = gotiPos.findIndex(p => p === -1);

    if (diceVal === 6 && homeIdx >= 0) {
      gotiPos[homeIdx] = 0;
    } else if (activeIdx >= 0) {
      gotiPos[activeIdx] = (gotiPos[activeIdx] + diceVal) % 52;
    }
    player.gotiPos = gotiPos;

    const extraTurn  = diceVal === 6;
    const opponent   = isP1 ? game.player2! : game.player1;
    const nextTurn   = extraTurn ? uid : opponent.uid;

    tx.update(ref, {
      [pKey]: player,
      currentTurn: nextTurn,
      lastDice: diceVal,
    });
  });
}

// Tick timer — called by BOTH clients every second, safe to call concurrently
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
                     : p2s > p1s ? game.player2!.uid
                     : null; // draw
      tx.update(ref, { timeLeft: 0, status: 'finished', winnerId, finishedAt: serverTimestamp() });
    } else {
      tx.update(ref, { timeLeft: newTime });
    }
  });
}

// Forfeit — opponent wins instantly
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

// Settle prize — call once when game finishes
// ⚠️  Move to Firebase Cloud Function in production for security
export async function settlePrize(game: LudoGameDoc): Promise<void> {
  if (game.prizeSettled) return;
  // Mark settled first (idempotency guard)
  await updateDoc(doc(db, 'games', game.gameId), { prizeSettled: true });

  if (game.winnerId) {
    await creditWallet(game.winnerId, game.prizePool, game.gameId, 'game_win');
  } else {
    // Draw — refund both minus platform cut
    const refAmt = Math.floor(game.entryFee * (1 - PLATFORM_CUT));
    await creditWallet(game.player1.uid, refAmt, game.gameId, 'game_refund');
    if (game.player2) await creditWallet(game.player2.uid, refAmt, game.gameId, 'game_refund');
  }
}
