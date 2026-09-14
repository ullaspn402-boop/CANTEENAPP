import React from 'react';
import { FoodItem } from '../../types.ts';
import { useCart } from '../../context/CartContext.tsx';
import { X, Clock, Star, Flame, Sparkles, Plus, Minus } from 'lucide-react';

interface FoodDetailModalProps {
  item: FoodItem | null;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ item, onClose }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  if (!item) return null;

  const cartEntry = cart.find((c) => c.foodItem.id === item.id);
  const quantity = cartEntry ? cartEntry.quantity : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="relative h-60 w-full bg-neutral-100">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {item.isVeg ? 'PURE VEG' : 'NON-VEGETARIAN'}
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{item.rating.toFixed(1)}</span>
              <span className="text-neutral-300">({item.ratingCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900">{item.name}</h2>
              <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider mt-0.5 block">
                {item.categoryName || 'Campus Special'}
              </span>
            </div>
            <span className="text-2xl font-black text-neutral-900">₹{item.price}</span>
          </div>

          <p className="text-neutral-600 text-sm mt-3 leading-relaxed">{item.description}</p>

          {/* Highlights */}
          <div className="grid grid-cols-4 gap-2 my-5 py-3 border-y border-neutral-100">
            <div className="text-center">
              <div className="flex items-center justify-center text-amber-600 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-neutral-900">{item.prepTimeMinutes} mins</div>
              <div className="text-[10px] text-neutral-400">Prep Time</div>
            </div>
            <div className="text-center border-x border-neutral-100">
              <div className="flex items-center justify-center text-orange-500 mb-1">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-neutral-900">{item.spiceLevel || 'Medium'}</div>
              <div className="text-[10px] text-neutral-400">Spice Level</div>
            </div>
            <div className="text-center border-r border-neutral-100">
              <div className="flex items-center justify-center text-blue-600 mb-1">
                <span className="text-xs font-black">📦</span>
              </div>
              <div className="text-xs font-bold text-neutral-900">{item.availableStock ?? 30} left</div>
              <div className="text-[10px] text-neutral-400">Kitchen Stock</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-emerald-600 mb-1">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-neutral-900">Zero Queue</div>
              <div className="text-[10px] text-neutral-400">Token Pickup</div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-neutral-400 block font-medium">Payment Mode</span>
              <span className="text-xs font-bold text-neutral-800">Pay at Canteen Counter</span>
            </div>

            {!item.isAvailable ? (
              <span className="px-5 py-2.5 bg-neutral-100 text-neutral-400 rounded-xl text-xs font-bold">
                Sold Out
              </span>
            ) : quantity === 0 ? (
              <button
                onClick={() => addToCart(item)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-amber-600 text-white rounded-xl px-3 py-1.5 shadow-md">
                <button
                  onClick={() => updateQuantity(item.id, quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-amber-700 rounded-lg text-white font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-extrabold min-w-5 text-center">{quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-amber-700 rounded-lg text-white font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
