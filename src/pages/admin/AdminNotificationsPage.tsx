import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlowButton } from '../../components/ui/GlowButton';
import toast from 'react-hot-toast';
import { Bell, Send, Users, User } from 'lucide-react';

export const AdminNotificationsPage = () => {
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target: 'all' });
  const [sending, setSending] = useState(false);

  const sentNotifications = [
    { id: 1, title: '🎉 Special Weekend Bonus!', message: 'Get 2x rewards this weekend!', target: 'all', sentAt: '2024-12-20 10:00', recipients: 14285 },
    { id: 2, title: '⚡ New Game Alert', message: 'Color Prediction now with 9x multiplier!', target: 'all', sentAt: '2024-12-19 15:00', recipients: 14285 },
    { id: 3, title: '🔧 Maintenance Notice', message: 'Brief maintenance at 2 AM tonight', target: 'all', sentAt: '2024-12-18 18:00', recipients: 14285 },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error('Fill all fields');
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success(`Notification sent to ${form.target === 'all' ? 'all users' : 'selected users'}!`);
    setForm({ title: '', message: '', type: 'info', target: 'all' });
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-purple-400" /> Push Notifications
        </h1>
        <p className="text-white/40 text-sm mt-1">Send notifications to users</p>
      </div>

      {/* Send Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-white/8">
        <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Send className="w-4 h-4 text-purple-400" /> Compose Notification
        </h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Target Audience</label>
              <select value={form.target} onChange={(e) => setForm(prev => ({ ...prev, target: e.target.value }))}
                className="input-gaming w-full px-4 py-3 rounded-xl text-sm">
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="premium">Premium Users</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Notification Type</label>
              <select value={form.type} onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="input-gaming w-full px-4 py-3 rounded-xl text-sm">
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="reward">Reward</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Notification title" className="input-gaming w-full px-4 py-3 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Message *</label>
            <textarea value={form.message} onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Notification message" rows={3}
              className="input-gaming w-full px-4 py-3 rounded-xl text-sm resize-none" />
          </div>
          <GlowButton type="submit" disabled={sending} size="lg">
            {sending ? <><div className="spin-loader w-4 h-4" /> Sending...</> : <><Send className="w-4 h-4" /> Send Notification</>}
          </GlowButton>
        </form>
      </motion.div>

      {/* Sent History */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white">Recently Sent</h3>
        </div>
        <div className="divide-y divide-white/5">
          {sentNotifications.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="p-4 hover:bg-white/2 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{notif.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                    <span className="flex items-center gap-1">
                      {notif.target === 'all' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {notif.recipients.toLocaleString()} recipients
                    </span>
                    <span>{notif.sentAt}</span>
                  </div>
                </div>
                <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">Sent</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
