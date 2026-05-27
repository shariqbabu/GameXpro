import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlowButton } from '../../components/ui/GlowButton';
import { MOCK_TRANSACTIONS, MOCK_DEPOSITS, MOCK_ADMIN_SETTINGS } from '../../utils/mockData';
import toast from 'react-hot-toast';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, Gift,
  Copy, Upload, CheckCircle, Clock, XCircle, QrCode, CreditCard
} from 'lucide-react';

const tabs = ['Overview', 'Add Money', 'Withdraw', 'History'];

export const WalletPage = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [depositForm, setDepositForm] = useState({ amount: '', utrId: '', screenshot: null as File | null });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', upiId: '' });
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showQR, setShowQR] = useState(false);

  const wallets = [
    { label: 'Total Balance', value: userProfile?.walletBalance || 1250, icon: Wallet, color: 'from-purple-500/30 to-purple-900/20', border: 'border-purple-500/30', text: 'text-purple-400' },
    { label: 'Winning Balance', value: userProfile?.winningBalance || 750, icon: TrendingUp, color: 'from-green-500/30 to-green-900/20', border: 'border-green-500/30', text: 'text-green-400' },
    { label: 'Deposit Balance', value: userProfile?.depositBalance || 500, icon: ArrowDownCircle, color: 'from-cyan-500/30 to-cyan-900/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    { label: 'Bonus Balance', value: userProfile?.bonusBalance || 100, icon: Gift, color: 'from-yellow-500/30 to-yellow-900/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    { label: 'Referral Earnings', value: userProfile?.referralEarnings || 150, icon: Gift, color: 'from-pink-500/30 to-pink-900/20', border: 'border-pink-500/30', text: 'text-pink-400' },
    { label: 'Locked Balance', value: userProfile?.lockedBalance || 0, icon: CreditCard, color: 'from-red-500/30 to-red-900/20', border: 'border-red-500/30', text: 'text-red-400' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDepositForm(prev => ({ ...prev, screenshot: file }));
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.amount || !depositForm.utrId) return toast.error('Fill all fields');
    if (parseFloat(depositForm.amount) < MOCK_ADMIN_SETTINGS.minDeposit) {
      return toast.error(`Minimum deposit is ₹${MOCK_ADMIN_SETTINGS.minDeposit}`);
    }
    setDepositLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Deposit request submitted! Admin will verify shortly.');
    setDepositForm({ amount: '', utrId: '', screenshot: null });
    setPreviewUrl('');
    setActiveTab('History');
    setDepositLoading(false);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawForm.amount || !withdrawForm.upiId) return toast.error('Fill all fields');
    if (parseFloat(withdrawForm.amount) < MOCK_ADMIN_SETTINGS.minWithdrawal) {
      return toast.error(`Minimum withdrawal is ₹${MOCK_ADMIN_SETTINGS.minWithdrawal}`);
    }
    const balance = userProfile?.winningBalance || 750;
    if (parseFloat(withdrawForm.amount) > balance) {
      return toast.error('Insufficient winning balance');
    }
    setWithdrawLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Withdrawal request submitted!');
    setWithdrawForm({ amount: '', upiId: '' });
    setActiveTab('History');
    setWithdrawLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-white/40" />;
    }
  };

  const getTypeColor = (type: string) => {
    if (type === 'deposit' || type === 'game_win' || type === 'referral' || type === 'bonus') return 'text-green-400';
    if (type === 'withdrawal' || type === 'game_loss') return 'text-red-400';
    return 'text-white';
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-sora text-white">💰 My Wallet</h1>
        <p className="text-white/40 text-sm mt-1">Manage your funds and transactions</p>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {wallets.map((w, i) => (
          <motion.div
            key={w.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-4 bg-gradient-to-br ${w.color} border ${w.border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <w.icon className={`w-4 h-4 ${w.text}`} />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{w.label}</span>
            </div>
            <p className={`text-xl font-bold font-sora ${w.text}`}>₹{w.value.toFixed(2)}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-5 border border-white/8">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-green-400" /> Quick Add Money
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[100, 500, 1000, 2000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => { setActiveTab('Add Money'); }}
                        className="py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
                      >
                        ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                      </button>
                    ))}
                  </div>
                  <GlowButton fullWidth onClick={() => setActiveTab('Add Money')}>
                    <ArrowDownCircle className="w-4 h-4" /> Add Money
                  </GlowButton>
                </div>
                <div className="glass rounded-2xl p-5 border border-white/8">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-cyan-400" /> Quick Withdraw
                  </h3>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Available</span>
                      <span className="text-green-400 font-bold">₹{(userProfile?.winningBalance || 750).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Min Withdrawal</span>
                      <span className="text-white">₹{MOCK_ADMIN_SETTINGS.minWithdrawal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Max Withdrawal</span>
                      <span className="text-white">₹{MOCK_ADMIN_SETTINGS.maxWithdrawal.toLocaleString()}</span>
                    </div>
                  </div>
                  <GlowButton fullWidth variant="cyan" onClick={() => setActiveTab('Withdraw')}>
                    <ArrowUpCircle className="w-4 h-4" /> Withdraw
                  </GlowButton>
                </div>
              </div>

              {/* Recent Deposits */}
              <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-semibold text-white">Recent Deposits</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {MOCK_DEPOSITS.map((dep) => (
                    <div key={dep.id} className="flex items-center gap-3 p-4">
                      <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <ArrowDownCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">₹{dep.amount}</p>
                        <p className="text-xs text-white/40">UTR: {dep.utrId}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(dep.status)}
                        <span className={`text-xs capitalize font-medium ${dep.status === 'approved' ? 'text-green-400' : dep.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {dep.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add Money Tab */}
          {activeTab === 'Add Money' && (
            <div className="max-w-lg mx-auto">
              <div className="glass rounded-2xl p-6 border border-white/8 space-y-5">
                <div className="text-center p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Pay to</p>
                  <p className="text-xl font-bold text-purple-400">{MOCK_ADMIN_SETTINGS.upiId || 'royalwin@upi'}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(MOCK_ADMIN_SETTINGS.upiId); toast.success('UPI ID copied!'); }}
                    className="mt-2 flex items-center gap-1.5 text-xs text-white/40 hover:text-white mx-auto transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy UPI ID
                  </button>
                </div>

                {/* QR Code */}
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-purple-500/50 transition-all text-sm"
                >
                  <QrCode className="w-4 h-4" /> {showQR ? 'Hide QR Code' : 'Show QR Code'}
                </button>

                {showQR && (
                  <div className="flex justify-center p-4 rounded-xl bg-white">
                    <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                      <QrCode className="w-32 h-32 text-gray-800" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleDeposit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder={`Min ₹${MOCK_ADMIN_SETTINGS.minDeposit}`}
                      className="input-gaming w-full px-4 py-3 rounded-xl text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      {[100, 500, 1000, 5000].map((a) => (
                        <button key={a} type="button"
                          onClick={() => setDepositForm(prev => ({ ...prev, amount: String(a) }))}
                          className="flex-1 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white hover:border-purple-500/50 transition-all">
                          ₹{a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-2">UTR / Transaction ID *</label>
                    <input
                      type="text"
                      value={depositForm.utrId}
                      onChange={(e) => setDepositForm(prev => ({ ...prev, utrId: e.target.value }))}
                      placeholder="Enter UTR or Transaction ID"
                      className="input-gaming w-full px-4 py-3 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-2">Payment Screenshot</label>
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${previewUrl ? 'border-green-500/50' : 'border-white/10 hover:border-purple-500/30'}`}>
                      {previewUrl ? (
                        <div>
                          <img src={previewUrl} alt="screenshot" className="max-h-40 mx-auto rounded-lg mb-2" />
                          <p className="text-xs text-green-400 flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Screenshot uploaded
                          </p>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
                          <p className="text-sm text-white/50">Click to upload screenshot</p>
                          <p className="text-xs text-white/30 mt-1">PNG, JPG up to 5MB</p>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                  </div>

                  <GlowButton type="submit" fullWidth disabled={depositLoading} size="lg">
                    {depositLoading ? <><div className="spin-loader w-4 h-4" /> Submitting...</> : '📤 Submit Deposit Request'}
                  </GlowButton>
                </form>
              </div>
            </div>
          )}

          {/* Withdraw Tab */}
          {activeTab === 'Withdraw' && (
            <div className="max-w-lg mx-auto">
              <div className="glass rounded-2xl p-6 border border-white/8 space-y-5">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Available Balance</span>
                    <span className="text-xl font-bold text-cyan-400">₹{(userProfile?.winningBalance || 750).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">Only winning balance can be withdrawn</p>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-2">Withdrawal Amount (₹) *</label>
                    <input
                      type="number"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder={`Min ₹${MOCK_ADMIN_SETTINGS.minWithdrawal}`}
                      className="input-gaming w-full px-4 py-3 rounded-xl text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      {[200, 500, 1000].map((a) => (
                        <button key={a} type="button"
                          onClick={() => setWithdrawForm(prev => ({ ...prev, amount: String(a) }))}
                          className="flex-1 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white hover:border-cyan-500/50 transition-all">
                          ₹{a}
                        </button>
                      ))}
                      <button type="button"
                        onClick={() => setWithdrawForm(prev => ({ ...prev, amount: String(userProfile?.winningBalance || 750) }))}
                        className="flex-1 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white hover:border-cyan-500/50 transition-all">
                        Max
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-2">UPI ID *</label>
                    <input
                      type="text"
                      value={withdrawForm.upiId}
                      onChange={(e) => setWithdrawForm(prev => ({ ...prev, upiId: e.target.value }))}
                      placeholder="yourname@upi"
                      className="input-gaming w-full px-4 py-3 rounded-xl text-sm"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
                    ⚠️ Withdrawals are processed within 24-48 hours. Min: ₹{MOCK_ADMIN_SETTINGS.minWithdrawal} | Max: ₹{MOCK_ADMIN_SETTINGS.maxWithdrawal.toLocaleString()}
                  </div>

                  <GlowButton type="submit" fullWidth variant="cyan" disabled={withdrawLoading} size="lg">
                    {withdrawLoading ? <><div className="spin-loader w-4 h-4" /> Processing...</> : '💸 Request Withdrawal'}
                  </GlowButton>
                </form>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'History' && (
            <div className="glass rounded-2xl border border-white/8 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-semibold text-white">Transaction History</h3>
              </div>
              <div className="divide-y divide-white/5">
                {MOCK_TRANSACTIONS.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-white/2 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                      tx.type === 'deposit' ? 'bg-green-500/20' :
                      tx.type === 'withdrawal' ? 'bg-red-500/20' :
                      tx.type === 'game_win' ? 'bg-purple-500/20' :
                      tx.type === 'game_loss' ? 'bg-orange-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      {tx.type === 'deposit' ? '⬇️' : tx.type === 'withdrawal' ? '⬆️' : tx.type === 'game_win' ? '🏆' : tx.type === 'game_loss' ? '🎮' : '🎁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                      <p className="text-xs text-white/40">{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <span className={`text-sm font-bold ${getTypeColor(tx.type)}`}>
                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
