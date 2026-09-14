import React, { useState, useEffect } from 'react';
import { Order } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCart } from '../../context/CartContext.tsx';
import {
  Clock,
  Receipt,
  RotateCcw,
  Star,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface OrderHistoryProps {
  onSelectOrder: (order: Order) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onSelectOrder }) => {
  const { authHeaders } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/my-orders', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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
        <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-xl">
          {orders.length} orders placed
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
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
                  Total Paid / Due: <span className="font-extrabold text-neutral-900 text-sm">₹{order.totalAmount}</span>
                  <span className="ml-2 text-[11px] text-neutral-400">(Pay at Canteen)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReorder(order)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reorder
                  </button>

                  <button
                    onClick={() => onSelectOrder(order)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>{order.status === 'completed' ? 'View Token / Review' : 'Track Token'}</span>
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
