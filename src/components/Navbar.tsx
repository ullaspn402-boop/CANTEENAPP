import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useCanteen } from '../context/CanteenContext.tsx';
import { CanteenStatus, Notification } from '../types.ts';
import { buildApiUrl } from '../lib/apiClient.ts';
import { OfficialCanteenRegistrationModal } from './auth/OfficialCanteenRegistrationModal.tsx';
import { CanteenSelectorModal } from './student/CanteenSelectorModal.tsx';
import { TransferOfficialAccountModal } from './common/TransferOfficialAccountModal.tsx';
import { isOfficialCanteenAccount } from '../db/canteenProfile.ts';
import {
  ShoppingBag,
  Bell,
  Utensils,
  ChefHat,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronDown,
  LogOut,
  LogIn,
  CheckCircle2,
  Check,
  AlertCircle,
  BarChart3,
  Brain,
  MessageSquare,
  Package,
  Activity,
  X,
  Info,
  Store,
  Navigation,
  Compass,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  canteenStatus: CanteenStatus | null;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  canteenStatus,
  onOpenCart,
}) => {
  const {
    user,
    firebaseUser,
    role,
    loginWithGoogle,
    switchRole,
    logout,
    authHeaders,
    authNotice,
    clearAuthNotice,
  } = useAuth();
  const { totalItems, activeOrder } = useCart();
  const {
    selectedCanteen,
    isCanteenSelectorOpen,
    setIsCanteenSelectorOpen,
    distanceMeters,
    isInsideCampus,
    detectLocation,
  } = useCanteen();
  const [showNotifs, setShowNotifs] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isOfficialRegOpen, setIsOfficialRegOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOfficial = isOfficialCanteenAccount(user?.email || firebaseUser?.email);

  const handleSwitchPortal = async (newRole: any) => {
    setIsRoleDropdownOpen(false);
    if ((newRole === 'staff' || newRole === 'admin') && !isOfficial) {
      setIsOfficialRegOpen(true);
      return;
    }
    await switchRole(newRole);
    if (newRole === 'student') setCurrentTab('menu');
    else if (newRole === 'staff') setCurrentTab('queue');
    else if (newRole === 'admin') setCurrentTab('menu-mgmt');
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch(buildApiUrl('/api/notifications'), { headers: authHeaders() });
      if (res.ok) {
        const notifs: Notification[] = await res.json();
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      }
    } catch (e: any) {
      console.warn('Notifications poll notice:', e?.message || e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchNotifications();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [user, role]);

  const markAllAsRead = async () => {
    try {
      await fetch(buildApiUrl('/api/notifications/mark-all-read'), {
        method: 'POST',
        headers: authHeaders(),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e: any) {
      console.warn('Mark all read notice:', e?.message || e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Status Badge */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab(role === 'student' ? 'menu' : role === 'staff' ? 'queue' : 'analytics')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-neutral-900 block leading-tight">
                  Campus<span className="text-amber-600">Bite</span>
                </span>
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">
                  Smart College Canteen
                </span>
              </div>
            </button>

            {/* Live Status Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-neutral-200">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  canteenStatus?.isOpen
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    canteenStatus?.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                {canteenStatus?.isOpen ? 'Canteen OPEN' : 'Canteen CLOSED'}
              </span>

              {canteenStatus?.isOpen && (
                <span className="inline-flex items-center gap-1 text-xs text-neutral-600 font-medium px-2 py-0.5 bg-neutral-100 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ~{canteenStatus?.currentWaitTimeMinutes || 8} min wait
                </span>
              )}
            </div>

            {/* Active Campus Canteen Selector Pill with Location Proximity */}
            {role === 'student' && (
              <button
                id="navbar-canteen-select-btn"
                onClick={() => setIsCanteenSelectorOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
                title="Click to view or change your active campus canteen"
              >
                <Store className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="truncate max-w-[130px]">
                  {selectedCanteen?.canteenName || 'Select Canteen'}
                </span>
                {distanceMeters !== null ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-semibold flex items-center gap-0.5">
                    <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                    {distanceMeters < 1000 ? `${distanceMeters}m` : `${(distanceMeters / 1000).toFixed(1)}km`}
                  </span>
                ) : (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-md font-semibold">
                    Official
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Navigation Links based on role */}
          <nav className="hidden md:flex items-center gap-1">
            {role === 'student' && (
              <>
                <button
                  onClick={() => setCurrentTab('menu')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'menu'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  Browse Menu
                </button>
                <button
                  onClick={() => setCurrentTab('orders')}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'orders'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  My Tokens & History
                  {activeOrder && (
                    <span className="ml-1.5 inline-flex items-center px-2 py-0.2 text-[11px] font-bold bg-amber-500 text-white rounded-full animate-bounce">
                      #{activeOrder.tokenNumber}
                    </span>
                  )}
                </button>
              </>
            )}

            {role === 'staff' && (
              <>
                <button
                  onClick={() => setCurrentTab('queue')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'queue'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  Live Order Queue
                </button>
                <button
                  onClick={() => setCurrentTab('inventory')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'inventory'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  Inventory & Prep
                </button>
                <button
                  onClick={() => setCurrentTab('menu-mgmt')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'menu-mgmt'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  Menu & Price Manager
                </button>
              </>
            )}

            {role === 'admin' && (
              <>
                <button
                  onClick={() => setCurrentTab('analytics')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'analytics'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
                <button
                  onClick={() => setCurrentTab('intelligence')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'intelligence'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Brain className="w-4 h-4 text-amber-600" />
                  Smart Intelligence (ML)
                </button>
                <button
                  onClick={() => setCurrentTab('menu-mgmt')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'menu-mgmt'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Menu & Categories
                </button>
                <button
                  onClick={() => setCurrentTab('feedback')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'feedback'
                      ? 'bg-amber-50 text-amber-700 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Feedback
                </button>
                <button
                  onClick={() => setCurrentTab('health')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'health'
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-600" />
                  System Health
                </button>
              </>
            )}
          </nav>

          {/* Right Action Icons: Verified Role Badge, Google Auth, Cart, Notifications */}
          <div className="flex items-center gap-2 sm:gap-3">
            {firebaseUser && user ? (
              <>
                {/* Portal & Role Display: Students have static Student Portal badge, Official account has portal switcher */}
                {!isOfficial ? (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200 bg-amber-50 text-amber-900 shadow-2xs select-none"
                    title="Student Portal Verified"
                  >
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Student Portal</span>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      id="role-switcher-btn"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs transition-all hover:scale-[1.02] cursor-pointer ${
                        role === 'admin'
                          ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900'
                          : role === 'staff'
                          ? 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-900'
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                      }`}
                      title="Official Canteen Operator: Switch Portal"
                    >
                      {role === 'student' && <Utensils className="w-3.5 h-3.5 text-amber-600" />}
                      {role === 'staff' && <ChefHat className="w-3.5 h-3.5 text-orange-600" />}
                      {role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                      <span>
                        {role === 'admin'
                          ? 'Admin Portal'
                          : role === 'staff'
                          ? 'Staff Portal'
                          : 'Student Portal'}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>

                    {isRoleDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-3.5 py-1.5 border-b border-neutral-100">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                            Official Canteen Portal Switcher
                          </span>
                        </div>
                        <div className="p-1 space-y-1">
                          <button
                            onClick={() => handleSwitchPortal('student')}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              role === 'student'
                                ? 'bg-amber-50 text-amber-900'
                                : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                <Utensils className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div>Student Portal</div>
                                <div className="text-[10px] text-neutral-400 font-normal">Browse & order food</div>
                              </div>
                            </div>
                            {role === 'student' && <Check className="w-4 h-4 text-amber-600" />}
                          </button>

                          <button
                            onClick={() => handleSwitchPortal('staff')}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              role === 'staff'
                                ? 'bg-orange-50 text-orange-900'
                                : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                                <ChefHat className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div>Canteen Staff Portal</div>
                                <div className="text-[10px] text-neutral-400 font-normal">Accept orders & payments</div>
                              </div>
                            </div>
                            {role === 'staff' && <Check className="w-4 h-4 text-orange-600" />}
                          </button>

                          <button
                            onClick={() => handleSwitchPortal('admin')}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              role === 'admin'
                                ? 'bg-blue-50 text-blue-900'
                                : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left">
                                <div>Administrator Portal</div>
                                <div className="text-[10px] text-neutral-400 font-normal">Update menu list & items</div>
                              </div>
                            </div>
                            {role === 'admin' && <Check className="w-4 h-4 text-blue-600" />}
                          </button>
                        </div>

                        {/* Official Email Transfer CTA for Verified Official Account */}
                        <div className="border-t border-neutral-100 p-2 mt-1 space-y-1.5">
                          <button
                            id="navbar-transfer-email-btn"
                            onClick={() => {
                              setIsRoleDropdownOpen(false);
                              setIsTransferModalOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Transfer official canteen authority to a new Gmail address with secret codes"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>Change / Transfer Official Email</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    id="notif-btn"
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 py-2 z-50">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-100">
                        <span className="font-bold text-xs text-neutral-900">Notifications ({notifications.length})</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] text-amber-600 hover:text-amber-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-neutral-400">No notifications yet</div>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 text-xs transition-colors ${
                                !n.isRead ? 'bg-amber-50/40' : 'hover:bg-neutral-50'
                              }`}
                            >
                              <div className="font-semibold text-neutral-900 flex items-center justify-between">
                                <span>{n.title}</span>
                                <span className="text-[10px] text-neutral-400 font-normal">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-neutral-600 mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Button (Visible for student or when items in cart) */}
                {(role === 'student' || totalItems > 0) && (
                  <button
                    id="cart-btn"
                    onClick={onOpenCart}
                    className="relative flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-medium text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span className="hidden sm:inline">Cart</span>
                    {totalItems > 0 && (
                      <span className="bg-white text-amber-700 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                        {totalItems}
                      </span>
                    )}
                  </button>
                )}

                {/* User Google Name, Avatar, and Sign Out */}
                <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs border border-amber-300 overflow-hidden shadow-2xs">
                    {firebaseUser.photoURL ? (
                      <img src={firebaseUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (user.name || firebaseUser.displayName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden lg:inline text-xs font-semibold text-neutral-800 max-w-[120px] truncate">
                    {user.name || firebaseUser.displayName || 'Campus User'}
                  </span>
                  <button
                    id="sign-out-btn"
                    onClick={logout}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* Clearly visible Sign in with Google button for unauthenticated users */
              <button
                id="navbar-google-signin-btn"
                onClick={loginWithGoogle}
                className="flex items-center gap-2.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Sign in with your campus Google account"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Auth Notice (Friendly non-blocking banner for cancellations, warnings, or sign-in status) */}
      {authNotice && (
        <div
          className={`border-t px-4 py-2 text-xs flex items-center justify-between transition-colors ${
            authNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : authNotice.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1">
            {authNotice.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            {authNotice.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />}
            {authNotice.type === 'info' && <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            <span className="font-medium">{authNotice.message}</span>
          </div>
          <button
            onClick={clearAuthNotice}
            className="p-1 hover:bg-black/5 rounded text-neutral-500 hover:text-neutral-800"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Announcement Bar if set by Canteen staff/admin */}
      {canteenStatus?.announcement && (
        <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 py-1.5 text-center text-xs text-amber-900 font-medium flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>{canteenStatus.announcement}</span>
        </div>
      )}

      {/* Official Canteen Registration & Verification Modal */}
      <OfficialCanteenRegistrationModal
        isOpen={isOfficialRegOpen}
        onClose={() => setIsOfficialRegOpen(false)}
        onSuccess={() => {
          setCurrentTab('menu-mgmt');
        }}
      />

      {/* Student Campus Canteen Selector Modal */}
      <CanteenSelectorModal
        isOpen={isCanteenSelectorOpen}
        onClose={() => setIsCanteenSelectorOpen(false)}
      />

      {/* Transfer Official Canteen Email / Account Modal */}
      <TransferOfficialAccountModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </header>
  );
};
