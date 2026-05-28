// ============================================================
// DEPOSIT PAGE - WITH CLOUDINARY UPLOAD
// ============================================================

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, QrCode, ArrowDownToLine } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { createDeposit } from '../services/walletService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import toast from 'react-hot-toast';

export function DepositPage() {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt)) newErrors.amount = 'Amount is required';
    else if (amt < 100) newErrors.amount = 'Minimum deposit is ₹100';
    else if (amt > 100000) newErrors.amount = 'Maximum deposit is ₹1,00,000';
    if (!utrNumber) newErrors.utrNumber = 'UTR number is required';
    else if (!/^\d{12}$/.test(utrNumber)) newErrors.utrNumber = 'UTR must be exactly 12 digits';
    if (!screenshot) newErrors.screenshot = 'Payment screenshot is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadToCloudinary(file, (prog) => setUploadProgress(prog.percent));
      setScreenshot(result.url);
      toast.success('Screenshot uploaded successfully!');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user?.uid) return;

    setIsSubmitting(true);
    try {
      await createDeposit(user.uid, parseFloat(amount), utrNumber, screenshot!);
      setSuccess(true);
      setAmount('');
      setUtrNumber('');
      setScreenshot(null);
      toast.success('Deposit request submitted! Admin will verify shortly.');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to submit deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Deposit Submitted!</h2>
          <p className="text-slate-400 mb-6">Your deposit request has been received. Admin will verify within 24 hours.</p>
          <button
            onClick={() => setSuccess(false)}
            className="btn-primary px-8 py-3 rounded-xl font-semibold text-white"
          >
            Make Another Deposit
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowDownToLine className="w-6 h-6 text-green-400" /> Add Money
        </h1>
        <p className="text-slate-400 text-sm mt-1">Deposit via UPI to add funds to your wallet</p>
      </motion.div>

      {/* UPI QR Code Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-yellow-400" /> Scan & Pay
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center flex-shrink-0 p-3">
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center flex-col gap-1">
              <QrCode className="w-16 h-16 text-gray-700" />
              <p className="text-xs text-gray-500">UPI QR Code</p>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-slate-400 text-sm mb-3">Pay to this UPI ID:</p>
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-3">
              <p className="text-yellow-400 font-casino text-lg font-bold">royalbet@upi</p>
              <p className="text-slate-500 text-xs mt-1">RoyalBet Gaming Pvt. Ltd.</p>
            </div>
            <div className="space-y-1.5 text-sm text-slate-400">
              <p>✅ Minimum: ₹100</p>
              <p>✅ Maximum: ₹1,00,000</p>
              <p>✅ Processing: Within 24 hours</p>
            </div>
          </div>
        </div>
        {parseFloat(amount) > 0 && (
          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-purple-400 text-sm text-center">
              Please transfer <span className="font-bold">₹{parseFloat(amount).toLocaleString('en-IN')}</span> to the UPI ID above
            </p>
          </div>
        )}
      </motion.div>

      {/* Deposit Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Deposit Details</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter deposit amount (min ₹100)"
              className="input-casino"
            />
            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {[200, 500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className="px-3 py-1.5 rounded-lg text-sm glass-card-light text-slate-300 hover:text-white hover:border-purple-500/30 transition-all"
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payment Screenshot <span className="text-red-400">*</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragOver ? 'border-purple-400 bg-purple-500/10' :
                screenshot ? 'border-green-500/50 bg-green-500/5' : 'border-purple-900/50 hover:border-purple-500/50'
              }`}
            >
              {uploading ? (
                <div className="space-y-2">
                  <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 text-sm">Uploading... {uploadProgress}%</p>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : screenshot ? (
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
                  <p className="text-green-400 text-sm font-medium">Screenshot uploaded!</p>
                  <img src={screenshot} alt="Payment proof" className="w-32 h-20 object-cover rounded-lg mx-auto" />
                  <button type="button" onClick={() => setScreenshot(null)} className="text-xs text-slate-400 underline">
                    Remove & upload again
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Drag & drop or click to upload</p>
                  <p className="text-slate-500 text-xs mt-1">JPG, PNG, WEBP • Max 5MB</p>
                  <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
              )}
            </div>
            {errors.screenshot && <p className="text-red-400 text-xs mt-1">{errors.screenshot}</p>}
          </div>

          {/* UTR Number */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              UTR Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="12-digit UTR reference number"
              maxLength={12}
              className="input-casino font-mono tracking-wider"
            />
            {errors.utrNumber && <p className="text-red-400 text-xs mt-1">{errors.utrNumber}</p>}
            <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> UTR is the unique 12-digit transaction reference from your payment app
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="btn-primary w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </div>
            ) : 'Submit Deposit Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
