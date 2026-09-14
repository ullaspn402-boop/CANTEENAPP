import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { useCanteen } from '../../context/CanteenContext.tsx';
import { Order } from '../../types.ts';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  Store,
} from 'lucide-react';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const { cart, updateQuantity, removeFromCart, clearCart, totalAmount, totalItems, placeOrder } = useCart();
  const { selectedCanteen } = useCanteen();
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const order = await placeOrder(specialInstructions.trim() || undefined);
      onOrderPlaced(order);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-neutral-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Your Canteen Tray</h2>
            <p className="text-xs text-neutral-500">{totalItems} item{totalItems !== 1 ? 's' : ''} added</p>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-neutral-400 hover:text-rose-600 transition-colors p-1.5"
                title="Clear tray"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-neutral-100">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-neutral-800 text-sm">Your tray is empty</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                Explore the menu to add delicious dosas, meals, rolls, and beverages!
              </p>
            </div>
          ) : (
            cart.map(({ foodItem, quantity }) => (
              <div key={foodItem.id} className="py-3 flex items-center gap-3">
                <img
                  src={foodItem.imageUrl}
                  alt={foodItem.name}
                  className="w-14 h-14 rounded-xl object-cover border border-neutral-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        foodItem.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {foodItem.name}
                    </h4>
                  </div>
                  <span className="text-xs text-neutral-600 font-semibold block mt-0.5">
                    ₹{foodItem.price} × {quantity} = ₹{foodItem.price * quantity}
                  </span>
                </div>

                {/* Quantity stepper */}
                <div className="flex items-center gap-1.5 bg-neutral-100 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(foodItem.id, quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-white hover:bg-neutral-200 text-neutral-700 font-bold transition-colors shadow-2xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(foodItem.id, quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-md bg-white hover:bg-neutral-200 text-neutral-700 font-bold transition-colors shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <div className="pt-4 mt-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Special Kitchen Instructions (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Less spicy sambar, no sugar in tea, extra chutney..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-neutral-50/60"
              />
            </div>
          )}
        </div>

        {/* Footer & Checkout button */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/50 space-y-3">
            {/* Active Destination Canteen Card */}
            <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Store className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-amber-700 font-semibold uppercase block leading-none">Destination Canteen</span>
                  <span className="font-bold text-neutral-900 truncate block text-xs">
                    {selectedCanteen?.canteenName || 'Central Campus Canteen'}
                  </span>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                Official
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-800 font-semibold">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Payment Mode:</span>
                </div>
                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                  Pay at Canteen Counter
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1 leading-normal">
                Cash or UPI QR accepted at Counter 1 when picking up your food.
              </p>
            </div>

            {/* Bill Summary */}
            <div className="space-y-1.5 text-xs text-neutral-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>College Student Discount</span>
                <span>Applied</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total Payable</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Generating Token...</span>
              ) : (
                <>
                  <span>Confirm Order & Get Digital Token</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
