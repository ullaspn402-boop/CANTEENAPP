import React, { useState, useEffect } from 'react';
import { FoodItem, Category } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { buildApiUrl } from '../../lib/apiClient.ts';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
  Flame,
  Layers,
  Package,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
} from 'lucide-react';

const PRESET_FOOD_IMAGES = [
  {
    name: 'Masala Dosa',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'North Indian Thali',
    url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Chicken Biryani',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Idli Vada Combo',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Crispy Samosa',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Masala Chai',
    url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Veg Cheese Grilled Sandwich',
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Iced Cold Coffee',
    url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Paneer Butter Masala',
    url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
  },
];

export const MenuManager: React.FC = () => {
  const { authHeaders } = useAuth();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'sold_out'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: 1,
    description: '',
    price: 40,
    availableStock: 30,
    imageUrl: PRESET_FOOD_IMAGES[0].url,
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Medium',
    prepTimeMinutes: 8,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Include inactive items so canteen admin sees the full database-backed catalog
      const [itemsRes, catsRes] = await Promise.all([
        fetch(buildApiUrl('/api/food-items?includeInactive=true'), { headers: authHeaders() }),
        fetch(buildApiUrl('/api/categories'), { headers: authHeaders() }),
      ]);
      if (itemsRes.ok && catsRes.ok) {
        const itemsData = await itemsRes.json();
        const catsData = await catsRes.json();
        setItems(itemsData);
        setCategories(catsData);
      }
    } catch (err) {
      console.error('MenuManager fetchData error:', err);
      showToast('Error loading menu catalog from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || 1,
      description: '',
      price: 40,
      availableStock: 30,
      imageUrl: PRESET_FOOD_IMAGES[0].url,
      isVeg: true,
      isAvailable: true,
      isActive: true,
      spiceLevel: 'Medium',
      prepTimeMinutes: 8,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      description: item.description,
      price: item.price,
      availableStock: item.availableStock ?? 30,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isActive: item.isActive !== false,
      spiceLevel: item.spiceLevel || 'Medium',
      prepTimeMinutes: item.prepTimeMinutes,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        const res = await fetch(buildApiUrl(`/api/food-items/${editingItem.id}`), {
          method: 'PUT',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          showToast(`"${formData.name}" successfully updated in PostgreSQL database.`);
          setIsModalOpen(false);
          await fetchData();
        } else {
          const errData = await res.json();
          showToast(errData.message || 'Failed to update food item.');
        }
      } else {
        const res = await fetch(buildApiUrl('/api/food-items'), {
          method: 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const created = await res.json();
          showToast(`"${formData.name}" added to canteen menu and stored in PostgreSQL!`);
          setIsModalOpen(false);
          await fetchData();
        } else {
          const errData = await res.json();
          showToast(errData.message || 'Failed to add food item.');
        }
      }
    } catch (err) {
      console.error('handleSave error:', err);
      showToast('Network error while communicating with backend API.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active/Deactivated (Active items appear in student website & android app; Deactivated items are hidden)
  const toggleActiveStatus = async (item: FoodItem) => {
    const nextStatus = item.isActive === false ? true : false;
    try {
      const res = await fetch(buildApiUrl(`/api/food-items/${item.id}/toggle-active`), {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isActive: nextStatus } : i))
        );
        showToast(
          nextStatus
            ? `"${item.name}" is now ACTIVE on Student Website & Android App.`
            : `"${item.name}" has been DEACTIVATED from Student Menu.`
        );
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to update active status.');
    }
  };

  // Toggle In Stock / Sold Out
  const toggleAvailability = async (item: FoodItem) => {
    const nextAvailability = !item.isAvailable;
    try {
      const res = await fetch(buildApiUrl(`/api/food-items/${item.id}/toggle-availability`), {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: nextAvailability }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isAvailable: nextAvailability } : i))
        );
        showToast(
          nextAvailability
            ? `"${item.name}" marked IN STOCK.`
            : `"${item.name}" marked SOLD OUT (students cannot order).`
        );
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to update availability.');
    }
  };

  // Quick Stock adjuster directly on card
  const handleQuickStockChange = async (item: FoodItem, delta: number) => {
    const currentStock = item.availableStock ?? 0;
    const newStock = Math.max(0, currentStock + delta);
    try {
      const res = await fetch(buildApiUrl(`/api/food-items/${item.id}/stock`), {
        method: 'PATCH',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availableStock: newStock }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  availableStock: newStock,
                  isAvailable: newStock > 0 ? i.isAvailable : false,
                }
              : i
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (item: FoodItem) => {
    if (
      !confirm(
        `Are you sure you want to remove "${item.name}"? If past orders reference this dish, it will be safely deactivated to protect order receipts.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(buildApiUrl(`/api/food-items/${item.id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.softDeleted) {
          showToast(`"${item.name}" had historical orders; safely deactivated and hidden from students.`);
          await fetchData();
        } else {
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          showToast(`"${item.name}" removed from database.`);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to delete item.');
    }
  };

  // Filters
  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'all' || i.categoryId === selectedCategoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && i.isActive !== false) ||
      (statusFilter === 'inactive' && i.isActive === false) ||
      (statusFilter === 'sold_out' && (!i.isAvailable || (i.availableStock ?? 0) <= 0));
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeCount = items.filter((i) => i.isActive !== false).length;
  const inactiveCount = items.filter((i) => i.isActive === false).length;
  const soldOutCount = items.filter((i) => !i.isAvailable || (i.availableStock ?? 0) <= 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold">
              BMSIT Canteen Admin
            </span>
            <span className="text-xs text-neutral-400">• Source of Truth</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
            Dynamic Food Menu Management
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Live database-driven catalog stored in PostgreSQL. Any dish added or modified here immediately updates the Student Website and Android application through the unified API.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            title="Refresh catalog from PostgreSQL"
            className="p-2.5 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl border border-neutral-200 shadow-2xs font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-neutral-500" />
            <span className="hidden sm:inline">Sync DB</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Food Item</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Total Dishes in DB</span>
          <span className="text-2xl font-black text-neutral-900 mt-0.5 block">{items.length}</span>
          <span className="text-[10px] text-neutral-400">Database rows</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 block">Active on Student Menu</span>
          <span className="text-2xl font-black text-emerald-700 mt-0.5 block">{activeCount}</span>
          <span className="text-[10px] text-emerald-600/80">Visible to students</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 block">Deactivated Dishes</span>
          <span className="text-2xl font-black text-neutral-700 mt-0.5 block">{inactiveCount}</span>
          <span className="text-[10px] text-neutral-400">Hidden from student menu</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 block">Sold Out / Low Stock</span>
          <span className="text-2xl font-black text-rose-700 mt-0.5 block">{soldOutCount}</span>
          <span className="text-[10px] text-rose-500">Orders prevented</span>
        </div>
      </div>

      {/* Quick Food Item Selector & Price Updater (User Request) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[11px] font-extrabold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Select Item to Update Price & Details</span>
          </div>
          <p className="text-xs font-medium text-neutral-600">
            Pick any existing food item from the menu to update its price according to the canteen, or click Add New Food Item.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative min-w-[280px]">
            <select
              id="food-item-quick-picker"
              defaultValue=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) {
                  const targetItem = items.find((it) => it.id === id);
                  if (targetItem) handleOpenEdit(targetItem);
                }
                e.target.value = '';
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-neutral-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="" disabled>
                🔍 Select food item to update price...
              </option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} — ₹{it.price} ({it.categoryName || 'Item'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'inactive'
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <EyeOff className="w-3 h-3" />
            Deactivated ({inactiveCount})
          </button>
          <button
            onClick={() => setStatusFilter('sold_out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === 'sold_out'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Sold Out ({soldOutCount})
          </button>
        </div>

        {/* Category & Search input */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedCategoryFilter}
            onChange={(e) =>
              setSelectedCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes or ingredients..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Food Items Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-neutral-100 rounded-3xl animate-pulse border border-neutral-200" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200 p-8 space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">No food items found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            No dishes match your selected filter. Click &ldquo;Add New Food Item&rdquo; to add a new dish to the PostgreSQL canteen database.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-amber-700"
          >
            Add New Dish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isInactive = item.isActive === false;
            const isSoldOut = !item.isAvailable || (item.availableStock ?? 0) <= 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isInactive
                    ? 'border-neutral-300 opacity-75 bg-neutral-50/50'
                    : isSoldOut
                    ? 'border-rose-200 ring-1 ring-rose-100'
                    : 'border-neutral-200'
                }`}
              >
                <div>
                  {/* Top Image & Badges */}
                  <div className="relative h-40 w-full bg-neutral-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isInactive ? 'grayscale contrast-75' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* Top status badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-2xs ${
                          item.isVeg ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {item.isVeg ? 'VEG 🟢' : 'NON-VEG 🔴'}
                      </span>

                      {item.spiceLevel && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-amber-300">
                          🌶️ {item.spiceLevel}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {isInactive ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-neutral-800 text-white shadow-2xs flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> DEACTIVATED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                          <Eye className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay: Price & Category */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-semibold text-neutral-200">
                        {item.categoryName || 'Campus Menu'}
                      </span>
                      <span className="text-lg font-black text-white">₹{item.price}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-neutral-900 text-base leading-snug">
                          {item.name}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {item.prepTimeMinutes} mins
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {item.rating?.toFixed(1) || '4.8'}
                      </span>
                      <span>•</span>
                      <span>{item.totalOrders ?? 0} ordered</span>
                    </div>

                    {/* Stock Controller */}
                    <div className="bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          Current Stock
                        </span>
                        <span
                          className={`text-xs font-black ${
                            (item.availableStock ?? 0) <= 5
                              ? 'text-rose-600'
                              : 'text-neutral-800'
                          }`}
                        >
                          {item.availableStock ?? 0} portions left
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickStockChange(item, -5)}
                          disabled={(item.availableStock ?? 0) <= 0}
                          className="w-7 h-7 bg-white hover:bg-neutral-100 text-neutral-700 rounded-lg border border-neutral-200 text-xs font-bold disabled:opacity-40 transition-colors"
                          title="Reduce stock by 5"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleQuickStockChange(item, -1)}
                          disabled={(item.availableStock ?? 0) <= 0}
                          className="w-7 h-7 bg-white hover:bg-neutral-100 text-neutral-700 rounded-lg border border-neutral-200 text-xs font-bold disabled:opacity-40 transition-colors"
                          title="Reduce stock by 1"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickStockChange(item, 5)}
                          className="w-7 h-7 bg-white hover:bg-neutral-100 text-neutral-700 rounded-lg border border-neutral-200 text-xs font-bold transition-colors"
                          title="Add 5 portions"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickStockChange(item, 20)}
                          className="w-7 h-7 bg-white hover:bg-neutral-100 text-neutral-700 rounded-lg border border-neutral-200 text-xs font-bold transition-colors"
                          title="Add 20 portions"
                        >
                          +20
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2.5">
                    {/* Primary Status Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* 1. Active / Deactivate Toggle */}
                      <button
                        onClick={() => toggleActiveStatus(item)}
                        className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                          isInactive
                            ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                        title={isInactive ? 'Activate dish for students' : 'Deactivate from student menu'}
                      >
                        {isInactive ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Activate Dish</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active on Menu</span>
                          </>
                        )}
                      </button>

                      {/* 2. Available / Unavailable Toggle */}
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                          item.isAvailable
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                        title={item.isAvailable ? 'Mark Sold Out' : 'Mark In Stock'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.isAvailable ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{item.isAvailable ? 'In Stock' : 'Sold Out'}</span>
                      </button>
                    </div>

                    {/* Secondary Actions: Edit and Delete */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Item #{item.id}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 text-neutral-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="px-2 py-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Remove dish"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  PostgreSQL Menu Catalog
                </span>
                <h2 className="text-xl font-black text-neutral-900 mt-0.5">
                  {editingItem ? `Edit Dish: ${editingItem.name}` : 'Add New Food Item to Menu'}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Changes save directly to the PostgreSQL database and sync with student devices.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Row 1: Dish Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Dish Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Masala Dosa"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Price (₹) & Available Stock / Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Food Item Price / Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      step={1}
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: Number(e.target.value) })
                      }
                      placeholder="e.g. 40"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-black text-neutral-900"
                    />
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold mt-1 block">
                    Set price according to canteen. Updates live on student website.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Available Quantity / Stock (Portions) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={formData.availableStock}
                    onChange={(e) =>
                      setFormData({ ...formData, availableStock: Number(e.target.value) })
                    }
                    placeholder="e.g. 30"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Stored in PostgreSQL inventory table (e.g. 30 portions)
                  </span>
                </div>
              </div>

              {/* Row 3: Dietary Type & Spice Level & Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Dietary Type</label>
                  <select
                    value={formData.isVeg ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, isVeg: e.target.value === 'true' })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                  >
                    <option value="true">Pure Veg (🟢)</option>
                    <option value="false">Non-Vegetarian (🔴)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Spice Level</label>
                  <select
                    value={formData.spiceLevel}
                    onChange={(e) => setFormData({ ...formData, spiceLevel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                  >
                    <option value="None">None (Sweet / Neutral)</option>
                    <option value="Mild">Mild 🌶️</option>
                    <option value="Medium">Medium 🌶️🌶️</option>
                    <option value="Spicy">Spicy 🌶️🌶️🌶️</option>
                    <option value="Extra Spicy">Extra Spicy 🔥</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">
                    Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={formData.prepTimeMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, prepTimeMinutes: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Food Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Crispy fermented crepe stuffed with spiced potato masala, served with coconut chutney & sambar..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
                />
              </div>

              {/* Image URL with Preset Options */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Food Image URL</label>
                <input
                  type="url"
                  required
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-[11px]"
                />

                {/* Presets */}
                <div className="mt-2">
                  <span className="text-[10px] font-semibold text-neutral-500 block mb-1.5">
                    Or select a popular campus food image preset:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_FOOD_IMAGES.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            imageUrl: preset.url,
                            name: formData.name || preset.name,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                          formData.imageUrl === preset.url
                            ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Toggles: Active on Menu and Available for Ordering */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-neutral-800 block">
                      Activate on Student Menu
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      When checked, dish appears in the Student Web & Android apps.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-neutral-800 block">
                      In Stock / Available for Ordering
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      Uncheck if temporarily sold out to prevent orders.
                    </span>
                  </div>
                </label>
              </div>

              {/* Live Preview Bar */}
              <div className="border border-amber-200 bg-amber-50/50 p-3 rounded-2xl flex items-center gap-3">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-amber-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Live Preview on Student Device
                  </span>
                  <span className="text-xs font-bold text-neutral-900 truncate block">
                    {formData.name || 'Dish Name'} • ₹{formData.price}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {formData.isVeg ? '🟢 Veg' : '🔴 Non-Veg'} • 🌶️ {formData.spiceLevel} • Stock: {formData.availableStock} portions
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white rounded-xl font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Update in PostgreSQL' : 'Save & Add to Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
