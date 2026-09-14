import React, { useState, useEffect } from 'react';
import { Order } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChefHat,
  ShoppingBag,
  Star,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';

interface DigitalTokenModalProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated?: (order: Order) => void;
}

export const DigitalTokenModal: React.FC<DigitalTokenModalProps> = ({
  order: initialOrder,
  onClose,
  onOrderUpdated,
}) => {
  const { authHeaders } = useAuth();
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // Poll order status every 4 seconds when tracker is open
  useEffect(() => {
    if (!order?.tokenNumber) return;
    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch(buildApiUrl(`/api/orders/track/${order.tokenNumber}`));
        if (res.ok) {
          const updated: Order = await res.json();
          setOrder(updated);
          if (onOrderUpdated) onOrderUpdated(updated);
        }
      } catch (err: any) {
        console.warn('Order tracking poll notice:', err?.message || err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [order?.tokenNumber, onOrderUpdated]);

  if (!order) return null;

  const steps = [
    { key: 'confirmed', label: 'Order Confirmed', icon: ShoppingBag, color: 'emerald' },
    { key: 'preparing', label: 'Preparing in Kitchen', icon: ChefHat, color: 'amber' },
    { key: 'ready', label: 'Ready for Pickup', icon: AlertCircle, color: 'blue' },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'purple' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(order.status);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/feedback`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          rating,
          comment: feedbackComment.trim() || undefined,
          foodItemId: order.items?.[0]?.foodItemId,
        }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 relative flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Digital Token Ticket Header */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-xs uppercase font-bold tracking-widest text-amber-200 mb-1">
            Official Canteen Token
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight font-mono py-1">
            #{order.tokenNumber}
          </div>
          <p className="text-xs text-amber-100 mt-1">
            Show this digital token number at <span className="font-bold underline">Counter 1</span>
          </p>

          {/* Status Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
            {order.status === 'confirmed' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            {order.status === 'preparing' && <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping" />}
            {order.status === 'ready' && <span className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" />}
            {order.status === 'completed' && <span className="w-2 h-2 rounded-full bg-purple-300" />}
            <span className="capitalize">
              {order.status === 'ready' ? 'Ready for Pickup!' : order.status}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Pick up banner if ready */}
          {order.status === 'ready' && (
            <div className="p-4 bg-blue-50 border-2 border-blue-400 rounded-2xl flex items-start gap-3 animate-bounce shadow-md">
              <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-blue-900 text-sm">
                  Your Order is Ready for Collection!
                </h4>
                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                  Head to <strong>Counter 1</strong> and quote Token <strong>#{order.tokenNumber}</strong>.
                  Pay ₹{order.totalAmount} via UPI or Cash.
                </p>
              </div>
            </div>
          )}

          {/* Order Progression Step Bar */}
          <div>
            <div className="flex items-center justify-between relative mb-2">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-200 -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-0 h-1 bg-amber-500 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${(currentIndex / 3) * 100}%` }}
              />

              {steps.map((step, idx) => {
                const isPassed = idx <= currentIndex;
                const isCurrent = idx === currentIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-amber-600 text-white ring-4 ring-amber-100 shadow-md scale-110'
                          : isPassed
                          ? 'bg-amber-500 text-white'
                          : 'bg-white border-2 border-neutral-300 text-neutral-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold mt-1 text-center max-w-[70px] leading-tight ${
                        isCurrent ? 'text-amber-700 font-bold' : isPassed ? 'text-neutral-800' : 'text-neutral-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/70 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-200">
              <span className="text-neutral-500">Estimated Prep Time</span>
              <span className="font-bold text-neutral-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                ~{order.prepTimeMinutes} mins
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Ordered Items
              </span>
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-800">
                    {item.name} <span className="text-neutral-400 font-bold">× {item.quantity}</span>
                  </span>
                  <span className="font-bold text-neutral-900">₹{item.subtotal}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-extrabold text-neutral-900">
              <span>Total Amount:</span>
              <span className="text-amber-700">₹{order.totalAmount}</span>
            </div>

            {order.specialInstructions && (
              <div className="text-[11px] bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-200">
                <strong>Note to chef:</strong> {order.specialInstructions}
              </div>
            )}
          </div>

          {/* Rate Order Section (Prompt Section 10: Feedback System) */}
          {order.status === 'completed' && (
            <div className="border-t border-neutral-200 pt-4">
              {feedbackSubmitted || order.feedback ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <h4 className="text-xs font-bold text-emerald-900">Rating & Feedback Received!</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Thank you for helping us improve our campus food quality.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-1.5">
                    <PartyPopper className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-neutral-900">Rate your food & canteen experience:</h4>
                  </div>

                  {/* 1-5 Stars */}
                  <div className="flex items-center gap-2 justify-center py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Optional comments on taste, warmth, speed..."
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />

                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">Order ID: #{order.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
