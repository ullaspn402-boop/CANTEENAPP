import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Camera,
  Upload,
  Video,
  RotateCw,
  Mail,
  Phone,
  User,
  Store,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
} from 'lucide-react';

interface OfficialCanteenRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OfficialCanteenRegistrationModal: React.FC<OfficialCanteenRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, firebaseUser, authHeaders, refreshUser, switchRole } = useAuth();
  const [operatorName, setOperatorName] = useState(user?.name || firebaseUser?.displayName || '');
  const [officialEmail, setOfficialEmail] = useState(user?.email || firebaseUser?.email || '');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [canteenName, setCanteenName] = useState('Campus Central Food Court');
  const [campusName, setCampusName] = useState('Main University Campus, Engineering Block A');
  const [showPasscode, setShowPasscode] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(
    firebaseUser?.photoURL ||
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80'
  );
  const [photoInputMode, setPhotoInputMode] = useState<'camera' | 'upload' | 'url'>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setOfficialEmail(user.email);
    }
    if (user?.name) {
      setOperatorName(user.name);
    }
  }, [user]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setError('Camera access not granted or unavailable on this device. You can upload an image file instead.');
      setIsCameraActive(false);
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(dataUrl);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(buildApiUrl('/api/canteen/register-official'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          operatorName,
          officialEmail,
          phone,
          canteenName,
          campusName,
          photoUrl,
          passcode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Registration failed.');
      }

      setSuccess(`Official Canteen Account successfully verified for "${officialEmail}"!`);
      await refreshUser();
      await switchRole('admin');

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to verify official canteen credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-blue-100">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Canteen Authority Verification</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mt-3">
            Register Official Canteen Account
          </h2>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">
            Only this verified official email and account will be authorized to update the menu list, change prices, and add dishes.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neutral-500" />
              <span>Canteen Operator / Head Name</span>
            </label>
            <input
              type="text"
              required
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="e.g. Ullas (Head of Canteen Operations)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-neutral-500" />
              <span>Official Registered Email (Authorized Account)</span>
            </label>
            <input
              type="email"
              required
              value={officialEmail}
              onChange={(e) => setOfficialEmail(e.target.value)}
              placeholder="official.canteen@campus.edu"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              When logging in with Google, you must sign in with this official email to manage the food menu.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-neutral-500" />
              <span>College / University / Campus Name *</span>
            </label>
            <input
              type="text"
              required
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
              placeholder="e.g. RV College of Engineering, Oxford Campus"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              This college name will be prominently displayed in the student portal so students can identify and order from their canteen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-neutral-500" />
                <span>Canteen Stall Name *</span>
              </label>
              <input
                type="text"
                required
                value={canteenName}
                onChange={(e) => setCanteenName(e.target.value)}
                placeholder="Main Campus Canteen"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-500" />
                <span>Contact Phone</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Operator Photo Selector: Click Photo / Upload File / URL */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>Operator Photo Verification</span>
              </label>
              <div className="flex items-center gap-1 p-0.5 bg-neutral-200/80 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoInputMode('camera');
                    startCamera();
                  }}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    photoInputMode === 'camera'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>Click Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setPhotoInputMode('upload');
                  }}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    photoInputMode === 'upload'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setPhotoInputMode('url');
                  }}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    photoInputMode === 'url'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <span>URL Preset</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Live Webcam Snapshot */}
            {photoInputMode === 'camera' && (
              <div className="space-y-2">
                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-48 flex items-center justify-center shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                    <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={captureSnapshot}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Snapshot</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 bg-neutral-800 text-white font-medium text-xs rounded-xl hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-4 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl bg-blue-50/50 flex flex-col items-center justify-center gap-1.5 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Video className="w-6 h-6 text-blue-600" />
                    <span>Click to Start Device Camera & Snap Live Photo</span>
                  </button>
                )}
              </div>
            )}

            {/* Mode 2: File Upload */}
            {photoInputMode === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 px-4 border-2 border-dashed border-neutral-300 hover:border-blue-400 rounded-2xl bg-white flex items-center justify-center gap-2 text-neutral-700 hover:text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Choose Photo from Device (JPG, PNG, WEBP)</span>
                </button>
              </div>
            )}

            {/* Mode 3: Direct URL */}
            {photoInputMode === 'url' && (
              <div>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Current Active Preview */}
            <div className="flex items-center gap-3 pt-1 border-t border-neutral-200/60">
              <div className="w-12 h-12 rounded-xl bg-neutral-200 overflow-hidden border border-neutral-300 flex-shrink-0 shadow-2xs">
                <img
                  src={photoUrl}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src =
                      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Active Photo Preview
                </span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Photo Ready for Verification
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                <span>Official Canteen Verification Passcode *</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasscode ? 'Hide Passcode' : 'Show Passcode'}</span>
              </button>
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Authorized Master Passkey"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-blue-300 bg-blue-50/50 font-mono text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                title={showPasscode ? 'Hide Passcode' : 'Show Passcode'}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              Authorized Canteen Master Passkey issued by campus administration
            </p>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{loading ? 'Verifying & Registering...' : 'Register as Verified Canteen Operator'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
