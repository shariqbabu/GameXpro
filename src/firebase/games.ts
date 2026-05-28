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
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import {
  GameRoom,
  MatchmakingQueue,
  ColorPredictionRound,
  ColorChoice,
  PlayerInfo,
} from '../types';
import { addFunds, deductFunds } from './wallet';

// ===================== MATCHMAKING =====================

export const joinMatchmakingQueue = async (
  uid: string,
  userName: string,
  photoURL: string,
  entryFee: number,
  gameType: string
): Promise<string> => {
  // Check if already in queue
  const existingQ = query(
    collection(db, 'matchmakingQueue'),
    where('uid', '==', uid),
    where('status', '==', 'WAITING')
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    return existingSnap.docs[0].id;
  }

  const qRef = await addDoc(collection(db, 'matchmakingQueue'), {
    uid,
    userName,
    photoURL: photoURL || '',
    entryFee,
    gameType,
    status: 'WAITING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return qRef.id;
};

export const cancelMatchmaking = async (queueId: string) => {
  await updateDoc(doc(db, 'matchmakingQueue', queueId), {
    status: 'CANCELLED',
    updatedAt: serverTimestamp(),
  });
};

export const subscribeMatchmakingQueue = (
  queueId: string,
  callback: (entry: MatchmakingQueue | null) => void
) => {
  return onSnapshot(doc(db, 'matchmakingQueue', queueId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as MatchmakingQueue);
    } else {
      callback(null);
    }
  });
};

export const findMatch = async (
  uid: string,
  queueId: string,
  entryFee: number,
  gameType: string
): Promise<string | null> => {
  // Find another waiting player
  const q = query(
    collection(db, 'matchmakingQueue'),
    where('status', '==', 'WAITING'),
    where('entryFee', '==', entryFee),
    where('gameType', '==', gameType),
    orderBy('createdAt', 'asc'),
    limit(10)
  );

  const snap = await getDocs(q);
  const others = snap.docs.filter(d => d.data().uid !== uid);

  if (others.length === 0) return null;

  const opponent = others[0];

  // Create room using transaction
  let roomId: string | null = null;

  await runTransaction(db, async (tx) => {
    const myQueueRef = doc(db, 'matchmakingQueue', queueId);
    const opponentQueueRef = doc(db, 'matchmakingQueue', opponent.id);

    const mySnap = await tx.get(myQueueRef);
    const oppSnap = await tx.get(opponentQueueRef);

    if (!mySnap.exists() || !oppSnap.exists()) throw new Error('Queue entry not found');
    if (mySnap.data().status !== 'WAITING' || oppSnap.data().status !== 'WAITING') {
      throw new Error('Already matched');
    }

    const myData = mySnap.data();
    const oppData = oppSnap.data();

    const roomRef = doc(collection(db, 'gameRooms'));
    roomId = roomRef.id;

    const player1: PlayerInfo = {
      uid: oppData.uid,
      name: oppData.userName,
      photoURL: oppData.photoURL || '',
    };

    const player2: PlayerInfo = {
      uid: myData.uid,
      name: myData.userName,
      photoURL: myData.photoURL || '',
    };

    tx.set(roomRef, {
      roomId: roomRef.id,
      gameType,
      entryFee,
      status: 'WAITING',
      player1,
      player2,
      winner: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(myQueueRef, { status: 'MATCHED', roomId: roomRef.id, updatedAt: serverTimestamp() });
    tx.update(opponentQueueRef, { status: 'MATCHED', roomId: roomRef.id, updatedAt: serverTimestamp() });
  });

  return roomId;
};

// ===================== GAME ROOMS =====================

export const subscribeGameRoom = (
  roomId: string,
  callback: (room: GameRoom | null) => void
) => {
  return onSnapshot(doc(db, 'gameRooms', roomId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as GameRoom);
    } else {
      callback(null);
    }
  });
};

export const startCardGame = async (roomId: string) => {
  const roomRef = doc(db, 'gameRooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');

  const room = roomSnap.data() as GameRoom;
  if (room.status !== 'WAITING') return;

  // Assign random cards
  const card1 = Math.floor(Math.random() * 13) + 1;
  const card2 = Math.floor(Math.random() * 13) + 1;
  const suits = ['♠', '♥', '♦', '♣'];
  const suit1 = suits[Math.floor(Math.random() * 4)];
  const suit2 = suits[Math.floor(Math.random() * 4)];

  let winnerId = '';
  let winnerName = '';

  if (card1 > card2) {
    winnerId = room.player1!.uid;
    winnerName = room.player1!.name;
  } else if (card2 > card1) {
    winnerId = room.player2!.uid;
    winnerName = room.player2!.name;
  } else {
    // Tie: return bets
    winnerId = 'TIE';
    winnerName = 'TIE';
  }

  await updateDoc(roomRef, {
    status: 'PLAYING',
    'player1.card': card1,
    'player1.cardSuit': suit1,
    'player2.card': card2,
    'player2.cardSuit': suit2,
    updatedAt: serverTimestamp(),
  });

  // Settle after 3 seconds
  setTimeout(async () => {
    await settleCardGame(roomId, winnerId, winnerName, room.entryFee, room.player1!, room.player2!);
  }, 3000);
};

