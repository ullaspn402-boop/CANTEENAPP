import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Utensils, ChefHat, ShieldCheck, AlertCircle, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { OfficialCanteenRegistrationModal } from './OfficialCanteenRegistrationModal.tsx';

interface LoginModalProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isModal = false, onClose }) => {
  const { loginWithGoogle, loading, authNotice, clearAuthNotice } = useAuth();
  const [selectedRole, setSelectedRole] = React.useState<'student' | 'staff' | 'admin'>('student');
  const [isOfficialModalOpen, setIsOfficialModalOpen] = React.useState(false);

  const handleSignIn = async () => {
    try {
      await loginWithGoogle(selectedRole);
      if (onClose) onClose();
    } catch {
      // Error handling is managed inside AuthContext and reflected in authNotice
    }
  };

  const content = (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-100/80 overflow-hidden relative">
      {/* Decorative gradient header banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 px-8 pt-8 pb-7 text-white text-center relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span>Campus Canteen Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center gap-2">
          Campus<span className="text-amber-200">Bite</span>
        </h2>
        <p className="text-amber-100 text-xs sm:text-sm mt-1 font-medium">
          Zero-Queue College Food Ordering & Management
        </p>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <div className="text-center mb-5">
          <h3 className="text-xl font-bold text-neutral-900">
            Sign in with Google
          </h3>
          <p className="text-sm font-medium text-neutral-600 mt-1">
            Use your campus Google account to continue.
          </p>
        </div>

        {/* Portal / Role Selection Tabs */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 text-center">
            Select Portal to Access:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
              }`}
            >
              <Utensils className={`w-4 h-4 mx-auto mb-1 ${selectedRole === 'student' ? 'text-white' : 'text-amber-600'}`} />
              <div className="text-xs font-bold">Student</div>
              <div className={`text-[10px] ${selectedRole === 'student' ? 'text-amber-100' : 'text-neutral-400'}`}>Order & Token</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('staff')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                selectedRole === 'staff'
                  ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/20 scale-[1.02]'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
              }`}
            >
              <ChefHat className={`w-4 h-4 mx-auto mb-1 ${selectedRole === 'staff' ? 'text-white' : 'text-orange-600'}`} />
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                <span>Staff</span>
                <span className="text-[10px] opacity-75">🔒</span>
              </div>
              <div className={`text-[10px] ${selectedRole === 'staff' ? 'text-orange-100' : 'text-neutral-400'}`}>Kitchen & Prep</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20 scale-[1.02]'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 mx-auto mb-1 ${selectedRole === 'admin' ? 'text-white' : 'text-blue-600'}`} />
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                <span>Admin</span>
                <span className="text-[10px] opacity-75">🔒</span>
              </div>
              <div className={`text-[10px] ${selectedRole === 'admin' ? 'text-blue-100' : 'text-neutral-400'}`}>Edit Menu & Ops</div>
            </button>
          </div>

          {/* Official Account Restriction Advisory */}
          {selectedRole !== 'student' && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold">Official Canteen Account Only:</span> {selectedRole === 'admin' ? 'Admin' : 'Staff'} portal access is strictly reserved for the registered canteen email. Other campus accounts will sign in as Student.
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Error / Notice Banner */}
        {authNotice && (
          <div
            className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              authNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : authNotice.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {authNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{authNotice.message}</div>
            <button
              onClick={clearAuthNotice}
              className="text-neutral-400 hover:text-neutral-600 font-bold ml-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Real Google OAuth Button */}
        <button
          id="google-login-action-btn"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-semibold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-white">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Authenticating with Google...</span>
            </div>
          ) : (
            <>
              {/* Official Google 'G' Logo */}
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <span>Continue with Google as {selectedRole === 'admin' ? 'Administrator' : selectedRole === 'staff' ? 'Staff' : 'Student'}</span>
            </>
          )}
        </button>

        {/* Official Canteen Registration Link */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOfficialModalOpen(true)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Canteen Staff & Admin: Register Official Account</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Server-side verified access via PostgreSQL</span>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        {content}
      </div>
      <OfficialCanteenRegistrationModal
        isOpen={isOfficialModalOpen}
        onClose={() => setIsOfficialModalOpen(false)}
      />
    </>
  );
};
