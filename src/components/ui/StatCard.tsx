import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: 'purple' | 'blue' | 'green' | 'red' | 'yellow';
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'purple',
  delay = 0,
}) => {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400',
  };

  const iconBg = {
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-gradient-to-br ${colorClasses[color]} glass border rounded-2xl p-5 cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBg[color]} text-2xl`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded-full ${trend.positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-white text-2xl font-bold font-orbitron">{value}</p>
    </motion.div>
  );
};

export default StatCard;
