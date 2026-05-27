import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: ReactNode;
  color: 'purple' | 'cyan' | 'green' | 'red' | 'gold';
  change?: number;
  decimals?: number;
  delay?: number;
}

const colorMap = {
  purple: {
    bg: 'from-purple-500/20 to-purple-900/10',
    border: 'border-purple-500/20',
    icon: 'bg-purple-500/20 text-purple-400',
    glow: 'shadow-purple-500/10',
    text: 'text-purple-400',
  },
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-900/10',
    border: 'border-cyan-500/20',
    icon: 'bg-cyan-500/20 text-cyan-400',
    glow: 'shadow-cyan-500/10',
    text: 'text-cyan-400',
  },
  green: {
    bg: 'from-green-500/20 to-green-900/10',
    border: 'border-green-500/20',
    icon: 'bg-green-500/20 text-green-400',
    glow: 'shadow-green-500/10',
    text: 'text-green-400',
  },
  red: {
    bg: 'from-red-500/20 to-red-900/10',
    border: 'border-red-500/20',
    icon: 'bg-red-500/20 text-red-400',
    glow: 'shadow-red-500/10',
    text: 'text-red-400',
  },
  gold: {
    bg: 'from-yellow-500/20 to-yellow-900/10',
    border: 'border-yellow-500/20',
    icon: 'bg-yellow-500/20 text-yellow-400',
    glow: 'shadow-yellow-500/10',
    text: 'text-yellow-400',
  },
};

export const StatCard = ({ title, value, prefix, suffix, icon, color, change, decimals = 0, delay = 0 }: StatCardProps) => {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        shadow-xl ${colors.glow}
        backdrop-blur-sm
      `}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-2xl bg-white transform translate-x-8 -translate-y-8" />

      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors.icon} text-xl`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-white/50 font-medium uppercase tracking-wider">{title}</p>
        <p className={`text-2xl font-bold font-sora ${colors.text}`}>
          {prefix}
          <CountUp end={value} duration={2} delay={delay} decimals={decimals} separator="," />
          {suffix}
        </p>
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay }}
      />
    </motion.div>
  );
};
