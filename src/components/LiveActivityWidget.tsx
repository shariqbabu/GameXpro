import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: string;
  user: string;
  action: string;
  amount?: string;
  time: string;
}

const generateActivity = (): Activity => {
  const users = ['R***j', 'P***a', 'A***t', 'N***a', 'S***i', 'K***r', 'M***a', 'V***k'];
  const actions = [
    { action: 'won in Color Prediction', amount: true },
    { action: 'won a Ludo match', amount: true },
    { action: 'joined RoyalWin', amount: false },
    { action: 'made a deposit', amount: true },
    { action: 'referred a friend', amount: false },
  ];
  const amounts = ['₹50', '₹100', '₹200', '₹500', '₹1000', '₹250', '₹750'];
  const picked = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    id: Math.random().toString(36).slice(2),
    user: users[Math.floor(Math.random() * users.length)],
    action: picked.action,
    amount: picked.amount ? amounts[Math.floor(Math.random() * amounts.length)] : undefined,
    time: 'just now',
  };
};

export const LiveActivityWidget = () => {
  const [activities, setActivities] = useState<Activity[]>([
    generateActivity(),
    generateActivity(),
    generateActivity(),
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => [generateActivity(), ...prev.slice(0, 4)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <h3 className="text-sm font-semibold text-white">Live Activity</h3>
      </div>
      <div className="p-3 space-y-2">
        <AnimatePresence>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 py-1.5"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {activity.user[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-white font-semibold">{activity.user}</span>
                <span className="text-xs text-white/50"> {activity.action}</span>
                {activity.amount && (
                  <span className="text-xs text-green-400 font-semibold"> {activity.amount}</span>
                )}
              </div>
              <span className="text-[10px] text-white/30 flex-shrink-0">{activity.time}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
