import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import {
  auth,
  db,
} from '../../firebase/config';

import toast from 'react-hot-toast';

import {
  Eye,
  EyeOff,
  Crown,
  Mail,
  Lock,
  User,
  Gift,
} from 'lucide-react';

import {
  GlowButton,
} from '../../components/ui/GlowButton';

import {
  MOCK_ADMIN_SETTINGS,
} from '../../utils/mockData';

const generateReferralCode = (
  username: string
) => {

  return (
    username
      .slice(0, 3)
      .toUpperCase() +
    Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()
  );
};

export const SignupPage = () => {

  const [
    form,
    setForm,
  ] = useState({

    username: '',

    email: '',

    password: '',

    referralCode: '',
  });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const navigate =
    useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    setForm((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  };

  const handleSignup = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (
      !form.username ||
      !form.email ||
      !form.password
    ) {

      return toast.error(
        'Fill all required fields'
      );
    }

    if (
      form.password.length < 6
    ) {

      return toast.error(
        'Password must be at least 6 characters'
      );
    }

    setLoading(true);

    try {

      // CREATE AUTH USER
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

      const user =
        userCredential.user;

      // UPDATE DISPLAY NAME
      await updateProfile(
        user,
        {
          displayName:
            form.username,
        }
      );

      // REFERRAL CODE
      const referralCode =
        generateReferralCode(
          form.username
        );

      // SIGNUP BONUS
      const signupBonus =
        MOCK_ADMIN_SETTINGS.signupBonus;

      // CREATE USER PROFILE
      await setDoc(
        doc(
          db,
          'users',
          user.uid
        ),
        {

          uid: user.uid,

          username:
            form.username,

          email:
            form.email,

          role: 'user',

          photoURL: '',

          referralCode,

          referredBy:
            form.referralCode ||
            null,

          totalMatches: 0,

          totalPoints: 0,

          achievements: [],

          accountStatus:
            'active',

          createdAt:
            serverTimestamp(),
        }
      );

      // CREATE WALLET
      await setDoc(
        doc(
          db,
          'wallets',
          user.uid
        ),
        {

          userId:
            user.uid,

          totalBalance:
            signupBonus,

          winningBalance: 0,

          depositBalance: 0,

          bonusBalance:
            signupBonus,

          referralEarnings: 0,

          lockedBalance: 0,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      // CREATE NOTIFICATION
      await setDoc(
        doc(
          db,
          'notifications',
          `${user.uid}_signup`
        ),
        {

          userId:
            user.uid,

          title:
            '🎉 Welcome Bonus!',

          message:
            `You received ₹${signupBonus} signup bonus! Start playing now.`,

          type: 'reward',

          isRead: false,

          createdAt:
            serverTimestamp(),
        }
      );

      toast.success(
        `Welcome to RoyalWin! 🎉 ₹${signupBonus} bonus credited!`
      );

      // WAIT AUTH + FIRESTORE SYNC
      setTimeout(() => {

        navigate(
          '/dashboard'
        );

      }, 1000);

    } catch (
      err: any
    ) {

      console.error(err);

      if (
        err?.code ===
        'auth/email-already-in-use'
      ) {

        toast.error(
          'Email already registered'
        );

      } else if (
        err?.code ===
        'auth/invalid-email'
      ) {

        toast.error(
          'Invalid email address'
        );

      } else if (
        err?.code ===
        'auth/weak-password'
      ) {

        toast.error(
          'Weak password'
        );

      } else {

        toast.error(
          err?.message ||
          'Signup failed'
        );
      }

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />

        <div
          className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{
            animationDelay:
              '1.5s',
          }}
        />

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)',
            backgroundSize:
              '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="w-full max-w-md relative z-10"
      >

        {/* LOGO */}
        <div className="text-center mb-6">

          <motion.div
            initial={{
              scale: 0,
            }}
            animate={{
              scale: 1,
            }}
            transition={{
              type:
                'spring',
              damping: 15,
              delay: 0.2,
            }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 mb-3 shadow-2xl shadow-purple-500/30"
          >

            <Crown className="w-8 h-8 text-white" />

          </motion.div>

          <h1 className="text-2xl font-bold font-sora gradient-text">
            Create Account
          </h1>

          <p className="text-white/40 text-sm mt-1">
            Join RoyalWin today
          </p>
        </div>

        {/* BONUS */}
        <motion.div
          initial={{
            scale: 0.9,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            delay: 0.3,
          }}
          className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 text-center"
        >

          <div className="flex items-center justify-center gap-2 text-yellow-400">

            <Gift className="w-5 h-5" />

            <span className="font-bold text-lg">
              ₹
              {
                MOCK_ADMIN_SETTINGS.signupBonus
              } FREE Bonus
            </span>
          </div>

          <p className="text-xs text-white/50 mt-1">
            Instantly credited after signup
          </p>
        </motion.div>

        {/* FORM */}
        <div className="glass rounded-3xl p-7 border border-white/8 shadow-2xl">

          <form
            onSubmit={
              handleSignup
            }
            className="space-y-4"
          >

            {/* USERNAME */}
            <div>

              <label className="block text-xs font-medium text-white/60 mb-2">
                Username *
              </label>

              <div className="relative">

                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />

                <input
                  name="username"
                  type="text"
                  value={
                    form.username
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Choose username"
                  className="input-gaming w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>

              <label className="block text-xs font-medium text-white/60 mb-2">
                Email *
              </label>

              <div className="relative">

                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />

                <input
                  name="email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter email"
                  className="input-gaming w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>

              <label className="block text-xs font-medium text-white/60 mb-2">
                Password *
              </label>

              <div className="relative">

                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />

                <input
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Min 6 characters"
                  className="input-gaming w-full pl-10 pr-10 py-3 rounded-xl text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >

                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* REFERRAL */}
            <div>

              <label className="block text-xs font-medium text-white/60 mb-2">
                Referral Code
              </label>

              <div className="relative">

                <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />

                <input
                  name="referralCode"
                  type="text"
                  value={
                    form.referralCode
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional"
                  className="input-gaming w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            <GlowButton
              type="submit"
              fullWidth
              disabled={loading}
              size="lg"
            >

              {loading ? (

                <div className="flex items-center gap-2">

                  <div className="spin-loader w-4 h-4" />

                  Creating Account...
                </div>

              ) : (

                'Create Account 🚀'
              )}
            </GlowButton>
          </form>

          <div className="mt-5 text-center">

            <p className="text-white/40 text-sm">

              Already have an account?{' '}

              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
