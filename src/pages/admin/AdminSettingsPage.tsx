import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, onSnapshot, setDoc, serverTimestamp, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';
import {
  Settings, Gift, DollarSign, Gamepad2,
  Bell, Save, ToggleLeft, ToggleRight,
  Loader2, AlertTriangle, RefreshCw,
} from 'lucide-react';
import type { AdminSettings } from '../../types';

// ── Default Settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: AdminSettings = {
  signupBonus: 50,
  referralBonus: 100,
  refereeBonus: 25,
  minDeposit: 10,
  maxDeposit: 50000,
  minWithdrawal: 100,
  maxWithdrawal: 10000,
  upiId: 'royalwin@upi',
  qrImageUrl: '',
  appName: 'RoyalWin',
  colorPredictionActive: true,
  ludoActive: true,
  maintenanceMode: false,
  platformFeePercent: 10,
};

const SETTINGS_DOC = doc(db, 'adminSettings', 'general');

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [resettingBonuses, setResettingBonuses] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Load settings from Firestore ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        if (snap.exists()) {
          const data = { ...DEFAULT_SETTINGS, ...snap.data() } as AdminSettings;
          setSettings(data);
          setSavedSettings(data);
        } else {
          // First time - create with defaults
          setDoc(SETTINGS_DOC, {
            ...DEFAULT_SETTINGS,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Settings load error:', err);
        toast.error('Failed to load settings');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Track unsaved changes ─────────────────────────────────────────────────
  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(savedSettings));
  }, [settings, savedSettings]);

  // ── Save to Firestore ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        SETTINGS_DOC,
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSavedSettings(settings);
      setHasChanges(false);
      toast.success('Settings saved successfully! ✅');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ── Discard changes ───────────────────────────────────────────────────────
  const handleDiscard = () => {
    setSettings(savedSettings);
    toast('Changes discarded', { icon: '↩️' });
  };

  // ── Toggle boolean fields ─────────────────────────────────────────────────
  const toggle = (key: keyof AdminSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Update number/string fields ───────────────────────────────────────────
  const update = (key: keyof AdminSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: typeof prev[key] === 'number' ? Number(value) : value,
    }));
  };

  // ── Danger: Clear game history ────────────────────────────────────────────
  const handleClearHistory = async () => {
    const confirmed = window.confirm(
      '⚠️ This will permanently delete ALL game history. This cannot be undone. Continue?'
    );
    if (!confirmed) return;

    setClearingHistory(true);
    try {
      const batch = writeBatch(db);
      const gamesSnap = await getDocs(collection(db, 'games'));

      if (gamesSnap.empty) {
        toast('No game history to clear', { icon: 'ℹ️' });
        return;
      }

      gamesSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      toast.success(`Cleared ${gamesSnap.size} game records`);
    } catch (err) {
      console.error('Clear history error:', err);
      toast.error('Failed to clear game history');
    } finally {
      setClearingHistory(false);
    }
  };

  // ── Danger: Reset all bonuses ─────────────────────────────────────────────
  const handleResetBonuses = async () => {
    const confirmed = window.confirm(
      '⚠️ This will reset signup bonus, referral bonus, and referee bonus to ₹0. Continue?'
    );
    if (!confirmed) return;

    setResettingBonuses(true);
    try {
      await setDoc(
        SETTINGS_DOC,
        {
          signupBonus: 0,
          referralBonus: 0,
          refereeBonus: 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success('All bonuses reset to ₹0');
    } catch (err) {
      console.error('Reset bonuses error:', err);
      toast.error('Failed to reset bonuses');
    } finally {
      setResettingBonuses(false);
    }
  };

  // ── Sections config ───────────────────────────────────────────────────────
  const sections = [
    {
      title: 'Bonus Settings',
      icon: Gift,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      fields: [
        {
          key: 'signupBonus',
          label: 'Signup Bonus (₹)',
          desc: 'Bonus credited to new users on registration',
          type: 'number',
          min: 0,
          max: 10000,
        },
        {
          key: 'referralBonus',
          label: 'Referral Bonus (₹)',
          desc: 'Bonus for referrer when their friend joins',
          type: 'number',
          min: 0,
          max: 10000,
        },
        {
          key: 'refereeBonus',
          label: 'Referee Bonus (₹)',
          desc: 'Extra bonus for new user who used a referral code',
          type: 'number',
          min: 0,
          max: 10000,
        },
        {
          key: 'platformFeePercent',
          label: 'Platform Fee (%)',
          desc: 'Percentage fee deducted from each game prize pool',
          type: 'number',
          min: 0,
          max: 50,
        },
      ],
    },
    {
      title: 'Deposit Settings',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      fields: [
        {
          key: 'minDeposit',
          label: 'Min Deposit (₹)',
          desc: 'Minimum amount a user can deposit',
          type: 'number',
          min: 1,
          max: 100000,
        },
        {
          key: 'maxDeposit',
          label: 'Max Deposit (₹)',
          desc: 'Maximum amount a user can deposit at once',
          type: 'number',
          min: 1,
          max: 1000000,
        },
      ],
    },
    {
      title: 'Withdrawal Settings',
      icon: DollarSign,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      fields: [
        {
          key: 'minWithdrawal',
          label: 'Min Withdrawal (₹)',
          desc: 'Minimum amount a user can withdraw',
          type: 'number',
          min: 1,
          max: 100000,
        },
        {
          key: 'maxWithdrawal',
          label: 'Max Withdrawal (₹)',
          desc: 'Maximum amount a user can withdraw at once',
          type: 'number',
          min: 1,
          max: 1000000,
        },
      ],
    },
    {
      title: 'Payment Settings',
      icon: Bell,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      fields: [
        {
          key: 'upiId',
          label: 'UPI ID',
          desc: 'UPI ID shown to users for making deposits',
          type: 'text',
        },
        {
          key: 'qrImageUrl',
          label: 'QR Code Image URL',
          desc: 'Payment QR code image URL (hosted image link)',
          type: 'text',
        },
        {
          key: 'appName',
          label: 'App Name',
          desc: 'Platform display name shown across the app',
          type: 'text',
        },
      ],
    },
  ];

  const toggleSettings = [
    {
      key: 'colorPredictionActive',
      label: 'Color Prediction Game',
      desc: 'Enable or disable the color prediction game for all users',
      activeColor: 'text-green-400',
    },
    {
      key: 'ludoActive',
      label: 'Ludo Battle Game',
      desc: 'Enable or disable the Ludo multiplayer game',
      activeColor: 'text-green-400',
    },
    {
      key: 'maintenanceMode',
      label: 'Maintenance Mode',
      desc: 'When enabled, users will see a maintenance screen',
      activeColor: 'text-red-400',
    },
  ];

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-white/40 text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-yellow-400" />
            Platform Settings
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Configure platform settings and bonuses
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleDiscard}
              className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white
                         border border-white/10 hover:border-white/20 transition-all"
            >
              Discard
            </motion.button>
          )}
          <GlowButton
            onClick={handleSave}
            disabled={saving || !hasChanges}
            variant="gold"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {hasChanges ? 'Save Changes' : 'Saved ✓'}
              </div>
            )}
          </GlowButton>
        </div>
      </div>

      {/* ── Unsaved Changes Banner ── */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl
                     bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          You have unsaved changes. Click "Save Changes" to apply.
        </motion.div>
      )}

      {/* ── Toggle Settings ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-400/10">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white">Game & Platform Controls</h3>
        </div>

        <div className="divide-y divide-white/5">
          {toggleSettings.map((item) => {
            const isActive = Boolean(settings[item.key as keyof AdminSettings]);
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-5 hover:bg-white/2 transition-colors"
              >
                <div className="flex-1 mr-4">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key as keyof AdminSettings)}
                  className={`relative flex items-center transition-all shrink-0
                    ${isActive ? item.activeColor : 'text-white/30'}`}
                  title={isActive ? 'Click to disable' : 'Click to enable'}
                >
                  {isActive ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Settings Sections ── */}
      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * si }}
          className="glass rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${section.bgColor}`}>
              <section.icon className={`w-4 h-4 ${section.color}`} />
            </div>
            <h3 className="font-semibold text-white">{section.title}</h3>
          </div>

          <div className="p-5 grid gap-5 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {field.label}
                </label>
                <p className="text-[10px] text-white/30 mb-2">{field.desc}</p>
                <input
                  type={field.type === 'text' ? 'text' : 'number'}
                  value={String(settings[field.key as keyof AdminSettings] ?? '')}
                  onChange={(e) => update(field.key as keyof AdminSettings, e.target.value)}
                  min={'min' in field ? field.min : undefined}
                  max={'max' in field ? field.max : undefined}
                  className="input-gaming w-full px-4 py-3 rounded-xl text-sm"
                  placeholder={field.type === 'text' ? `Enter ${field.label}` : '0'}
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* ── QR Preview ── */}
      {settings.qrImageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl border border-white/8 p-5"
        >
          <h3 className="font-semibold text-white mb-3 text-sm">QR Code Preview</h3>
          <img
            src={settings.qrImageUrl}
            alt="Payment QR"
            className="w-40 h-40 object-contain rounded-xl border border-white/10 bg-white p-2"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              toast.error('Invalid QR image URL');
            }}
          />
        </motion.div>
      )}

      {/* ── Danger Zone ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-red-500/30 bg-red-500/5 overflow-hidden"
      >
        <div className="p-4 border-b border-red-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="font-semibold text-red-400">Danger Zone</h3>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-white/40">
            These actions are <strong className="text-red-400">irreversible</strong>.
            Use with extreme caution.
          </p>

          <div className="flex flex-wrap gap-3">
            <GlowButton
              variant="red"
              size="sm"
              disabled={clearingHistory}
              onClick={handleClearHistory}
            >
              {clearingHistory ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Clearing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" />
                  Clear Game History
                </div>
              )}
            </GlowButton>

            <GlowButton
              variant="red"
              size="sm"
              disabled={resettingBonuses}
              onClick={handleResetBonuses}
            >
              {resettingBonuses ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Resetting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Gift className="w-3 h-3" />
                  Reset All Bonuses
                </div>
              )}
            </GlowButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
