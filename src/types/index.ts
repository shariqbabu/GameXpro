export interface User {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  referralCode: string;
  referredBy?: string;
  walletBalance: number;
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  referralEarnings: number;
  lockedBalance: number;
  totalPoints: number;
  totalMatches: number;
  accountStatus: 'active' | 'blocked' | 'banned';
  joinDate: string;
  lastActive: string;
  achievements: string[];
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bonus' | 'referral' | 'game_win' | 'game_loss' | 'transfer';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  description: string;
  createdAt: string;
  updatedAt: string;
  utrId?: string;
  screenshotUrl?: string;
  upiId?: string;
  bankDetails?: BankDetails;
}

export interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  bankName: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  amount: number;
  utrId: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

export interface ColorRound {
  id: string;
  roundNumber: number;
  status: 'betting' | 'waiting' | 'result';
  result?: 'red' | 'green' | 'violet';
  startTime: string;
  endTime: string;
  totalBets: number;
  totalAmount: number;
}

export interface ColorBet {
  id: string;
  userId: string;
  roundId: string;
  color: 'red' | 'green' | 'violet';
  amount: number;
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
  winAmount?: number;
  createdAt: string;
}

export interface LudoRoom {
  id: string;
  createdBy: string;
  entryFee: number;
  prizePool: number;
  status: 'waiting' | 'playing' | 'finished';
  players: LudoPlayer[];
  maxPlayers: 2;
  currentTurn: string;
  gameState?: LudoGameState;
  winner?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface LudoPlayer {
  uid: string;
  username: string;
  photoURL: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
  pieces: number[];
  isConnected: boolean;
}

export interface LudoGameState {
  board: number[][];
  currentDice: number;
  moveHistory: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reward';
  isRead: boolean;
  createdAt: string;
}

export interface AdminSettings {
  signupBonus: number;
  referralBonus: number;
  refereeBonus: number;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  maintenanceMode: boolean;
  appName: string;
  upiId: string;
  qrImageUrl: string;
  colorPredictionActive: boolean;
  ludoActive: boolean;
}

export interface GameHistory {
  id: string;
  userId: string;
  gameType: 'color_prediction' | 'ludo';
  result: 'win' | 'loss' | 'draw';
  amount: number;
  winAmount: number;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUsername: string;
  bonusAmount: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  photoURL: string;
  totalWins: number;
  totalEarnings: number;
  rank: number;
}
