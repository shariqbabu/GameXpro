import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAdminSettings, updateAdminSettings } from '../../services/userService';
import { getRecentRounds } from '../../services/gameService';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { AdminSettings, GameRound } from '../../types';

const AdminGames: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [recentRounds, setRecentRounds] = useState<GameRound[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, rounds] = await Promise.all([getAdminSettings(), getRecentRounds(20)]);
        setSettings(s);
        setRecentRounds(rounds);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateAdminSettings(settings);
      toast.success('Game settings saved!');
    } catch { toast.error('Failed to save'); }
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
        <h1 className="text-2xl font-bold text-white">🎮 Game Management</h1>
        <p className="text-gray-400 text-sm">Control game settings and view history</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Toggles */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🎮 Game Status</h3>
          <div className="space-y-4">
            {[
              { key: 'colorGameEnabled', label: 'Color Prediction', icon: '🎨', desc: 'Enable/disable color game' },
              { key: 'ludoGameEnabled', label: 'Ludo Game', icon: '🎲', desc: 'Enable/disable ludo game' },
              { key: 'spinWheelEnabled', label: 'Spin Wheel', icon: '🎡', desc: 'Enable/disable spin wheel' },
              { key: 'maintenanceMode', label: 'Maintenance Mode', icon: '🔧', desc: 'Put platform in maintenance' },
            ].map(({ key, label, icon, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => settings && setSettings({ ...settings, [key]: !settings[key as keyof AdminSettings] })}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${settings?.[key as keyof AdminSettings] ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${settings?.[key as keyof AdminSettings] ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Color Game Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🎨 Color Game Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Round Timer (seconds)</label>
              <input
                type="number"
                value={settings?.colorGameTimer || 30}
                onChange={e => settings && setSettings({ ...settings, colorGameTimer: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
                min={10}
                max={120}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Multipliers</label>
              <div className="grid grid-cols-3 gap-3">
                {(['red', 'green', 'violet'] as const).map(color => (
                  <div key={color}>
                    <label className={`text-xs mb-1 block capitalize ${color === 'red' ? 'text-red-400' : color === 'green' ? 'text-green-400' : 'text-purple-400'}`}>
                      {color}
                    </label>
                    <input
                      type="number"
                      value={settings?.colorGameMultiplier?.[color] || 2}
                      onChange={e => settings && setSettings({
                        ...settings,
                        colorGameMultiplier: { ...settings.colorGameMultiplier, [color]: Number(e.target.value) }
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50"
                      min={1.5}
                      step={0.5}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reward Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">🎁 Reward Settings</h3>
          <div className="space-y-4">
            {[
              { key: 'signupBonus', label: 'Signup Bonus (₹)' },
              { key: 'referralBonus', label: 'Referral Bonus (₹)' },
              { key: 'refereeBonus', label: 'Referee Bonus (₹)' },
              { key: 'dailyRewardAmount', label: 'Daily Reward (₹)' },
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

        {/* Announcement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">📢 Announcement</h3>
          <textarea
            value={settings?.announcement || ''}
            onChange={e => settings && setSettings({ ...settings, announcement: e.target.value })}
            placeholder="Enter announcement message..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 resize-none"
          />
          <p className="text-gray-500 text-xs mt-2">This will be shown on the user dashboard.</p>
        </motion.div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-4 rounded-xl font-bold text-lg transition-all hover:-translate-y-1 disabled:opacity-50"
      >
        {saving ? '⏳ Saving...' : '💾 Save Game Settings'}
      </button>

      {/* Recent Rounds */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-semibold">📜 Recent Game Rounds</h3>
        </div>
        {recentRounds.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No rounds yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  {['Round', 'Result', 'Total Bets', 'Total Amount', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-400 text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRounds.map(round => (
                  <tr key={round.id} className="border-t border-white/5 hover:bg-white/2">
                    <td className="px-4 py-3 text-white text-sm">#{round.roundNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${round.result === 'red' ? 'bg-red-500/20 text-red-400' : round.result === 'green' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {round.result?.toUpperCase() || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{round.totalBets}</td>
                    <td className="px-4 py-3 text-green-400 text-sm">₹{round.totalAmount}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(round.startTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminGames;
