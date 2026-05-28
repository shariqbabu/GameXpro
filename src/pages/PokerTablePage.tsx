import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// PlayingCard component yahan ho sakta hai
const PlayingCard: React.FC<{ card: any; size?: 'sm' | 'md' | 'lg' }> = ({
  card,
  size = 'md',
}) => {
  return <div>{card?.value || 'Card'}</div>;
};

// ✅ useAuth yahan andar hoga
export const PokerTablePage: React.FC = () => {
  const { firebaseUser, user, wallet, loading: authLoading } = useAuth();

  const uid =
    firebaseUser?.uid ||
    (user as any)?.id ||
    (user as any)?.uid ||
    '';

  const userName =
    (user as any)?.username ||
    (user as any)?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    'Player';

  const photoURL =
    (user as any)?.photoURL ||
    (user as any)?.avatar ||
    firebaseUser?.photoURL ||
    '';

  const walletBalance =
    (wallet?.depositBalance || 0) +
    (wallet?.winningBalance || 0) +
    (wallet?.referralBalance || 0) +
    (wallet?.bonusBalance || 0);

  // baaki states
  const [gameState, setGameState] = useState<'table-select' | 'matchmaking' | 'playing'>('table-select');

  return (
    <div>
      Poker Page
    </div>
  );
};

export default PokerTablePage;
