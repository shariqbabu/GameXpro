// ============================================================
// FORGOT PASSWORD PAGE
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Crown, Mail, ArrowLeft, Send } from 'lucide-react';
import { resetPassword } from '../services/authService';
import toast from 'react-hot-toast';

const schema = z.object({ email: z.string().email('Invalid email address') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-casino-gradient flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4">
            <Crown className="w-7 h-7 text-black" />
          </div>
          <h1 className="font-casino text-2xl text-yellow-400">RoyalBet</h1>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-white mb-2">Email Sent!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Check your inbox and follow the instructions to reset your password.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Reset Password</h2>
              <p className="text-slate-400 text-sm mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input {...register('email')} type="email" placeholder="your@email.com" className="input-casino pl-10" />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reset Link</>
                  )}
                </button>
              </form>

              <p className="text-center text-slate-400 text-sm mt-5">
                <Link to="/login" className="text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
