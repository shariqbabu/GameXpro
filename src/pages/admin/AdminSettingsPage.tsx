import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOCK_ADMIN_SETTINGS } from '../../utils/mockData';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';
import { Settings, Gift, DollarSign, Gamepad2, Bell, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import type { AdminSettings } from '../../types';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<AdminSettings>(MOCK_ADMIN_SETTINGS);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Settings saved successfully! ✅');
    setSaving(false);
  };

  const toggle = (key: keyof AdminSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const update = (key: keyof AdminSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: typeof prev[key] === 'number' ? Number(value) : value }));
  };

  const sections = [
    {
      title: 'Bonus Settings',
      icon: Gift,
      color: 'text-yellow-400',
      fields: [
        { key: 'signupBonus', label: 'Signup Bonus (₹)', desc: 'Bonus credited to new users', type: 'number' },
        { key: 'referralBonus', label: 'Referral Bonus (₹)', desc: 'Bonus for referrer when friend joins', type: 'number' },
        { key: 'refereeBonus', label: 'Referee Bonus (₹)', desc: 'Bonus for new user who used referral code', type: 'number' },
      ],
    },
    {
      title: 'Deposit Settings',
      icon: DollarSign,
      color: 'text-green-400',
      fields: [
        { key: 'minDeposit', label: 'Min Deposit (₹)', desc: 'Minimum deposit amount', type: 'number' },
        { key: 'maxDeposit', label: 'Max Deposit (₹)', desc: 'Maximum deposit amount', type: 'number' },
      ],
    },
    {
      title: 'Withdrawal Settings',
      icon: DollarSign,
      color: 'text-orange-400',
      fields: [
        { key: 'minWithdrawal', label: 'Min Withdrawal (₹)', desc: 'Minimum withdrawal amount', type: 'number' },
        { key: 'maxWithdrawal', label: 'Max Withdrawal (₹)', desc: 'Maximum withdrawal amount', type: 'number' },
      ],
    },
    {
      title: 'Payment Settings',
      icon: Bell,
      color: 'text-purple-400',
      fields: [
        { key: 'upiId', label: 'UPI ID', desc: 'UPI ID for receiving payments', type: 'text' },
        { key: 'qrImageUrl', label: 'QR Code URL', desc: 'Payment QR code image URL', type: 'text' },
        { key: 'appName', label: 'App Name', desc: 'Platform display name', type: 'text' },
      ],
    },
  ];

  const toggleSettings = [
    { key: 'colorPredictionActive', label: 'Color Prediction Game', desc: 'Enable/disable color prediction game' },
    { key: 'ludoActive', label: 'Ludo Battle Game', desc: 'Enable/disable ludo game' },
    { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Enable maintenance mode for the platform' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-yellow-400" /> Platform Settings
          </h1>
          <p className="text-white/40 text-sm mt-1">Configure platform settings and bonuses</p>
        </div>
        <GlowButton onClick={handleSave} disabled={saving} variant="gold">
          {saving ? <><div className="spin-loader w-4 h-4" /> Saving...</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </GlowButton>
      </div>

      {/* Toggle Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          <h3 className="font-semibold text-white">Game & Platform Controls</h3>
        </div>
        <div className="divide-y divide-white/5">
          {toggleSettings.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggle(item.key as keyof AdminSettings)}
                className={`relative flex items-center transition-all ${settings[item.key as keyof AdminSettings] ? 'text-green-400' : 'text-white/30'}`}
              >
                {settings[item.key as keyof AdminSettings] ? (
                  <ToggleRight className="w-10 h-10" />
                ) : (
                  <ToggleLeft className="w-10 h-10" />
                )}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Setting Sections */}
      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + si * 0.05 }}
          className="glass rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <section.icon className={`w-4 h-4 ${section.color}`} />
            <h3 className="font-semibold text-white">{section.title}</h3>
          </div>
          <div className="p-5 grid gap-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-white/60 mb-1.5">{field.label}</label>
                <p className="text-[10px] text-white/30 mb-2">{field.desc}</p>
                <input
                  type={field.type === 'text' ? 'text' : 'number'}
                  value={String(settings[field.key as keyof AdminSettings])}
                  onChange={(e) => update(field.key as keyof AdminSettings, e.target.value)}
                  className="input-gaming w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-red-500/30 bg-red-500/5 overflow-hidden"
      >
        <div className="p-4 border-b border-red-500/20">
          <h3 className="font-semibold text-red-400">Danger Zone</h3>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-white/40">These actions are irreversible. Use with extreme caution.</p>
          <div className="flex flex-wrap gap-3">
            <GlowButton variant="red" size="sm" onClick={() => toast.error('This would clear all game history (demo)')}>
              Clear Game History
            </GlowButton>
            <GlowButton variant="red" size="sm" onClick={() => toast.error('This would reset all bonuses (demo)')}>
              Reset All Bonuses
            </GlowButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