export const settleCardGame = async (
  roomId: string,
  winnerId: string,
  winnerName: string,
  entryFee: number,
  player1: PlayerInfo,
  player2: PlayerInfo
) => {
  const roomRef = doc(db, 'gameRooms', roomId);

  if (winnerId === 'TIE') {
    // Return bets
    await addFunds(player1.uid, entryFee, 'winningBalance', 'Card game - Tie refund');
    await addFunds(player2.uid, entryFee, 'winningBalance', 'Card game - Tie refund');

    await updateDoc(roomRef, {
      status: 'FINISHED',
      winner: 'TIE',
      winnerName: 'TIE',
      updatedAt: serverTimestamp(),
    });
  } else {
    const loserId = winnerId === player1.uid ? player2.uid : player1.uid;
    const platformFee = entryFee * 0.1; // 10% platform fee
    const payout = entryFee * 2 - platformFee;

    await addFunds(winnerId, payout, 'winningBalance', `Card game win - ₹${payout}`);

    await updateDoc(roomRef, {
      status: 'FINISHED',
      winner: winnerId,
      winnerName,
      updatedAt: serverTimestamp(),
    });

    // Create loss transaction for loser (already deducted at bet time)
    await addDoc(collection(db, 'transactions'), {
      uid: loserId,
      type: 'GAME_LOSS',
      amount: -entryFee,
      previousBalance: 0,
      currentBalance: 0,
      status: 'COMPLETED',
      description: `Card game loss`,
      createdAt: serverTimestamp(),
    });
  }

  // Send notifications
  await sendGameNotification(player1.uid, winnerId === player1.uid, 'Card Battle', entryFee);
  await sendGameNotification(player2.uid, winnerId === player2.uid, 'Card Battle', entryFee);
};

// ===================== COLOR PREDICTION =====================

export const subscribeColorGame = (
  callback: (round: ColorPredictionRound | null) => void
) => {
  const q = query(
    collection(db, 'colorPredictionGames'),
    orderBy('roundNumber', 'desc'),
    limit(1)
  );

  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      callback({ id: snap.docs[0].id, ...snap.docs[0].data() } as ColorPredictionRound);
    } else {
      callback(null);
    }
  });
};

export const getColorGameHistory = async (limitCount = 10) => {
  const q = query(
    collection(db, 'colorPredictionGames'),
    orderBy('roundNumber', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ColorPredictionRound));
};

export const placeBet = async (
  uid: string,
  userName: string,
  roundId: string,
  color: ColorChoice,
  amount: number
) => {
  // Deduct from wallet first
  await deductFunds(uid, amount, 'GAME_LOSS', `Color prediction bet - ${color}`);

  const roundRef = doc(db, 'colorPredictionGames', roundId);
  const roundSnap = await getDoc(roundRef);
  if (!roundSnap.exists()) throw new Error('Round not found');

  const round = roundSnap.data() as ColorPredictionRound;
  if (round.status !== 'BETTING') throw new Error('Betting is closed');

  // Check if user already bet in this round
  const existingBet = round.bets?.find((b: any) => b.uid === uid);
  if (existingBet) throw new Error('Already placed a bet in this round');

  const multiplier = color === 'VIOLET' ? 3 : 2;

  const newBet = {
    uid,
    userName,
    color,
    amount,
    multiplier,
    settled: false,
  };

  await updateDoc(roundRef, {
    bets: [...(round.bets || []), newBet],
    updatedAt: serverTimestamp(),
  });
};

// ===================== DICE GAME =====================

export const playDiceGame = async (
  uid: string,
  bet: number,
  prediction: 'ODD' | 'EVEN'
): Promise<{ dice1: number; dice2: number; sum: number; won: boolean; payout: number }> => {
  // Deduct bet first
  await deductFunds(uid, bet, 'GAME_LOSS', `Dice game bet - ${prediction}`);

  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const sum = dice1 + dice2;
  const result = sum % 2 === 0 ? 'EVEN' : 'ODD';
  const won = result === prediction;
  const payout = won ? bet * 2 : 0;

  if (won) {
    await addFunds(uid, payout, 'winningBalance', `Dice game win - ${sum} (${result})`);
  }

  // Save game record
  await addDoc(collection(db, 'diceGames'), {
    uid,
    bet,
    prediction,
    dice1,
    dice2,
    sum,
    result,
    won,
    payout,
    status: 'SETTLED',
    createdAt: serverTimestamp(),
  });

  await sendGameNotification(uid, won, 'Dice Game', bet);

  return { dice1, dice2, sum, won, payout };
};

// ===================== NOTIFICATIONS =====================

export const sendGameNotification = async (
  uid: string,
  won: boolean,
  gameName: string,
  amount: number
) => {
  await addDoc(collection(db, 'notifications'), {
    uid,
    type: won ? 'GAME_WIN' : 'GAME_LOSS',
    title: won ? `🎉 You Won!` : `😔 Better Luck Next Time`,
    message: won
      ? `Congratulations! You won ₹${amount * 2} in ${gameName}`
      : `You lost ₹${amount} in ${gameName}. Keep playing!`,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const subscribeNotifications = (
  uid: string,
  callback: (notifications: any[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};

export const cleanupStaleRooms = async () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const q = query(
    collection(db, 'gameRooms'),
    where('status', '==', 'WAITING'),
    where('createdAt', '<', Timestamp.fromDate(tenMinutesAgo))
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await updateDoc(d.ref, { status: 'CANCELLED', updatedAt: serverTimestamp() });
  }
};
