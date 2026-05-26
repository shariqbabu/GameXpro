import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const AdminNotifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ title: string; message: string; type: string; time: string }[]>([]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        title,
        message,
        type,
        isGlobal: true,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      setSent(prev => [{ title, message, type, time: new Date().toLocaleTimeString() }, ...prev]);
      setTitle('');
      setMessage('');
      toast.success('Notification sent to all users!');
    } catch { toast.error('Failed to send notification'); }
    finally { setSending(false); }
  };

  const typeStyles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const typeIcons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

  const templates = [
    { title: 'Maintenance Alert', message: 'Platform will be under maintenance from 2 AM to 4 AM IST. Please complete your transactions before this time.', type: 'warning' as const },
    { title: 'New Game Added!', message: 'Exciting news! A new game has been added to the platform. Check it out now and win big!', type: 'success' as const },
    { title: 'Special Bonus', message: 'Congratulations! All users get double bonus rewards today. Play now and double your earnings!', type: 'success' as const },
    { title: 'System Update', message: 'We have improved our platform for better performance and security. Thanks for your patience.', type: 'info' as const },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white">🔔 Notifications</h1>
        <p className="text-gray-400 text-sm">Send announcements to all users</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">📤 Send Notification</h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Notification message..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 resize-none" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Type</label>
              <div className="grid grid-cols-4 gap-2">
                {(['info', 'success', 'warning', 'error'] as const).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`py-2 rounded-lg text-xs font-medium capitalize transition-all border ${type === t ? typeStyles[t] : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                    {typeIcons[t]} {t}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSend} disabled={sending}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-3 rounded-xl font-bold transition-all hover:-translate-y-1 disabled:opacity-50">
              {sending ? '⏳ Sending...' : '📤 Send to All Users'}
            </button>
          </div>
        </motion.div>

        {/* Templates & History */}
        <div className="space-y-4">
          {/* Templates */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">📋 Quick Templates</h3>
            <div className="space-y-3">
              {templates.map((tmpl, i) => (
                <button key={i} onClick={() => { setTitle(tmpl.title); setMessage(tmpl.message); setType(tmpl.type); }}
                  className="w-full text-left p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{typeIcons[tmpl.type]}</span>
                    <p className="text-white text-sm font-medium">{tmpl.title}</p>
                  </div>
                  <p className="text-gray-500 text-xs truncate">{tmpl.message}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Recent Sent */}
          {sent.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">📜 Recently Sent</h3>
              <div className="space-y-3">
                {sent.map((n, i) => (
                  <div key={i} className={`p-3 rounded-xl border ${typeStyles[n.type as keyof typeof typeStyles]}`}>
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{n.title}</p>
                      <span className="text-xs opacity-60">{n.time}</span>
                    </div>
                    <p className="text-xs opacity-70 mt-1 truncate">{n.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
