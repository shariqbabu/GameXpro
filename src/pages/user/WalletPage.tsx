import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../firebase/config';

import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Gift,
  Copy,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  QrCode,
  CreditCard,
} from 'lucide-react';

const tabs = ['Overview', 'Add Money', 'Withdraw', 'History'];

export const WalletPage = () => {
  const { userProfile, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('Overview');

  const [depositForm, setDepositForm] = useState({
    amount: '',
    utrId: '',
    screenshot: null as File | null,
  });

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    upiId: '',
  });

  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [previewUrl, setPreviewUrl] = useState('');
  const [showQR, setShowQR] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);

  const adminSettings = {
    minDeposit: 100,
    minWithdrawal: 200,
    maxWithdrawal: 50000,
    upiId: 'yourupi@upi',
  };

  // REALTIME TRANSACTIONS
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTransactions(data);
      },
      (error) => {
        console.error(error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // REALTIME DEPOSITS
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'deposits'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDeposits(data);
      },
      (error) => {
        console.error(error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const wallets = [
    {
      label: 'Total Balance',
      value: userProfile?.walletBalance ?? 0,
      icon: Wallet,
      color: 'from-purple-500/30 to-purple-900/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    },
    {
      label: 'Winning Balance',
      value: userProfile?.winningBalance ?? 0,
      icon: TrendingUp,
      color: 'from-green-500/30 to-green-900/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },
    {
      label: 'Deposit Balance',
      value: userProfile?.depositBalance ?? 0,
      icon: ArrowDownCircle,
      color: 'from-cyan-500/30 to-cyan-900/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
    },
    {
      label: 'Bonus Balance',
      value: userProfile?.bonusBalance ?? 0,
      icon: Gift,
      color: 'from-yellow-500/30 to-yellow-900/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
    },
    {
      label: 'Referral Earnings',
      value: userProfile?.referralEarnings ?? 0,
      icon: Gift,
      color: 'from-pink-500/30 to-pink-900/20',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
    },
    {
      label: 'Locked Balance',
      value: userProfile?.lockedBalance ?? 0,
      icon: CreditCard,
      color: 'from-red-500/30 to-red-900/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
    },
  ];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setDepositForm((prev) => ({
        ...prev,
        screenshot: file,
      }));

      const reader = new FileReader();

      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!currentUser?.uid) {
      return toast.error('Login required');
    }

    const amount = Number(depositForm.amount);

    if (!amount || amount <= 0) {
      return toast.error('Enter valid amount');
    }

    if (!depositForm.utrId) {
      return toast.error('Enter UTR ID');
    }

    if (amount < adminSettings.minDeposit) {
      return toast.error(
        `Minimum deposit is ₹${adminSettings.minDeposit}`
      );
    }

    try {
      setDepositLoading(true);

      await addDoc(collection(db, 'deposits'), {
        userId: currentUser.uid,
        amount,
        utrId: depositForm.utrId,
        status: 'pending',
        screenshotUrl: previewUrl || '',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'deposit',
        amount,
        description: 'Deposit Request',
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success(
        'Deposit request submitted successfully'
      );

      setDepositForm({
        amount: '',
        utrId: '',
        screenshot: null,
      });

      setPreviewUrl('');
      setActiveTab('History');

    } catch (error) {
      console.error(error);
      toast.error('Deposit failed');

    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!currentUser?.uid) {
      return toast.error('Login required');
    }

    const amount = Number(withdrawForm.amount);

    if (!amount || amount <= 0) {
      return toast.error('Enter valid amount');
    }

    if (!withdrawForm.upiId) {
      return toast.error('Enter UPI ID');
    }

    if (amount < adminSettings.minWithdrawal) {
      return toast.error(
        `Minimum withdrawal is ₹${adminSettings.minWithdrawal}`
      );
    }

    const balance =
      userProfile?.winningBalance ?? 0;

    if (amount > balance) {
      return toast.error(
        'Insufficient winning balance'
      );
    }

    try {
      setWithdrawLoading(true);

      await addDoc(collection(db, 'withdrawals'), {
        userId: currentUser.uid,
        amount,
        upiId: withdrawForm.upiId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'withdrawal',
        amount: -amount,
        description: 'Withdrawal Request',
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast.success(
        'Withdrawal request submitted'
      );

      setWithdrawForm({
        amount: '',
        upiId: '',
      });

      setActiveTab('History');

    } catch (error) {
      console.error(error);
      toast.error('Withdrawal failed');

    } finally {
      setWithdrawLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return (
          <CheckCircle className="w-4 h-4 text-green-400" />
        );

      case 'pending':
        return (
          <Clock className="w-4 h-4 text-yellow-400" />
        );

      case 'rejected':
        return (
          <XCircle className="w-4 h-4 text-red-400" />
        );

      default:
        return (
          <Clock className="w-4 h-4 text-white/40" />
        );
    }
  };

  const getTypeColor = (type: string) => {
    if (
      type === 'deposit' ||
      type === 'game_win' ||
      type === 'referral' ||
      type === 'bonus'
    ) {
      return 'text-green-400';
    }

    if (
      type === 'withdrawal' ||
      type === 'game_loss'
    ) {
      return 'text-red-400';
    }

    return 'text-white';
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Existing UI same rahegi */}
    </div>
  );
};
