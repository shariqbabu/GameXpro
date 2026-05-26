import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userService';
import { uploadImage } from '../services/cloudinary';
import { formatCurrency, copyToClipboard, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

const Profile: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.displayName || '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
    setUploading(true);
    try {
      const result = await uploadImage(file, 'profiles', setUploadProgress);
      await updateUserProfile(userProfile.uid, { photoURL: result.url });
      await refreshProfile();
      toast.success('Profile photo updated! 📸');
    } catch {
      toast.error('Upload failed. Check Cloudinary config.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!userProfile || !name.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(userProfile.uid, { displayName: name.trim() });
      await refreshProfile();
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyRef = async () => {
    if (userProfile?.referralCode) {
      await copyToClipboard(userProfile.referralCode);
      toast.success('Copied!');
    }
  };

  const stats = [
    { label: 'Games Played', value: userProfile?.totalGamesPlayed || 0, icon: '🎮', color: 'text-blue-400' },
    { label: 'Total Wins', value: userProfile?.totalWins || 0, icon: '🏆', color: 'text-yellow-400' },
    { label: 'Win Rate', value: `${userProfile?.totalGamesPlayed ? Math.round((userProfile.totalWins / userProfile.totalGamesPlayed) * 100) : 0}%`, icon: '📊', color: 'text-green-400' },
    { label: 'Referral Earnings', value: formatCurrency(userProfile?.referralEarnings || 0), icon: '🔗', color: 'text-purple-400' },
  ];

  const walletItems = [
    { label: 'Total Balance', value: formatCurrency(userProfile?.walletBalance || 0), color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20', text: 'text-purple-300' },
    { label: 'Winning Amount', value: formatCurrency(userProfile?.winningAmount || 0), color: 'from-green-500/20 to-green-600/10 border-green-500/20', text: 'text-green-300' },
    { label: 'Bonus Amount', value: formatCurrency(userProfile?.bonusAmount || 0), color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20', text: 'text-yellow-300' },
    { label: 'Deposit Amount', value: formatCurrency(userProfile?.depositAmount || 0), color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20', text: 'text-blue-300' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-white">
        👤 My Profile
      </motion.h1>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass border border-white/10 rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold overflow-hidden ring-4 ring-purple-500/30">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userProfile?.displayName?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm hover:bg-purple-700 transition-all"
            >
              {uploading ? '⏳' : '📷'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="absolute mt-28 ml-0 w-24">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <div className="flex gap-2 items-center mb-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xl font-bold focus:outline-none focus:border-purple-500"
                />
                <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-bold text-white">{userProfile?.displayName}</h2>
                <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-white text-sm">✏️</button>
              </div>
            )}
            <p className="text-gray-400 text-sm mb-2">{userProfile?.email}</p>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className={`text-xs px-2 py-1 rounded-full ${userProfile?.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                {userProfile?.role === 'admin' ? '⚙️ Admin' : '🎮 Gamer'}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                ✅ Verified
              </span>
            </div>
            {userProfile?.createdAt && (
              <p className="text-gray-500 text-xs mt-2">Joined: {formatDate(userProfile.createdAt)}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Referral Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass border border-purple-500/20 rounded-2xl p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10"
      >
        <h3 className="text-white font-semibold mb-3">🔗 Your Referral Code</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-gray-400 text-xs mb-1">Share this code to earn bonuses</p>
            <p className="text-2xl font-orbitron font-bold gradient-text">{userProfile?.referralCode}</p>
          </div>
          <button
            onClick={handleCopyRef}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 text-sm"
          >
            📋 Copy
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">Earn bonus for every user who signs up with your code!</p>
      </motion.div>

      {/* Wallet Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="text-white font-semibold mb-3">💰 Wallet Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          {walletItems.map((item) => (
            <div key={item.label} className={`bg-gradient-to-br ${item.color} glass border rounded-xl p-4`}>
              <p className="text-gray-400 text-xs mb-1">{item.label}</p>
              <p className={`font-orbitron font-bold text-lg ${item.text}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Game Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="text-white font-semibold mb-3">📊 Game Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="glass border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className={`font-bold text-xl ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* UID */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass border border-white/5 rounded-xl p-4"
      >
        <p className="text-gray-500 text-xs mb-1">User ID</p>
        <div className="flex items-center gap-2">
          <p className="text-gray-400 text-xs font-mono flex-1 truncate">{userProfile?.uid}</p>
          <button
            onClick={() => { copyToClipboard(userProfile?.uid || ''); toast.success('UID copied!'); }}
            className="text-gray-500 hover:text-white text-xs transition-colors"
          >
            📋
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
