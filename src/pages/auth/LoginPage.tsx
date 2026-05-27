import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Crown, Mail, Lock, Zap } from 'lucide-react';
import { GlowButton } from '../../components/ui/GlowButton';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back! 🎮');
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Try again later.');
      } else {
        // Demo mode - allow demo login
        if (email === 'demo@royalwin.com' && password === 'demo123') {
          toast.success('Welcome to RoyalWin! 🎮 (Demo Mode)');
          navigate('/dashboard');
        } else if (email === 'admin@royalwin.com' && password === 'admin123') {
          toast.success('Admin access granted! 🛡️ (Demo Mode)');
          navigate('/admin');
        } else {
          toast.error('Login failed. Use demo@royalwin.com / demo123');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
      setForgotMode(false);
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 mb-4 shadow-2xl shadow-purple-500/30"
          >
            <Crown className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold font-sora gradient-text">RoyalWin</h1>
          <p className="text-white/40 text-sm mt-1">India's Premier Gaming Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 border border-white/8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white font-sora">
              {forgotMode ? 'Reset Password' : 'Welcome Back!'}
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {forgotMode ? 'Enter your email to receive a reset link' : 'Login to continue playing'}
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mb-5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-xs text-cyan-400">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span><strong>Demo:</strong> demo@royalwin.com / demo123 | <strong>Admin:</strong> admin@royalwin.com / admin123</span>
            </div>
          </div>

          <form onSubmit={forgotMode ? handleForgotPassword : handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input-gaming w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Password */}
            {!forgotMode && (
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-gaming w-full pl-10 pr-10 py-3 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password */}
            {!forgotMode && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit */}
            <GlowButton type="submit" fullWidth disabled={loading} size="lg">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="spin-loader w-4 h-4" />
                  {forgotMode ? 'Sending...' : 'Logging in...'}
                </div>
              ) : (
                forgotMode ? 'Send Reset Email' : 'Login to Play 🎮'
              )}
            </GlowButton>

            {forgotMode && (
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-sm text-white/50 hover:text-white transition-colors"
              >
                ← Back to Login
              </button>
            )}
          </form>

          {!forgotMode && (
            <div className="mt-6 text-center">
              <p className="text-white/40 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                  Sign Up Free
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: '🎮', text: 'Live Games' },
            { icon: '💰', text: 'Real Cash' },
            { icon: '⚡', text: 'Instant Pay' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-center p-3 rounded-xl bg-white/3 border border-white/5"
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-xs text-white/50">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
