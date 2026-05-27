import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOCK_NOTIFICATIONS } from '../../utils/mockData';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import type { Notification } from '../../types';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const typeConfig = {
    reward: { bg: 'bg-yellow-500/20', icon: '🎁', border: 'border-yellow-500/20' },
    success: { bg: 'bg-green-500/20', icon: '✅', border: 'border-green-500/20' },
    error: { bg: 'bg-red-500/20', icon: '❌', border: 'border-red-500/20' },
    warning: { bg: 'bg-orange-500/20', icon: '⚠️', border: 'border-orange-500/20' },
    info: { bg: 'bg-blue-500/20', icon: 'ℹ️', border: 'border-blue-500/20' },
  };

  return (
    <div className="space-y-5 pb-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sora text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-400" /> Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-white/50 mt-1">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 transition-all">
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
          <button onClick={clearAll} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 transition-all">
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 font-medium">No notifications yet</p>
          <p className="text-white/20 text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const config = typeConfig[notif.type];
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => markRead(notif.id)}
                className={`relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:bg-white/3 ${!notif.isRead ? `${config.bg} ${config.border}` : 'glass border-white/5'}`}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!notif.isRead ? 'text-white' : 'text-white/70'}`}>{notif.title}</p>
                    <p className="text-[10px] text-white/30 flex-shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className="text-xs text-white/50 mt-1">{notif.message}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-1" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
