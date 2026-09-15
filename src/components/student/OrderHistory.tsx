import React, { useState, useEffect, useCallback } from 'react';
import { Order } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCart } from '../../context/CartContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import {
  Clock,
  Receipt,
  RotateCcw,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface OrderHistoryProps {
  onSelectOrder: (order: Order) => void;
  onViewPlacedSummary?: (order: Order) => void;
  onViewCompletedSummary?: (order: Order) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  onSelectOrder,
  onViewPlacedSummary,
  onViewCompletedSummary,
}) => {
  const { authHeaders } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl('/api/orders/my-orders'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || `Server error (${res.status}). Please refresh.`);
      }
    } catch (err: any) {
      console.warn('Order history fetch error:', err?.message || err);
      setError('Unable to load orders. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(true);
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 8s so live order status updates appear
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchOrders(true);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleReorder = (order: Order) => {
    if (!order.items) return;
    order.items.forEach((item) => {
      // Add items into cart
      addToCart({
        id: item.foodItemId,
        name: item.name || 'Food item',
        price: item.unitPrice,
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
        categoryId: 1,
        description: '',
        isVeg: item.isVeg ?? true,
        isAvailable: true,
        prepTimeMinutes: 10,
        rating: 4.8,
        ratingCount: 50,
        totalOrders: 100,
      });
    });
    setIsCartOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Confirmed
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1 animate-bounce">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Ready for Pickup
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Your Tokens & Order History</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Track ongoing meal tokens or re-order your favorite campus meals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-xl">
            {orders.length} orders
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-neutral-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-800">Could not load orders</p>
            <p className="text-rose-600 text-xs mt-0.5">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !error && orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200 p-8">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">No orders yet</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Once you order meals or snacks from the canteen, your digital tokens and tracking will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all p-5"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="px-3 py-1 bg-amber-600 text-white rounded-xl font-mono font-black text-sm shadow-xs">
                    #{order.tokenNumber}
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 block">
                      {new Date(order.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Items */}
              <div className="py-3 flex flex-wrap gap-2">
                {order.items?.map((it) => (
                  <span
                    key={it.id}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-lg text-neutral-800"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        it.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {it.name} <span className="text-neutral-400">×{it.quantity}</span>
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-neutral-500">
                  <span className="font-extrabold text-neutral-900 text-sm">₹{order.totalAmount}</span>
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.paymentStatus === 'paid' ? '✓ PAID' : 'Pay at Counter'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReorder(order)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reorder
                  </button>

                  {order.status === 'completed' && onViewCompletedSummary && (
                    <button
                      onClick={() => onViewCompletedSummary(order)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="View Final Order Summary & Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Receipt Summary</span>
                    </button>
                  )}

                  {order.status !== 'completed' && onViewPlacedSummary && (
                    <button
                      onClick={() => onViewPlacedSummary(order)}
                      className="px-3.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="View Order Placement Summary Ticket"
                    >
                      <Receipt className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Order Summary</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectOrder(order)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>{order.status === 'completed' ? 'Token / Review' : 'Track Live'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
