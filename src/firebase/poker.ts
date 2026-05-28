// src/firebase/poker.ts
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { addFunds, deductFunds } from './wallet';

// ===================== CARD HELPERS =====================

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type CardValue = 
  | 'A' | '2' | '3' | '4' | '5' | '6' | '7'
  | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface PokerCard {
  suit: Suit;
  value: CardValue;
  faceDown: boolean;
}

interface PokerPlayerData {
  uid: string;
  name: string;
  photoURL: string;
  chips: number;
  cards: PokerCard[];
  currentBet: number;
  action: string | null;
  isFolded: boolean;
  isReady: boolean;
}

const createPokerDeck = (): PokerCard[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values: CardValue[] = [
    'A', '2', '3', '4', '5', '6', '7',
    '8', '9', '10', 'J', 'Q', 'K',
  ];
  const deck: PokerCard[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value, faceDown: false });
    }
  }
  return deck;
};

const shufflePokerDeck = (deck: PokerCard[]): PokerCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ===================== JOIN QUEUE =====================

export const joinPokerQueue = async (
  uid: string,
  userName: string,
  photoURL: string,
  entryFee: number
): Promise<string> => {
  // Already waiting?
  const existingQ = query(
    collection(db, 'pokerQueue'),
    where('uid', '==', uid),
    where('status', '==', 'WAITING')
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    return existingSnap.docs[0].id;
  }

  // Entry fee deduct
  await deductFunds(
    uid,
    entryFee,
    'GAME_LOSS',          // ✅ valid TransactionType
    `Poker entry fee ₹${entryFee}`
  );

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

// ===================== CANCEL QUEUE =====================

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
  await addFunds(
    uid,
    entryFee,
    'winningBalance',     // ✅ valid type
    'Poker cancelled - refund'
  );
};

// ===================== SUBSCRIBE QUEUE =====================

export const subscribePokerQueue = (
  queueId: string,
  callback: (entry: any) => void
) => {
  return onSnapshot(
    doc(db, 'pokerQueue', queueId),
    (snap) => {
      callback(
        snap.exists() 
          ? { id: snap.id, ...snap.data() } 
          : null
      );
    }
  );
};

// ===================== FIND MATCH =====================

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

  // Pehle wala sirf wait karta hai
  if (myCreatedAt <= opponentCreatedAt) return null;

  // Deck + cards
  const newDeck = shufflePokerDeck(createPokerDeck());

  const p1Cards: PokerCard[] = [
    { ...newDeck[0], faceDown: false },
    { ...newDeck[1], faceDown: false },
  ];
  const p2Cards: PokerCard[] = [
    { ...newDeck[2], faceDown: true },
    { ...newDeck[3], faceDown: true },
  ];
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

      const player1: PokerPlayerData = {
        uid: oppData.uid,
        name: oppData.userName,
        photoURL: oppData.photoURL || '',
        chips: 5000,
        cards: p1Cards,
        currentBet: 50,
        action: null,
        isFolded: false,
        isReady: true,
      };

      const player2: PokerPlayerData = {
        uid: myData.uid,
        name: myData.userName,
        photoURL: myData.photoURL || '',
        chips: 5000,
        cards: p2Cards,
        currentBet: 25,
        action: null,
        isFolded: false,
        isReady: true,
      };

      tx.set(roomRef, {
        roomId,
        entryFee,
        status: 'PLAYING',
        phase: 'pre-flop',
        pot: 75,
        player1,
        player2,
        communityCards: [],
        deck: remainingDeck,
        currentTurn: oppData.uid,
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
  return onSnapshot(
    doc(db, 'pokerRooms', roomId),
    (snap) => {
      callback(
        snap.exists() 
          ? { id: snap.id, ...snap.data() } 
          : null
      );
    }
  );
};

// ===================== PERFORM ACTION =====================

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

  const myData = { ...room[myKey] };
  const opponentData = room[opponentKey];
  const bigBlind = 50;
  let newPot = room.pot;
  let shouldProgress = false;

  switch (action) {
    case 'fold':
      myData.isFolded = true;
      myData.action = 'fold';
      shouldProgress = true;
      break;

    case 'check':
      myData.action = 'check';
      shouldProgress = true;
      break;

    case 'call':
      myData.chips -= bigBlind;
      myData.currentBet += bigBlind;
      myData.action = 'call';
      newPot += bigBlind;
      shouldProgress = true;
      break;

    case 'raise':
      const rAmount = raiseAmount || bigBlind * 2;
      myData.chips -= rAmount;
      myData.currentBet += rAmount;
      myData.action = 'raise';
      newPot += rAmount;
      break;

    case 'all-in':
      newPot += myData.chips;
      myData.currentBet += myData.chips;
      myData.action = 'all-in';
      myData.chips = 0;
      shouldProgress = true;
      break;
  }

  // Fold - opponent wins
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

  // Dono ne action liya?
  const bothActed = shouldProgress && opponentData.action !== null;

  if (bothActed) {
    await progressPokerPhase(roomId, room, myData, myKey, newPot);
    return;
  }

  await updateDoc(roomRef, {
    [myKey]: myData,
    pot: newPot,
    currentTurn: opponentData.uid,
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

  const phaseOrder = [
    'pre-flop', 'flop', 'turn', 'river', 'showdown'
  ];
  const currentIdx = phaseOrder.indexOf(room.phase);
  const nextPhase = phaseOrder[currentIdx + 1] || 'showdown';

  let communityCards = [...(room.communityCards || [])];
  const deck = room.deck || [];

  if (nextPhase === 'flop') {
    communityCards = [
      { ...deck[0], faceDown: false },
      { ...deck[1], faceDown: false },
      { ...deck[2], faceDown: false },
    ];
  } else if (nextPhase === 'turn') {
    communityCards = [
      ...communityCards,
      { ...deck[3], faceDown: false },
    ];
  } else if (nextPhase === 'river') {
    communityCards = [
      ...communityCards,
      { ...deck[4], faceDown: false },
    ];
  } else if (nextPhase === 'showdown') {
    // Winner randomly decide (baad mein hand evaluator add karo)
    const winnerId = Math.random() > 0.5
      ? room.player1.uid
      : room.player2.uid;
    const winnerName = winnerId === room.player1.uid
      ? room.player1.name
      : room.player2.name;

    await settlePokerGame(
      roomId,
      winnerId,
      winnerName,
      room.entryFee,
      room.player1,
      room.player2
    );
    return;
  }

  const resetPlayer1 = {
    ...room.player1,
    action: null,
    currentBet: 0,
    ...(playerKey === 'player1' ? updatedPlayer : {}),
  };

  const resetPlayer2 = {
    ...room.player2,
    action: null,
    currentBet: 0,
    ...(playerKey === 'player2' ? updatedPlayer : {}),
  };

  await updateDoc(roomRef, {
    phase: nextPhase,
    communityCards,
    pot: newPot,
    player1: resetPlayer1,
    player2: resetPlayer2,
    currentTurn: room.player1.uid,
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

  // Winner ko payout
  await addFunds(
    winnerId,
    payout,
    'winningBalance',     // ✅ valid type
    `Poker win - ₹${payout}`
  );

  await updateDoc(roomRef, {
    status: 'FINISHED',
    phase: 'showdown',
    winner: winnerId,
    winnerName,
    'player1.cards': player1.cards.map(
      (c: any) => ({ ...c, faceDown: false })
    ),
    'player2.cards': player2.cards.map(
      (c: any) => ({ ...c, faceDown: false })
    ),
    updatedAt: serverTimestamp(),
  });
};
