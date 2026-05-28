// ============================================================
// ROYALBET CASINO - TYPE DEFINITIONS
// ============================================================

import { Timestamp } from 'firebase/firestore';

// ─── User Types ─────────────────────────────────────────────
export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;
  referralCode: string;
  referredBy: string;
  isAdmin: boolean;
  status: 'active' | 'banned';
  totalDeposit: number;
  totalWithdraw: number;
  totalPlayed: number;
  totalWon: number;
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

// ─── Wallet Types ─────────────────────────────────────────────
export interface Wallet {
  uid: string;
  depositBalance: number;
  winningBalance: number;
  bonusBalance: number;
}

export interface WalletWithTotal extends Wallet {
  totalBalance: number;
}

// ─── Transaction Types ─────────────────────────────────────────
export type TransactionType =
  | 'deposit'
  | 'withdraw'
  | 'game_bet'
  | 'game_win'
  | 'referral_bonus'
  | 'admin_adjustment';

export type BalanceType = 'depositBalance' | 'winningBalance' | 'bonusBalance';

export interface Transaction {
  id: string;
  uid: string;
  type: TransactionType;
  amount: number;
  balanceType: BalanceType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: Timestamp;
}

// ─── Deposit Types ─────────────────────────────────────────────
export interface Deposit {
  id: string;
  uid: string;
  amount: number;
  utrNumber: string;
  screenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedBy: string;
  createdAt: Timestamp;
  userName?: string;
  userEmail?: string;
}

// ─── Withdrawal Types ─────────────────────────────────────────
export interface Withdrawal {
  id: string;
  uid: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string;
  createdAt: Timestamp;
  userName?: string;
  userEmail?: string;
}

// ─── Referral Types ─────────────────────────────────────────────
export interface Referral {
  uid: string;
  code: string;
  totalReferrals: number;
  totalEarned: number;
}

// ─── Game Room Types ─────────────────────────────────────────────
export interface GameRoom {
  id: string;
  roomId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: RoomPlayer[];
  winner: string;
  betAmount: number;
  createdAt: Timestamp;
}

export interface RoomPlayer {
  uid: string;
  name: string;
  card?: number;
  cardSuit?: string;
  ready: boolean;
}

// ─── Dice Game Types ─────────────────────────────────────────────
export type DiceBet = 'even' | 'odd';

export interface DiceRound {
  id: string;
  roomId: string;
  players: DicePlayer[];
  dice1: number;
  dice2: number;
  total: number;
  result: DiceBet | '';
  winnerUids: string[];
  betAmount: number;
  status: 'betting' | 'rolling' | 'finished';
  createdAt: Timestamp;
}

export interface DicePlayer {
  uid: string;
  name: string;
  bet: DiceBet;
  amount: number;
}

// ─── Color Prediction Types ─────────────────────────────────────────
export type ColorBet = 'red' | 'green' | 'violet';

export interface ColorRound {
  id: string;
  roundId: string;
  result: ColorBet | '';
  players: ColorPlayer[];
  totalBet: number;
  status: 'betting' | 'revealing' | 'finished';
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
}

export interface ColorPlayer {
  uid: string;
  name: string;
  bet: ColorBet;
  amount: number;
}

// ─── Auth Types ─────────────────────────────────────────────────
export interface SignupForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

// ─── Admin Dashboard Stats ────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  totalDeposit: number;
  totalWithdraw: number;
  totalRevenue: number;
  activeUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalGamesPlayed: number;
}
