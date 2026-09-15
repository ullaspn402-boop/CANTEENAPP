import React from 'react';
import { Order } from '../../types.ts';
import { useCanteen } from '../../context/CanteenContext.tsx';
import {
  CheckCircle2,
  Clock,
  Store,
  MapPin,
  CreditCard,
  Banknote,
  Receipt,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

interface OrderPlacedSummaryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder?: (order: Order) => void;
  viewerRole?: 'student' | 'staff' | 'admin';
}

export const OrderPlacedSummaryModal: React.FC<OrderPlacedSummaryModalProps> = ({
  order,
  isOpen,
  onClose,
  onTrackOrder,
  viewerRole = 'student',
}) => {
  const { selectedCanteen } = useCanteen();
  const isStaffOrAdmin = viewerRole === 'staff' || viewerRole === 'admin';

  if (!isOpen || !order) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div
          className={`px-6 pt-7 pb-6 text-white text-center relative flex-shrink-0 ${
            isStaffOrAdmin
              ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 text-white border border-white/30 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>{isStaffOrAdmin ? 'Live Canteen Order Ticket' : 'Order Successfully Placed'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isStaffOrAdmin ? `Token Ticket #${order.tokenNumber}` : 'Order Confirmed!'}
          </h2>
          <p className="text-white/90 text-xs sm:text-sm mt-1">
            {isStaffOrAdmin
              ? 'Order is registered in the live kitchen queue ready for preparation.'
              : 'The canteen staff has received your order and started preparing it.'}
          </p>
        </div>

        {/* Scrollable Order Details */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Big Token Number Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 text-center relative overflow-hidden shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              {isStaffOrAdmin ? 'Kitchen Order Token' : 'Your Digital Pickup Token'}
            </div>
            <div className="text-4xl font-black text-amber-900 tracking-tight my-1">
              #{order.tokenNumber}
            </div>
            <div className="text-xs text-neutral-600 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Estimated Pickup: ~{order.prepTimeMinutes || 8} mins (Counter 1)</span>
            </div>
          </div>

          {/* Customer info for Staff/Admin */}
          {isStaffOrAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center gap-3 text-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-neutral-900 truncate">
                  Customer: {order.customerName || 'Campus Student'}
                </div>
                <div className="text-[11px] text-neutral-500 truncate">
                  {order.customerEmail || 'student@campus.edu'}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 uppercase">
                {order.status}
              </span>
            </div>
          )}

          {/* Canteen Details Card */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-neutral-900 truncate">
                {selectedCanteen?.canteenName || 'Central Campus Canteen'}
              </div>
              <div className="text-[11px] text-neutral-500 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>Head: {selectedCanteen?.operatorName || 'Campus Canteen'} • Main Food Court</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Verified
            </span>
          </div>

          {/* Itemized Order List */}
          <div className="border border-neutral-200 rounded-2xl p-4 bg-white">
            <div className="text-xs font-bold text-neutral-800 mb-3 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-neutral-500" />
              <span>Order Summary ({order.items?.length || 0} items)</span>
            </div>

            <div className="divide-y divide-neutral-100 text-xs">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-800">{item.name}</span>
                    <span className="text-neutral-400 font-medium">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-neutral-900">₹{item.subtotal || item.unitPrice * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Total and Payment */}
            <div className="border-t border-neutral-200 pt-3 mt-2 flex items-center justify-between font-bold text-sm">
              <span className="text-neutral-700">Total Amount</span>
              <span className="text-amber-600 text-base font-black">₹{order.totalAmount}</span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-dashed border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
              <span className="flex items-center gap-1.5">
                {order.paymentStatus === 'paid' ? (
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>Payment Status:</span>
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {order.paymentStatus === 'paid' ? 'PAID (UPI/Online)' : 'PAY AT COUNTER'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          {!isStaffOrAdmin ? (
            <>
              {onTrackOrder && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTrackOrder(order);
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Track Live Token Progress</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-white hover:bg-neutral-100 text-neutral-700 font-semibold text-xs rounded-xl border border-neutral-200 transition-colors cursor-pointer"
              >
                Order More Food
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Close Order Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
