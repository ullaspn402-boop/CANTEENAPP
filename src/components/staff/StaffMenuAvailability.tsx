import React, { useState, useEffect } from 'react';
import { FoodItem, Category } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import {
  ChefHat,
  Eye,
  EyeOff,
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Minus,
  Plus,
  Save,
  Clock,
} from 'lucide-react';

interface StockEditorState {
  [itemId: number]: { value: number; dirty: boolean; saving: boolean };
}

export const StaffMenuAvailability: React.FC = () => {
  const { authHeaders } = useAuth();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [stockEditor, setStockEditor] = useState<StockEditorState>({});
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        // Staff sees ALL active items (including unavailable ones) so they can toggle availability
        fetch(buildApiUrl('/api/food-items?includeInactive=false'), { headers: authHeaders() }),
        fetch(buildApiUrl('/api/categories'), { headers: authHeaders() }),
      ]);
      if (itemsRes.ok && catsRes.ok) {
        const itemsData: FoodItem[] = await itemsRes.json();
        const catsData: Category[] = await catsRes.json();
        setItems(itemsData);
        setCategories(catsData);

        // Initialise stock editor with current values
        const initialStock: StockEditorState = {};
        for (const item of itemsData) {
          initialStock[item.id] = {
            value: item.availableStock ?? 0,
            dirty: false,
            saving: false,
          };
        }
        setStockEditor(initialStock);
      }
    } catch (err: any) {
      console.error('StaffMenuAvailability fetchData error:', err);
      showToast('Failed to load menu data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle item availability (sold-out vs available)
  const handleToggleAvailability = async (item: FoodItem) => {
    setTogglingId(item.id);
    try {
      const res = await fetch(buildApiUrl(`/api/food-items/${item.id}/toggle-availability`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !item.isAvailable } : i))
        );
        showToast(
          !item.isAvailable
            ? `"${item.name}" is now available.`
            : `"${item.name}" marked as sold out.`,
        );
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update availability.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Save stock update for one item
  const handleSaveStock = async (itemId: number) => {
    const entry = stockEditor[itemId];
    if (!entry || !entry.dirty) return;

    setStockEditor((prev) => ({ ...prev, [itemId]: { ...prev[itemId], saving: true } }));
    try {
      const res = await fetch(buildApiUrl(`/api/food-items/${itemId}/stock`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ availableStock: entry.value }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, availableStock: entry.value } : i))
        );
        setStockEditor((prev) => ({
          ...prev,
          [itemId]: { ...prev[itemId], dirty: false, saving: false },
        }));
        showToast('Stock updated successfully.');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update stock.', 'error');
        setStockEditor((prev) => ({ ...prev, [itemId]: { ...prev[itemId], saving: false } }));
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
      setStockEditor((prev) => ({ ...prev, [itemId]: { ...prev[itemId], saving: false } }));
    }
  };

  const adjustStock = (itemId: number, delta: number) => {
    setStockEditor((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const newVal = Math.max(0, current.value + delta);
      const original = items.find((i) => i.id === itemId)?.availableStock ?? 0;
      return { ...prev, [itemId]: { value: newVal, dirty: newVal !== original, saving: false } };
    });
  };

  const setStockValue = (itemId: number, rawVal: string) => {
    const val = parseInt(rawVal, 10);
    if (isNaN(val) || val < 0) return;
    const originalStock = items.find((i) => i.id === itemId)?.availableStock ?? 0;
    setStockEditor((prev) => ({
      ...prev,
      [itemId]: { value: val, dirty: val !== originalStock, saving: false },
    }));
  };

  // Filtered items
  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.categoryName || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || item.categoryId === categoryFilter;
    return matchSearch && matchCat;
  });

  // Stats
  const availableCount = items.filter((i) => i.isAvailable).length;
  const soldOutCount = items.filter((i) => !i.isAvailable).length;
  const lowStockCount = items.filter((i) => (i.availableStock ?? 0) <= 5 && i.isAvailable).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-neutral-500 text-sm font-medium">Loading menu items…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-3 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Menu Availability</h1>
            <p className="text-sm text-neutral-500">
              Toggle availability and update stock quantities for today's service
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Eye className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-800">{availableCount}</div>
              <div className="text-[11px] text-emerald-700 font-medium uppercase tracking-wide">Available</div>
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
              <EyeOff className="w-4 h-4 text-rose-700" />
            </div>
            <div>
              <div className="text-xl font-bold text-rose-800">{soldOutCount}</div>
              <div className="text-[11px] text-rose-700 font-medium uppercase tracking-wide">Sold Out</div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-800">{lowStockCount}</div>
              <div className="text-[11px] text-amber-700 font-medium uppercase tracking-wide">Low Stock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="pl-9 pr-8 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Staff permission notice */}
      <div className="mb-6 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Package className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          <span className="font-semibold">Staff permissions:</span> You can mark items as
          available/sold-out and update today's stock quantities. To add new items, change
          prices, or edit descriptions, contact the Canteen Admin.
        </p>
      </div>

      {/* Item cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No items match your filter</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const stockEntry = stockEditor[item.id];
            const stockVal = stockEntry?.value ?? item.availableStock ?? 0;
            const isDirty = stockEntry?.dirty ?? false;
            const isSaving = stockEntry?.saving ?? false;
            const isLowStock = stockVal <= 5 && item.isAvailable;
            const isToggling = togglingId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs transition-all ${
                  item.isAvailable
                    ? 'border-neutral-200 hover:shadow-md hover:border-neutral-300'
                    : 'border-rose-200 bg-rose-50/30 opacity-75'
                }`}
              >
                {/* Food image */}
                <div className="relative h-36 bg-neutral-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-all ${
                      item.isAvailable ? '' : 'grayscale opacity-60'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
                    }}
                  />

                  {/* Veg indicator */}
                  <div
                    className={`absolute top-2 left-2 w-5 h-5 rounded-sm border-2 flex items-center justify-center bg-white ${
                      item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                  </div>

                  {/* Sold-out overlay */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-rose-600/90 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                        Sold Out
                      </span>
                    </div>
                  )}

                  {/* Low stock badge */}
                  {isLowStock && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Low
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4">
                  {/* Title row */}
                  <div className="mb-3">
                    <h3 className="font-bold text-neutral-900 text-sm leading-snug">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                        {item.categoryName || 'Uncategorised'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <Clock className="w-3 h-3" />
                        {item.prepTimeMinutes}m
                      </span>
                      <span className="text-[11px] font-bold text-amber-700">₹{item.price}</span>
                    </div>
                  </div>

                  {/* Availability toggle */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-600">Availability</span>
                    <button
                      id={`toggle-avail-${item.id}`}
                      onClick={() => handleToggleAvailability(item)}
                      disabled={isToggling}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        item.isAvailable
                          ? 'bg-emerald-500 focus:ring-emerald-400'
                          : 'bg-neutral-300 focus:ring-neutral-300'
                      } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={item.isAvailable ? 'Mark as sold out' : 'Mark as available'}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${
                          item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Status label */}
                  <div
                    className={`text-[11px] font-semibold flex items-center gap-1 mb-3 ${
                      item.isAvailable ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.isAvailable ? (
                      <>
                        <Eye className="w-3 h-3" /> Visible to students
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Hidden — sold out
                      </>
                    )}
                  </div>

                  {/* Stock editor */}
                  <div className="border-t border-neutral-100 pt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-neutral-600 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-neutral-400" />
                        Stock
                      </span>
                      {isLowStock && (
                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          Restock soon
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustStock(item.id, -1)}
                        disabled={stockVal <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-3 h-3 text-neutral-600" />
                      </button>

                      <input
                        type="number"
                        min={0}
                        value={stockVal}
                        onChange={(e) => setStockValue(item.id, e.target.value)}
                        className={`flex-1 text-center text-sm font-bold border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors ${
                          isDirty
                            ? 'border-amber-400 bg-amber-50 text-amber-800'
                            : isLowStock
                            ? 'border-amber-200 bg-amber-50/50 text-amber-700'
                            : 'border-neutral-200 text-neutral-900'
                        }`}
                      />

                      <button
                        onClick={() => adjustStock(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-neutral-600" />
                      </button>

                      {isDirty && (
                        <button
                          id={`save-stock-${item.id}`}
                          onClick={() => handleSaveStock(item.id)}
                          disabled={isSaving}
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-60"
                        >
                          {isSaving ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">Save</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-neutral-400 mt-1">portions remaining today</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
