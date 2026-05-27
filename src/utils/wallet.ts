// ============================================================
// WALLET UTILITY FUNCTIONS
// ============================================================

import { Wallet, WalletWithTotal } from '../types';

/**
 * Computes total balance from individual balance types
 * Total = depositBalance + winningBalance + bonusBalance
 */
export function computeTotalBalance(wallet: Wallet): WalletWithTotal {
  return {
    ...wallet,
    totalBalance: wallet.depositBalance + wallet.winningBalance + wallet.bonusBalance,
  };
}

/**
 * Format currency to INR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Generate unique referral code from user name and uid
 */
export function generateReferralCode(name: string, uid: string): string {
  const prefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const suffix = uid.slice(-5).toUpperCase();
  return `${prefix}${suffix}`;
}

/**
 * Validate UPI ID format
 */
export function isValidUPI(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
  return upiRegex.test(upiId);
}

/**
 * Validate UTR number (12 digits)
 */
export function isValidUTR(utr: string): boolean {
  return /^\d{12}$/.test(utr);
}
