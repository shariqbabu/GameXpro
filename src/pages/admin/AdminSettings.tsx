import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAdminSettings, updateAdminSettings } from '../../services/userService';
import toast from 'react-hot-toast';
import type { AdminSettings } from '../../types';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminSettings().then(setSettings).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateAdminSettings(settings);
      toast.success('Settings saved successfully!');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full spinning" />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white">⚙️ Platform Settings</h1>
        <p className="text-gray-400 text-sm">Configure platform-wide settings</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">💰 Wallet Limits</h3>
          <div className="space-y-4">
            {[
              { key: 'minDeposit', label: 'Min Deposit (₹)' },
              { key: 'maxDeposit', label: 'Max Deposit (₹)' },
              { key: 'minWithdrawal', label: 'Min Withdrawal (₹)' },
              { key: 'maxWithdrawal', label: 'Max Withdrawal (₹)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-gray-400 text-sm mb-2 block">{label}</label>
                <input
                  type="number"
                  value={(settings as any)?.[key] || 0}
                  onChange={e => settings && setSettings({ ...settings, [key]: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payment Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">💳 Payment Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">UPI ID</label>
              <input
                type="text"
                value={settings?.upiId || ''}
                onChange={e => settings && setSettings({ ...settings, upiId: e.target.value })}
                placeholder="gamezone@upi"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Payment QR URL</label>
              <input
                type="url"
                value={settings?.paymentQrUrl || ''}
                onChange={e => settings && setSettings({ ...settings, paymentQrUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
              />
              {settings?.paymentQrUrl && (
                <div className="mt-3 p-3 bg-white/5 rounded-xl">
                  <p className="text-gray-400 text-xs mb-2">QR Preview:</p>
                  <img src={settings.paymentQrUrl} alt="QR Preview" className="w-32 h-32 object-cover rounded-lg border border-white/10 mx-auto" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bonus Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🎁 Bonus & Rewards</h3>
          <div className="space-y-4">
            {[
              { key: 'signupBonus', label: 'Signup Bonus (₹)', desc: 'Points given on registration' },
              { key: 'referralBonus', label: 'Referral Bonus (₹)', desc: 'Points for referrer' },
              { key: 'refereeBonus', label: 'Referee Bonus (₹)', desc: 'Points for new user using referral' },
              { key: 'dailyRewardAmount', label: 'Daily Reward (₹)', desc: 'Daily login reward' },
            ].map(({ key, label, desc }) => (
              <div key={key}>
                <label className="text-gray-400 text-sm mb-1 block">{label}</label>
                <p className="text-gray-600 text-xs mb-1">{desc}</p>
                <input
                  type="number"
                  value={(settings as any)?.[key] || 0}
                  onChange={e => settings && setSettings({ ...settings, [key]: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Feature Toggles */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🔧 Feature Toggles</h3>
          <div className="space-y-4">
            {[
              { key: 'colorGameEnabled', label: 'Color Prediction Game', desc: 'Enable color game for users' },
              { key: 'ludoGameEnabled', label: 'Ludo Game', desc: 'Enable ludo game for users' },
              { key: 'spinWheelEnabled', label: 'Spin Wheel', desc: 'Enable daily spin wheel' },
              { key: 'dailyRewardEnabled', label: 'Daily Rewards', desc: 'Enable daily login rewards' },
              { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Disable platform for maintenance' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
                <button
                  onClick={() => settings && setSettings({ ...settings, [key]: !settings[key as keyof AdminSettings] })}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${settings?.[key as keyof AdminSettings] ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${settings?.[key as keyof AdminSettings] ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-4 rounded-xl font-bold text-lg transition-all hover:-translate-y-1 disabled:opacity-50"
      >
        {saving ? '⏳ Saving...' : '💾 Save All Settings'}
      </button>
    </div>
  );
};

export default AdminSettingsPage;
