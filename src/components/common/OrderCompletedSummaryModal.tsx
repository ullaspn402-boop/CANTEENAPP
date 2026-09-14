import React, { useState } from 'react';
import { Order } from '../../types.ts';
import { buildApiUrl } from '../../lib/apiClient.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CheckCircle2,
  Clock,
  Receipt,
  Star,
  Sparkles,
  Check,
  User,
  X,
  CreditCard,
  Send,
} from 'lucide-react';

interface OrderCompletedSummaryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  viewerRole: 'student' | 'staff' | 'admin';
}

export const OrderCompletedSummaryModal: React.FC<OrderCompletedSummaryModalProps> = ({
  order,
  isOpen,
  onClose,
  viewerRole,
}) => {
  const { authHeaders } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!isOpen || !order) return null;

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await fetch(buildApiUrl(`/api/orders/${order.id}/feedback`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      console.warn('Feedback submit error:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const isStaffOrAdmin = viewerRole === 'staff' || viewerRole === 'admin';

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
            <span>{isStaffOrAdmin ? 'Kitchen Fulfillment Complete' : 'Order Handed Over'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isStaffOrAdmin ? 'Order Completed & Closed!' : 'Meal Ready & Collected!'}
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1 font-medium">
            {isStaffOrAdmin
              ? 'Food has been handed over to student and payment verified.'
              : 'Enjoy your delicious meal! Thank you for ordering with CampusBite.'}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Token & Stats Summary Banner */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Completed Order Token
            </div>
            <div className="text-3xl font-black text-neutral-900 my-1">
              #{order.tokenNumber}
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-neutral-600 mt-2">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                Handover Completed
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Turnaround: ~{order.prepTimeMinutes || 8} mins
              </span>
            </div>
          </div>

          {/* Staff Info (Customer Name and Details) */}
          {isStaffOrAdmin && (
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center gap-3 text-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-neutral-900 truncate">
                  Customer: {order.customerName || 'Campus Student'}
                </div>
                <div className="text-[11px] text-neutral-500 truncate">
                  {order.customerEmail || 'student@campus.edu'}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                Fulfilled
              </span>
            </div>
          )}

          {/* Itemized Order Breakdown */}
          <div className="border border-neutral-200 rounded-2xl p-4 bg-white">
            <div className="text-xs font-bold text-neutral-800 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-neutral-500" />
                <span>Fulfilled Items ({order.items?.length || 0})</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Payment Received
              </span>
            </div>

            <div className="divide-y divide-neutral-100 text-xs">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-neutral-800">
                    {item.name} <span className="text-neutral-400">x{item.quantity}</span>
                  </span>
                  <span className="font-bold text-neutral-900">
                    ₹{item.subtotal || item.unitPrice * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-3 mt-2 flex items-center justify-between font-bold text-sm">
              <span className="text-neutral-700">Total Revenue Collected</span>
              <span className="text-emerald-700 text-base font-black">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Student Feedback Rating Widget */}
          {!isStaffOrAdmin && (
            <div className="border border-amber-200/80 rounded-2xl p-4 bg-amber-50/40">
              <div className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>How was your meal & canteen service?</span>
              </div>

              {feedbackSubmitted ? (
                <div className="py-3 text-center text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Thank you! Your feedback helps the canteen improve.</span>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3 mt-2">
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        className="p-1 text-2xl transition-transform hover:scale-125 cursor-pointer"
                        title={`${s} Stars`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a quick note (e.g., taste was amazing, hot and fresh)..."
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingFeedback ? 'Submitting...' : 'Submit Rating'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 px-4 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer ${
              isStaffOrAdmin
                ? 'bg-neutral-900 hover:bg-neutral-800'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
            }`}
          >
            {isStaffOrAdmin ? 'Done • Return to Kitchen Queue' : 'Close Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
