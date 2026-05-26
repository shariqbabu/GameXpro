import { format, formatDistanceToNow } from 'date-fns';

export const generateReferralCode = (uid: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = 'GZ';
  let code = prefix;
  const seed = uid.slice(0, 6);
  for (let i = 0; i < 6; i++) {
    const charIndex = seed.charCodeAt(i % seed.length) % chars.length;
    code += chars[charIndex];
  }
  return code;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPoints = (points: number): string => {
  if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
  if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
  return points.toString();
};

export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
};

export const formatRelativeTime = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

export const getColorClass = (color: string): string => {
  switch (color) {
    case 'red': return 'bg-red-500';
    case 'green': return 'bg-green-500';
    case 'violet': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved':
    case 'completed':
    case 'win': return 'status-badge-success';
    case 'rejected':
    case 'loss': return 'status-badge-error';
    case 'pending': return 'status-badge-warning';
    default: return 'status-badge-info';
  }
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateUPI = (upi: string): boolean => {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
  return re.test(upi);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getRandomColor = (): 'red' | 'green' | 'violet' => {
  const colors: ('red' | 'green' | 'violet')[] = ['red', 'green', 'violet'];
  return colors[Math.floor(Math.random() * colors.length)];
};
