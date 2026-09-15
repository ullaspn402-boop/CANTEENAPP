import React, { useState, useEffect } from 'react';
import { FoodItem, Category, CanteenStatus } from '../../types.ts';
import { FoodCard } from './FoodCard.tsx';
import { FoodDetailModal } from './FoodDetailModal.tsx';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCanteen } from '../../context/CanteenContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import {
  Search,
  Filter,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  Check,
  ShoppingBag,
  Store,
  Navigation,
  Compass,
  GraduationCap,
} from 'lucide-react';

interface StudentHomeProps {
  canteenStatus: CanteenStatus | null;
  onOpenTokenTracker: () => void;
  onOpenAIAssistant?: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  canteenStatus,
  onOpenTokenTracker,
  onOpenAIAssistant,
}) => {
  const { user } = useAuth();
  const { activeOrder, totalItems, totalAmount, setIsCartOpen } = useCart();
  const {
    selectedCanteen,
    setIsCanteenSelectorOpen,
    distanceMeters,
    locationStatus,
    isInsideCampus,
  } = useCanteen();

  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedVegFilter, setSelectedVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high' | 'rating'>('popular');
  const [loading, setLoading] = useState(true);
  const [selectedFoodDetail, setSelectedFoodDetail] = useState<FoodItem | null>(null);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch categories & items
  const fetchCategories = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/categories'));
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory.toString());
      if (selectedVegFilter === 'veg') params.append('isVeg', 'true');
      if (selectedVegFilter === 'nonveg') params.append('isVeg', 'false');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('sortBy', sortBy);

      const res = await fetch(buildApiUrl(`/api/food-items?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setFoodItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchFoodItems();
  }, [selectedCategory, selectedVegFilter, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* 1. Greeting & Canteen Live Status Banner (Prompt Section 4) */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {/* College & Canteen Name */}
            {selectedCanteen?.campusName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-amber-100 text-[11px] font-semibold mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-amber-200" />
                <span>{selectedCanteen.campusName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-amber-100 text-xs sm:text-sm font-semibold mb-1">
              <span>{getGreeting()}</span>
              <span>•</span>
              <span>{user?.name || 'Student'} 👋</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              What are you craving today?
            </h1>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
              Pre-order delicious campus meals, receive a digital token, and pick up hot food without standing in line.
            </p>

            {/* Quick Status Chips */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <button
                id="hero-canteen-select-btn"
                onClick={() => setIsCanteenSelectorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 transition-all cursor-pointer"
                title="Click to view or switch your campus canteen"
              >
                <Store className="w-3.5 h-3.5 text-amber-200" />
                <span>Canteen: <strong>{selectedCanteen?.canteenName || 'Central Campus Canteen'}</strong></span>
                <span className="text-[10px] bg-blue-500/40 text-blue-100 px-1.5 py-0.2 rounded font-semibold ml-1">
                  ✓ Verified
                </span>
              </button>

              {distanceMeters !== null && (
                <button
                  onClick={() => setIsCanteenSelectorOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 hover:bg-emerald-500/40 backdrop-blur-md text-emerald-100 border border-emerald-400/40 transition-all cursor-pointer"
                  title="Campus GPS location verified"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    {isInsideCampus ? '📍 On Campus' : 'Nearby'}: ~
                    {distanceMeters < 1000 ? `${distanceMeters}m` : `${(distanceMeters / 1000).toFixed(1)}km`} away
                  </span>
                </button>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                <span className={`w-2 h-2 rounded-full ${canteenStatus?.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {canteenStatus?.isOpen ? 'Canteen OPEN' : 'Canteen CLOSED'}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/20 backdrop-blur-md text-amber-100">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                ~{canteenStatus?.currentWaitTimeMinutes || 8} mins wait
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                Token Pickup @ Counter 1
              </span>
            </div>
          </div>

          {/* Current Active Order Card if student has an active order (Prompt Section 4) */}
          {activeOrder && (
            <div className="bg-white/95 backdrop-blur-md text-neutral-900 p-4 rounded-2xl shadow-xl border border-white/60 md:w-80 flex-shrink-0 animate-pulse-subtle">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Active Order Live
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 uppercase">
                  {activeOrder.status}
                </span>
              </div>
              <div className="text-2xl font-black font-mono mt-1 text-neutral-900">
                #{activeOrder.tokenNumber}
              </div>
              <div className="text-xs text-neutral-600 mt-1 line-clamp-1">
                {activeOrder.items?.map((i) => `${i.name} (×${i.quantity})`).join(', ') || 'Your meal items'}
              </div>
              <button
                onClick={onOpenTokenTracker}
                className="w-full mt-3 py-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Track Digital Token</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Quick Trigger Banner (Resilient offline-first fallback) */}
      {onOpenAIAssistant && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                Have questions or need meal recommendations?
              </h4>
              <p className="text-[11px] text-neutral-600">
                Ask our Canteen Assistant about today's menu, wait times, or dietary options.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAIAssistant}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-xs flex items-center gap-1.5"
          >
            <span>Ask Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Today's Special Offers & Combos Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-amber-200/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-2 py-0.5 rounded-sm">
              Today's Combo
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mt-0.5">
              Masala Dosa + Kulhad Chai @ ₹50
            </h4>
            <p className="text-[11px] text-neutral-500">Save ₹5 on morning special breakfast</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-sm">
              Campus Favorite
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mt-0.5">
              Chicken Dum Biryani Bowl @ ₹130
            </h4>
            <p className="text-[11px] text-neutral-500">Served with boiled egg & creamy raita</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200/80 flex items-center gap-3 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-sm">
              Zero Waiting
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mt-0.5">
              Samosa & Filter Coffee Express
            </h4>
            <p className="text-[11px] text-neutral-500">Ready in under 3 minutes at Counter 1</p>
          </div>
        </div>
      </div>

      {/* 3. Search, Quick Filters & Category Chips */}
      <div className="space-y-4">
        {/* Search and Sort controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search masala dosa, thali, maggi, biryani, cold coffee..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Veg / Non-Veg segmented pill */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-semibold w-full sm:w-auto justify-between">
            <button
              onClick={() => setSelectedVegFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedVegFilter === 'all'
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedVegFilter('veg')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                selectedVegFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              Veg Only
            </button>
            <button
              onClick={() => setSelectedVegFilter('nonveg')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                selectedVegFilter === 'nonveg'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300" />
              Non-Veg
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === null
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <span>All Items</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Food Items Grid (Prompt Section 5) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-neutral-900">
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name
              : 'Campus Canteen Menu'}{' '}
            <span className="text-xs font-semibold text-neutral-400">
              ({foodItems.length} items available)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-64 bg-neutral-100 rounded-2xl animate-pulse border border-neutral-200"
              />
            ))}
          </div>
        ) : foodItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200 p-8">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">No dishes match your filters</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Try searching with another keyword or resetting the category and dietary filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedVegFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {foodItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onOpenDetail={(it) => setSelectedFoodDetail(it)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Food Detail Modal */}
      <FoodDetailModal
        item={selectedFoodDetail}
        onClose={() => setSelectedFoodDetail(null)}
      />

      {/* Floating Bottom Cart Bar for mobile & easy checkout */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-30">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white p-3 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-neutral-700 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">
                  {totalItems} item{totalItems > 1 ? 's' : ''} in tray
                </span>
                <span className="text-xs text-neutral-300">Total: ₹{totalAmount}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <span>View Tray & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
