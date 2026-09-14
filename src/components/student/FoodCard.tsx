import React from 'react';
import { FoodItem } from '../../types.ts';
import { useCart } from '../../context/CartContext.tsx';
import { Clock, Star, Plus, Minus } from 'lucide-react';

interface FoodCardProps {
  item: FoodItem;
  onOpenDetail: (item: FoodItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onOpenDetail }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const cartEntry = cart.find((c) => c.foodItem.id === item.id);
  const quantity = cartEntry ? cartEntry.quantity : 0;

  return (
    <div className="group bg-white rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Image container */}
      <div
        className="relative h-44 w-full bg-neutral-100 overflow-hidden cursor-pointer"
        onClick={() => onOpenDetail(item)}
      >
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        {/* Veg / Non-Veg indicator pill */}
        <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md shadow-2xs flex items-center gap-1.5">
          <span
            className={`w-3 h-3 border flex items-center justify-center rounded-xs ${
              item.isVeg ? 'border-emerald-600' : 'border-rose-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </span>
          <span className="text-[10px] font-semibold text-neutral-700">
            {item.isVeg ? 'VEG' : 'NON-VEG'}
          </span>
        </div>

        {/* Rating and Spice badges */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {item.spiceLevel && item.spiceLevel !== 'None' && (
            <span className="bg-neutral-900/80 backdrop-blur-xs text-amber-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-2xs">
              🌶️ {item.spiceLevel}
            </span>
          )}
          <div className="bg-neutral-900/80 backdrop-blur-xs text-amber-400 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Prep time chip */}
        <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-300" />
          <span>{item.prepTimeMinutes} mins</span>
        </div>

        {/* Out of stock overlay if unavailable */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-2xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
              Sold Out Today
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onOpenDetail(item)}
              className="font-bold text-neutral-900 text-base leading-snug cursor-pointer hover:text-amber-600 transition-colors line-clamp-1"
            >
              {item.name}
            </h3>
            <span className="text-base font-extrabold text-neutral-900 whitespace-nowrap">
              ₹{item.price}
            </span>
          </div>

          <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-neutral-400 font-medium">
              {item.totalOrders} ordered
            </span>
            {item.availableStock !== undefined && item.availableStock > 0 && item.availableStock <= 15 && (
              <span className="text-[10px] font-bold text-amber-700">
                ⚡ Only {item.availableStock} left
              </span>
            )}
          </div>

          {!item.isAvailable ? (
            <button
              disabled
              className="px-3 py-1.5 bg-neutral-100 text-neutral-400 rounded-xl text-xs font-semibold cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={() => addToCart(item)}
              className="px-4 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 border border-amber-300/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-amber-600 text-white rounded-xl px-1.5 py-1 shadow-sm">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-amber-700 rounded-lg text-white font-bold transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-extrabold min-w-4 text-center">{quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-amber-700 rounded-lg text-white font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
