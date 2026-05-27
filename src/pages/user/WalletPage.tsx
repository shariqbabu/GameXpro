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

const tabs = [
  'Overview',
  'Add Money',
  'Withdraw',
  'History',
];

export const WalletPage = () => {

  const { userProfile, currentUser } =
    useAuth();

  const [activeTab, setActiveTab] =
    useState('Overview');

  const [depositForm, setDepositForm] =
    useState({
      amount: '',
      utrId: '',
      screenshot: null as File | null,
    });

  const [withdrawForm, setWithdrawForm] =
    useState({
      amount: '',
      upiId: '',
    });

  const [depositLoading, setDepositLoading] =
    useState(false);

  const [withdrawLoading, setWithdrawLoading] =
    useState(false);

  const [previewUrl, setPreviewUrl] =
    useState('');

  const [showQR, setShowQR] =
    useState(false);

  const [transactions, setTransactions] =
    useState<any[]>([]);

  const [deposits, setDeposits] =
    useState<any[]>([]);

  const adminSettings = {
    minDeposit: 100,
    minWithdrawal: 200,
    maxWithdrawal: 50000,
    upiId: 'yourupi@upi',
  };

  // TRANSACTIONS
  useEffect(() => {

    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'transactions'),
      where(
        'userId',
        '==',
        currentUser.uid
      ),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setTransactions(data);
      },
      (error) => {
        console.error(
          'TRANSACTION ERROR:',
          error
        );
      }
    );

    return () => unsubscribe();

  }, [currentUser]);

  // DEPOSITS
  useEffect(() => {

    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'deposits'),
      where(
        'userId',
        '==',
        currentUser.uid
      ),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setDeposits(data);
      },
      (error) => {
        console.error(
          'DEPOSIT ERROR:',
          error
        );
      }
    );

    return () => unsubscribe();

  }, [currentUser]);

  const wallets = [
    {
      label: 'Total Balance',
      value:
        userProfile?.walletBalance ?? 0,
      icon: Wallet,
      color:
        'from-purple-500/30 to-purple-900/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
    },

    {
      label: 'Winning Balance',
      value:
        userProfile?.winningBalance ?? 0,
      icon: TrendingUp,
      color:
        'from-green-500/30 to-green-900/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },

    {
      label: 'Deposit Balance',
      value:
        userProfile?.depositBalance ?? 0,
      icon: ArrowDownCircle,
      color:
        'from-cyan-500/30 to-cyan-900/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
    },

    {
      label: 'Bonus Balance',
      value:
        userProfile?.bonusBalance ?? 0,
      icon: Gift,
      color:
        'from-yellow-500/30 to-yellow-900/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
    },

    {
      label: 'Referral Earnings',
      value:
        userProfile?.referralEarnings ?? 0,
      icon: Gift,
      color:
        'from-pink-500/30 to-pink-900/20',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
    },

    {
      label: 'Locked Balance',
      value:
        userProfile?.lockedBalance ?? 0,
      icon: CreditCard,
      color:
        'from-red-500/30 to-red-900/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
    },
  ];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0];

    if (file) {

      setDepositForm((prev) => ({
        ...prev,
        screenshot: file,
      }));

      const reader =
        new FileReader();

      reader.onload = () => {
        setPreviewUrl(
          reader.result as string
        );
      };

      reader.readAsDataURL(file);
    }
  };

  // DEPOSIT
  const handleDeposit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!currentUser?.uid) {
      return toast.error(
        'Login required'
      );
    }

    const amount = Number(
      depositForm.amount
    );

    if (!amount || amount <= 0) {
      return toast.error(
        'Enter valid amount'
      );
    }

    if (!depositForm.utrId) {
      return toast.error(
        'Enter UTR ID'
      );
    }

    if (
      amount <
      adminSettings.minDeposit
    ) {
      return toast.error(
        `Minimum deposit is ₹${adminSettings.minDeposit}`
      );
    }

    try {

      setDepositLoading(true);

      await addDoc(
        collection(db, 'deposits'),
        {
          userId:
            currentUser.uid,
          amount,
          utrId:
            depositForm.utrId,
          status: 'pending',
          screenshotUrl:
            previewUrl || '',
          createdAt:
            serverTimestamp(),
        }
      );

      await addDoc(
        collection(
          db,
          'transactions'
        ),
        {
          userId:
            currentUser.uid,
          type: 'deposit',
          amount,
          description:
            'Deposit Request',
          status: 'pending',
          createdAt:
            serverTimestamp(),
        }
      );

      toast.success(
        'Deposit request submitted'
      );

      setDepositForm({
        amount: '',
        utrId: '',
        screenshot: null,
      });

      setPreviewUrl('');

      setActiveTab('History');

    } catch (error: any) {

      console.error(error);

      toast.error(
        error?.message ||
        'Deposit failed'
      );

    } finally {

      setDepositLoading(false);
    }
  };

  // WITHDRAW
  const handleWithdraw = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!currentUser?.uid) {
      return toast.error(
        'Login required'
      );
    }

    const amount = Number(
      withdrawForm.amount
    );

    if (!amount || amount <= 0) {
      return toast.error(
        'Enter valid amount'
      );
    }

    if (!withdrawForm.upiId) {
      return toast.error(
        'Enter UPI ID'
      );
    }

    if (
      amount <
      adminSettings.minWithdrawal
    ) {
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

      await addDoc(
        collection(db, 'withdrawals'),
        {
          userId:
            currentUser.uid,
          amount,
          upiId:
            withdrawForm.upiId,
          status: 'pending',
          createdAt:
            serverTimestamp(),
        }
      );

      await addDoc(
        collection(
          db,
          'transactions'
        ),
        {
          userId:
            currentUser.uid,
          type: 'withdrawal',
          amount: -amount,
          description:
            'Withdrawal Request',
          status: 'pending',
          createdAt:
            serverTimestamp(),
        }
      );

      toast.success(
        'Withdrawal request submitted'
      );

      setWithdrawForm({
        amount: '',
        upiId: '',
      });

      setActiveTab('History');

    } catch (error: any) {

      console.error(error);

      toast.error(
        error?.message ||
        'Withdrawal failed'
      );

    } finally {

      setWithdrawLoading(false);
    }
  };

  const getStatusIcon = (
    status: string
  ) => {

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

  const getTypeColor = (
    type: string
  ) => {

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
    <div className="space-y-6 pb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-white">
            Wallet
          </h1>

          <p className="text-sm text-white/50">
            Manage your gaming wallet
          </p>
        </div>

        <button
          onClick={() =>
            setShowQR(!showQR)
          }
          className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center"
        >
          <QrCode className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* QR */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
            className="glass rounded-3xl p-6 border border-white/10 text-center"
          >
            <div className="w-48 h-48 mx-auto rounded-2xl bg-white p-4 flex items-center justify-center">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay"
                alt="QR"
                className="w-full h-full"
              />
            </div>

            <p className="text-white mt-4 font-semibold">
              {adminSettings.upiId}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WALLET CARDS */}
      <div className="grid grid-cols-2 gap-4">
        {wallets.map((wallet, i) => {

          const Icon =
            wallet.icon;

          return (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className={`rounded-3xl border p-4 bg-gradient-to-br ${wallet.color} ${wallet.border}`}
            >
              <div className="flex items-center justify-between mb-4">

                <Icon
                  className={`w-5 h-5 ${wallet.text}`}
                />

                <span className="text-xs text-white/50">
                  {wallet.label}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white">
                ₹{Number(
                  wallet.value || 0
                ).toFixed(2)}
              </h2>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};
