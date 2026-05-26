import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  delay?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = false,
  onClick,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={`glass rounded-2xl ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
