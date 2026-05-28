export const generateReferralCode = (uid: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  // Use uid to seed the code
  for (let i = 0; i < 8; i++) {
    const charIndex = uid.charCodeAt(i % uid.length) % chars.length;
    code += chars[charIndex];
  }
  return code;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatShortDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const truncateAddress = (str: string, maxLength = 20): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

export const getColorClass = (color: string): string => {
  switch (color) {
    case 'RED': return 'bg-red-500';
    case 'GREEN': return 'bg-green-500';
    case 'VIOLET': return 'bg-violet-500';
    default: return 'bg-gray-500';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'MATCHED':
      return 'text-green-400';
    case 'PENDING':
    case 'WAITING':
      return 'text-yellow-400';
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export const getStatusBg = (status: string): string => {
  switch (status) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'MATCHED':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'PENDING':
    case 'WAITING':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getCardSuit = (index: number): string => {
  const suits = ['♠', '♥', '♦', '♣'];
  return suits[index % 4];
};

export const getCardName = (value: number): string => {
  if (value === 1) return 'A';
  if (value === 11) return 'J';
  if (value === 12) return 'Q';
  if (value === 13) return 'K';
  return value.toString();
};

export const calculateUsableBalance = (wallet: {
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  referralBalance: number;
}): number => {
  // Only 10% of bonus balance is usable
  const usableBonus = wallet.bonusBalance * 0.1;
  // Referral balance is fully usable
  const usableReferral = wallet.referralBalance;
  // Winning balance is fully usable
  const usableWinning = wallet.winningBalance;
  // Deposit balance is NOT usable in games
  return usableWinning + usableBonus + usableReferral;
};

export const deductFromWallet = (
  wallet: {
    winningBalance: number;
    bonusBalance: number;
    referralBalance: number;
  },
  amount: number
): {
  winningBalance: number;
  bonusBalance: number;
  referralBalance: number;
} | null => {
  const maxBonus = wallet.bonusBalance * 0.1;
  const usableBonus = Math.min(maxBonus, Math.max(0, amount - wallet.winningBalance - wallet.referralBalance));
  const usableWinning = Math.min(wallet.winningBalance, amount - usableBonus - Math.min(wallet.referralBalance, amount - usableBonus));
  const usableReferral = Math.min(wallet.referralBalance, amount - usableWinning - usableBonus);

  const totalUsable = usableWinning + usableBonus + usableReferral;
  if (totalUsable < amount) return null;

  return {
    winningBalance: wallet.winningBalance - usableWinning,
    bonusBalance: wallet.bonusBalance - usableBonus,
    referralBalance: wallet.referralBalance - usableReferral,
  };
};
