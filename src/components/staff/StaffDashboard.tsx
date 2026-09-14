import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import { OrderCompletedSummaryModal } from '../common/OrderCompletedSummaryModal.tsx';
import { TransferOfficialAccountModal } from '../common/TransferOfficialAccountModal.tsx';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  CreditCard,
  Check,
  User,
  Phone,
  Mail,
  Receipt,
  Eye,
  X,
  DollarSign,
  Bell,
  ShieldAlert,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { authHeaders } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(null);
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<Order | null>(null);
  const [completedSummaryOrder, setCompletedSummaryOrder] = useState<Order | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const previousOrderIdsRef = useRef<Set<number>>(new Set());

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const fetchStaffOrders = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch(buildApiUrl('/api/staff/orders'), { headers: authHeaders() });
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);

        // Detect new incoming order
        if (previousOrderIdsRef.current.size > 0) {
          const newlyArrived = data.find(
            (o) => !previousOrderIdsRef.current.has(o.id) && o.status === 'confirmed'
          );
          if (newlyArrived) {
            setNewOrderAlert(newlyArrived);
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 750;
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
              osc.start();
              osc.stop(ctx.currentTime + 0.35);
            } catch {}
          }
        }
        previousOrderIdsRef.current = new Set(data.map((o) => o.id));

        if (selectedDetailsOrder) {
          const updatedSelected = data.find((o) => o.id === selectedDetailsOrder.id);
          if (updatedSelected) setSelectedDetailsOrder(updatedSelected);
        }
      }
    } catch (err: any) {
      console.warn('Staff orders poll notice:', err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffOrders();
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchStaffOrders();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: number, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(buildApiUrl(`/api/staff/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Order status updated to "${nextStatus}".`);
        const target = orders.find((o) => o.id === orderId);
        if (nextStatus === 'completed' && target) {
          setCompletedSummaryOrder({ ...target, status: 'completed', completedAt: new Date() });
        }
        await fetchStaffOrders();
      }
    } catch (err: any) {
      console.warn('Update order status notice:', err?.message || err);
    } finally {
      setUpdatingId(null);
    }
  };

  const updateOrderPayment = async (orderId: number, newPaymentStatus: 'paid' | 'pay_at_canteen') => {
    setUpdatingPaymentId(orderId);
    try {
      const res = await fetch(buildApiUrl(`/api/staff/orders/${orderId}/payment`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });
      if (res.ok) {
        showToast(`Payment status verified & updated to "${newPaymentStatus.toUpperCase()}".`);
        await fetchStaffOrders();
      }
    } catch (err: any) {
      console.warn('Update order payment notice:', err?.message || err);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Stats calculation
  const activeOrders = orders.filter((o) => ['confirmed', 'preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Filtered orders
  const displayedOrders = orders.filter((o) => {
    if (statusFilter === 'active') return ['confirmed', 'preparing', 'ready'].includes(o.status);
    if (statusFilter === 'confirmed') return o.status === 'confirmed';
    if (statusFilter === 'preparing') return o.status === 'preparing';
    if (statusFilter === 'ready') return o.status === 'ready';
    if (statusFilter === 'completed') return o.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl border border-neutral-700 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* High-visibility New Order Alert Banner */}
      {newOrderAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold flex-shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>New Order Placed! Token #{newOrderAlert.tokenNumber}</span>
                <span className="text-xs bg-white text-orange-700 px-2 py-0.5 rounded-full font-black">
                  ₹{newOrderAlert.totalAmount}
                </span>
              </div>
              <div className="text-xs text-amber-100 mt-0.5">
                From: {newOrderAlert.customerName || 'Student'} • {newOrderAlert.items?.length || 1} item(s) to prepare
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStatusFilter('confirmed');
                setSelectedDetailsOrder(newOrderAlert);
                setNewOrderAlert(null);
              }}
              className="px-3 py-1.5 bg-white text-orange-700 hover:bg-neutral-100 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              View in Queue
            </button>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Kitchen Station Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Kitchen Display Station (KDS) & Order Processing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-1">
            Live Order Queue & Payment Verification
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="staff-transfer-email-btn"
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Transfer official canteen authority or change official email"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Transfer Official Email</span>
          </button>
          <button
            onClick={fetchStaffOrders}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-500 text-white rounded-2xl p-5 shadow-lg shadow-amber-500/15 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">Active Queue</span>
            <div className="text-3xl font-black mt-1">{activeOrders.length}</div>
            <span className="text-[11px] text-amber-100 mt-0.5 block">Orders being cooked or ready</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="text-3xl font-black text-neutral-900 mt-1">₹{totalRevenue}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
              From {completedOrders.length} fulfilled orders
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Avg Wait Target</span>
            <div className="text-3xl font-black text-neutral-900 mt-1">~8.5m</div>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">Zero counter line delay</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'active', label: `Active Queue (${activeOrders.length})` },
          { id: 'confirmed', label: 'Incoming / New' },
          { id: 'preparing', label: 'Cooking Now' },
          { id: 'ready', label: 'Ready for Pickup' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All Orders' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200 p-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900">Queue is clear!</h3>
          <p className="text-xs text-neutral-500 mt-1">No orders waiting under this status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedOrders.map((order) => {
            const isUpdating = updatingId === order.id;
            const isUpdatingPayment = updatingPaymentId === order.id;
            const isPaid = order.paymentStatus === 'paid';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  order.status === 'confirmed'
                    ? 'border-emerald-300 ring-2 ring-emerald-100'
                    : order.status === 'preparing'
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : order.status === 'ready'
                    ? 'border-blue-400 ring-2 ring-blue-100'
                    : 'border-neutral-200 opacity-85'
                }`}
              >
                {/* Card Header: Token & Status */}
                <div className="p-4 bg-neutral-50/70 border-b border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Token Number
                    </span>
                    <div className="text-2xl font-black font-mono text-neutral-900">
                      #{order.tokenNumber}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        order.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'preparing'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'ready'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {order.status}
                    </span>
                    <div className="text-[11px] text-neutral-400">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                {/* Payment Verification Banner */}
                <div
                  className={`px-4 py-2 border-b text-xs flex items-center justify-between ${
                    isPaid
                      ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Payment Done (₹{order.totalAmount})</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Payment Pending (₹{order.totalAmount})</span>
                      </>
                    )}
                  </div>

                  {!isPaid ? (
                    <button
                      onClick={() => updateOrderPayment(order.id, 'paid')}
                      disabled={isUpdatingPayment}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Confirm student paid in cash or counter UPI"
                    >
                      <Check className="w-3 h-3" />
                      <span>{isUpdatingPayment ? 'Verifying...' : 'Mark Paid'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide bg-emerald-100 px-2 py-0.5 rounded-md">
                      Verified
                    </span>
                  )}
                </div>

                {/* Items & Kitchen Notes */}
                <div className="p-4 flex-1 space-y-3">
                  <div className="space-y-1.5">
                    {order.items?.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 last:border-0"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              it.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                          <span className="line-clamp-1">{it.name}</span>
                        </div>
                        <span className="font-extrabold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">
                          × {it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl text-xs border border-amber-200">
                      <strong className="block text-[10px] uppercase font-bold text-amber-800">
                        Kitchen Instruction:
                      </strong>
                      {order.specialInstructions}
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center text-xs text-neutral-500 border-t border-neutral-100">
                    <span className="truncate max-w-[150px]">
                      Customer: <strong>{order.customerName || 'Student'}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedDetailsOrder(order)}
                      className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Check Details
                    </button>
                  </div>
                </div>

                {/* Action Footer (Workflow: Confirmed -> Preparing -> Ready -> Completed) */}
                <div className="p-4 bg-neutral-50/50 border-t border-neutral-100">
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      disabled={isUpdating}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>{isUpdating ? 'Updating...' : 'Accept & Start Cooking'}</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      disabled={isUpdating}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isUpdating ? 'Calling...' : 'Mark Ready for Pickup (Call Token)'}</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      disabled={isUpdating}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isUpdating ? 'Completing...' : 'Handover Food & Complete Order'}</span>
                    </button>
                  )}

                  {order.status === 'completed' && (
                    <div className="text-center text-xs font-semibold text-neutral-400 py-1 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Completed & Collected</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Order Details Modal */}
      {selectedDetailsOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Order Verification Details
                </div>
                <div className="text-2xl font-black font-mono mt-0.5">
                  Token #{selectedDetailsOrder.tokenNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailsOrder(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Customer Information */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-2">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Details</span>
                </div>
                <div className="text-sm font-bold text-neutral-900">
                  {selectedDetailsOrder.customerName || 'College Student'}
                </div>
                {selectedDetailsOrder.customerEmail && (
                  <div className="text-xs text-neutral-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{selectedDetailsOrder.customerEmail}</span>
                  </div>
                )}
                {selectedDetailsOrder.customerPhone && (
                  <div className="text-xs text-neutral-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{selectedDetailsOrder.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-2.5">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Payment Information
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                      selectedDetailsOrder.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedDetailsOrder.paymentStatus === 'paid' ? 'PAID / SETTLED' : 'PAYMENT PENDING'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-700">
                  <span>Payment Method:</span>
                  <strong className="capitalize">
                    {selectedDetailsOrder.paymentMethod === 'pay_at_canteen'
                      ? 'Pay Cash / UPI at Counter'
                      : 'Online UPI'}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-sm font-extrabold text-neutral-900 border-t border-neutral-200/60 pt-2">
                  <span>Total Order Amount:</span>
                  <span className="text-base text-amber-600 font-mono">₹{selectedDetailsOrder.totalAmount}</span>
                </div>

                {selectedDetailsOrder.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => updateOrderPayment(selectedDetailsOrder.id, 'paid')}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Verify & Mark Payment Received</span>
                  </button>
                )}
              </div>

              {/* Order Items Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Items Ordered ({selectedDetailsOrder.items?.length || 0})</span>
                </div>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden">
                  {selectedDetailsOrder.items?.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            it.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-neutral-800">{it.name}</div>
                          <div className="text-[11px] text-neutral-400">
                            ₹{it.unitPrice} × {it.quantity}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-neutral-900">₹{it.subtotal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedDetailsOrder.specialInstructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
                  <strong className="block text-[10px] uppercase font-bold text-amber-800 mb-1">
                    Special Kitchen Request:
                  </strong>
                  {selectedDetailsOrder.specialInstructions}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedDetailsOrder(null)}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-bold transition-all"
              >
                Close Details
              </button>

              {selectedDetailsOrder.status === 'confirmed' && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedDetailsOrder.id, 'preparing');
                    setSelectedDetailsOrder(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Accept Order & Start Cooking</span>
                </button>
              )}
              {selectedDetailsOrder.status === 'preparing' && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedDetailsOrder.id, 'ready');
                    setSelectedDetailsOrder(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Mark Ready for Pickup</span>
                </button>
              )}
              {selectedDetailsOrder.status === 'ready' && (
                <button
                  onClick={() => {
                    updateOrderStatus(selectedDetailsOrder.id, 'completed');
                    setSelectedDetailsOrder(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Handover Food & Complete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Order Completed & Fulfilled Summary Modal */}
      <OrderCompletedSummaryModal
        isOpen={Boolean(completedSummaryOrder)}
        order={completedSummaryOrder}
        viewerRole="staff"
        onClose={() => setCompletedSummaryOrder(null)}
      />

      {/* Transfer Official Canteen Email / Authority Modal */}
      <TransferOfficialAccountModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </div>
  );
};
