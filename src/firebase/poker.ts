// services/poker.ts
import {
  doc, collection, addDoc, updateDoc,
  onSnapshot, runTransaction, serverTimestamp,
  query, where, orderBy, getDocs, getDoc, limit
} from 'firebase/firestore';
import { db } from './config';
import { addFunds, deductFunds } from './wallet';
import { createDeck, shuffleDeck } from '../utils/helpers';

interface PokerPlayer {
  uid: string;
  name: string;
  photoURL: string;
  chips: number;
  cards: any[];
  currentBet: number;
  action: string | null;
  isFolded: boolean;
  isReady: boolean;
}

// ===================== JOIN POKER MATCHMAKING =====================
export const joinPokerQueue = async (
  uid: string,
  userName: string,
  photoURL: string,
  entryFee: number
): Promise<string> => {
  // Already waiting hai kya
  const existingQ = query(
    collection(db, 'pokerQueue'),
    where('uid', '==', uid),
    where('status', '==', 'WAITING')
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    return existingSnap.docs[0].id;
  }

  // Entry fee deduct karo
  await deductFunds(uid, entryFee, 'GAME_BET', `Poker entry fee ₹${entryFee}`);

  const qRef = await addDoc(collection(db, 'pokerQueue'), {
    uid,
    userName,
    photoURL: photoURL || '',
    entryFee,
    status: 'WAITING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return qRef.id;
};

export const cancelPokerQueue = async (
  queueId: string,
  uid: string,
  entryFee: number
) => {
  await updateDoc(doc(db, 'pokerQueue', queueId), {
    status: 'CANCELLED',
    updatedAt: serverTimestamp(),
  });
  // Refund
  await addFunds(uid, entryFee, 'winningBalance', 'Poker queue cancelled - refund');
};

export const subscribePokerQueue = (
  queueId: string,
  callback: (entry: any) => void
) => {
  return onSnapshot(doc(db, 'pokerQueue', queueId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
};

// ===================== FIND MATCH & CREATE ROOM =====================
export const findPokerMatch = async (
  uid: string,
  queueId: string,
  entryFee: number
): Promise<string | null> => {
  const q = query(
    collection(db, 'pokerQueue'),
    where('status', '==', 'WAITING'),
    where('entryFee', '==', entryFee),
    orderBy('createdAt', 'asc'),
    limit(10)
  );

  const snap = await getDocs(q);
  const allWaiting = snap.docs;

  const myEntry = allWaiting.find((d) => d.id === queueId);
  if (!myEntry) return null;

  const others = allWaiting.filter((d) => d.data().uid !== uid);
  if (others.length === 0) return null;

  const myCreatedAt = myEntry.data().createdAt?.toMillis?.() ?? 0;
  const opponent = others[0];
  const opponentCreatedAt = opponent.data().createdAt?.toMillis?.() ?? 0;

  // Pehle wala wait karta hai, baad wala room banata hai
  if (myCreatedAt <= opponentCreatedAt) return null;

  // Deck banao aur cards deal karo
  const newDeck = shuffleDeck(createDeck());
  
  // Player cards
  const p1Cards = [
    { ...newDeck[0], faceDown: false },
    { ...newDeck[1], faceDown: false }
  ];
  const p2Cards = [
    { ...newDeck[2], faceDown: true },
    { ...newDeck[3], faceDown: true }
  ];
  
  // Remaining deck (community cards ke liye)
  const remainingDeck = newDeck.slice(4);

  const roomRef = doc(collection(db, 'pokerRooms'));
  const roomId = roomRef.id;

  try {
    await runTransaction(db, async (tx) => {
      const myQueueRef = doc(db, 'pokerQueue', queueId);
      const opponentQueueRef = doc(db, 'pokerQueue', opponent.id);

      const [mySnap, oppSnap] = await Promise.all([
        tx.get(myQueueRef),
        tx.get(opponentQueueRef),
      ]);

      if (!mySnap.exists() || !oppSnap.exists()) {
        throw new Error('Queue entry not found');
      }
      if (
        mySnap.data().status !== 'WAITING' ||
        oppSnap.data().status !== 'WAITING'
      ) {
        throw new Error('Already matched');
      }

      const myData = mySnap.data();
      const oppData = oppSnap.data();

      // Opponent = player1 (pehle aaya), Me = player2
      const player1: PokerPlayer = {
        uid: oppData.uid,
        name: oppData.userName,
        photoURL: oppData.photoURL || '',
        chips: 5000,
        cards: p1Cards,
        currentBet: 50, // Big blind
        action: null,
        isFolded: false,
        isReady: true,
      };

      const player2: PokerPlayer = {
        uid: myData.uid,
        name: myData.userName,
        photoURL: myData.photoURL || '',
        chips: 5000,
        cards: p2Cards,
        currentBet: 25, // Small blind
        action: null,
        isFolded: false,
        isReady: true,
      };

      tx.set(roomRef, {
        roomId,
        entryFee,
        status: 'PLAYING',
        phase: 'pre-flop',
        pot: 75, // SB + BB
        player1,
        player2,
        communityCards: [],
        deck: remainingDeck,
        currentTurn: oppData.uid, // Player1 pehle khelta hai
        winner: null,
        winnerName: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.update(myQueueRef, {
        status: 'MATCHED',
        roomId,
        updatedAt: serverTimestamp(),
      });
      tx.update(opponentQueueRef, {
        status: 'MATCHED',
        roomId,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err: any) {
    if (err.message === 'Already matched') return null;
    throw err;
  }

  return roomId;
};

// ===================== SUBSCRIBE ROOM =====================
export const subscribePokerRoom = (
  roomId: string,
  callback: (room: any) => void
) => {
  return onSnapshot(doc(db, 'pokerRooms', roomId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
};

// ===================== PLAYER ACTION =====================
export const performPokerAction = async (
  roomId: string,
  uid: string,
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in',
  raiseAmount?: number
) => {
  const roomRef = doc(db, 'pokerRooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');

  const room = roomSnap.data();
  if (room.currentTurn !== uid) throw new Error('Not your turn');

  const isPlayer1 = room.player1.uid === uid;
  const myKey = isPlayer1 ? 'player1' : 'player2';
  const opponentKey = isPlayer1 ? 'player2' : 'player1';

  const myData = room[myKey];
  const opponentData = room[opponentKey];
  const bigBlind = 50;

  let updatedMe = { ...myData };
  let newPot = room.pot;
  let shouldProgress = false;

  switch (action) {
    case 'fold':
      updatedMe.isFolded = true;
      updatedMe.action = 'fold';
      shouldProgress = true;
      break;

    case 'check':
      updatedMe.action = 'check';
      shouldProgress = true;
      break;

    case 'call':
      const callAmount = bigBlind;
      updatedMe.chips -= callAmount;
      updatedMe.currentBet += callAmount;
      updatedMe.action = 'call';
      newPot += callAmount;
      shouldProgress = true;
      break;

    case 'raise':
      const rAmount = raiseAmount || bigBlind * 2;
      updatedMe.chips -= rAmount;
      updatedMe.currentBet += rAmount;
      updatedMe.action = 'raise';
      newPot += rAmount;
      break;

    case 'all-in':
      newPot += updatedMe.chips;
      updatedMe.currentBet += updatedMe.chips;
      updatedMe.action = 'all-in';
      updatedMe.chips = 0;
      shouldProgress = true;
      break;
  }

  // Agar player fold kiya
  if (action === 'fold') {
    await settlePokerGame(
      roomId,
      opponentData.uid,
      opponentData.name,
      room.entryFee,
      room.player1,
      room.player2
    );
    return;
  }

  // Next turn decide karo
  const nextTurn = opponentData.uid;

  // Kya phase progress karni chahiye?
  const bothActed = shouldProgress && 
    (opponentData.action !== null || action === 'all-in');

  if (bothActed) {
    await progressPokerPhase(roomId, room, updatedMe, myKey, newPot);
    return;
  }

  await updateDoc(roomRef, {
    [myKey]: updatedMe,
    pot: newPot,
    currentTurn: nextTurn,
    updatedAt: serverTimestamp(),
  });
};

// ===================== PROGRESS PHASE =====================
export const progressPokerPhase = async (
  roomId: string,
  room: any,
  updatedPlayer: any,
  playerKey: string,
  newPot: number
) => {
  const roomRef = doc(db, 'pokerRooms', roomId);
  
  const phaseOrder = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
  const currentIdx = phaseOrder.indexOf(room.phase);
  const nextPhase = phaseOrder[currentIdx + 1] || 'showdown';

  let communityCards = [...(room.communityCards || [])];
  const deck = room.deck || [];

  if (nextPhase === 'flop') {
    communityCards = [deck[0], deck[1], deck[2]];
  } else if (nextPhase === 'turn') {
    communityCards = [...communityCards, deck[3]];
  } else if (nextPhase === 'river') {
    communityCards = [...communityCards, deck[4]];
  } else if (nextPhase === 'showdown') {
    // Winner decide karo randomly (ya hand evaluation logic)
    const winnerId = Math.random() > 0.5 ? room.player1.uid : room.player2.uid;
    const winnerName = winnerId === room.player1.uid ? room.player1.name : room.player2.name;
    
    await settlePokerGame(
      roomId, winnerId, winnerName,
      room.entryFee, room.player1, room.player2
    );
    return;
  }

  // Reset actions for next phase
  const resetPlayer1 = { 
    ...room.player1, 
    action: null, 
    currentBet: 0,
    ...(playerKey === 'player1' ? updatedPlayer : {})
  };
  const resetPlayer2 = { 
    ...room.player2, 
    action: null, 
    currentBet: 0,
    ...(playerKey === 'player2' ? updatedPlayer : {})
  };

  await updateDoc(roomRef, {
    phase: nextPhase,
    communityCards,
    pot: newPot,
    player1: resetPlayer1,
    player2: resetPlayer2,
    currentTurn: room.player1.uid, // Player1 se shuru
    updatedAt: serverTimestamp(),
  });
};

// ===================== SETTLE GAME =====================
export const settlePokerGame = async (
  roomId: string,
  winnerId: string,
  winnerName: string,
  entryFee: number,
  player1: any,
  player2: any
) => {
  const roomRef = doc(db, 'pokerRooms', roomId);
  const platformFee = entryFee * 0.1;
  const payout = entryFee * 2 - platformFee;

  await addFunds(winnerId, payout, 'winningBalance', `Poker win - ₹${payout}`);

  await updateDoc(roomRef, {
    status: 'FINISHED',
    phase: 'showdown',
    winner: winnerId,
    winnerName,
    // Dono ke cards reveal karo
    'player1.cards': player1.cards.map((c: any) => ({ ...c, faceDown: false })),
    'player2.cards': player2.cards.map((c: any) => ({ ...c, faceDown: false })),
    updatedAt: serverTimestamp(),
  });
};
