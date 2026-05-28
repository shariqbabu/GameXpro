// ============================================================
// PROFILE PAGE
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWallet } from '../hooks/useWallet';
import { updateUserProfile } from '../services/adminService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { formatCurrency } from '../utils/wallet';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { wallet } = useWallet();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setUploadingPhoto(true);
    try {
      const result = await uploadToCloudinary(file);
      await updateUserProfile(user.uid, { photoURL: result.url });
      setUser({ ...user, photoURL: result.url });
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { name, phone });
      setUser({ ...user, name, phone });
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-purple-400" /> My Profile
        </h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center overflow-hidden border-2 border-purple-500/30">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-500 transition-all">
              {uploadingPhoto ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              {user?.isAdmin && (
                <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <p className="text-slate-500 text-xs mt-1">
              Member since {user?.createdAt?.toDate ? format(user.createdAt.toDate(), 'MMMM yyyy') : 'N/A'}
            </p>
            <div className="mt-3 flex items-center justify-center md:justify-start gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                user?.status === 'active' ? 'badge-approved' : 'badge-rejected'
              }`}>
                {user?.status}
              </span>
              <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">
                Code: {user?.referralCode}
              </span>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-xl text-sm font-medium glass-card-light text-slate-300 hover:text-white transition-all border border-white/10"
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Edit Form */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-white/5 space-y-4"
          >
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-casino" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-casino" />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Balance', value: formatCurrency(wallet?.totalBalance || 0), icon: '💰', color: 'text-yellow-400' },
          { label: 'Total Won', value: formatCurrency(user?.totalWon || 0), icon: '🏆', color: 'text-green-400' },
          { label: 'Games Played', value: user?.totalPlayed?.toString() || '0', icon: '🎮', color: 'text-purple-400' },
          { label: 'Total Deposited', value: formatCurrency(user?.totalDeposit || 0), icon: '💳', color: 'text-blue-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" /> Account Information
        </h2>
        <div className="space-y-3">
          {[
            { label: 'User ID', value: user?.uid },
            { label: 'Email', value: user?.email },
            { label: 'Phone', value: user?.phone },
            { label: 'Referral Code', value: user?.referralCode },
            { label: 'Last Login', value: user?.lastLogin?.toDate ? format(user.lastLogin.toDate(), 'MMM d, yyyy h:mm a') : 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="text-white text-sm font-medium truncate max-w-[200px]">{value || 'N/A'}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
