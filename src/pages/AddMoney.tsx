import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminSettings } from '../services/userService';
import { submitDeposit } from '../services/walletService';
import { uploadImage } from '../services/cloudinary';
import toast from 'react-hot-toast';
import type { AdminSettings } from '../types';

const AddMoney: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAdminSettings().then(setSettings).catch(console.error);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    const amt = Number(amount);
    if (!amt || amt < (settings?.minDeposit || 100)) { toast.error(`Minimum deposit is ₹${settings?.minDeposit || 100}`); return; }
    if (amt > (settings?.maxDeposit || 50000)) { toast.error(`Maximum deposit is ₹${settings?.maxDeposit || 50000}`); return; }
    if (!utrNumber.trim()) { toast.error('UTR/Transaction ID is required'); return; }

    setSubmitting(true);
    let screenshotUrl = '';
    
    try {
      if (screenshot) {
        setUploading(true);
        const result = await uploadImage(screenshot, 'screenshots', setUploadProgress);
        screenshotUrl = result.url;
        setUploading(false);
      }

      await submitDeposit(userProfile.uid, userProfile.displayName, userProfile.email, amt, utrNumber, screenshotUrl);
      toast.success('Deposit request submitted! Awaiting admin approval. 🎉');
      navigate('/wallet');
    } catch (err) {
      toast.error('Submission failed. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-gray-400">←</button>
        <div>
          <h1 className="text-2xl font-bold text-white">💳 Add Money</h1>
          <p className="text-gray-400 text-sm">Scan QR and submit payment details</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-2xl p-6 text-center"
        >
          <h3 className="text-white font-semibold mb-4">📱 Scan QR Code to Pay</h3>
          
          {settings?.paymentQrUrl ? (
            <img src={settings.paymentQrUrl} alt="Payment QR" className="w-48 h-48 mx-auto rounded-xl border border-white/10" />
          ) : (
            <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center">
              {/* Generated QR placeholder */}
              <div className="w-40 h-40 grid grid-cols-8 gap-0.5">
                {Array.from({ length: 64 }, (_, i) => (
                  <div
                    key={i}
                    className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'} rounded-sm`}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-white/5 rounded-xl">
            <p className="text-gray-400 text-xs mb-1">UPI ID</p>
            <p className="text-white font-medium">{settings?.upiId || 'gamezone@upi'}</p>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
              <p className="text-gray-400 text-xs">Min Deposit</p>
              <p className="text-green-400 font-bold">₹{settings?.minDeposit || 100}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <p className="text-gray-400 text-xs">Max Deposit</p>
              <p className="text-blue-400 font-bold">₹{settings?.maxDeposit || 50000}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-yellow-400 text-xs font-medium">⚠️ Important</p>
            <p className="text-gray-400 text-xs mt-1">After payment, enter the UTR/Transaction ID below. Admin will verify and credit your wallet within 5-15 minutes.</p>
          </div>
        </motion.div>

        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-4">💰 Payment Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Min ₹${settings?.minDeposit || 100}`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500/50 transition-all"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {quickAmounts.map(a => (
                  <button key={a} type="button" onClick={() => setAmount(String(a))}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${Number(amount) === a ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    ₹{a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">UTR / Transaction ID *</label>
              <input
                type="text"
                value={utrNumber}
                onChange={e => setUtrNumber(e.target.value)}
                placeholder="Enter 12-digit UTR number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Payment Screenshot (Optional)</label>
              {screenshotPreview ? (
                <div className="relative">
                  <img src={screenshotPreview} alt="Screenshot" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                  <button type="button" onClick={() => { setScreenshot(null); setScreenshotPreview(''); }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 transition-all"
                >
                  <span className="text-3xl mb-2">📸</span>
                  <p className="text-gray-400 text-sm">Click to upload screenshot</p>
                  <p className="text-gray-600 text-xs">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {uploading && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg transition-all hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
            >
              {submitting ? '⏳ Submitting...' : '✅ Submit Payment Request'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddMoney;
