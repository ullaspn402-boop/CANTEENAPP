import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { CanteenProvider } from './context/CanteenContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { StudentHome } from './components/student/StudentHome.tsx';
import { OrderHistory } from './components/student/OrderHistory.tsx';
import { ReviewsPage } from './components/student/ReviewsPage.tsx';
import { CartCheckoutDrawer } from './components/student/CartCheckoutDrawer.tsx';
import { DigitalTokenModal } from './components/student/DigitalTokenModal.tsx';
import { OrderPlacedSummaryModal } from './components/student/OrderPlacedSummaryModal.tsx';
import { OrderCompletedSummaryModal } from './components/common/OrderCompletedSummaryModal.tsx';
import { StudentAIAssistant } from './components/student/StudentAIAssistant.tsx';
import { StaffDashboard } from './components/staff/StaffDashboard.tsx';
import { InventoryManager } from './components/staff/InventoryManager.tsx';
import { StaffMenuAvailability } from './components/staff/StaffMenuAvailability.tsx';
import { MenuManager } from './components/admin/MenuManager.tsx';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard.tsx';
import { SmartIntelligence } from './components/admin/SmartIntelligence.tsx';
import { FeedbackManager } from './components/admin/FeedbackManager.tsx';
import { AdminSystemHealth } from './components/admin/AdminSystemHealth.tsx';
import { LoginModal } from './components/auth/LoginModal.tsx';
import { CanteenStatus, Order } from './types.ts';
import { buildApiUrl } from './lib/apiClient.ts';

function CanteenAppContent() {
  const { user, firebaseUser, role, loading, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const { isCartOpen, setIsCartOpen, activeOrder, setActiveOrder } = useCart();
  const [currentTab, setCurrentTab] = useState<string>('menu');
  const [canteenStatus, setCanteenStatus] = useState<CanteenStatus | null>(null);
  const [selectedTokenOrder, setSelectedTokenOrder] = useState<Order | null>(null);
  const [orderPlacedSummary, setOrderPlacedSummary] = useState<Order | null>(null);
  const [orderCompletedSummary, setOrderCompletedSummary] = useState<Order | null>(null);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // Sync tab with role
  useEffect(() => {
    if (role === 'student') setCurrentTab('menu');
    else if (role === 'staff') setCurrentTab('queue');
    else if (role === 'admin') setCurrentTab('analytics');
  }, [role]);

  // Fetch canteen status
  const fetchStatus = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch(buildApiUrl('/api/canteen/status'));
      if (res.ok) {
        const data = await res.json();
        setCanteenStatus(data);
      }
    } catch (e: any) {
      console.warn('Canteen status poll notice:', e?.message || e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchStatus();
      }
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setOrderPlacedSummary(order);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
          <span className="font-black text-xl">CB</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-600 text-sm font-medium">
          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span>Verifying campus session...</span>
        </div>
      </div>
    );
  }

  const isAuthenticated = Boolean(firebaseUser && user && role);

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        canteenStatus={canteenStatus}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Router based on Role & Tab */}
      <main className="flex-1 pb-16">
        {/* UNAUTHENTICATED LOGIN EXPERIENCE */}
        {!isAuthenticated && (
          <LoginModal />
        )}

        {/* STUDENT VIEWS */}
        {isAuthenticated && role === 'student' && (
          <>
            {currentTab === 'menu' && (
              <StudentHome
                canteenStatus={canteenStatus}
                onOpenTokenTracker={() => {
                  if (activeOrder) setSelectedTokenOrder(activeOrder);
                }}
                onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
                onOpenReviews={() => setCurrentTab('reviews')}
              />
            )}
            {currentTab === 'orders' && (
              <OrderHistory
                onSelectOrder={(ord) => setSelectedTokenOrder(ord)}
              />
            )}
            {currentTab === 'reviews' && (
              <ReviewsPage
                onBrowseMenu={() => setCurrentTab('menu')}
                onViewTokens={() => setCurrentTab('orders')}
              />
            )}
          </>
        )}

        {/* STAFF VIEWS */}
        {isAuthenticated && role === 'staff' && (
          <>
            {currentTab === 'queue' && <StaffDashboard />}
            {currentTab === 'inventory' && <InventoryManager />}
            {currentTab === 'menu-mgmt' && <MenuManager />}
            {currentTab === 'availability' && <StaffMenuAvailability />}
          </>
        )}

        {/* ADMIN VIEWS */}
        {isAuthenticated && role === 'admin' && (
          <>
            {currentTab === 'analytics' && (
              <AnalyticsDashboard
                canteenStatus={canteenStatus}
                onStatusUpdated={(st) => setCanteenStatus(st)}
              />
            )}
            {currentTab === 'intelligence' && <SmartIntelligence />}
            {currentTab === 'menu-mgmt' && <MenuManager />}
            {currentTab === 'feedback' && <FeedbackManager />}
            {currentTab === 'health' && <AdminSystemHealth />}
          </>
        )}
      </main>

      {/* Standalone Login Modal when triggered */}
      {isLoginModalOpen && (
        <LoginModal isModal onClose={() => setIsLoginModalOpen(false)} />
      )}

      {/* Cart & Checkout Drawer */}
      <CartCheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Digital Token & Tracker Modal */}
      {selectedTokenOrder && (
        <DigitalTokenModal
          order={selectedTokenOrder}
          onClose={() => setSelectedTokenOrder(null)}
          onOrderUpdated={(updated) => {
            if (activeOrder?.id === updated.id) {
              if (updated.status === 'completed') {
                setActiveOrder(null);
                setSelectedTokenOrder(null);
                setOrderCompletedSummary(updated);
              } else {
                setActiveOrder(updated);
              }
            }
          }}
        />
      )}

      {/* Student Order Placed Summary Modal */}
      <OrderPlacedSummaryModal
        isOpen={Boolean(orderPlacedSummary)}
        order={orderPlacedSummary}
        onClose={() => setOrderPlacedSummary(null)}
        onTrackOrder={(ord) => {
          setOrderPlacedSummary(null);
          setSelectedTokenOrder(ord);
        }}
      />

      {/* Student Order Completed Summary Modal */}
      <OrderCompletedSummaryModal
        isOpen={Boolean(orderCompletedSummary)}
        order={orderCompletedSummary}
        viewerRole="student"
        onClose={() => setOrderCompletedSummary(null)}
      />

      {/* Resilient Student AI Assistant Drawer */}
      <StudentAIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-200 bg-white py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <span>CampusBite • Smart College Food Ordering Platform</span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <CanteenProvider>
        <CartProvider>
          <CanteenAppContent />
        </CartProvider>
      </CanteenProvider>
    </AuthProvider>
  );
}

export default App;
