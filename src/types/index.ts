export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  referralCode: string;
  referredBy?: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
  lastLogin: string;
  totalPoints: number;
  walletBalance: number;
  winningAmount: number;
  bonusAmount: number;
  depositAmount: number;
  referralEarnings: number;
  totalGamesPlayed: number;
  totalWins: number;
}

export interface Wallet {
  userId: string;
  totalBalance: number;
  winningAmount: number;
  bonusAmount: number;
  depositAmount: number;
  referralEarnings: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'game_win' | 'game_loss' | 'bonus' | 'referral';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deposit {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  utrNumber: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  upiId?: string;
  bankAccount?: string;
  ifscCode?: string;
  accountName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

export interface GameRound {
  id: string;
  roundNumber: number;
  result?: 'red' | 'green' | 'violet';
  status: 'waiting' | 'betting' | 'processing' | 'completed';
  startTime: string;
  endTime?: string;
  totalBets: number;
  totalAmount: number;
}

export interface GameBet {
  id: string;
  userId: string;
  userName: string;
  roundId: string;
  color: 'red' | 'green' | 'violet';
  amount: number;
  result?: 'win' | 'loss';
  winAmount?: number;
  createdAt: string;
}

export interface LudoMatch {
  id: string;
  players: string[];
  status: 'waiting' | 'active' | 'completed';
  entryFee: number;
  prize: number;
  winner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettings {
  signupBonus: number;
  referralBonus: number;
  refereeBonus: number;
  minDeposit: number;
  maxDeposit: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  paymentQrUrl: string;
  upiId: string;
  colorGameEnabled: boolean;
  ludoGameEnabled: boolean;
  spinWheelEnabled: boolean;
  maintenanceMode: boolean;
  announcement: string;
  colorGameTimer: number;
  colorGameMultiplier: { red: number; green: number; violet: number };
  dailyRewardEnabled: boolean;
  dailyRewardAmount: number;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isGlobal: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  photoURL?: string;
  totalWins: number;
  totalEarnings: number;
  rank: number;
}
