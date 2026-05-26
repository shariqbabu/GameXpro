import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC = () => {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (mode !== 'forgot') {
      if (!form.password) errs.password = 'Password is required';
      else if (form.password.length < 6) errs.password = 'Min 6 characters';
    }
    if (mode === 'signup') {
      if (!form.name) errs.name = 'Name is required';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else if (mode === 'signup') await signup(form.email, form.password, form.name, form.referralCode || undefined);
      else await resetPassword(form.email);
      if (mode === 'forgot') setMode('login');
    } catch {
      // Errors handled in context
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-red-500/50 focus:ring-red-500/30'
        : 'border-white/10 focus:ring-purple-500/30 focus:border-purple-500/50'
    }`;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/gaming-hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl" />

      {/* Floating Orbs */}
      <div className="absolute top-20 right-20 w-4 h-4 bg-purple-400 rounded-full animate-float opacity-60" />
      <div className="absolute bottom-32 left-32 w-3 h-3 bg-blue-400 rounded-full animate-float opacity-50" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-float opacity-40" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-purple-500/30 animate-pulse-glow">
            🎮
          </div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text">GameZone Pro</h1>
          <p className="text-gray-400 text-sm mt-2">Premium Gaming Platform</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass border border-white/10 rounded-2xl p-6"
        >
          {/* Mode Tabs */}
          {mode !== 'forgot' && (
            <div className="flex bg-white/5 rounded-xl p-1 mb-6">
              {(['login', 'signup'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                    mode === m
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {m === 'login' ? '🔑 Login' : '✨ Sign Up'}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === 'forgot' && (
                <div className="text-center mb-4">
                  <h2 className="text-white font-semibold text-lg">Reset Password</h2>
                  <p className="text-gray-400 text-sm mt-1">Enter your email to receive reset link</p>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={inputClass('name')}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
              )}

              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inputClass('email')}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {mode !== 'forgot' && (
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className={inputClass('password')}
                  />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
              )}

              {mode === 'signup' && (
                <>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      className={inputClass('confirmPassword')}
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Referral Code (Optional)"
                      value={form.referralCode}
                      onChange={e => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
                      className={inputClass('referralCode')}
                    />
                    <p className="text-gray-500 text-xs mt-1">Enter a referral code to get bonus points!</p>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
                {mode === 'login' ? '🚀 Login' : mode === 'signup' ? '🎉 Create Account' : '📧 Send Reset Link'}
              </Button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-gray-400 text-sm hover:text-white transition-colors py-2"
                >
                  ← Back to Login
                </button>
              )}
            </motion.form>
          </AnimatePresence>

          {/* Signup Benefits */}
          {mode === 'signup' && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-center text-xs text-purple-300 font-medium mb-2">🎁 New User Bonuses</p>
              <div className="flex justify-center gap-4 text-xs text-gray-400">
                <span>✅ Welcome Bonus</span>
                <span>✅ Daily Rewards</span>
                <span>✅ Referral Bonus</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Demo Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <p className="text-gray-600 text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
