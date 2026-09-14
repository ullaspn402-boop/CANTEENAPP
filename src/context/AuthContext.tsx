import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { User, UserRole } from '../types.ts';
import { buildApiUrl } from '../lib/apiClient.ts';
import { isOfficialCanteenAccount } from '../db/canteenProfile.ts';

export interface AuthNotice {
  type: 'info' | 'warning' | 'error';
  message: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole | null;
  token: string | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  authNotice: AuthNotice | null;
  clearAuthNotice: () => void;
  loginWithGoogle: (targetRole?: UserRole) => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  authHeaders: () => Record<string, string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<AuthNotice | null>(null);

  const clearAuthNotice = useCallback(() => {
    setAuthNotice(null);
  }, []);

  // Auto-dismiss authNotice after 5 seconds
  useEffect(() => {
    if (authNotice) {
      const timer = setTimeout(() => setAuthNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [authNotice]);

  const authHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const refreshUser = useCallback(async (activeToken?: string) => {
    const tokenToUse = activeToken || token;
    if (!tokenToUse) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(buildApiUrl('/api/auth/me'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToUse}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const isOfficial = isOfficialCanteenAccount(data.user.email);
          const verifiedRole = isOfficial ? (data.user.role as UserRole) : 'student';
          setUser({ ...data.user, role: verifiedRole });
          setRole(verifiedRole);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn('Profile retrieval notice:', err.message || res.status);
      }
    } catch (err: any) {
      console.warn('Network issue during user profile sync:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const idToken = await fUser.getIdToken();
          setToken(idToken);
          await refreshUser(idToken);
        } catch (e: any) {
          console.warn('ID token fetch warning:', e?.message || e);
          setLoading(false);
        }
      } else {
        setToken(null);
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [refreshUser]);

  const switchRole = useCallback(async (newRole: UserRole) => {
    const userEmail = user?.email || firebaseUser?.email;
    const isOfficial = isOfficialCanteenAccount(userEmail);

    // STRICT ROLE-LOCK: Reject staff or admin access for any non-official accounts!
    if ((newRole === 'staff' || newRole === 'admin') && !isOfficial) {
      setAuthNotice({
        type: 'error',
        message:
          'Access Denied: Only the verified Official Canteen Account can access the Staff or Admin portal. Other accounts are restricted to the Student portal.',
      });
      return;
    }

    setRole(newRole);
    if (user) {
      setUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
    const roleDisplay =
      newRole === 'admin'
        ? 'Canteen Administrator'
        : newRole === 'staff'
        ? 'Canteen Staff'
        : 'Student';

    setAuthNotice({
      type: 'info',
      message: `Active portal switched to ${roleDisplay}.`,
    });

    if (token) {
      try {
        await fetch(buildApiUrl('/api/auth/role'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        });
      } catch (err) {
        console.warn('Role switch network sync notice:', err);
      }
    }
  }, [token, user, firebaseUser]);

  const loginWithGoogle = async (targetRole?: UserRole) => {
    setLoading(true);
    setAuthNotice(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setFirebaseUser(result.user);

      // Fetch verified PostgreSQL profile & role from backend
      const res = await fetch(buildApiUrl('/api/auth/me'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const userEmail = data.user.email || result.user.email;
          const isOfficial = isOfficialCanteenAccount(userEmail);

          let effectiveRole: UserRole = 'student';
          if (isOfficial) {
            effectiveRole = targetRole || (data.user.role as UserRole) || 'admin';
          } else {
            effectiveRole = 'student';
            if (targetRole && targetRole !== 'student') {
              setAuthNotice({
                type: 'warning',
                message:
                  'Access to Staff & Admin portals is strictly reserved for the verified Official Canteen Account. You have been signed in to the Student Portal.',
              });
            }
          }

          setUser({ ...data.user, role: effectiveRole });
          setRole(effectiveRole);
          setIsLoginModalOpen(false);

          if (isOfficial && targetRole && targetRole !== data.user.role) {
            fetch(buildApiUrl('/api/auth/role'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
              body: JSON.stringify({ role: targetRole }),
            }).catch(() => {});
          }

          if (!targetRole || targetRole === 'student' || isOfficial) {
            const roleDisplay =
              effectiveRole === 'admin'
                ? 'Canteen Administrator'
                : effectiveRole === 'staff'
                ? 'Canteen Staff'
                : 'Student';

            setAuthNotice({
              type: 'info',
              message: `Welcome, ${data.user.name || result.user.displayName}! Signed in as ${roleDisplay}.`,
            });
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Unable to load profile from database.');
      }
    } catch (error: any) {
      const errorCode = error?.code || '';
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request'
      ) {
        console.info('Google Sign-In popup closed by user.');
        setAuthNotice({
          type: 'info',
          message: 'Google sign-in was cancelled.',
        });
      } else if (errorCode === 'auth/popup-blocked') {
        setAuthNotice({
          type: 'warning',
          message: 'Google sign-in window was blocked by your browser. Please allow popups for this site and try again.',
        });
      } else if (errorCode === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        setAuthNotice({
          type: 'error',
          message: `Domain '${host}' is not in the Firebase Authorized Domains list. Please add '${host}' to Firebase Console > Authentication > Settings > Authorized domains.`,
        });
      } else {
        console.warn('Google Sign-In notice:', error?.message || error);
        setAuthNotice({
          type: 'error',
          message: error?.message || 'Google sign-in could not be completed. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setUser(null);
      setRole(null);
      setToken(null);
      setAuthNotice({
        type: 'info',
        message: 'Signed out successfully.',
      });
    } catch (error: any) {
      console.warn('Sign out warning:', error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role,
        token,
        loading,
        isLoginModalOpen,
        setIsLoginModalOpen,
        authNotice,
        clearAuthNotice,
        loginWithGoogle,
        switchRole,
        logout,
        authHeaders,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
